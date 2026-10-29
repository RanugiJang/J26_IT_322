import torch
import torch.nn as nn
import joblib
import json

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
        # x: (batch_size, frames=64, joints=12, coords=3) or (batch_size, 64, 36)
        B, T, J, C = x.shape
        # Embed joint coordinates
        h = self.embed(x) # (B, T, J, d_model)
        
        # Spatial attention across joints for each frame
        h_spatial = h.view(B * T, J, self.d_model)
        attn_out, _ = self.spatial(h_spatial, h_spatial, h_spatial)
        # Pool across joints (e.g. mean) -> (B * T, d_model)
        h_pooled = attn_out.mean(dim=1).view(B, T, self.d_model)
        
        # Temporal transformer across frames
        h_temporal = self.temporal(h_pooled) # (B, T, d_model)
        
        # Pool across temporal dimension (mean) -> (B, d_model)
        rep = h_temporal.mean(dim=1)
        
        logits = self.head(rep).squeeze(-1) # (B,)
        return logits
import os
from pathlib import Path

_MODEL_PATH = Path(__file__).resolve().parent.parent / "models" / "cacjat_retrained" / "cacjat_model.pth"
ckpt = torch.load(_MODEL_PATH, map_location="cpu")
model = RetrainedCACJAT()
# Try loading state_dict
try:
    load_res = model.load_state_dict(ckpt["model_state_dict"], strict=True)
    print("SUCCESS: State dict loaded with strict=True!")
    print(load_res)
except Exception as e:
    print("Mismatch loading state dict:", e)

# Test a forward pass
x_dummy = torch.randn(2, 64, 12, 3)
with torch.no_grad():
    out = model(x_dummy)
    prob = torch.sigmoid(out)
    print("Dummy output logits:", out)
    print("Dummy output probs:", prob)
