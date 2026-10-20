"""
Model classes for Module 3 (ECG).

Models 2, 3 and 4 were REBUILT from the layer names / shapes stored inside your
.pt files, so they load with strict=True. Model 1 (ECGResNet1D) could not be
rebuilt because model1_quality_resnet.pt was not provided - the class below is a
best guess. If loading model 1 fails, paste your original ECGResNet1D class here
(keep the same name) and it will work.
"""
import torch
import torch.nn as nn
import torch.nn.functional as F


# --------------------------------------------------------------------------
# Model 1 - Quality gate (Exact 1D ResNet matching model1_quality_resnet.pt)
# --------------------------------------------------------------------------
class BasicBlock1D(nn.Module):
    def __init__(self, cin, cout, stride=1):
        super().__init__()
        self.conv1 = nn.Conv1d(cin, cout, 7, stride=stride, padding=3, bias=False)
        self.bn1 = nn.BatchNorm1d(cout)
        self.conv2 = nn.Conv1d(cout, cout, 7, stride=1, padding=3, bias=False)
        self.bn2 = nn.BatchNorm1d(cout)
        self.shortcut = nn.Sequential()
        if stride != 1 or cin != cout:
            self.shortcut = nn.Sequential(
                nn.Conv1d(cin, cout, 1, stride=stride, bias=False),
                nn.BatchNorm1d(cout)
            )

    def forward(self, x):
        out = F.relu(self.bn1(self.conv1(x)))
        out = self.bn2(self.conv2(out))
        out += self.shortcut(x)
        return F.relu(out)


class ECGResNet1D(nn.Module):
    def __init__(self, num_classes=3):
        super().__init__()
        self.stem = nn.Sequential(
            nn.Conv1d(1, 64, 15, stride=2, padding=7, bias=False),
            nn.BatchNorm1d(64),
            nn.ReLU()
        )
        self.layer1 = nn.Sequential(BasicBlock1D(64, 64, 1), BasicBlock1D(64, 64, 1))
        self.layer2 = nn.Sequential(BasicBlock1D(64, 128, 2), BasicBlock1D(128, 128, 1))
        self.layer3 = nn.Sequential(BasicBlock1D(128, 256, 2), BasicBlock1D(256, 256, 1))
        self.layer4 = nn.Sequential(BasicBlock1D(256, 512, 2), BasicBlock1D(512, 512, 1))
        self.fc = nn.Linear(512, num_classes)

    def forward(self, x):
        x = self.stem(x)
        x = self.layer1(x)
        x = self.layer2(x)
        x = self.layer3(x)
        x = self.layer4(x)
        x = F.adaptive_avg_pool1d(x, 1).squeeze(-1)
        return self.fc(x)


