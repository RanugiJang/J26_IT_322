"""Step 3c — Baselines the GNN must beat.

B1  DDInter lookup — the "current practice" baseline: a pair is flagged only if
    it is listed in a curated interaction database (score from severity).
    It can never flag an interaction the database does not already contain.
B2  XGBoost on drug features — a standard machine-learning model that sees each
    pair in isolation (chemical structure + ATC class + pharmacogenes), with
    no knowledge-graph structure.

Evaluated on the warm and cold settings, for all pairs and for pairs involving
at least one cardiac drug.

Outputs: reports/baselines.md, reports/baselines.json,
         reports/figures/roc_baselines.png,
         data/processed/preds_<model>_<setting>.csv.gz, models/xgb_<setting>.json

Run:  python -m src.model.baselines
"""
from __future__ import annotations

import json
import time

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402
import numpy as np  # noqa: E402
import pandas as pd  # noqa: E402
from sklearn.metrics import roc_curve  # noqa: E402

from ..data.common import ROOT, load_config, path  # noqa: E402
from .features import load_features, pair_matrix  # noqa: E402
from .metrics import evaluate  # noqa: E402

SEV_SCORE = {"Major": 1.0, "Moderate": 0.75, "Minor": 0.5, "Unknown": 0.5}


def lookup_scores(df: pd.DataFrame) -> np.ndarray:
    s = df.severity.map(SEV_SCORE).fillna(0.5)
    return np.where(df.in_ddinter, s, 0.0)


def train_xgb(Xtr, ytr, Xva, yva, params: dict, seed: int):
    import xgboost as xgb
    model = xgb.XGBClassifier(**params, tree_method="hist", eval_metric="auc", n_jobs=-1,
                              random_state=seed, early_stopping_rounds=30)
    model.fit(Xtr, ytr, eval_set=[(Xva, yva)], verbose=False)
    return model


def run_setting(setting: str, cfg: dict, X: np.ndarray, row: dict) -> tuple[dict, dict]:
    bc = cfg["baselines"]
    df = pd.read_csv(ROOT / cfg["paths"]["processed"] / f"pairs_{setting}.csv.gz")
    ia, ib = df.a.map(row).to_numpy(), df.b.map(row).to_numpy()
    tr, va, te = (df.split == s for s in ("train", "val", "test"))
    test = df[te].reset_index(drop=True)
    results, curves = {}, {}

    # ---- B1 lookup
    s_lookup = lookup_scores(test)
    results["DDInter lookup"] = s_lookup

    # ---- B2 XGBoost
    rng = np.random.default_rng(cfg["splits"]["seed"])
    tr_idx = np.flatnonzero(tr)
    if len(tr_idx) > bc["max_train_rows"]:
        tr_idx = rng.choice(tr_idx, bc["max_train_rows"], replace=False)
    va_idx = np.flatnonzero(va)
    t0 = time.time()
    model = train_xgb(pair_matrix(X, ia[tr_idx], ib[tr_idx]), df.label.to_numpy()[tr_idx],
                      pair_matrix(X, ia[va_idx], ib[va_idx]), df.label.to_numpy()[va_idx],
                      bc["gb_params"], cfg["splits"]["seed"])
    te_idx = np.flatnonzero(te)
    s_xgb = model.predict_proba(pair_matrix(X, ia[te_idx], ib[te_idx]))[:, 1]
    results["XGBoost"] = s_xgb
    print(f"    XGBoost trained on {len(tr_idx):,} pairs in {time.time() - t0:.0f}s "
          f"(best iteration {model.best_iteration})")
    model.save_model(str(path(f"models/xgb_{setting}.json")))

    metrics = {}
    for name, score in results.items():
        key = name.lower().replace(" ", "_")
        pd.DataFrame({"a": test.a, "b": test.b, "label": test.label, "cardiac": test.cardiac,
                      "score": score}).to_csv(
            path(f"{cfg['paths']['processed']}/preds_{key}_{setting}.csv.gz"), index=False, compression="gzip")
        m_all = evaluate(test.label, score, bc["threshold"])
        card = test.cardiac.to_numpy() > 0
        m_card = evaluate(test.label[card], score[card], bc["threshold"])
        metrics[name] = {"all": m_all, "cardiac": m_card}
        curves[name] = roc_curve(test.label[card], score[card])[:2]
    # how much of DrugBank-documented interactions does the lookup catch?
    db = test[(test.label == 1) & test.in_drugbank]
    metrics["DDInter lookup"]["coverage_of_drugbank_interactions"] = float(db.in_ddinter.mean()) if len(db) else float("nan")
    return metrics, curves


