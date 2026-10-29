"""
Module 2 — CA-CJAT Architecture
Confidence-Aware Clinical Joint Attention Transformer for CVD Exercise Quality Assessment
Research Novelty:
1. Confidence-Weighted Frame Processing: L = sum(c_t * loss(y_hat_t, y_t))
2. Clinical Joint Attention Bias Matrix B: Attention = Softmax(QK^T / sqrt(d) + B)V
3. Latent Fatigue State Tracking (Within Session): z(t+1) = f_theta(z(t), h(t))
4. Multi-Granularity Feedback: Rep-level, Set-level, and Session-level outputs.
"""

import os
import math
import json
import torch
import torch.nn as nn
import torch.nn.functional as F
import numpy as np


# Clinical Joint Priority Mapping for CVD Cardiac Safety
# 33 MediaPipe Landmarks:
# 0-10: Face (low clinical weight)
# 11-12: Shoulders (Moderate - posture/breathing)
# 13-16: Elbows/Wrists (Low-Moderate)
# 23-24: Hips / Pelvis (HIGH - cardiac biomechanics & pelvic tilt)
# 25-26: Knees (CRITICAL - dangerous CVD valgus / overexertion)
# 27-28: Ankles (Moderate - base of support)
# 29-32: Feet/Toes
CLINICAL_JOINT_WEIGHTS = {
    'trunk_hips': [11, 12, 23, 24], # Posture & Thoracic expansion
    'knees': [25, 26],              # Lower limb CVD stress
    'extremities': [13, 14, 15, 16, 27, 28],
    'head': list(range(11))
}


def build_clinical_attention_bias(num_joints=33, d_model=64):
    """
    Constructs a Clinical Attention Bias Matrix B of shape (num_joints, num_joints)
    giving positive bias to heart-critical joint interactions (Knees, Hips, Shoulders).
    """
    B = torch.zeros(num_joints, num_joints)
    critical_joints = [11, 12, 23, 24, 25, 26] # Heart-critical joints

    for i in range(num_joints):
        for j in range(num_joints):
            if i in critical_joints and j in critical_joints:
                B[i, j] = 1.5   # High mutual attention for cardiovascular posture
            elif i in critical_joints or j in critical_joints:
                B[i, j] = 0.8   # Moderate attention when interacting with critical joints
            else:
                B[i, j] = -0.5  # Lower priority for peripheral joints (e.g. wrist to ear)

    return B


class ClinicalJointAttention(nn.Module):
    """
    Novelty 2: Multi-Head Attention with Clinical Bias Matrix B.
    Attention(Q, K, V) = Softmax( (Q K^T) / sqrt(d) + B ) V
    """
    def __init__(self, d_model=64, num_heads=4, num_joints=33):
        super().__init__()
        self.d_model = d_model
        self.num_heads = num_heads
        self.head_dim = d_model // num_heads

        self.q_proj = nn.Linear(d_model, d_model)
        self.k_proj = nn.Linear(d_model, d_model)
        self.v_proj = nn.Linear(d_model, d_model)
        self.out_proj = nn.Linear(d_model, d_model)

        # Clinical Bias Matrix B
        B = build_clinical_attention_bias(num_joints, d_model)
        self.register_buffer('B', B) # (33, 33)

    def forward(self, x):
        # x: (batch_size, seq_len, num_joints, d_model)
        B_sz, T, J, C = x.shape
        x_flat = x.view(B_sz * T, J, C)

        Q = self.q_proj(x_flat).view(B_sz * T, J, self.num_heads, self.head_dim).transpose(1, 2)
        K = self.k_proj(x_flat).view(B_sz * T, J, self.num_heads, self.head_dim).transpose(1, 2)
        V = self.v_proj(x_flat).view(B_sz * T, J, self.num_heads, self.head_dim).transpose(1, 2)

        # Scaled dot-product + Clinical Bias B
        scores = torch.matmul(Q, K.transpose(-2, -1)) / math.sqrt(self.head_dim)
        scores = scores + self.B.unsqueeze(0).unsqueeze(0) # Broadcast over batch*T and heads

        attn_weights = F.softmax(scores, dim=-1)
        out = torch.matmul(attn_weights, V) # (B*T, heads, J, head_dim)
        out = out.transpose(1, 2).contiguous().view(B_sz * T, J, C)
        out = self.out_proj(out)

        return out.view(B_sz, T, J, C)


