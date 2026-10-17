"""Use the trained exercise-quality models on a patient's session.

    from exercise_inference import predict_session
    out = predict_session("squat", reps)       # reps = list of DataFrames, one per repetition

Each repetition DataFrame needs the 12 joint columns used in REHAB24-6 (hip-centred, metres, time-ordered):
    LeftShoulder_X/Y/Z, RightShoulder_X/Y/Z, LeftElbow_*, RightElbow_*, LeftWrist_*, RightWrist_*,
    LeftKnee_*, RightKnee_*, LeftAnkle_*, RightAnkle_*, LeftFootIndex_*, RightFootIndex_*

Why a whole session: the models compare each repetition with the patient's OWN typical movement
(per-person median normalisation), so at least MIN_REPS repetitions of the same exercise are needed.
"""
from pathlib import Path

import joblib
import numpy as np
import pandas as pd

from .models.train_exercise_quality import angle_sequence, rep_features

MIN_REPS = 5
WARNING = ("Decision-support only. Trained on motion-capture data from 8-10 people (not cardiac patients); "
           "balanced accuracy on unseen people was about 67-82% depending on the exercise. "
           "A patient who performs EVERY repetition the same wrong way can look 'normal' because each "
           "repetition is compared with the patient's own typical movement.")

_BUNDLE = None


def _bundle(path=None):
    global _BUNDLE
    if _BUNDLE is None:
        _BUNDLE = joblib.load(path or Path(__file__).resolve().parent / "exercise_quality_models.pkl")
    return _BUNDLE


def predict_session(exercise, reps, model_path=None, threshold=0.5):
    b = _bundle(model_path)
    if exercise not in b["exercises"]:
        raise ValueError(f"Unknown exercise '{exercise}'. Choose from {sorted(b['exercises'])}")
    if len(reps) < MIN_REPS:
        raise ValueError(f"Need at least {MIN_REPS} repetitions of the same exercise (got {len(reps)}).")
    spec = b["exercises"][exercise]
    feats = pd.DataFrame([rep_features(angle_sequence(r.reset_index(drop=True))) for r in reps])[spec["features"]]
    feats = feats - feats.median()                      # patient's own typical movement (label-free)
    p_correct = spec["model"].predict_proba(feats.values)[:, list(spec["model"].classes_).index(1)]
    return {
        "exercise": exercise,
        "n_reps": len(reps),
        "repetitions": [{"rep": i + 1, "p_correct": round(float(p), 3),
                         "label": "correct" if p >= threshold else "incorrect"} for i, p in enumerate(p_correct)],
        "share_correct": round(float((p_correct >= threshold).mean()), 3),
        "warning": WARNING,
    }
