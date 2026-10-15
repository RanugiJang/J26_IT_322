"""Shared evaluation metrics (used by baselines now and the GNN in Step 4)."""
from __future__ import annotations

import numpy as np
from sklearn.metrics import average_precision_score, confusion_matrix, f1_score, roc_auc_score


def evaluate(y: np.ndarray, score: np.ndarray, threshold: float = 0.5) -> dict:
    y = np.asarray(y).astype(int)
    pred = (np.asarray(score) >= threshold).astype(int)
    tn, fp, fn, tp = confusion_matrix(y, pred, labels=[0, 1]).ravel()
    both = len(np.unique(y)) == 2
    return {
        "n": int(len(y)),
        "auroc": float(roc_auc_score(y, score)) if both else float("nan"),
        "auprc": float(average_precision_score(y, score)) if both else float("nan"),
        "sensitivity": float(tp / (tp + fn)) if tp + fn else float("nan"),   # recall: real interactions caught
        "specificity": float(tn / (tn + fp)) if tn + fp else float("nan"),
        "precision": float(tp / (tp + fp)) if tp + fp else float("nan"),
        "f1": float(f1_score(y, pred, zero_division=0)),
    }
