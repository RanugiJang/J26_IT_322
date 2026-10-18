# Module 1 – Explainable CVD Risk Prediction using ML Models and Federated GNN

Part of **J26-IT-322 – An Integrated AI Framework for Cardiovascular Health Management**
Owner: Jang R G (IT23178472)

Module 1 estimates a patient's **10-year cardiovascular disease (CHD) risk**, explains **why**, separates
factors the patient **can change** from those they cannot, shows **similar past patients**, and reports
**how certain** the prediction is. Its output is the Module 1 part of the **Shared Patient Profile**
used by Modules 2–4.

> Research prototype – not for clinical use.

---

## Folder structure

```
module1/
├── data/            ← datasets (NOT on GitHub – see "Data")
├── notebooks/       ← research experiments 01–10
├── outputs/         ← charts, metrics, trained model (NOT on GitHub)
├── src/
│   ├── module1.py   ← predict_patient() – the module's API
│   └── app.py       ← Streamlit demo
├── tests/
│   └── test_module1.py
├── requirements.txt
└── README.md
```

---

## Setup

```bash
# from the repo root (J26_IT_322)
python3 -m venv venv
source venv/bin/activate
pip install -r module1/requirements.txt
```

**Mac (Apple chip) only:** XGBoost needs OpenMP: `brew install libomp`

---

## Data

Data files are **not committed** (public repo; licence terms). Put them in `module1/data/`:

| File | Source | Used in |
|---|---|---|
| `framingham.csv` | Kaggle – Framingham Heart Study (4,238 patients, 10-year CHD outcome) | 01, 03, 05, 06, 08, 09, 10, `module1.py` |
| `framingham.rda` | `riskCommunicator` R package – longitudinal teaching dataset (3 exams per patient) | 07 |
| `UCI/processed.{cleveland,hungarian,switzerland,va}.data` | UCI Heart Disease – 4 hospitals | 02, 04, 09 |

Teaching datasets only. Results are not intended for clinical publication.

---

## How to run

**1. Train the model and print an example profile**
```bash
python module1/src/module1.py
```

**2. Demo app**
```bash
streamlit run module1/src/app.py
```
Opens at http://localhost:8501

**3. Tests**
```bash
pytest module1/tests -v
```

**4. Use from code (other modules / backend)**
```python
from module1 import load, predict_patient
m = load("module1/outputs/module1_model.joblib")
profile = predict_patient(m, {"age": 60, "male": 1, "sysBP": 165, ...}, patient_id="P001")
```

---

## Notebooks

| # | Notebook | What it does |
|---|---|---|
| 01 | `01_baseline` | Logistic regression vs XGBoost, Platt calibration, Youden threshold, SHAP |
| 02 | `02_federated` | Federated learning (FedAvg) across 4 UCI hospitals – data never leaves each hospital |
| 03 | `03_gnn` | Patient-similarity graph + Graph Attention Network; attention shows similar patients |
| 04 | `04_federated_gnn` | Federated GNN – each hospital trains a GCN on its own graph, weights averaged |
| 05 | `05_uncertainty` | MC Dropout – risk range instead of a single number |
| 06 | `06_causal` | DoWhy causal effect estimates with refutation tests |
| 07 | `07_lstm_trend` | LSTM forecasting risk trend over 3 exams |
| 08 | `08_baselines` | Comparison with Framingham Risk Score, bootstrap CIs, 5-fold CV |
| 09 | `09_ablation` | Ablation – contribution of each component |
| 10 | `10_explanations` | Fixed vs modifiable vs treatment factors |

---

## Results

### 1. Risk prediction vs clinical baseline – Framingham test set (n = 848) · notebooks 01, 08

| Model | Test AUC (95% CI) | 5-fold CV AUC | Brier | Calibration error |
|---|---|---|---|---|
| Framingham Risk Score (office, clinical standard) | 0.702 (0.653–0.747) | 0.717 ± 0.016 | – | – |
| Logistic regression (calibrated) | 0.696 (0.648–0.741) | 0.726 ± 0.019 | 0.120 | 0.017 |
| XGBoost (uncalibrated) | 0.679 (0.627–0.728) | 0.705 ± 0.022 | 0.194 | 0.236 |
| **XGBoost + Platt (used)** | **0.679 (0.627–0.728)** | 0.705 ± 0.022 | **0.121** | **0.015** |

