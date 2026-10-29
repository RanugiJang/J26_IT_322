import os
import json
import joblib
import torch
import torch.nn as nn
import numpy as np

class RetrainedCACJAT(nn.Module):
    def __init__(self, d_model=32, n_heads=4, n_layers=2, n_joints=12, dim_feedforward=64):
        super().__init__()
        self.d_model = d_model
        self.n_joints = n_joints
        self.embed = nn.Linear(3, d_model)
        self.spatial = nn.MultiheadAttention(embed_dim=d_model, num_heads=n_heads, batch_first=True)
        encoder_layer = nn.TransformerEncoderLayer(
            d_model=d_model, nhead=n_heads, dim_feedforward=dim_feedforward, batch_first=True
        )
        self.temporal = nn.TransformerEncoder(encoder_layer, num_layers=n_layers)
        self.head = nn.Sequential(
            nn.Linear(d_model, d_model),
            nn.ReLU(),
            nn.Dropout(0.1),
            nn.Linear(d_model, 1)
        )

    def forward(self, x):
        # x: (B, T=64, J=12, C=3)
        B, T, J, C = x.shape
        h = self.embed(x) # (B, T, J, d_model)
        h_spatial = h.view(B * T, J, self.d_model)
        attn_out, _ = self.spatial(h_spatial, h_spatial, h_spatial)
        h_pooled = attn_out.mean(dim=1).view(B, T, self.d_model)
        h_temporal = self.temporal(h_pooled) # (B, T, d_model)
        rep = h_temporal.mean(dim=1) # (B, d_model)
        return self.head(rep).squeeze(-1) # (B,)

class CACJATRetrainedPredictor:
    MP_JOINT_INDICES = [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28]

    def __init__(self, model_dir=None):
        if model_dir is None:
            from pathlib import Path
            model_dir = str(Path(__file__).resolve().parent.parent / "models" / "cacjat_retrained")
        self.model_dir = model_dir
        self.config_path = os.path.join(model_dir, "config.json")
        self.scaler_path = os.path.join(model_dir, "scaler.pkl")
        self.model_path = os.path.join(model_dir, "cacjat_model.pth")
        
        with open(self.config_path) as f:
            self.config = json.load(f)
            
        self.threshold = float(self.config.get("threshold", 0.5))
        self.n_frames = int(self.config.get("frames", 64))
        self.feature_columns = self.config.get("coordinate_columns", [])
        self.scaler = joblib.load(self.scaler_path)
        
        self.model = RetrainedCACJAT()
        ckpt = torch.load(self.model_path, map_location="cpu")
        state_dict = ckpt.get("model_state_dict", ckpt)
        self.model.load_state_dict(state_dict, strict=True)
        self.model.eval()

    def resample_frames(self, frames_array, target_frames=64):
        # frames_array: (N, 36)
        n = len(frames_array)
        if n == target_frames:
            return frames_array
        x_orig = np.linspace(0, 1, n)
        x_target = np.linspace(0, 1, target_frames)
        resampled = np.zeros((target_frames, frames_array.shape[1]), dtype=np.float32)
        for c in range(frames_array.shape[1]):
            resampled[:, c] = np.interp(x_target, x_orig, frames_array[:, c])
        return resampled

    def predict_sequence(self, sequence_36):
        # sequence_36: numpy array of shape (N, 36)
        if sequence_36 is None or len(sequence_36) < 10:
            return {
                "success": False,
                "error": "Insufficient valid pose frames for deep learning inference (minimum 10 required)",
                "prediction": None,
                "probability": None
            }
            
        resampled_64 = self.resample_frames(sequence_36, self.n_frames) # (64, 36)
        flat = resampled_64.reshape(1, -1) # (1, 2304)
        scaled = self.scaler.transform(flat) # (1, 2304)
        tensor_in = torch.tensor(scaled, dtype=torch.float32).view(1, self.n_frames, 12, 3)
        
        with torch.no_grad():
            logit = self.model(tensor_in)
            prob = float(torch.sigmoid(logit).item())
            
        is_correct = bool(prob >= self.threshold)
        return {
            "success": True,
            "probability": round(prob, 4),
            "prediction": "correct" if is_correct else "incorrect",
            "threshold": self.threshold,
            "form_label": "Optimal Movement Pattern (Experimental Form Model)" if is_correct else "Biomechanical Defect Detected (Experimental Form Model)",
            "form_state": "CORRECT" if is_correct else "FORM DEFECT",
            "model_metadata": {
                "architecture": "CA-CJAT (Spatial Multihead Attention + 2-layer Temporal Transformer)",
                "checkpoint": "cacjat_model.pth",
                "scaler": "scaler.pkl (StandardScaler, 2304 features)",
                "input_shape": [1, 64, 12, 3],
                "disclaimer": "Experimental biomechanical form score. Not a clinically validated diagnostic or surgical risk indicator."
            }
        }

p = CACJATRetrainedPredictor()
print("Loaded CACJATRetrainedPredictor successfully!")
# Test with dummy 30 frames
dummy_seq = np.random.randn(30, 36)
res = p.predict_sequence(dummy_seq)
print("Dummy 30-frame prediction:", res)

# Test with invalid frames (<10)
res_invalid = p.predict_sequence(np.random.randn(5, 36))
print("Invalid 5-frame prediction:", res_invalid)
