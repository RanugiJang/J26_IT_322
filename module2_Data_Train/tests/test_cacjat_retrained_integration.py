"""
Tests for Retrained CA-CJAT Exercise-Quality Model Integration:
  1. Model loading (checkpoint, scaler, config)
  2. Valid sample prediction (resampling, scaling, thresholding, output format)
  3. Missing or invalid landmarks safety handling (no fake predictions)
  4. Video analysis endpoint integration (/api/analyze-video-file)
"""

import os
import cv2
import json
import torch
import numpy as np
import pytest
from fastapi.testclient import TestClient

from module2.src.models.ca_cjat import (
    RetrainedCACJAT,
    CACJATRetrainedPredictor,
    get_retrained_cacjat_predictor
)
from module2.src.domains.exercise import ExerciseDomain
from backend.main import app


@pytest.fixture
def predictor():
    return get_retrained_cacjat_predictor(model_dir="module2/models/cacjat_retrained")


def test_retrained_model_loading(predictor):
    """Verifies that config, scaler, and PyTorch model state_dict load with 100% exact alignment."""
    assert predictor.threshold == 0.5
    assert predictor.n_frames == 64
    assert len(predictor.feature_columns) == 36
    assert predictor.scaler.n_features_in_ == 2304

    # Verify PyTorch model
    assert isinstance(predictor.model, RetrainedCACJAT)
    assert not predictor.model.training  # in eval mode


def test_retrained_valid_sample_prediction(predictor):
    """Verifies prediction pipeline on a realistic 36-coordinate sequence."""
    # Create realistic test sequence of 45 frames (less than 64 to test resampling)
    # Using typical REHAB24-6 coordinate ranges (metres, hip-centred)
    np.random.seed(42)
    n_frames = 45
    sequence_36 = np.zeros((n_frames, 36), dtype=np.float32)

    # Fill shoulders, elbows, knees around realistic means
    sequence_36[:, 0] = 0.15 + 0.02 * np.random.randn(n_frames)   # LeftShoulder_X
    sequence_36[:, 1] = 0.43 + 0.01 * np.random.randn(n_frames)   # LeftShoulder_Y
    sequence_36[:, 2] = 0.06 + 0.01 * np.random.randn(n_frames)   # LeftShoulder_Z
    sequence_36[:, 3] = -0.10 + 0.02 * np.random.randn(n_frames)  # RightShoulder_X
    sequence_36[:, 4] = 0.43 + 0.01 * np.random.randn(n_frames)   # RightShoulder_Y
    sequence_36[:, 5] = -0.04 + 0.01 * np.random.randn(n_frames)  # RightShoulder_Z
    sequence_36[:, 24] = 0.07 + 0.02 * np.random.randn(n_frames)  # LeftKnee_X
    sequence_36[:, 25] = -0.42 + 0.02 * np.random.randn(n_frames) # LeftKnee_Y
    sequence_36[:, 27] = -0.12 + 0.02 * np.random.randn(n_frames) # RightKnee_X
    sequence_36[:, 28] = -0.42 + 0.02 * np.random.randn(n_frames) # RightKnee_Y

    res = predictor.predict_sequence(sequence_36)

    assert res["success"] is True
    assert "probability" in res
    assert 0.0 <= res["probability"] <= 1.0
    assert res["prediction"] in ["correct", "incorrect"]
    assert res["threshold"] == 0.5
    assert "form_label" in res
    assert "form_state" in res
    assert "disclaimer" in res["model_metadata"]
    # Check Condition 8: disclaimer states experimental status
    assert "Experimental" in res["model_metadata"]["disclaimer"]


def test_retrained_invalid_or_missing_landmarks(predictor):
    """Verifies that missing, empty, or too-short inputs do NOT silently generate fake predictions."""
    # 1. None input
    res_none = predictor.predict_sequence(None)
    assert res_none["success"] is False
    assert res_none["prediction"] is None
    assert res_none["probability"] is None
    assert res_none["status"] == "insufficient_pose_landmarks"

    # 2. Too short (<10 frames)
    short_seq = np.random.randn(5, 36).astype(np.float32)
    res_short = predictor.predict_sequence(short_seq)
    assert res_short["success"] is False
    assert res_short["prediction"] is None
    assert res_short["status"] == "insufficient_pose_landmarks"

    # 3. Dimension mismatch (e.g. 20 coords instead of 36)
    bad_dim_seq = np.random.randn(25, 20).astype(np.float32)
    res_dim = predictor.predict_sequence(bad_dim_seq)
    assert res_dim["success"] is False
    assert res_dim["status"] == "dimension_mismatch"


def test_exercise_domain_retrained_integration():
    """Verifies that ExerciseDomain integrates the retrained predictor."""
    domain = ExerciseDomain(retrained_cacjat_dir="module2/models/cacjat_retrained")
    assert domain.retrained_predictor is not None

    # Test evaluate_retrained_cacjat
    valid_seq = np.random.randn(30, 36).astype(np.float32)
    eval_res = domain.evaluate_retrained_cacjat(valid_seq)
    assert eval_res["success"] is True
    assert "probability" in eval_res


def test_video_upload_endpoint(tmp_path):
    """Verifies that /api/analyze-video-file runs end-to-end and returns CA-CJAT prediction & disclaimer."""
    # Create a small valid test video file (30 frames)
    video_file = tmp_path / "test_movement.mp4"
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(str(video_file), fourcc, 15.0, (320, 240))

    # Draw moving white rectangle simulating human silhouette motion
    for i in range(30):
        frame = np.zeros((240, 320, 3), dtype=np.uint8)
        y_pos = int(60 + 20 * np.sin(i * 0.4))
        # Person torso & legs rectangle
        cv2.rectangle(frame, (130, y_pos), (190, y_pos + 120), (255, 255, 255), -1)
        out.write(frame)
    out.release()

    client = TestClient(app)
    with open(str(video_file), "rb") as f:
        response = client.post(
            "/api/analyze-video-file",
            files={"file": ("test_movement.mp4", f, "video/mp4")},
            data={
                "patient_id": "TEST-P01",
                "prescribed_exercise_id": "ex-walk-10",
                "patient_name": "Test Patient"
            }
        )

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "overall_form_score" in data
    assert "cacjat_evaluation" in data
    assert "disclaimer" in data
    assert "Experimental" in data["disclaimer"]