- No model is significantly better than the Framingham Risk Score (paired bootstrap: XGBoost − FRS = −0.023, 95% CI −0.052 to +0.006).
  Module 1's contribution is therefore **explanation, uncertainty and similar-patient evidence at FRS-level accuracy**, not higher AUC.
- Platt scaling cut calibration error from 0.236 → 0.015: predicted percentages now match observed event rates.
- The proposal target (AUC ≥ 0.85) is not reachable on this dataset; recorded in the decision log.

### 2. Federated learning – UCI Heart Disease, 4 hospitals · notebook 02

| Hospital | Local only | Centralised (all data pooled) | **Federated (FedAvg)** |
|---|---|---|---|
| Cleveland | 0.892 | 0.896 | **0.897** |
| Hungary | 0.912 | 0.890 | **0.890** |
| Switzerland* | 0.457 | 0.371 | **0.400** |
| VA | 0.723 | 0.785 | **0.785** |
| All (combined test) | – | 0.880 | **0.881** |

- Federated AUC (0.881) matches centralised (0.880) **without sharing patient data** between hospitals.
- Smaller hospitals gain most (VA +0.062 vs training alone).
- \*Switzerland has only 2 healthy patients in its test set, so its AUC is unreliable and excluded from averages.

### 3. Explainability and uncertainty · notebooks 03, 05, 10

| Component | Result |
|---|---|
| GAT patient-similarity graph | AUC 0.688 (logistic regression 0.696) – similar accuracy, but adds **similar-patient evidence** (e.g. "4 of 5 similar past patients developed CHD") |
| MC Dropout uncertainty | Low-uncertainty patients: **85%** correct · High-uncertainty: **31%** correct → the flag identifies predictions a clinician should double-check |
| Fixed vs modifiable factors | **59%** of the risk explanation comes from factors the patient can change |

### 4. Risk trend over time – Framingham longitudinal (3 exams) · notebook 07

- Patients whose trend was **increasing** had a 25.9% CVD rate vs 9.8% for **stable** patients.
- Trend classifier balanced accuracy **0.64** (always guessing "stable" gives 0.33 balanced).
- Adding exam history: AUC gain +0.025 (95% CI −0.004 to +0.059) – promising but not yet significant.

### 5. Ablation – what each component adds · notebook 09

| Component | Metric | With | Without | Change |
|---|---|---|---|---|
| Platt calibration | Brier (lower = better) | 0.121 | 0.194 | **−0.073** |
| Patient-similarity graph (GAT) | AUC | 0.688 | 0.696 | −0.008 |
| Exam history (LSTM, 3 exams vs last only) | AUC | 0.761 | 0.720 | **+0.041** |
| Federation (mean of 3 hospitals) | AUC | 0.858 | 0.842 | **+0.015** |
| Federation – VA hospital | AUC | 0.785 | 0.723 | **+0.062** |

**Summary:** calibration, exam history and federation improve performance; the graph's value is
explanation (similar patients), not accuracy.

---

## Output – Shared Patient Profile (Module 1 part)

| Field | Meaning |
|---|---|
| `risk_score` | Calibrated 10-year CHD risk (0–1) |
| `risk_band` | low (< 10%), moderate (10–20%), high (≥ 20%) |
| `risk_range` | 5th–95th percentile across 20 bootstrap models |
| `top_factors` | Top 5 SHAP factors with type (fixed / modifiable / treatment) and direction |
| `similar_patients` | 5 nearest training patients and their outcomes |
| `confidence_flag` | `low` if range > 15 points or > 2 inputs missing |
| `missing_inputs` | Inputs filled with the training median |
| `risk_trend` | `null` – needs ≥ 3 past visits |
| `genetic_risk` | `null` – polygenic risk score is future work |

**Goes to:** Module 2 (modifiable factors → lifestyle advice), Module 3 (risk band → monitoring sensitivity),
Module 4 (treatment / conditions → drug-interaction checks).

---

## Limitations and future work

- Public teaching datasets only; validation on Sri Lankan data (WHO STEPS 2021, local hospital) is pending approval.
- `risk_trend` needs a patient's visit history; available once the shared database is in place.
- Polygenic risk score (genetic risk) moved to future work.
- To be exposed as a FastAPI endpoint for the integrated CardioLoop system after PP1.