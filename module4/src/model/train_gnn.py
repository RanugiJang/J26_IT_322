"""Step 4 — Train + evaluate the GNN, compare with the Step 3 baselines.

Training trick (prevents the model from "seeing the answer"):
  each step, a random 25% of training interactions are hidden from the graph and
  used as the questions; the model must predict them from the other 75%.
Cold-drug simulation (cold setting): each step a random share of training drugs
loses ALL its interaction edges, and the model must still predict that drug's
pairs — so it learns to handle a brand-new drug from chemistry + genes alone.
Early stopping on validation AUROC; decision threshold chosen on validation
(Youden's J) rather than fixed at 0.5.

Evaluation graph: train (+ validation) interactions only. In the cold setting,
test drugs therefore have NO interaction edges at all — the model can only use
their chemistry, ATC class and pharmacogene links.

Outputs:
  models/gnn_<setting>.pt
  data/processed/preds_gnn_<setting>.csv.gz
  reports/gnn_results.json, reports/model_comparison.md
  reports/figures/roc_comparison.png, reports/figures/gnn_training.png

Run:  python -m src.model.train_gnn            (warm + cold)
      python -m src.model.train_gnn cold       (one setting)
"""
from __future__ import annotations

import json
import sys
import time

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402
import numpy as np  # noqa: E402
import pandas as pd  # noqa: E402
import torch  # noqa: E402
import torch.nn.functional as F  # noqa: E402
from sklearn.metrics import f1_score, roc_auc_score, roc_curve  # noqa: E402

from ..data.common import ROOT, load_config, path  # noqa: E402
from .gnn import build_model, predict  # noqa: E402
from .graph import N_MECH, load_graph_inputs, message_graph  # noqa: E402
from .metrics import evaluate  # noqa: E402


def idx(series: pd.Series, row: dict) -> torch.Tensor:
    return torch.tensor(series.map(row).to_numpy(), dtype=torch.long)


