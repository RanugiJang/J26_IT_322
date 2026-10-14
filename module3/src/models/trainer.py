"""
Module 3 — Model Trainer
Trains and evaluates the ECGQualityResNet on the prepared dataset.

Usage
-----
python src/models/trainer.py
"""

import sys
import json
import time
from pathlib import Path

import numpy as np
import pandas as pd
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader, WeightedRandomSampler
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    classification_report, confusion_matrix, f1_score
)
import matplotlib.pyplot as plt
import seaborn as sns

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
from src.models.resnet1d import ECGQualityResNet, count_parameters


# =====================================================================
# Hyperparameters — adjust for your experiments
# =====================================================================
SEGMENT_SAMPLES = 3600
BATCH_SIZE      = 32
EPOCHS          = 30
LR              = 1e-3
WEIGHT_DECAY    = 1e-4
DROPOUT         = 0.2
RANDOM_SEED     = 42
NUM_CLASSES     = 3
CLASS_NAMES     = ["Good", "Borderline", "Unusable"]


# =====================================================================
# PyTorch Dataset
# =====================================================================

class ECGQualityDataset(Dataset):
    """Loads pre-saved .npy ECG segments and their integer quality labels."""

    def __init__(self, df: pd.DataFrame):
        self.paths  = df["segment_path"].tolist()
        self.labels = df["quality_int"].tolist()

    def __len__(self) -> int:
        return len(self.paths)

    def __getitem__(self, idx: int):
        seg   = np.load(self.paths[idx]).astype(np.float32)
        # Ensure correct length (pad or trim)
        if len(seg) < SEGMENT_SAMPLES:
            seg = np.pad(seg, (0, SEGMENT_SAMPLES - len(seg)))
        else:
            seg = seg[:SEGMENT_SAMPLES]
        x     = torch.from_numpy(seg).unsqueeze(0)   # (1, 3600)
        y     = torch.tensor(self.labels[idx], dtype=torch.long)
        return x, y


# =====================================================================
# Training utilities
# =====================================================================

def get_weighted_sampler(df: pd.DataFrame) -> WeightedRandomSampler:
    """Create an over-sampling sampler to handle class imbalance."""
    class_counts = df["quality_int"].value_counts().sort_index().values
    weights      = 1.0 / class_counts
    sample_wts   = [weights[y] for y in df["quality_int"]]
    return WeightedRandomSampler(sample_wts, num_samples=len(sample_wts), replacement=True)


def train_one_epoch(model, loader, optimizer, criterion, device):
    model.train()
    total_loss, correct, total = 0.0, 0, 0
    for x, y in loader:
        x, y = x.to(device), y.to(device)
        optimizer.zero_grad()
        logits = model(x)
        loss   = criterion(logits, y)
        loss.backward()
        optimizer.step()
        total_loss += loss.item() * len(y)
        correct    += (logits.argmax(1) == y).sum().item()
        total      += len(y)
    return total_loss / total, correct / total


@torch.no_grad()
def evaluate(model, loader, criterion, device):
    model.eval()
    total_loss, correct, total = 0.0, 0, 0
    all_preds, all_targets = [], []
    for x, y in loader:
        x, y   = x.to(device), y.to(device)
        logits = model(x)
        loss   = criterion(logits, y)
        total_loss += loss.item() * len(y)
        preds       = logits.argmax(1)
        correct    += (preds == y).sum().item()
        total      += len(y)
        all_preds.extend(preds.cpu().tolist())
        all_targets.extend(y.cpu().tolist())
    f1 = f1_score(all_targets, all_preds, average="macro", zero_division=0)
    return total_loss / total, correct / total, all_preds, all_targets, f1


# =====================================================================
# Plots
# =====================================================================

def plot_training_curves(history: dict, save_dir: Path) -> None:
    fig, axes = plt.subplots(1, 3, figsize=(18, 5))
    for ax, key, title in zip(
        axes,
        ["loss", "acc", "f1"],
        ["Loss", "Accuracy", "Macro F1"]
    ):
        ax.plot(history[f"train_{key}"], label="Train", linewidth=2)
        ax.plot(history[f"val_{key}"],   label="Val",   linewidth=2, linestyle="--")
        ax.set_title(title)
        ax.set_xlabel("Epoch")
        ax.legend()
        ax.grid(True, alpha=0.3)
    plt.tight_layout()
    plt.savefig(save_dir / "training_curves.png", dpi=150)
    plt.close()
    print(f"Training curves → {save_dir / 'training_curves.png'}")


def plot_confusion_matrix(targets, preds, save_dir: Path) -> None:
    cm = confusion_matrix(targets, preds)
    fig, ax = plt.subplots(figsize=(7, 6))
    sns.heatmap(cm, annot=True, fmt="d", cmap="Blues",
                xticklabels=CLASS_NAMES, yticklabels=CLASS_NAMES, ax=ax)
    ax.set_xlabel("Predicted")
    ax.set_ylabel("True")
    ax.set_title("Confusion Matrix — Test Set")
    plt.tight_layout()
    plt.savefig(save_dir / "confusion_matrix.png", dpi=150)
    plt.close()
    print(f"Confusion matrix → {save_dir / 'confusion_matrix.png'}")


# =====================================================================
# Main training loop
# =====================================================================