def write_report(all_metrics: dict, all_curves: dict, cfg: dict) -> None:
    md = ["# Module 4 — Baseline results", "",
          "Test-set performance. *Cardiac* = pairs with at least one cardiac drug (ATC B01, C01–C03, C07–C10).",
          "*Warm* = random pairs held out. *Cold* = whole drugs held out (unseen in training).", ""]
    for subset in ("cardiac", "all"):
        md += [f"## {subset.capitalize()} pairs", "",
               "| Setting | Model | AUROC | AUPRC | Sensitivity | Specificity | Precision | F1 |",
               "|---|---|---|---|---|---|---|---|"]
        for setting, models in all_metrics.items():
            for name, m in models.items():
                x = m[subset]
                md.append(f"| {setting} | {name} | {x['auroc']:.3f} | {x['auprc']:.3f} | {x['sensitivity']:.3f} | "
                          f"{x['specificity']:.3f} | {x['precision']:.3f} | {x['f1']:.3f} |")
        md.append("")
    md += ["## DDInter lookup coverage",
           "Share of DrugBank-documented interactions in the test set that the lookup flags:", ""]
    for setting, models in all_metrics.items():
        md.append(f"- {setting}: {models['DDInter lookup']['coverage_of_drugbank_interactions']:.1%}")
    md += ["", "Lookup precision is ~1.0 by construction (anything listed is a known interaction); "
           "its weakness is sensitivity — interactions it has never been told about are missed.", ""]
    path(f"{cfg['paths']['reports']}/baselines.md").write_text("\n".join(md), encoding="utf-8")
    path(f"{cfg['paths']['reports']}/baselines.json").write_text(json.dumps(all_metrics, indent=2))

    fig, axes = plt.subplots(1, len(all_curves), figsize=(6 * len(all_curves), 5))
    axes = np.atleast_1d(axes)
    for ax, (setting, curves) in zip(axes, all_curves.items()):
        for name, (fpr, tpr) in curves.items():
            auc = all_metrics[setting][name]["cardiac"]["auroc"]
            ax.plot(fpr, tpr, label=f"{name} (AUROC {auc:.3f})", linewidth=2)
        ax.plot([0, 1], [0, 1], "--", color="grey", linewidth=1)
        ax.set_title(f"{setting.capitalize()} split — cardiac pairs")
        ax.set_xlabel("False positive rate")
        ax.set_ylabel("Sensitivity (true positive rate)")
        ax.legend(loc="lower right", frameon=False)
    plt.tight_layout()
    plt.savefig(path(f"{cfg['paths']['reports']}/figures/roc_baselines.png"), dpi=200)


def main() -> None:
    cfg = load_config()
    print("\n== Step 3c: baselines ==")
    X, row, _ = load_features(cfg)
    all_metrics, all_curves = {}, {}
    for setting in ("warm", "cold"):
        print(f"  [{setting}]")
        all_metrics[setting], all_curves[setting] = run_setting(setting, cfg, X, row)
        for name, m in all_metrics[setting].items():
            c = m["cardiac"]
            print(f"    {name:<15} cardiac: AUROC {c['auroc']:.3f} | sensitivity {c['sensitivity']:.3f} | "
                  f"specificity {c['specificity']:.3f} | F1 {c['f1']:.3f}")
    write_report(all_metrics, all_curves, cfg)
    print("\n  report -> reports/baselines.md   figure -> reports/figures/roc_baselines.png")


if __name__ == "__main__":
    main()
