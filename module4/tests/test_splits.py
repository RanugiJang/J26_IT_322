"""Split tests: no leakage between train and held-out drugs, no contradictory labels."""
import numpy as np
import pandas as pd

from src.model.features import pair_matrix
from src.model.splits import build, check_no_leakage

CFG = {"splits": {"seed": 1, "drug_frac": {"train": 0.8, "val": 0.1, "test": 0.1},
                  "pair_frac": {"train": 0.8, "val": 0.1, "test": 0.1}, "neg_ratio": 1.0}}


def _toy(n=120, m=900, seed=0):
    rng = np.random.default_rng(seed)
    ids = [f"DB{i:05d}" for i in range(n)]
    nodes = pd.DataFrame({"drugbank_id": ids, "name": ids, "is_cardiac": rng.random(n) < 0.3})
    a, b = rng.integers(0, n, m), rng.integers(0, n, m)
    keep = a != b
    lo, hi = np.minimum(a, b)[keep], np.maximum(a, b)[keep]
    pos = pd.DataFrame({"a": [ids[i] for i in lo], "b": [ids[i] for i in hi]}).drop_duplicates()
    pos = pos.assign(in_drugbank=True, in_ddinter=False, severity=None, mechanism_id=1,
                     mech_src=pos.a, mech_tgt=pos.b, label=1)
    return pos.reset_index(drop=True), nodes


def test_cold_split_has_no_drug_leakage():
    pos, nodes = _toy()
    df = build("cold", pos, nodes, CFG)
    check_no_leakage(df)                                   # raises on leakage
    train = df[df.split == "train"]
    assert (train.split_a == "train").all() and (train.split_b == "train").all()
    test = df[df.split == "test"]
    assert ((test.split_a == "test") | (test.split_b == "test")).all()


def test_negatives_are_balanced_and_never_positive():
    pos, nodes = _toy()
    for setting in ("warm", "cold"):
        df = build(setting, pos, nodes, CFG)
        positives = set(zip(pos.a, pos.b))
        neg = df[df.label == 0]
        assert not (set(zip(neg.a, neg.b)) & positives)
        assert abs(len(neg) - len(pos)) <= 0.02 * len(pos)
        assert (df.a < df.b).all()                         # pairs stored in canonical order


def test_pair_features_are_symmetric():
    X = np.random.default_rng(0).integers(0, 2, (5, 8)).astype(np.uint8)
    assert np.array_equal(pair_matrix(X, np.array([1]), np.array([3])),
                          pair_matrix(X, np.array([3]), np.array([1])))
