"""Step 3b — Drug feature vectors (also reused as GNN input features in Step 4).

Per drug:
  * Morgan fingerprint of the chemical structure (RDKit, from TDC SMILES)
  * has_structure flag (biologics / ClinPGx-only drugs have no SMILES)
  * ATC anatomical group, multi-hot (14 letters A..V)
  * cardiac ATC sub-group, multi-hot (B01, C01, C02, C03, C07, C08, C09, C10)
  * pharmacogene profile: multi-hot over the most-connected genes (ClinPGx),
    plus counts of PK and PD gene links

Pair features (symmetric, so A+B == B+A):  [f(a) + f(b),  f(a) * f(b)]

Output: data/processed/drug_features.npz

Run:  python -m src.model.features
"""
from __future__ import annotations

import numpy as np
import pandas as pd

from ..data.common import ROOT, load_config, path

ATC_L1 = list("ABCDGHJLMNPRSV")


def morgan(smiles: pd.Series, radius: int, bits: int) -> tuple[np.ndarray, np.ndarray]:
    from rdkit import Chem, RDLogger
    from rdkit.Chem import rdFingerprintGenerator
    RDLogger.DisableLog("rdApp.*")
    gen = rdFingerprintGenerator.GetMorganGenerator(radius=radius, fpSize=bits)
    fp = np.zeros((len(smiles), bits), dtype=np.uint8)
    ok = np.zeros(len(smiles), dtype=np.uint8)
    for i, s in enumerate(smiles):
        if isinstance(s, str) and s:
            m = Chem.MolFromSmiles(s)
            if m is not None:
                fp[i] = gen.GetFingerprintAsNumPy(m).astype(np.uint8)
                ok[i] = 1
    return fp, ok


def build_features(cfg: dict) -> tuple[np.ndarray, list[str], list[str]]:
    inter = ROOT / cfg["paths"]["interim"]
    nodes = pd.read_csv(inter / "nodes_drug.csv")
    dg = pd.read_csv(inter / "edges_drug_gene.csv")
    fc = cfg["features"]
    ids = nodes.drugbank_id.tolist()
    row = {d: i for i, d in enumerate(ids)}

    fp, has = morgan(nodes.smiles, fc["morgan_radius"], fc["morgan_bits"])

    atc = nodes.atc_codes.fillna("").str.split(";")
    l1 = np.array([[int(any(c.startswith(x) for c in codes)) for x in ATC_L1] for codes in atc], dtype=np.uint8)
    groups = list(cfg["cardiac_scope"]["atc_prefixes"].keys())
    l2 = np.array([[int(any(c.startswith(g) for c in codes)) for g in groups] for codes in atc], dtype=np.uint8)

    top_genes = dg.gene_symbol.value_counts().head(fc["top_genes"]).index.tolist()
    gcol = {g: j for j, g in enumerate(top_genes)}
    genes = np.zeros((len(ids), len(top_genes)), dtype=np.uint8)
    pk = np.zeros((len(ids), 1), dtype=np.uint8)
    pdx = np.zeros((len(ids), 1), dtype=np.uint8)
    for _, r in dg.iterrows():
        i = row.get(r.drugbank_id)
        if i is None:
            continue
        if r.gene_symbol in gcol:
            genes[i, gcol[r.gene_symbol]] = 1
        pk[i] = min(255, pk[i] + int(bool(r.get("pk"))))
        pdx[i] = min(255, pdx[i] + int(bool(r.get("pd"))))

    X = np.hstack([fp, has[:, None], l1, l2, genes, np.minimum(pk, 10), np.minimum(pdx, 10)]).astype(np.uint8)
    names = ([f"fp_{k}" for k in range(fp.shape[1])] + ["has_structure"] + [f"atc_{x}" for x in ATC_L1]
             + [f"atc_{g}" for g in groups] + [f"gene_{g}" for g in top_genes] + ["n_pk_genes", "n_pd_genes"])
    return X, ids, names


def pair_matrix(X: np.ndarray, ia: np.ndarray, ib: np.ndarray) -> np.ndarray:
    A = X[ia].astype(np.uint16)
    B = X[ib].astype(np.uint16)
    return np.hstack([A + B, A * B]).astype(np.uint8 if (A + B).max() < 256 and (A * B).max() < 256 else np.uint16)


def load_features(cfg: dict) -> tuple[np.ndarray, dict[str, int], list[str]]:
    z = np.load(ROOT / cfg["paths"]["processed"] / "drug_features.npz", allow_pickle=True)
    ids = list(z["ids"])
    return z["X"], {d: i for i, d in enumerate(ids)}, list(z["names"])


def main() -> None:
    cfg = load_config()
    print("\n== Step 3b: drug features ==")
    X, ids, names = build_features(cfg)
    out = path(f"{cfg['paths']['processed']}/drug_features.npz")
    np.savez_compressed(out, X=X, ids=np.array(ids, dtype=object), names=np.array(names, dtype=object))
    has = X[:, names.index("has_structure")]
    print(f"  {X.shape[0]:,} drugs x {X.shape[1]} features -> {out.relative_to(ROOT)}")
    print(f"  chemical structure available for {int(has.sum()):,} drugs "
          f"({X.shape[0] - int(has.sum()):,} without: biologics / ClinPGx-only)")


if __name__ == "__main__":
    main()