# --------------------------------------------------------------------------
# Model 2 - Artifact detector (multi-label 1D CNN)  -> 3 logits
# --------------------------------------------------------------------------
class ArtifactDetectorCNN(nn.Module):
    def __init__(self, num_labels=3):
        super().__init__()
        layers, cin = [], 1
        for cout, k in [(32, 15), (64, 11), (128, 7), (256, 5)]:
            layers += [nn.Conv1d(cin, cout, k, padding=k // 2, bias=False),
                       nn.BatchNorm1d(cout), nn.ReLU(), nn.MaxPool1d(2)]
            cin = cout
        self.features = nn.Sequential(*layers)
        self.fc = nn.Linear(256, num_labels)

    def forward(self, x):
        return self.fc(self.features(x).mean(-1))   # logits (apply sigmoid outside)


# --------------------------------------------------------------------------
# Model 3 - Arrhythmia screening (InceptionTime) -> 3 logits
# --------------------------------------------------------------------------
class InceptionModule(nn.Module):
    def __init__(self, cin, nf=32, ks=(11, 21, 41)):
        super().__init__()
        self.bottleneck = nn.Conv1d(cin, nf, 1, bias=False)
        self.convs = nn.ModuleList([nn.Conv1d(nf, nf, k, padding=k // 2, bias=False) for k in ks])
        self.maxpool = nn.Sequential(nn.MaxPool1d(3, 1, 1), nn.Conv1d(cin, nf, 1, bias=False))
        self.bn = nn.BatchNorm1d(nf * (len(ks) + 1))

    def forward(self, x):
        b = self.bottleneck(x)
        out = torch.cat([c(b) for c in self.convs] + [self.maxpool(x)], dim=1)
        return F.relu(self.bn(out))


class InceptionTime(nn.Module):
    def __init__(self, num_classes=3):
        super().__init__()
        self.inception1 = InceptionModule(1)
        self.inception2 = InceptionModule(128)
        self.residual1 = nn.Sequential(nn.Conv1d(1, 128, 1, bias=False), nn.BatchNorm1d(128))
        self.inception3 = InceptionModule(128)
        self.inception4 = InceptionModule(128)
        self.residual2 = nn.Sequential(nn.Conv1d(128, 128, 1, bias=False), nn.BatchNorm1d(128))
        self.inception5 = InceptionModule(128)
        self.inception6 = InceptionModule(128)
        self.residual3 = nn.Sequential(nn.Conv1d(128, 128, 1, bias=False), nn.BatchNorm1d(128))
        self.fc = nn.Linear(128, num_classes)

    def forward(self, x):
        r = x
        x = self.inception2(self.inception1(x))
        x = F.relu(x + self.residual1(r))
        r = x
        x = self.inception4(self.inception3(x))
        x = F.relu(x + self.residual2(r))
        r = x
        x = self.inception6(self.inception5(x))
        x = F.relu(x + self.residual3(r))
        return self.fc(x.mean(-1))                  # logits (softmax outside)


# --------------------------------------------------------------------------
# Model 4 - Denoising U-Net
# --------------------------------------------------------------------------
def _double_conv(cin, cout, k=7):
    return nn.Sequential(
        nn.Conv1d(cin, cout, k, padding=k // 2, bias=False), nn.BatchNorm1d(cout), nn.ReLU(),
        nn.Conv1d(cout, cout, k, padding=k // 2, bias=False), nn.BatchNorm1d(cout), nn.ReLU(),
    )


class _Block(nn.Module):
    def __init__(self, cin, cout):
        super().__init__()
        self.conv = _double_conv(cin, cout)

    def forward(self, x):
        return self.conv(x)


class _Up(nn.Module):
    def __init__(self, cin, skip, cout):
        super().__init__()
        self.upsample = nn.ConvTranspose1d(cin, cin, 2, stride=2)
        self.conv = _double_conv(cin + skip, cout)

    def forward(self, x, skip):
        x = self.upsample(x)
        if x.shape[-1] != skip.shape[-1]:
            x = F.pad(x, (0, skip.shape[-1] - x.shape[-1]))
        return self.conv(torch.cat([skip, x], dim=1))


class ECGDenoisingUNet(nn.Module):
    def __init__(self, in_channels=1):
        super().__init__()
        self.enc1 = _Block(in_channels, 32)
        self.enc2 = _Block(32, 64)
        self.enc3 = _Block(64, 128)
        self.enc4 = _Block(128, 256)
        self.pool = nn.MaxPool1d(2)
        self.bottleneck = _double_conv(256, 512)
        self.dec4 = _Up(512, 256, 256)
        self.dec3 = _Up(256, 128, 128)
        self.dec2 = _Up(128, 64, 64)
        self.dec1 = _Up(64, 32, 32)
        self.final_conv = nn.Conv1d(32, 1, 1)

    def forward(self, x):
        n = x.shape[-1]
        pad = (-n) % 16                              # U-Net needs length divisible by 16
        if pad:
            x = F.pad(x, (0, pad), mode="replicate")
        e1 = self.enc1(x)
        e2 = self.enc2(self.pool(e1))
        e3 = self.enc3(self.pool(e2))
        e4 = self.enc4(self.pool(e3))
        b = self.bottleneck(self.pool(e4))
        d = self.dec4(b, e4)
        d = self.dec3(d, e3)
        d = self.dec2(d, e2)
        d = self.dec1(d, e1)
        return self.final_conv(d)[..., :n]