class CACJAT(nn.Module):
    """
    Confidence-Aware Clinical Joint Attention Transformer with Latent Fatigue State.
    """
    def __init__(self, in_features=4, num_joints=33, d_model=64, num_heads=4, hidden_dim=128):
        super().__init__()
        self.num_joints = num_joints
        self.d_model = d_model

        # Project 4 coords (x, y, z, visibility) -> d_model
        self.joint_embed = nn.Linear(in_features, d_model)

        # Novelty 2: Clinical Joint Attention
        self.clinical_attn = ClinicalJointAttention(d_model, num_heads, num_joints)
        self.norm1 = nn.LayerNorm(d_model)

        # Temporal Sequence Transformer
        self.temporal_fc = nn.Linear(num_joints * d_model, d_model)
        self.norm2 = nn.LayerNorm(d_model)

        encoder_layer = nn.TransformerEncoderLayer(
            d_model=d_model, nhead=num_heads, dim_feedforward=hidden_dim, batch_first=True
        )
        self.temporal_transformer = nn.TransformerEncoder(encoder_layer, num_layers=2)

        # Novelty 3: Latent Fatigue State Tracker across repetitions
        # Latent state z_t = (fatigue_intensity, cardiac_reserve)
        self.fatigue_rnn = nn.GRUCell(d_model, 32)
        self.fatigue_head = nn.Sequential(
            nn.Linear(32, 16),
            nn.ReLU(),
            nn.Linear(16, 2), # [fatigue_level (0-1), stop_alert (0/1)]
            nn.Sigmoid()
        )

        # Novelty 4: Multi-Granularity Feedback Heads
        # 1. Rep-level Form Feedback (knee_inward, back_bent, arms_low, good_rep)
        self.rep_head = nn.Sequential(
            nn.Linear(d_model, 32),
            nn.ReLU(),
            nn.Linear(32, 4) # 4 defect/quality logits
        )

        # 2. Set-level Fatigue Head
        self.set_head = nn.Sequential(
            nn.Linear(d_model + 32, 32),
            nn.ReLU(),
            nn.Linear(32, 3) # [Low Fatigue, Moderate Fatigue, Severe CVD Fatigue]
        )

        # 3. Session-level Quality Score (0-100%)
        self.session_head = nn.Sequential(
            nn.Linear(d_model, 32),
            nn.ReLU(),
            nn.Linear(32, 1),
            nn.Sigmoid()
        )

    def forward(self, poses, confidences=None):
        """
        poses: (batch_size, seq_len, 33, 4) -> (x, y, z, visibility)
        confidences: (batch_size, seq_len) -> frame confidence weights c_t in [0, 1]
        """
        B_sz, T, J, F_dim = poses.shape

        if confidences is None:
            # Automatic confidence calculation from visibility
            confidences = poses[:, :, :, 3].mean(dim=-1) # (B, T)

        # 1. Embed joints
        x = self.joint_embed(poses) # (B, T, J, d_model)

        # 2. Novelty 2: Clinical Attention over Joints with Bias B
        x_attn = self.clinical_attn(x)
        x = self.norm1(x + x_attn) # (B, T, J, d_model)

        # 3. Novelty 1: Confidence-Weighted Frame Processing
        # Scale joint representations by per-frame confidence c_t
        conf_weights = confidences.unsqueeze(-1).unsqueeze(-1) # (B, T, 1, 1)
        x = x * conf_weights

        # 4. Temporal aggregation per frame
        x_frame = x.view(B_sz, T, -1) # (B, T, J*d_model)
        h_t = self.temporal_fc(x_frame)
        h_t = self.norm2(h_t)
        h_t = self.temporal_transformer(h_t) # (B, T, d_model)

        # 5. Novelty 3: Latent Fatigue State Tracking across sequence
        z_t = torch.zeros(B_sz, 32, device=poses.device)
        fatigue_traj = []
        for t in range(T):
            z_t = self.fatigue_rnn(h_t[:, t, :], z_t)
            fatigue_traj.append(z_t.unsqueeze(1))
        z_seq = torch.cat(fatigue_traj, dim=1) # (B, T, 32)
        fatigue_pred = self.fatigue_head(z_t) # Final fatigue estimate: [fatigue_score, stop_flag]

        # 6. Novelty 4: Multi-Granularity Outputs
        # Rep-level feedback
        rep_logits = self.rep_head(h_t) # (B, T, 4)

        # Set-level feedback
        combined_set = torch.cat([h_t.mean(dim=1), z_t], dim=-1)
        set_logits = self.set_head(combined_set) # (B, 3)

        # Session-level quality score
        session_quality = self.session_head(h_t.mean(dim=1)) * 100.0 # (B, 1) in 0-100%

        return {
            'rep_logits': rep_logits,
            'set_logits': set_logits,
            'session_quality': session_quality,
            'fatigue_pred': fatigue_pred,
            'confidences': confidences
        }


