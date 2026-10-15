"""Step 3a — Labelled drug pairs + train/val/test splits.

Positive pair  = any documented interaction (DrugBank via TDC, or DDInter).
Negative pair  = made by "corrupting" one drug of a positive pair with a random
                 drug, so every drug appears in negatives about as often as in
                 positives (stops the model from just learning "popular drug").
                 Negatives are never a documented interaction.

Two evaluation settings (both saved):
  warm  — random pairs held out; test drugs were seen in training
          (the standard benchmark setting in published DDI papers)
  cold  — whole DRUGS held out; every test pair has at least one drug the model
          never saw in training (realistic for new drugs; the harder, honest test)
Cardiac and non-cardiac drugs are split separately so every split has cardiac drugs.

Output: data/processed/pairs_warm.csv.gz, data/processed/pairs_cold.csv.gz,
        reports/splits.json

Run:  python -m src.model.splits
"""
from __future__ import annotations

import json

import numpy as np
import pandas as pd

from ..data.common import ROOT, load_config, path

SPLITS = ("train", "val", "test")
RANK = {"train": 0, "val": 1, "test": 2}


def load_positives(cfg: dict) -> tuple[pd.DataFrame, pd.DataFrame]:
    inter = ROOT / cfg["paths"]["interim"]
    nodes = pd.read_csv(inter / "nodes_drug.csv", usecols=["drugbank_id", "name", "is_cardiac"])
    e = pd.read_csv(inter / "edges_ddi.csv")
    a = np.where(e.drug1 < e.drug2, e.drug1, e.drug2)
    b = np.where(e.drug1 < e.drug2, e.drug2, e.drug1)
    e = e.assign(a=a, b=b, in_drugbank=e.source.eq("drugbank"), in_ddinter=e.severity.notna() | e.source.eq("ddinter"))
    e = e.sort_values("in_drugbank", ascending=False)        # keep the DrugBank mechanism when both exist
    pos = (e.groupby(["a", "b"], as_index=False)
             .agg(in_drugbank=("in_drugbank", "max"), in_ddinter=("in_ddinter", "max"),
                  severity=("severity", "first"), mechanism_id=("mechanism_id", "first"),
                  mech_src=("drug1", "first"), mech_tgt=("drug2", "first")))
    pos["label"] = 1
    return pos, nodes


def assign_drug_splits(nodes: pd.DataFrame, frac: dict, rng: np.random.Generator) -> dict[str, str]:
    out: dict[str, str] = {}
    for _, grp in nodes.groupby("is_cardiac"):
        ids = grp.drugbank_id.to_numpy().copy()
        rng.shuffle(ids)
        n_tr, n_va = int(len(ids) * frac["train"]), int(len(ids) * frac["val"])
        for i, d in enumerate(ids):
            out[d] = "train" if i < n_tr else ("val" if i < n_tr + n_va else "test")
    return out


def corrupt(pos: pd.DataFrame, pools: dict[str, np.ndarray], keep_side: np.ndarray,
            forbidden: set, rng: np.random.Generator, ratio: float) -> pd.DataFrame:
    """For each positive, keep one drug and replace the other with a random drug from `pools[split]`."""
    rows, seen = [], set(forbidden)
    reps = int(np.ceil(ratio))
    for r in range(reps):
        take = pos if r < reps - 1 or ratio == reps else pos.sample(frac=ratio - r, random_state=int(rng.integers(1e9)))
        for split, grp in take.groupby("split"):
            pool = pools[split]
            kept = np.where(keep_side[grp.index] == 0, grp.a.to_numpy(), grp.b.to_numpy())
            for k in kept:
                for _ in range(20):                        # retry until we find a non-interacting partner
                    other = pool[rng.integers(len(pool))]
                    if other == k:
                        continue
                    pair = (k, other) if k < other else (other, k)
                    if pair not in seen:
                        seen.add(pair)
                        rows.append((pair[0], pair[1], split))
                        break
    neg = pd.DataFrame(rows, columns=["a", "b", "split"])
    neg["label"] = 0
    return neg


