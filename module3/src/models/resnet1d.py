"""
Module 3 — 1D ResNet ECG Quality Classifier (PyTorch)
Architecture: lightweight 1-D Residual Network designed for
fixed-length single-lead ECG segments.

Output classes:
    0 → Good
    1 → Borderline
    2 → Unusable
"""

import torch
import torch.nn as nn
import torch.nn.functional as F


# =====================================================================
# Building blocks
# =====================================================================

class ResBlock1D(nn.Module):
    """
    One residual block: two Conv1d layers with BatchNorm and ReLU,
    plus a skip connection (with optional projection if channels change).
    """

    def __init__(self, in_ch: int, out_ch: int, kernel: int = 3,
                 stride: int = 1, dropout: float = 0.1):
        super().__init__()
        padding = kernel // 2

        self.conv1 = nn.Conv1d(in_ch, out_ch, kernel,
                               stride=stride, padding=padding, bias=False)
        self.bn1   = nn.BatchNorm1d(out_ch)

        self.conv2 = nn.Conv1d(out_ch, out_ch, kernel,
                               stride=1, padding=padding, bias=False)
        self.bn2   = nn.BatchNorm1d(out_ch)

        self.dropout = nn.Dropout(p=dropout)

        # Projection shortcut when dimensions change
        if stride != 1 or in_ch != out_ch:
            self.shortcut = nn.Sequential(
                nn.Conv1d(in_ch, out_ch, kernel_size=1, stride=stride, bias=False),
                nn.BatchNorm1d(out_ch),
            )
        else:
            self.shortcut = nn.Identity()

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        out = F.relu(self.bn1(self.conv1(x)))
        out = self.dropout(out)
        out = self.bn2(self.conv2(out))
        out = out + self.shortcut(x)
        return F.relu(out)


# =====================================================================
# Main model
# =====================================================================

class ECGQualityResNet(nn.Module):
    """
    Lightweight 1-D ResNet for three-class ECG quality assessment.

    Input  : (batch, 1, 3600)   — one 10-second segment at 360 Hz
    Output : (batch, 3)         — raw logits for [Good, Borderline, Unusable]

    To get class probabilities: F.softmax(logits, dim=1)
    To get predicted class    : logits.argmax(dim=1)
    """

    CLASS_NAMES = ["Good", "Borderline", "Unusable"]

    def __init__(self, num_classes: int = 3, dropout: float = 0.2):
        super().__init__()

        # Initial feature extraction
        self.stem = nn.Sequential(
            nn.Conv1d(1, 32, kernel_size=7, stride=2, padding=3, bias=False),
            nn.BatchNorm1d(32),
            nn.ReLU(inplace=True),
            nn.MaxPool1d(kernel_size=3, stride=2, padding=1),
        )

        # Residual stages (channels: 32 → 64 → 128 → 256)
        self.stage1 = nn.Sequential(
            ResBlock1D(32,  64,  stride=2, dropout=dropout),
            ResBlock1D(64,  64,  stride=1, dropout=dropout),
        )
        self.stage2 = nn.Sequential(
            ResBlock1D(64,  128, stride=2, dropout=dropout),
            ResBlock1D(128, 128, stride=1, dropout=dropout),
        )
        self.stage3 = nn.Sequential(
            ResBlock1D(128, 256, stride=2, dropout=dropout),
            ResBlock1D(256, 256, stride=1, dropout=dropout),
        )

        # Global average pooling + classifier head
        self.gap        = nn.AdaptiveAvgPool1d(1)
        self.classifier = nn.Sequential(
            nn.Flatten(),
            nn.Linear(256, 128),
            nn.ReLU(inplace=True),
            nn.Dropout(p=dropout),
            nn.Linear(128, num_classes),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x = self.stem(x)
        x = self.stage1(x)
        x = self.stage2(x)
        x = self.stage3(x)
        x = self.gap(x)
        return self.classifier(x)

    def predict_proba(self, x: torch.Tensor) -> torch.Tensor:
        """Return class probabilities (softmax applied)."""
        with torch.no_grad():
            return F.softmax(self(x), dim=1)

    def predict(self, x: torch.Tensor) -> list:
        """Return predicted class names as strings."""
        probs   = self.predict_proba(x)
        indices = probs.argmax(dim=1).tolist()
        return [self.CLASS_NAMES[i] for i in indices]


# =====================================================================
# Model summary helper
# =====================================================================

def count_parameters(model: nn.Module) -> int:
    return sum(p.numel() for p in model.parameters() if p.requires_grad)


# =====================================================================
# Quick self-test
# =====================================================================
if __name__ == "__main__":
    model = ECGQualityResNet(num_classes=3, dropout=0.2)
    print(model)
    print(f"\nTrainable parameters: {count_parameters(model):,}")

    # Simulate a batch of 4 segments: shape (batch=4, channel=1, samples=3600)
    dummy = torch.randn(4, 1, 3600)
    logits = model(dummy)
    probs  = model.predict_proba(dummy)
    labels = model.predict(dummy)

    print(f"\nInput  shape : {dummy.shape}")
    print(f"Logits shape : {logits.shape}")
    print(f"Probabilities:\n{probs}")
    print(f"Predicted classes: {labels}")
