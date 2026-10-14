"""
Module 3 — ECG Quality Inference API
Load the trained model and run inference on a single ECG segment.

Usage (standalone)
------------------
python src/quality/quality_gate.py

Expected output
---------------
{
  "quality_class": "Borderline",
  "quality_score": 0.62,
  "probabilities": {"Good": 0.21, "Borderline": 0.62, "Unusable": 0.17},
  "decision": "Investigate artifacts"
}
"""

import sys
from pathlib import Path

import numpy as np
import torch
import torch.nn.functional as F

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
from src.models.resnet1d import ECGQualityResNet


# =====================================================================
# Constants
# =====================================================================
CLASS_NAMES     = ["Good", "Borderline", "Unusable"]
SEGMENT_SAMPLES = 3600

DECISIONS = {
    "Good":       "Proceed to arrhythmia screening",
    "Borderline": "Investigate artifacts",
    "Unusable":   "Ask patient to retake the recording",
}


# =====================================================================
# Quality Gate
# =====================================================================

class ECGQualityGate:
    """
    Wraps the trained ECGQualityResNet and exposes a simple predict()
    interface for the rest of the pipeline.
    """

    def __init__(self, model_path: str = "models/saved/best_model.pt",
                 device: str = None):
        if device is None:
            device = "cuda" if torch.cuda.is_available() else "cpu"
        self.device = torch.device(device)

        self.model = ECGQualityResNet(num_classes=3).to(self.device)
        state = torch.load(model_path, map_location=self.device, weights_only=True)
        self.model.load_state_dict(state)
        self.model.eval()
        print(f"[QualityGate] Model loaded from {model_path}  (device: {device})")

    def predict(self, segment: np.ndarray, fs: int = 360) -> dict:
        """
        Run quality assessment on a single ECG segment.

        Parameters
        ----------
        segment : np.ndarray  Shape (N,) — raw or preprocessed ECG window
        fs      : int          Sampling frequency (not used by the CNN,
                               kept for API consistency)

        Returns
        -------
        result : dict
            quality_class  : str    — "Good" | "Borderline" | "Unusable"
            quality_score  : float  — probability of the predicted class
            probabilities  : dict   — {class: probability}
            decision       : str    — human-readable next-step description
        """
        # Prepare tensor
        seg = segment.astype(np.float32)
        if len(seg) < SEGMENT_SAMPLES:
            seg = np.pad(seg, (0, SEGMENT_SAMPLES - len(seg)))
        else:
            seg = seg[:SEGMENT_SAMPLES]

        x = torch.from_numpy(seg).unsqueeze(0).unsqueeze(0).to(self.device)  # (1,1,3600)

        with torch.no_grad():
            logits = self.model(x)
            probs  = F.softmax(logits, dim=1).squeeze().cpu().tolist()

        pred_idx    = int(np.argmax(probs))
        pred_class  = CLASS_NAMES[pred_idx]
        pred_score  = round(probs[pred_idx], 4)
        prob_dict   = {cls: round(p, 4) for cls, p in zip(CLASS_NAMES, probs)}

        return {
            "quality_class": pred_class,
            "quality_score": pred_score,
            "probabilities": prob_dict,
            "decision":      DECISIONS[pred_class],
        }


# =====================================================================
# Rule-based fallback (no trained model required)
# =====================================================================

def rule_based_quality(segment: np.ndarray, fs: int = 360) -> dict:
    """
    Simple SNR-based quality assessment that works without a trained model.
    Use this to prototype the pipeline before training is complete.
    """
    sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
    from src.quality.feature_extractor import snr_estimate

    snr = snr_estimate(segment, fs)

    if snr >= 15.0:
        cls, score = "Good", min(1.0, (snr - 15) / 20 + 0.7)
    elif snr >= 5.0:
        cls, score = "Borderline", (snr - 5) / 10 * 0.4 + 0.3
    else:
        cls, score = "Unusable", max(0.0, 1 - (snr + 5) / 10)

    return {
        "quality_class": cls,
        "quality_score": round(float(score), 4),
        "snr_db":        round(float(snr), 2),
        "decision":      DECISIONS[cls],
        "method":        "rule-based (SNR threshold)",
    }


# =====================================================================
# Quick self-test
# =====================================================================

if __name__ == "__main__":
    import json

    rng = np.random.default_rng(0)

    print("=== Rule-based quality gate (no model needed) ===\n")

    for label, snr_target in [("Good", 20), ("Borderline", 10), ("Unusable", 1)]:
        sig_power   = 1.0
        noise_power = sig_power / (10 ** (snr_target / 10))
        seg = (rng.standard_normal(3600) * np.sqrt(sig_power) +
               rng.standard_normal(3600) * np.sqrt(noise_power)).astype(np.float32)

        result = rule_based_quality(seg, fs=360)
        print(f"[{label:10s}]  {json.dumps(result, indent=2)}\n")