def build(setting: str, pos: pd.DataFrame, nodes: pd.DataFrame, cfg: dict) -> pd.DataFrame:
    sc = cfg["splits"]
    rng = np.random.default_rng(sc["seed"] + (0 if setting == "warm" else 1))
    pos = pos.copy().reset_index(drop=True)
    all_drugs = nodes.drugbank_id.to_numpy()
    forbidden = set(zip(pos.a, pos.b))

    if setting == "warm":
        u = rng.random(len(pos))
        f = sc["pair_frac"]
        pos["split"] = np.where(u < f["train"], "train", np.where(u < f["train"] + f["val"], "val", "test"))
        pools = {s: all_drugs for s in SPLITS}
        keep_side = rng.integers(0, 2, len(pos))
        drug_split = None
    else:
        drug_split = assign_drug_splits(nodes, sc["drug_frac"], rng)
        ra = pos.a.map(drug_split).map(RANK)
        rb = pos.b.map(drug_split).map(RANK)
        pos["split"] = np.maximum(ra, rb).map({v: k for k, v in RANK.items()})
        # keep the drug that defines the split (the "newest" one); partner comes from same-or-earlier splits
        keep_side = np.where(ra >= rb, 0, 1)
        by_rank = {s: np.array([d for d, sp in drug_split.items() if RANK[sp] <= RANK[s]]) for s in SPLITS}
        pools = by_rank

    neg = corrupt(pos, pools, keep_side, forbidden, rng, sc["neg_ratio"])
    df = pd.concat([pos, neg], ignore_index=True)
    for col, val in (("in_drugbank", False), ("in_ddinter", False)):
        df[col] = df[col].astype("boolean").fillna(val).astype(bool)
    cardiac = set(nodes.loc[nodes.is_cardiac, "drugbank_id"])
    df["cardiac"] = df.a.isin(cardiac).astype(int) + df.b.isin(cardiac).astype(int)
    df["setting"] = setting
    if drug_split is not None:
        df["split_a"] = df.a.map(drug_split)
        df["split_b"] = df.b.map(drug_split)
    return df.sample(frac=1, random_state=sc["seed"]).reset_index(drop=True)


def check_no_leakage(df: pd.DataFrame) -> None:
    """Cold setting: no test/val drug may appear in a training pair; labels never contradict."""
    pairs = df.groupby(["a", "b"]).label.nunique()
    assert (pairs == 1).all(), "a pair is labelled both positive and negative"
    if "split_a" in df:
        train = df[df.split == "train"]
        train_drugs = set(train.a) | set(train.b)
        held = set(df.loc[df.split_a != "train", "a"]) | set(df.loc[df.split_b != "train", "b"])
        assert not (train_drugs & held), "held-out drug appears in training pairs"


def main() -> None:
    cfg = load_config()
    print("\n== Step 3a: labelled pairs + splits ==")
    pos, nodes = load_positives(cfg)
    print(f"  positive pairs (unordered): {len(pos):,}  "
          f"(DrugBank {int(pos.in_drugbank.sum()):,} | DDInter-only {int((~pos.in_drugbank).sum()):,})")
    stats = {}
    for setting in ("warm", "cold"):
        df = build(setting, pos, nodes, cfg)
        check_no_leakage(df)
        out = path(f"{cfg['paths']['processed']}/pairs_{setting}.csv.gz")
        df.to_csv(out, index=False, compression="gzip")
        s = (df.groupby(["split", "label"]).size().unstack(fill_value=0)
               .rename(columns={0: "neg", 1: "pos"}).reindex(SPLITS))
        s["cardiac_pairs"] = df[df.cardiac > 0].groupby("split").size().reindex(SPLITS)
        stats[setting] = {k: {c: int(v) for c, v in row.items()} for k, row in s.iterrows()}
        print(f"\n  [{setting}] -> {out.relative_to(ROOT)}  (leakage check passed)")
        print(s.to_string())
    path(f"{cfg['paths']['reports']}/splits.json").write_text(json.dumps(stats, indent=2))


if __name__ == "__main__":
    main()