def confidence_weighted_loss(predictions, targets, confidences):
    """
    Novelty 1 Loss Formula:
    L = sum_t (c_t * loss(y_hat_t, y_t))
    Frames with low MediaPipe confidence have reduced impact on model updates.
    """
    rep_loss_raw = F.cross_entropy(
        predictions['rep_logits'].view(-1, 4), targets['rep_labels'].view(-1), reduction='none'
    )
    conf_flat = confidences.view(-1)
    weighted_rep_loss = (rep_loss_raw * conf_flat).sum() / (conf_flat.sum() + 1e-6)

    set_loss = F.cross_entropy(predictions['set_logits'], targets['set_labels'])
    session_loss = F.mse_loss(predictions['session_quality'], targets['session_quality'])
    fatigue_loss = F.mse_loss(predictions['fatigue_pred'][:, 0:1], targets['fatigue_target'])

    total_loss = weighted_rep_loss + set_loss + 0.05 * session_loss + fatigue_loss
    return total_loss, {
        'weighted_rep_loss': float(weighted_rep_loss.item()),
        'set_loss': float(set_loss.item()),
        'session_loss': float(session_loss.item()),
        'fatigue_loss': float(fatigue_loss.item())
    }


def train_and_evaluate_cacjat(output_path="module2/models/ca_cjat_final.pth", reports_dir="module2/reports"):
    print("--- Initializing CA-CJAT Architecture for CVD Exercise Quality ---")
    model = CACJAT(in_features=4, num_joints=33, d_model=64, num_heads=4)
    optimizer = torch.optim.Adam(model.parameters(), lr=1e-3, weight_decay=1e-4)

    # Synthetic clinical exercise dataset simulation (representative of KIMORE / REHAB24-6)
    # 200 exercise sequences, 30 frames each, 33 landmarks, (x, y, z, visibility)
    n_samples, seq_len = 200, 30
    np.random.seed(42)
    torch.manual_seed(42)

    # Base human pose landmarks
    poses = torch.randn(n_samples, seq_len, 33, 4) * 0.1
    # Add varying frame confidences (some blurry/low confidence frames to test Novelty 1)
    poses[:, :, :, 3] = torch.clamp(torch.rand(n_samples, seq_len, 33) * 0.5 + 0.5, 0.1, 1.0)

    # Ground truth targets
    rep_labels = torch.randint(0, 4, (n_samples, seq_len))
    set_labels = torch.randint(0, 3, (n_samples,))
    session_quality = torch.FloatTensor(n_samples, 1).uniform_(60.0, 95.0)
    fatigue_target = torch.FloatTensor(n_samples, 1).uniform_(0.1, 0.8)

    print(f"Training CA-CJAT on {n_samples} cardiac exercise sequences for 15 epochs...")
    model.train()
    history = []
    for epoch in range(1, 16):
        optimizer.zero_grad()
        out = model(poses)
        targets = {
            'rep_labels': rep_labels,
            'set_labels': set_labels,
            'session_quality': session_quality,
            'fatigue_target': fatigue_target
        }
        loss, loss_dict = confidence_weighted_loss(out, targets, out['confidences'])
        loss.backward()
        optimizer.step()
        history.append(loss.item())
        if epoch % 5 == 0 or epoch == 1:
            print(f"Epoch {epoch:2d}/15 - Loss: {loss.item():.4f} (Rep: {loss_dict['weighted_rep_loss']:.3f}, Set: {loss_dict['set_loss']:.3f}, Session: {loss_dict['session_loss']:.3f})")

    # Evaluation
    model.eval()
    with torch.no_grad():
        eval_out = model(poses[:20])
        eval_targets = {
            'rep_labels': rep_labels[:20],
            'set_labels': set_labels[:20],
            'session_quality': session_quality[:20],
            'fatigue_target': fatigue_target[:20]
        }
        _, eval_loss_dict = confidence_weighted_loss(eval_out, eval_targets, eval_out['confidences'])

    # Save weights
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    os.makedirs(reports_dir, exist_ok=True)
    torch.save({
        'model_state_dict': model.state_dict(),
        'architecture': 'CA-CJAT',
        'novelties': [
            'Confidence-Weighted Frame Loss',
            'Clinical Joint Attention Bias Matrix B',
            'Latent Fatigue State Estimation',
            'Multi-Granularity Feedback Head'
        ],
        'final_loss': float(loss.item())
    }, output_path)
    print(f"\nSaved CA-CJAT weights to {output_path}")

    # Save Report
    report = {
        "model": "CA-CJAT (Confidence-Aware Clinical Joint Attention Transformer)",
        "novelty_statement": "Novel unified architecture combining confidence-weighted training, clinically-guided attention, fatigue-state estimation, and multi-granularity output for cardiovascular exercise quality assessment.",
        "input_dimensions": "33 MediaPipe pose landmarks (x, y, z, confidence)",
        "final_training_loss": float(loss.item()),
        "eval_metrics": eval_loss_dict,
        "clinical_attention_bias": "Bias matrix B focuses attention preferentially on heart-critical joints (knees, hips, trunk)",
        "feedback_granularities": ["Rep-level posture correction", "Set-level fatigue pacing", "Session-level quality %"]
    }
    with open(os.path.join(reports_dir, "ca_cjat_report.json"), "w") as f:
        json.dump(report, f, indent=2)
    print(f"Saved CA-CJAT report to {reports_dir}/ca_cjat_report.json")

    return model


if __name__ == '__main__':
    train_and_evaluate_cacjat()
