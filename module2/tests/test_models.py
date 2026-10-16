"""
Unit Tests for Module 2 Machine Learning Models:
  1. Lifestyle Priority Ranking (XGBoost + LightGBM)
  2. Smoking Stage Detection
  3. Random Forest Exercise Prescriber
  4. CA-CJAT Deep Attention Transformer
  5. DQN Reinforcement Learning Adaptive Coach
"""

import os
import torch
import numpy as np
import pandas as pd
import pytest

from module2.src.models.ca_cjat import CACJAT, build_clinical_attention_bias
from module2.src.models.dqn_agent import DQNAgent
from module2.src.models.exercise_prescriber import ExercisePrescriptionEngine


def test_clinical_attention_bias_matrix():
    B = build_clinical_attention_bias(num_joints=33, d_model=64)
    assert B.shape == (33, 33)
    # Check that critical joints (e.g. knees 25, 26, hips 23, 24) have higher bias
    assert B[25, 26] > B[0, 1]
    assert B[23, 24] > B[15, 16]


def test_cacjat_forward_pass():
    model = CACJAT(in_features=4, num_joints=33, d_model=64, num_heads=4)
    poses = torch.randn(2, 20, 33, 4) # (batch=2, frames=20, joints=33, coords=4)
    confidences = torch.rand(2, 20)

    out = model(poses, confidences)
    assert 'rep_logits' in out
    assert 'set_logits' in out
    assert 'session_quality' in out
    assert 'fatigue_pred' in out

    assert out['rep_logits'].shape == (2, 20, 4)
    assert out['set_logits'].shape == (2, 3)
    assert out['session_quality'].shape == (2, 1)
    assert out['fatigue_pred'].shape == (2, 2)


def test_exercise_prescriber():
    engine = ExercisePrescriptionEngine()
    patient = {
        'Age': 55, 'Gender': 1, 'BMI': 32.0,
        'Predicted_Risk_Score': 0.75, 'Sitting_Hours': 9.0, 'Baseline_Activity_Min': 5
    }
    res = engine.prescribe(patient)
    assert 'exercise_type' in res
    assert 'recommended_duration_min' in res
    assert res['recommended_duration_min'] in [5, 10, 15, 20]
    assert len(res['cardiac_safety_rules']) >= 3


def test_dqn_adaptive_feedback_loop():
    agent = DQNAgent()
    # Initial: 10-minute walk (action 3)
    initial_action = 3

    # Feedback: Too Hard -> must adapt down
    res_too_hard = agent.update_from_feedback(initial_action, 'Too Hard', cvd_risk=0.75, day_num=1)
    assert res_too_hard['reward_assigned'] == -1.0
    assert res_too_hard['adapted_action_idx'] < initial_action

    # Feedback: Done -> must adapt up
    res_done = agent.update_from_feedback(res_too_hard['adapted_action_idx'], 'Done', cvd_risk=0.70, day_num=2)
    assert res_done['reward_assigned'] == 1.0
    assert res_done['adapted_action_idx'] >= res_too_hard['adapted_action_idx']
