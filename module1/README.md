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

## Results (Framingham test set, n = 848)

| Model | AUC-ROC (95% CI) | Brier | Calibration error |
|---|---|---|---|
| Logistic regression (calibrated) | 0.696 (0.645–0.743) | 0.120 | 0.017 |
| XGBoost (uncalibrated) | 0.679 (0.628–0.730) | 0.195 | 0.236 |
| **XGBoost + Platt (used)** | **0.679 (0.628–0.730)** | **0.121** | **0.015** |

- Platt scaling cut calibration error from 0.236 → 0.015: risk percentages now match observed rates.
- About **59%** of the model's risk explanation comes from **modifiable** factors (notebook 10).
- AUC ≈ 0.68–0.70 is typical for the Framingham dataset; the proposal target (≥ 0.85) was not reached and is recorded in the decision log.

<!-- TODO: add key numbers from notebooks 02, 03, 05, 07, 08, 09 -->

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