def run_setting(setting: str, cfg: dict, gi) -> dict:
    mc = cfg["gnn"]
    torch.manual_seed(mc["seed"])
    rng = np.random.default_rng(mc["seed"])
    df = pd.read_csv(ROOT / cfg["paths"]["processed"] / f"pairs_{setting}.csv.gz")
    tr, va, te = (df[df.split == s].reset_index(drop=True) for s in ("train", "val", "test"))
    tr_pos, tr_neg = tr[tr.label == 1].reset_index(drop=True), tr[tr.label == 0].reset_index(drop=True)
    row = gi.drug_row

    # mechanism labels (DrugBank positives only), directional src -> tgt
    has_mech = tr_pos.in_drugbank & tr_pos.mechanism_id.between(1, N_MECH)
    m_src_all, m_tgt_all = idx(tr_pos.mech_src, row), idx(tr_pos.mech_tgt, row)
    m_lab_all = torch.tensor(tr_pos.mechanism_id.fillna(1).astype(int).to_numpy() - 1, dtype=torch.long)
    has_mech_t = torch.tensor(has_mech.to_numpy())

    ia_tp, ib_tp = idx(tr_pos.a, row), idx(tr_pos.b, row)
    ia_tn, ib_tn = idx(tr_neg.a, row), idx(tr_neg.b, row)
    ei_val, et_val = message_graph(gi, tr_pos)                        # for validation
    ia_va, ib_va, y_va = idx(va.a, row), idx(va.b, row), va.label.to_numpy()

    cold_frac = float(mc.get("cold_drug_frac", {}).get(setting, 0.0))
    train_drugs = np.unique(np.concatenate([ia_tp.numpy(), ib_tp.numpy()]))
    ia_tp_np, ib_tp_np, ia_tn_np, ib_tn_np = ia_tp.numpy(), ib_tp.numpy(), ia_tn.numpy(), ib_tn.numpy()

    model = build_model(gi, mc)
    opt = torch.optim.AdamW(model.parameters(), lr=mc["lr"], weight_decay=mc["weight_decay"])
    n_tgt = int(len(tr_pos) * mc["target_frac"])
    best, best_state, bad, history = -1.0, None, 0, []
    t0 = time.time()

    for step in range(1, mc["steps"] + 1):
        model.train()
        if cold_frac > 0:
            cold = np.zeros(gi.n_drugs, dtype=bool)
            cold[rng.choice(train_drugs, int(len(train_drugs) * cold_frac), replace=False)] = True
            touch = np.flatnonzero(cold[ia_tp_np] | cold[ib_tp_np])          # pairs of "pretend-new" drugs
            rest = rng.permutation(np.flatnonzero(~(cold[ia_tp_np] | cold[ib_tp_np])))
            k = int(len(rest) * mc["target_frac"])
            tgt, msg = np.concatenate([touch, rest[:k]]), rest[k:]
            n_touch = len(touch)
            neg_touch = np.flatnonzero(cold[ia_tn_np] | cold[ib_tn_np])
            neg_rest = np.flatnonzero(~(cold[ia_tn_np] | cold[ib_tn_np]))
            neg = np.concatenate([rng.choice(neg_touch, min(len(neg_touch), n_touch), replace=False),
                                  rng.choice(neg_rest, min(len(neg_rest), k * mc["neg_per_pos"]), replace=False)])
        else:
            perm = rng.permutation(len(tr_pos))
            tgt, msg = perm[:n_tgt], perm[n_tgt:]
            neg = rng.choice(len(tr_neg), size=min(len(tr_neg), n_tgt * mc["neg_per_pos"]), replace=False)
        ei, et = message_graph(gi, tr_pos.iloc[msg])
        tgt_t, neg_t = torch.tensor(tgt), torch.tensor(neg)

        h, _ = model.encode(gi, ei, et)
        ia = torch.cat([ia_tp[tgt_t], ia_tn[neg_t]])
        ib = torch.cat([ib_tp[tgt_t], ib_tn[neg_t]])
        y = torch.cat([torch.ones(len(tgt)), torch.zeros(len(neg))])
        loss_link = F.binary_cross_entropy_with_logits(model.score(h, ia, ib), y)

        m_sel = tgt_t[has_mech_t[tgt_t]]
        loss_mech = F.cross_entropy(model.mechanism(h, m_src_all[m_sel], m_tgt_all[m_sel]), m_lab_all[m_sel],
                                    label_smoothing=0.05) if len(m_sel) else torch.tensor(0.0)
        loss = loss_link + mc["mech_weight"] * loss_mech
        opt.zero_grad()
        loss.backward()
        torch.nn.utils.clip_grad_norm_(model.parameters(), 2.0)
        opt.step()

        if step % mc["eval_every"] == 0 or step == mc["steps"]:
            p, _ = predict(model, gi, ei_val, et_val, ia_va, ib_va)
            auc = roc_auc_score(y_va, p.numpy())
            history.append({"step": step, "loss": loss.item(), "loss_link": loss_link.item(),
                            "loss_mech": float(loss_mech.detach()), "val_auroc": float(auc)})
            print(f"    step {step:4d} | loss {loss.item():.4f} (link {loss_link.item():.4f}, "
                  f"mech {loss_mech.item():.3f}) | val AUROC {auc:.4f} | {time.time() - t0:.0f}s")
            if auc > best + 1e-4:
                best, bad = auc, 0
                best_state = {k: v.detach().clone() for k, v in model.state_dict().items()}
            else:
                bad += 1
                if bad >= mc["patience"]:
                    print(f"    early stop (no val improvement for {mc['patience']} checks)")
                    break

    model.load_state_dict(best_state)
    model.eval()
    train_secs = time.time() - t0

    # decision threshold chosen on validation (Youden's J = sensitivity + specificity - 1)
    p_va, _ = predict(model, gi, ei_val, et_val, ia_va, ib_va)
    fpr, tpr, thr_all = roc_curve(y_va, p_va.numpy())
    thr = float(np.clip(thr_all[np.argmax(tpr - fpr)], 0.01, 0.99))

    # ---- test: message graph = train + val interactions
    trva_pos = pd.concat([tr_pos, va[va.label == 1]], ignore_index=True)
    ei_te, et_te = message_graph(gi, trva_pos)
    ia_te, ib_te = idx(te.a, row), idx(te.b, row)
    t1 = time.time()
    p_te, _ = predict(model, gi, ei_te, et_te, ia_te, ib_te)
    infer_ms = (time.time() - t1) * 1000
    p_te = p_te.numpy()
    card = te.cardiac.to_numpy() > 0
    metrics = {"all": evaluate(te.label, p_te, thr), "cardiac": evaluate(te.label[card], p_te[card], thr)}

    # ---- mechanism accuracy on test DrugBank positives
    tp = te[(te.label == 1) & te.in_drugbank & te.mechanism_id.between(1, N_MECH)]
    with torch.no_grad():
        h, _ = model.encode(gi, ei_te, et_te)
        logits = model.mechanism(h, idx(tp.mech_src, row), idx(tp.mech_tgt, row))
    y_m = tp.mechanism_id.astype(int).to_numpy() - 1
    top = logits.topk(3, dim=1).indices.numpy()
    metrics["mechanism"] = {"n": int(len(tp)), "top1_accuracy": float((top[:, 0] == y_m).mean()),
                            "top3_accuracy": float((top == y_m[:, None]).any(1).mean()),
                            "macro_f1": float(f1_score(y_m, top[:, 0], average="macro"))}
    metrics["threshold"] = thr
    metrics["cold_drug_frac"] = cold_frac
    metrics["train_seconds"] = round(train_secs, 1)
    metrics["best_val_auroc"] = float(best)
    metrics["inference_ms_full_test_set"] = round(infer_ms, 1)
    metrics["history"] = history

    pd.DataFrame({"a": te.a, "b": te.b, "label": te.label, "cardiac": te.cardiac, "score": p_te}).to_csv(
        path(f"{cfg['paths']['processed']}/preds_gnn_{setting}.csv.gz"), index=False, compression="gzip")
    torch.save({"state": model.state_dict(), "gnn_cfg": mc, "setting": setting, "threshold": thr,
                "drug_ids": gi.drug_ids, "gene_symbols": gi.gene_symbols},
               path(f"models/gnn_{setting}.pt"))
    return metrics


