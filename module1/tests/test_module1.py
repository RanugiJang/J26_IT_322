"""
Tests for module1.predict_patient()
Run from the repo root:   pytest module1/tests -v
"""
import os
import sys

import pytest

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "src"))

from module1 import FACTORS, FEATURES, load, predict_patient, train_and_save  # noqa: E402

DATA = os.path.join(HERE, "..", "data", "framingham.csv")

BASE_PATIENT = {
    "male": 1, "age": 60, "currentSmoker": 1, "cigsPerDay": 20, "BPMeds": 0,
    "prevalentStroke": 0, "prevalentHyp": 1, "diabetes": 0, "totChol": 260,
    "sysBP": 165, "diaBP": 98, "BMI": 29.5, "heartRate": 80, "glucose": 95,
}
LOW_RISK_PATIENT = {
    "male": 0, "age": 35, "currentSmoker": 0, "cigsPerDay": 0, "BPMeds": 0,
    "prevalentStroke": 0, "prevalentHyp": 0, "diabetes": 0, "totChol": 180,
    "sysBP": 110, "diaBP": 70, "BMI": 22.0, "heartRate": 70, "glucose": 80,
}


@pytest.fixture(scope="module")
def model(tmp_path_factory):
    if not os.path.exists(DATA):
        pytest.skip("framingham.csv not found in module1/data/")
    path = tmp_path_factory.mktemp("m") / "model.joblib"
    train_and_save(DATA, str(path))
    return load(str(path))


# ---------------------------------------------------------------- output format
def test_profile_has_all_fields(model):
    p = predict_patient(model, BASE_PATIENT, patient_id="T1")
    expected = {"patient_id", "risk_score", "risk_band", "risk_range", "risk_trend",
                "top_factors", "similar_patients", "confidence_flag", "genetic_risk",
                "missing_inputs", "timestamp", "model_version"}
    assert expected.issubset(p.keys())
    assert p["patient_id"] == "T1"


def test_risk_is_a_probability(model):
    p = predict_patient(model, BASE_PATIENT)
    assert 0.0 <= p["risk_score"] <= 1.0


def test_risk_range_is_ordered(model):
    lo, hi = predict_patient(model, BASE_PATIENT)["risk_range"]
    assert 0.0 <= lo <= hi <= 1.0


def test_risk_band_matches_score(model):
    p = predict_patient(model, BASE_PATIENT)
    r = p["risk_score"]
    expected = "low" if r < 0.10 else "moderate" if r < 0.20 else "high"
    assert p["risk_band"] == expected


def test_top_factors_have_valid_types(model):
    p = predict_patient(model, BASE_PATIENT)
    assert len(p["top_factors"]) == 5
    for f in p["top_factors"]:
        assert f["feature"] in FEATURES
        assert f["type"] in {"fixed", "modifiable", "treatment"}
        assert f["direction"] in {"raises", "lowers"}


def test_five_similar_patients(model):
    p = predict_patient(model, BASE_PATIENT)
    assert len(p["similar_patients"]) == 5
    assert 0.0 <= p["similar_patients_event_rate"] <= 1.0


def test_placeholders_are_null(model):
    p = predict_patient(model, BASE_PATIENT)
    assert p["genetic_risk"] is None
    assert p["risk_trend"] is None


def test_every_feature_is_labelled():
    assert set(FACTORS) == set(FEATURES)


# ---------------------------------------------------------------- clinical sense
def test_high_risk_patient_scores_above_low_risk(model):
    high = predict_patient(model, BASE_PATIENT)["risk_score"]
    low = predict_patient(model, LOW_RISK_PATIENT)["risk_score"]
    assert high > low


def test_higher_blood_pressure_does_not_lower_risk(model):
    normal = predict_patient(model, {**BASE_PATIENT, "sysBP": 120})["risk_score"]
    high = predict_patient(model, {**BASE_PATIENT, "sysBP": 200})["risk_score"]
    assert high >= normal


def test_older_age_does_not_lower_risk(model):
    young = predict_patient(model, {**BASE_PATIENT, "age": 40})["risk_score"]
    old = predict_patient(model, {**BASE_PATIENT, "age": 70})["risk_score"]
    assert old >= young


def test_same_input_gives_same_output(model):
    a = predict_patient(model, BASE_PATIENT)["risk_score"]
    b = predict_patient(model, BASE_PATIENT)["risk_score"]
    assert a == b


# ---------------------------------------------------------------- bad / missing input
def test_impossible_value_is_rejected(model):
    with pytest.raises(ValueError):
        predict_patient(model, {**BASE_PATIENT, "sysBP": 500})


def test_missing_values_are_filled_and_reported(model):
    patient = {k: v for k, v in BASE_PATIENT.items() if k not in ("glucose", "totChol")}
    p = predict_patient(model, patient)
    assert set(p["missing_inputs"]) == {"glucose", "totChol"}
    assert 0.0 <= p["risk_score"] <= 1.0


def test_many_missing_values_lower_confidence(model):
    patient = {k: BASE_PATIENT[k] for k in ("male", "age", "sysBP")}
    p = predict_patient(model, patient)
    assert p["confidence_flag"] == "low"
