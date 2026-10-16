# Module 4 — GNN vs baselines

Test-set results. *Warm* = random pairs held out; *Cold* = whole drugs held out (never seen in training).
*Cardiac* = pairs with at least one cardiac drug. AUROC/AUPRC are threshold-free; the GNN's
sensitivity/specificity use a threshold chosen on the validation set (baselines: 0.5).

## Cardiac pairs

| Setting | Model | AUROC | AUPRC | Sensitivity | Specificity | Precision | F1 |
|---|---|---|---|---|---|---|---|
| warm | DDInter lookup | 0.690 | 0.717 | 0.380 | 1.000 | 1.000 | 0.551 |
| warm | XGBoost | 0.838 | 0.861 | 0.803 | 0.696 | 0.759 | 0.780 |
| warm | **GNN (GATv2)** | 0.964 | 0.970 | 0.909 | 0.875 | 0.897 | 0.903 |
| cold | DDInter lookup | 0.691 | 0.714 | 0.382 | 1.000 | 1.000 | 0.552 |
| cold | XGBoost | 0.780 | 0.804 | 0.619 | 0.786 | 0.772 | 0.687 |
| cold | **GNN (GATv2)** | 0.819 | 0.845 | 0.739 | 0.734 | 0.764 | 0.751 |

## All pairs

| Setting | Model | AUROC | AUPRC | Sensitivity | Specificity | Precision | F1 |
|---|---|---|---|---|---|---|---|
| warm | DDInter lookup | 0.713 | 0.713 | 0.427 | 1.000 | 1.000 | 0.598 |
| warm | XGBoost | 0.838 | 0.840 | 0.749 | 0.761 | 0.758 | 0.754 |
| warm | **GNN (GATv2)** | 0.964 | 0.965 | 0.896 | 0.894 | 0.895 | 0.896 |
| cold | DDInter lookup | 0.707 | 0.707 | 0.413 | 1.000 | 1.000 | 0.585 |
| cold | XGBoost | 0.774 | 0.776 | 0.578 | 0.815 | 0.757 | 0.656 |
| cold | **GNN (GATv2)** | 0.812 | 0.818 | 0.720 | 0.751 | 0.743 | 0.731 |

## Mechanism prediction (86 DrugBank interaction types)

| Setting | Test pairs | Top-1 accuracy | Top-3 accuracy | Macro-F1 |
|---|---|---|---|---|
| warm | 19,152 | 0.925 | 0.992 | 0.754 |
| cold | 36,859 | 0.599 | 0.807 | 0.449 |

## Training

- warm: 508s training, best validation AUROC 0.966, threshold 0.61, cold-drug simulation 0%, scoring the full test set took 681 ms
- cold: 541s training, best validation AUROC 0.829, threshold 0.32, cold-drug simulation 15%, scoring the full test set took 401 ms