def write_report(results: dict, cfg: dict) -> None:
    rep = ROOT / cfg["paths"]["reports"]
    base = json.loads((rep / "baselines.json").read_text()) if (rep / "baselines.json").exists() else {}
    proc = ROOT / cfg["paths"]["processed"]
    md = ["# Module 4 — GNN vs baselines", "",
          "Test-set results. *Warm* = random pairs held out; *Cold* = whole drugs held out (never seen in training).",
          "*Cardiac* = pairs with at least one cardiac drug. AUROC/AUPRC are threshold-free; the GNN's",
          "sensitivity/specificity use a threshold chosen on the validation set (baselines: 0.5).", ""]
    for subset in ("cardiac", "all"):
        md += [f"## {subset.capitalize()} pairs", "",
               "| Setting | Model | AUROC | AUPRC | Sensitivity | Specificity | Precision | F1 |",
               "|---|---|---|---|---|---|---|---|"]
        for setting in results:
            rows = [(n, m[subset]) for n, m in base.get(setting, {}).items()] + [("GNN (GATv2)", results[setting][subset])]
            for name, x in rows:
                bold = "**" if name.startswith("GNN") else ""
                md.append(f"| {setting} | {bold}{name}{bold} | {x['auroc']:.3f} | {x['auprc']:.3f} | "
                          f"{x['sensitivity']:.3f} | {x['specificity']:.3f} | {x['precision']:.3f} | {x['f1']:.3f} |")
        md.append("")
    md += ["## Mechanism prediction (86 DrugBank interaction types)", "",
           "| Setting | Test pairs | Top-1 accuracy | Top-3 accuracy | Macro-F1 |", "|---|---|---|---|---|"]
    for setting, r in results.items():
        m = r["mechanism"]
        md.append(f"| {setting} | {m['n']:,} | {m['top1_accuracy']:.3f} | {m['top3_accuracy']:.3f} | {m['macro_f1']:.3f} |")
    md += ["", "## Training", ""]
    for setting, r in results.items():
        md.append(f"- {setting}: {r['train_seconds']:.0f}s training, best validation AUROC {r['best_val_auroc']:.3f}, "
                  f"threshold {r.get('threshold', 0.5):.2f}, cold-drug simulation {r.get('cold_drug_frac', 0):.0%}, "
                  f"scoring the full test set took {r['inference_ms_full_test_set']:.0f} ms")
    path(f"{cfg['paths']['reports']}/model_comparison.md").write_text("\n".join(md) + "\n", encoding="utf-8")
    slim = {s: {k: v for k, v in r.items() if k != "history"} for s, r in results.items()}
    path(f"{cfg['paths']['reports']}/gnn_results.json").write_text(json.dumps(slim, indent=2))

    # ROC comparison on cardiac pairs
    fig, axes = plt.subplots(1, len(results), figsize=(6 * len(results), 5))
    for ax, setting in zip(np.atleast_1d(axes), results):
        for key, label in (("ddinter_lookup", "DDInter lookup"), ("xgboost", "XGBoost"), ("gnn", "GNN (GATv2)")):
            f = proc / f"preds_{key}_{setting}.csv.gz"
            if not f.exists():
                continue
            d = pd.read_csv(f)
            d = d[d.cardiac > 0]
            fpr, tpr, _ = roc_curve(d.label, d.score)
            ax.plot(fpr, tpr, linewidth=2.5 if key == "gnn" else 1.6,
                    label=f"{label} (AUROC {roc_auc_score(d.label, d.score):.3f})")
        ax.plot([0, 1], [0, 1], "--", color="grey", linewidth=1)
        ax.set_title(f"{setting.capitalize()} split — cardiac drug pairs")
        ax.set_xlabel("False positive rate")
        ax.set_ylabel("Sensitivity")
        ax.legend(loc="lower right", frameon=False)
    plt.tight_layout()
    plt.savefig(path(f"{cfg['paths']['reports']}/figures/roc_comparison.png"), dpi=200)
    plt.close()

    fig, ax = plt.subplots(figsize=(7, 4))
    for setting, r in results.items():
        hdf = pd.DataFrame(r["history"])
        ax.plot(hdf.step, hdf.val_auroc, marker="o", markersize=3, label=f"{setting} — validation AUROC")
    ax.set_xlabel("Training step")
    ax.set_ylabel("AUROC")
    ax.legend(frameon=False)
    ax.set_title("GNN training progress")
    plt.tight_layout()
    plt.savefig(path(f"{cfg['paths']['reports']}/figures/gnn_training.png"), dpi=200)
    plt.close()


