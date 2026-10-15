# Module 4 — Baseline results

Test-set performance. *Cardiac* = pairs with at least one cardiac drug (ATC B01, C01–C03, C07–C10).
*Warm* = random pairs held out. *Cold* = whole drugs held out (unseen in training).

## Cardiac pairs

| Setting | Model | AUROC | AUPRC | Sensitivity | Specificity | Precision | F1 |
|---|---|---|---|---|---|---|---|
| warm | DDInter lookup | 0.690 | 0.717 | 0.380 | 1.000 | 1.000 | 0.551 |
| warm | XGBoost | 0.838 | 0.861 | 0.803 | 0.696 | 0.759 | 0.780 |
| cold | DDInter lookup | 0.691 | 0.714 | 0.382 | 1.000 | 1.000 | 0.552 |
| cold | XGBoost | 0.780 | 0.804 | 0.619 | 0.786 | 0.772 | 0.687 |

## All pairs

| Setting | Model | AUROC | AUPRC | Sensitivity | Specificity | Precision | F1 |
|---|---|---|---|---|---|---|---|
| warm | DDInter lookup | 0.713 | 0.713 | 0.427 | 1.000 | 1.000 | 0.598 |
| warm | XGBoost | 0.838 | 0.840 | 0.749 | 0.761 | 0.758 | 0.754 |
| cold | DDInter lookup | 0.707 | 0.707 | 0.413 | 1.000 | 1.000 | 0.585 |
| cold | XGBoost | 0.774 | 0.776 | 0.578 | 0.815 | 0.757 | 0.656 |

## DDInter lookup coverage
Share of DrugBank-documented interactions in the test set that the lookup flags:

- warm: 14.2%
- cold: 14.2%

Lookup precision is ~1.0 by construction (anything listed is a known interaction); its weakness is sensitivity — interactions it has never been told about are missed.
