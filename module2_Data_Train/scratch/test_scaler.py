from pathlib import Path
import joblib
import numpy as np
import torch

_SCALER_PATH = Path(__file__).resolve().parent.parent / "models" / "cacjat_retrained" / "scaler.pkl"
scaler = joblib.load(_SCALER_PATH)
print("Scaler mean_[:10]:", scaler.mean_[:10])
print("Scaler scale_[:10]:", scaler.scale_[:10])

# Test transformation
dummy_raw = np.random.randn(1, 2304)
scaled = scaler.transform(dummy_raw)
print("Scaled shape:", scaled.shape)
tensor_in = torch.tensor(scaled, dtype=torch.float32).view(1, 64, 12, 3)
print("Tensor in shape:", tensor_in.shape)