def main() -> None:
    cfg = load_config()
    if cfg["gnn"].get("threads"):
        torch.set_num_threads(cfg["gnn"]["threads"])
    settings = sys.argv[1:] or ["warm", "cold"]
    print("\n== Step 4: GNN ==")
    gi = load_graph_inputs(cfg)
    print(f"  graph: {gi.n_drugs:,} drugs, {gi.n_genes:,} genes, {gi.n_vars} variants, "
          f"{gi.static_ei.shape[1]:,} drug–gene/gene–variant edges, {gi.x_drug.shape[1]} drug features")
    res_path = ROOT / cfg["paths"]["reports"] / "gnn_results_full.json"
    results = json.loads(res_path.read_text()) if res_path.exists() else {}
    for setting in settings:
        print(f"  [{setting}]")
        results[setting] = run_setting(setting, cfg, gi)
        c, m = results[setting]["cardiac"], results[setting]["mechanism"]
        print(f"    GNN cardiac: AUROC {c['auroc']:.3f} | sensitivity {c['sensitivity']:.3f} | "
              f"specificity {c['specificity']:.3f} | F1 {c['f1']:.3f}")
        print(f"    mechanism: top-1 {m['top1_accuracy']:.3f} | top-3 {m['top3_accuracy']:.3f}")
        res_path.write_text(json.dumps(results, indent=2))
    order = [s for s in ("warm", "cold") if s in results]
    write_report({s: results[s] for s in order}, cfg)
    print("\n  report -> reports/model_comparison.md   figures -> reports/figures/roc_comparison.png, gnn_training.png")


if __name__ == "__main__":
    main()
