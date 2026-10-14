# Module 3 — AI-based ECG Quality Assessment
# AI-Powered ECG Research Platform

## What this module does

Module 3 is the **central AI quality gate** of the complete ECG monitoring platform.

Before any heart-rhythm analysis is performed, this module decides:

| Quality class | Meaning | Next action |
|---|---|---|
| **Good** | Signal is reliable | Proceed to arrhythmia screening |
| **Borderline** | Signal has some noise | Investigate artifacts, attempt repair |
| **Unusable** | Signal is too noisy | Ask patient to retake the recording |

---

## Project structure

```
module3/
├── data/
│   ├── mitdb/          ← MIT-BIH Arrhythmia Database records
│   ├── nstdb/          ← MIT-BIH Noise Stress Test Database records
│   └── processed/
│       ├── segments/   ← .npy files (one per 10-second ECG window)
│       └── labels/
│           └── ecg_metadata.csv
├── notebooks/          ← Jupyter exploration notebooks
├── src/
│   ├── preprocessing/
│   │   └── ecg_preprocessor.py   ← Load, filter, segment ECG
│   ├── quality/
│   │   ├── feature_extractor.py  ← Handcrafted signal-quality features
│   │   ├── dataset_builder.py    ← Build labeled dataset
│   │   └── quality_gate.py       ← Inference: rule-based + CNN
│   ├── models/
│   │   ├── resnet1d.py           ← 1D ResNet architecture (PyTorch)
│   │   └── trainer.py            ← Training and evaluation loop
│   └── utils/
│       └── downloader.py         ← Download ECG datasets from PhysioNet
├── models/saved/       ← Trained model weights (.pt files)
├── results/
│   ├── plots/          ← Training curves, confusion matrix, waveform plots
│   └── metrics/        ← JSON metrics, classification reports
├── tests/              ← Unit tests
├── run_pipeline.py     ← End-to-end pipeline runner
└── requirements.txt
```

---

## Development steps (follow in order)

### Step 1 — Install dependencies

```powershell
# Activate your virtual environment first
.\.venv\Scripts\Activate.ps1

# Install from requirements.txt
pip install -r requirements.txt
```

### Step 2 — Download datasets

```powershell
python src/utils/downloader.py
```

Downloads to `data/mitdb/` and `data/nstdb/` automatically.

### Step 3 — Test preprocessing on one record

```powershell
python src/preprocessing/ecg_preprocessor.py
```

Saves a waveform comparison plot to `results/plots/preprocessing_comparison.png`.

### Step 4 — Test quality feature extraction

```powershell
python src/quality/feature_extractor.py
```

### Step 5 — Run the rule-based quality gate (no model needed)

```powershell
python src/quality/quality_gate.py
```

### Step 6 — Build the training dataset

```powershell
python src/quality/dataset_builder.py
```

Creates `data/processed/labels/ecg_metadata.csv`.

### Step 7 — Train the AI model

```powershell
python src/models/trainer.py
```

Best model saved to `models/saved/best_model.pt`.

### Step 8 — Run the complete pipeline

```powershell
# Rule-based (no trained model needed)
python run_pipeline.py

# With trained model
python run_pipeline.py --use-model
```

---

## AI model

**Architecture:** 1D ResNet (lightweight, designed for 10-second ECG segments)

- Input: `(batch, 1, 3600)` — one channel, 3 600 samples at 360 Hz
- Output: `(batch, 3)` — logits for [Good, Borderline, Unusable]
- Approx. 1.2 M trainable parameters

**Training strategy:**
- Record-level train/val/test split (no data leakage)
- Weighted sampling to handle class imbalance
- AdamW optimizer with cosine annealing schedule

---

## Datasets used

| Dataset | Source | Purpose |
|---|---|---|
| MIT-BIH Arrhythmia Database | PhysioNet | Clean ECG signals → Good quality examples |
| MIT-BIH Noise Stress Test DB | PhysioNet | Real noisy ECGs → Borderline / Unusable examples |

Synthetic noise (white noise, baseline wander) is added to clean records
to create additional Borderline and Unusable examples.

> **Important:** The quality labeling thresholds (SNR ≥ 15 dB = Good, etc.)
> are starting points for experimentation. These must be validated
> against your research criteria before use.

---

## Research novelty of Module 3

1. **Quality gate before arrhythmia screening** — unreliable recordings
   are rejected before automated rhythm analysis.
2. **Beat-level quality scoring** — each 10-second window is assessed
   independently rather than treating the whole recording uniformly.
3. **Confidence-aware output** — the model provides class probabilities
   and can abstain when uncertain.
4. **Rule-based fallback** — works even without a trained model, using
   SNR-based thresholds.