def train(metadata_csv: str = "data/processed/labels/ecg_metadata.csv",
          model_dir:    str = "models/saved",
          results_dir:  str = "results"):

    torch.manual_seed(RANDOM_SEED)
    np.random.seed(RANDOM_SEED)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Device: {device}\n")

    # ------------------------------------------------------------------
    # Load metadata and split by record_id to avoid data leakage
    # ------------------------------------------------------------------
    df = pd.read_csv(metadata_csv)
    print(f"Total segments: {len(df)}")
    print(df["quality_label"].value_counts().to_string(), "\n")

    records = df["record_id"].unique()
    train_recs, temp_recs = train_test_split(records, test_size=0.30,
                                             random_state=RANDOM_SEED)
    val_recs, test_recs   = train_test_split(temp_recs, test_size=0.50,
                                             random_state=RANDOM_SEED)

    train_df = df[df["record_id"].isin(train_recs)]
    val_df   = df[df["record_id"].isin(val_recs)]
    test_df  = df[df["record_id"].isin(test_recs)]

    print(f"Train: {len(train_df)}  Val: {len(val_df)}  Test: {len(test_df)}")

    sampler      = get_weighted_sampler(train_df)
    train_loader = DataLoader(ECGQualityDataset(train_df),
                              batch_size=BATCH_SIZE, sampler=sampler)
    val_loader   = DataLoader(ECGQualityDataset(val_df),
                              batch_size=BATCH_SIZE, shuffle=False)
    test_loader  = DataLoader(ECGQualityDataset(test_df),
                              batch_size=BATCH_SIZE, shuffle=False)

    # ------------------------------------------------------------------
    # Model, loss, optimiser
    # ------------------------------------------------------------------
    model     = ECGQualityResNet(num_classes=NUM_CLASSES, dropout=DROPOUT).to(device)
    print(f"Parameters: {count_parameters(model):,}\n")

    criterion = nn.CrossEntropyLoss()
    optimizer = torch.optim.AdamW(model.parameters(), lr=LR, weight_decay=WEIGHT_DECAY)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=EPOCHS)

    history   = {k: [] for k in
                 ["train_loss", "train_acc", "train_f1",
                  "val_loss",   "val_acc",   "val_f1"]}

    Path(model_dir).mkdir(parents=True, exist_ok=True)
    results_path = Path(results_dir)
    (results_path / "metrics").mkdir(parents=True, exist_ok=True)
    (results_path / "plots").mkdir(parents=True, exist_ok=True)

    best_val_f1 = 0.0

    # ------------------------------------------------------------------
    # Training loop
    # ------------------------------------------------------------------
    for epoch in range(1, EPOCHS + 1):
        t0 = time.time()
        tr_loss, tr_acc = train_one_epoch(model, train_loader, optimizer, criterion, device)
        vl_loss, vl_acc, vl_preds, vl_targets, vl_f1 = evaluate(
            model, val_loader, criterion, device)
        _, _, tr_preds, tr_targets, tr_f1 = evaluate(
            model, train_loader, criterion, device)
        scheduler.step()

        history["train_loss"].append(tr_loss)
        history["train_acc"].append(tr_acc)
        history["train_f1"].append(tr_f1)
        history["val_loss"].append(vl_loss)
        history["val_acc"].append(vl_acc)
        history["val_f1"].append(vl_f1)

        print(f"Epoch {epoch:02d}/{EPOCHS}  "
              f"Loss {tr_loss:.4f}/{vl_loss:.4f}  "
              f"Acc {tr_acc:.3f}/{vl_acc:.3f}  "
              f"F1 {tr_f1:.3f}/{vl_f1:.3f}  "
              f"({time.time()-t0:.1f}s)")

        if vl_f1 > best_val_f1:
            best_val_f1 = vl_f1
            torch.save(model.state_dict(), f"{model_dir}/best_model.pt")
            print(f"  ✓ New best model saved (val F1 = {vl_f1:.4f})")

    # ------------------------------------------------------------------
    # Test evaluation
    # ------------------------------------------------------------------
    model.load_state_dict(torch.load(f"{model_dir}/best_model.pt",
                                     weights_only=True))
    _, te_acc, te_preds, te_targets, te_f1 = evaluate(
        model, test_loader, criterion, device)

    report = classification_report(te_targets, te_preds,
                                   target_names=CLASS_NAMES, digits=4)
    print("\n" + "=" * 60)
    print("TEST RESULTS")
    print("=" * 60)
    print(f"Accuracy : {te_acc:.4f}")
    print(f"Macro F1 : {te_f1:.4f}")
    print("\nClassification Report:")
    print(report)

    # Save metrics
    metrics = {"test_accuracy": te_acc, "test_macro_f1": te_f1,
               "history": history}
    with open(results_path / "metrics" / "training_metrics.json", "w") as f:
        json.dump(metrics, f, indent=2)
    with open(results_path / "metrics" / "classification_report.txt", "w") as f:
        f.write(report)

    plot_training_curves(history,        results_path / "plots")
    plot_confusion_matrix(te_targets, te_preds, results_path / "plots")
    print("\nTraining complete!")


# =====================================================================
# Entry point
# =====================================================================
if __name__ == "__main__":
    train()
