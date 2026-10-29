"""
Module 1 – Explainable CVD Risk Prediction
Single entry point used by the demo app and by Modules 2–4.

    from module1 import train_and_save, load, predict_patient

    train_and_save("../data/framingham.csv", "../outputs/module1_model.joblib")   # once
    m = load("../outputs/module1_model.joblib")
    profile = predict_patient(m, patient_dict, patient_id="P001")

The returned dict is the Shared Patient Profile (Module 1 part).
"""

import os
os.environ.setdefault("KMP_DUPLICATE_LIB_OK", "TRUE")
os.environ.setdefault("OMP_NUM_THREADS", "1")

from datetime import datetime, timezone

import joblib
import numpy as np
import pandas as pd
from xgboost import XGBClassifier          # import xgboost before shap/torch (Mac fix)
import shap
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.neighbors import NearestNeighbors
from sklearn.preprocessing import StandardScaler

SEED = 42
TARGET = "TenYearCHD"
N_BOOTSTRAP = 20            # models used for the risk range
WIDE_RANGE = 0.15           # range wider than 15 points → low confidence

FEATURES = ["male", "age", "currentSmoker", "cigsPerDay", "BPMeds", "prevalentStroke",
            "prevalentHyp", "diabetes", "totChol", "sysBP", "diaBP", "BMI",
            "heartRate", "glucose"]

# name, type, unit (None = yes/no)
FACTORS = {
    "male":            ("Sex (male)",                   "fixed",      None),
    "age":             ("Age",                          "fixed",      "years"),
    "prevalentStroke": ("Previous stroke",              "fixed",      None),
    "BPMeds":          ("On blood pressure medication", "treatment",  None),
    "currentSmoker":   ("Current smoker",               "modifiable", None),
    "cigsPerDay":      ("Cigarettes per day",           "modifiable", "per day"),
    "prevalentHyp":    ("Hypertension",                 "modifiable", None),
    "diabetes":        ("Diabetes",                     "modifiable", None),
    "totChol":         ("Total cholesterol",            "modifiable", "mg/dL"),
    "sysBP":           ("Systolic blood pressure",      "modifiable", "mmHg"),
    "diaBP":           ("Diastolic blood pressure",     "modifiable", "mmHg"),
    "BMI":             ("Body mass index",              "modifiable", "kg/m²"),
    "heartRate":       ("Heart rate",                   "modifiable", "bpm"),
    "glucose":         ("Blood glucose",                "modifiable", "mg/dL"),
}

# Plausible input ranges (outside → input error)
VALID_RANGES = {
    "age": (18, 100), "cigsPerDay": (0, 100), "totChol": (80, 700), "sysBP": (70, 300),
    "diaBP": (40, 200), "BMI": (12, 70), "heartRate": (30, 200), "glucose": (40, 500),
}


# ---------------------------------------------------------------- helpers
def _logit(p):
    p = np.clip(p, 1e-6, 1 - 1e-6)
    return np.log(p / (1 - p)).reshape(-1, 1)


def _new_xgb(pos_weight):
    return XGBClassifier(
        n_estimators=300, max_depth=3, learning_rate=0.03, subsample=0.8,
        colsample_bytree=0.8, min_child_weight=5, scale_pos_weight=pos_weight,
        eval_metric="logloss", random_state=SEED, n_jobs=1)


def _risk_band(p):
    if p < 0.10:
        return "low"
    if p < 0.20:
        return "moderate"
    return "high"


# ---------------------------------------------------------------- training
def train_and_save(data_path, model_path):
    """Train everything Module 1 needs and save it to one file."""
    df = pd.read_csv(data_path).drop_duplicates()
    df.loc[(df["currentSmoker"] == 0) & (df["cigsPerDay"].isna()), "cigsPerDay"] = 0
    X, y = df[FEATURES], df[TARGET].astype(int)

    X_train, X_tmp, y_train, y_tmp = train_test_split(
        X, y, test_size=0.4, stratify=y, random_state=SEED)
    X_cal, _, y_cal, _ = train_test_split(
        X_tmp, y_tmp, test_size=0.5, stratify=y_tmp, random_state=SEED)

    imputer = SimpleImputer(strategy="median").fit(X_train)
    Xtr = pd.DataFrame(imputer.transform(X_train), columns=FEATURES)
    Xca = pd.DataFrame(imputer.transform(X_cal), columns=FEATURES)
    pos_weight = (y_train == 0).sum() / (y_train == 1).sum()

    # Main model + Platt scaling
    model = _new_xgb(pos_weight).fit(Xtr, y_train)
    platt = LogisticRegression().fit(_logit(model.predict_proba(Xca)[:, 1]), y_cal)

    # Bootstrap models → risk range (how much the answer changes with different training data)
    rng = np.random.default_rng(SEED)
    boot = []
    for _ in range(N_BOOTSTRAP):
        idx = rng.integers(0, len(Xtr), len(Xtr))
        m = _new_xgb(pos_weight).fit(Xtr.iloc[idx], y_train.iloc[idx])
        cal = LogisticRegression().fit(_logit(m.predict_proba(Xca)[:, 1]), y_cal)
        boot.append((m, cal))

    # Similar patients: nearest neighbours in the training set
    scaler = StandardScaler().fit(Xtr)
    knn = NearestNeighbors(n_neighbors=5).fit(scaler.transform(Xtr))

    joblib.dump({
        "imputer": imputer, "model": model, "platt": platt, "boot": boot,
        "scaler": scaler, "knn": knn,
        "train_X": Xtr.reset_index(drop=True), "train_y": y_train.reset_index(drop=True),
        "version": "module1-xgb-v1",
    }, model_path)
    return model_path


def load(model_path):
    m = joblib.load(model_path)
    m["explainer"] = shap.TreeExplainer(m["model"])
    return m


# ---------------------------------------------------------------- prediction
def _validate(patient):
    missing = [f for f in FEATURES if patient.get(f) is None]
    out_of_range = [f for f, (lo, hi) in VALID_RANGES.items()
                    if patient.get(f) is not None and not lo <= patient[f] <= hi]
    return missing, out_of_range


def predict_patient(m, patient, patient_id=None, top_n=5):
    """
    patient: dict with the 14 FEATURES (missing values allowed → filled with training median).
    Returns the Module 1 part of the Shared Patient Profile.
    """
    missing, out_of_range = _validate(patient)
    if out_of_range:
        raise ValueError(f"Values outside plausible range: {out_of_range}")

    row = pd.DataFrame([{f: patient.get(f, np.nan) for f in FEATURES}], dtype=float)
    x = pd.DataFrame(m["imputer"].transform(row), columns=FEATURES)

    # 1. Calibrated risk
    risk = float(m["platt"].predict_proba(_logit(m["model"].predict_proba(x)[:, 1]))[0, 1])

    # 2. Risk range from bootstrap models (5th–95th percentile)
    boot = [float(cal.predict_proba(_logit(bm.predict_proba(x)[:, 1]))[0, 1])
            for bm, cal in m["boot"]]
    lo, hi = np.percentile(boot, [5, 95])

    # 3. Top factors (SHAP)
    sv = m["explainer"](x).values[0]
    order = np.argsort(-np.abs(sv))[:top_n]
    top_factors = []
    for i in order:
        f = FEATURES[i]
        name, ftype, unit = FACTORS[f]
        top_factors.append({
            "feature": f, "name": name, "type": ftype,
            "value": float(x.iloc[0, i]), "unit": unit,
            "direction": "raises" if sv[i] > 0 else "lowers",
            "impact": round(float(sv[i]), 3),
            "imputed": f in missing,
        })

    # 4. Similar patients from training data
    dist, idx = m["knn"].kneighbors(m["scaler"].transform(x))
    similar = [{
        "train_index": int(j),
        "distance": round(float(d), 3),
        "age": float(m["train_X"].loc[j, "age"]),
        "sysBP": float(m["train_X"].loc[j, "sysBP"]),
        "had_chd_in_10y": bool(m["train_y"].loc[j]),
    } for d, j in zip(dist[0], idx[0])]

    # 5. Confidence flag
    reasons = []
    if hi - lo > WIDE_RANGE:
        reasons.append("wide risk range")
    if len(missing) > 2:
        reasons.append(f"{len(missing)} inputs missing")
    confidence = "low" if reasons else "high"

    return {
        "patient_id": patient_id,
        "module": "module1_risk_prediction",
        "model_version": m["version"],
        "risk_score": round(risk, 3),
        "risk_band": _risk_band(risk),
        "risk_range": [round(float(lo), 3), round(float(hi), 3)],
        "risk_trend": None,            # needs ≥3 past visits (notebook 07); not available here
        "top_factors": top_factors,
        "similar_patients": similar,
        "similar_patients_event_rate": round(np.mean([s["had_chd_in_10y"] for s in similar]), 2),
        "confidence_flag": confidence,
        "confidence_reasons": reasons,
        "missing_inputs": missing,
        "genetic_risk": None,          # future work (PGS)
        "timestamp": datetime.now(timezone.utc).isoformat(timespec="seconds"),
    }


# ---------------------------------------------------------------- quick check
if __name__ == "__main__":
    import json
    import sys
    here = os.path.dirname(os.path.abspath(__file__))
    data = sys.argv[1] if len(sys.argv) > 1 else os.path.join(here, "..", "data", "framingham.csv")
    path = os.path.join(here, "..", "outputs", "module1_model.joblib")
    os.makedirs(os.path.dirname(path), exist_ok=True)
    print("Training…")
    train_and_save(data, path)
    m = load(path)
    example = {"male": 1, "age": 60, "currentSmoker": 1, "cigsPerDay": 20, "BPMeds": 0,
               "prevalentStroke": 0, "prevalentHyp": 1, "diabetes": 0, "totChol": 260,
               "sysBP": 165, "diaBP": 98, "BMI": 29.5, "heartRate": 80, "glucose": 95}
    print(json.dumps(predict_patient(m, example, patient_id="DEMO-001"), indent=2, ensure_ascii=False))
