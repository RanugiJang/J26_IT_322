"""LSTM helpers for REHAB24-6 exercise-quality (correct / incorrect) models."""
import numpy as np
import torch
import torch.nn as nn

from train_exercise_models import NAMES, load_exercise

torch.set_num_threads(1)


class LSTMNet(nn.Module):
    def __init__(self, n_in=8, hidden=32):
        super().__init__()
        self.lstm = nn.LSTM(n_in, hidden, batch_first=True)
        self.drop = nn.Dropout(0.3)
        self.fc = nn.Linear(hidden, 1)

    def forward(self, x):
        _, (h, _) = self.lstm(x)
        return self.fc(self.drop(h[-1])).squeeze(-1)


def person_norm_seq(seqs, persons):
    """Subtract each person's own median trajectory (label-free)."""
    out = seqs.copy()
    for p in np.unique(persons):
        m = persons == p
        out[m] = seqs[m] - np.median(seqs[m], axis=0, keepdims=True)
    return out


def train_net(Xtr, ytr, epochs=80, seed=42):
    """Returns (net, mu, sd). Channels are standardised with TRAIN statistics only."""
    torch.manual_seed(seed)
    np.random.seed(seed)
    mu, sd = Xtr.mean(axis=(0, 1)), Xtr.std(axis=(0, 1)) + 1e-6
    X = torch.tensor((Xtr - mu) / sd, dtype=torch.float32)
    y = torch.tensor(ytr, dtype=torch.float32)
    net = LSTMNet(n_in=Xtr.shape[2])
    opt = torch.optim.Adam(net.parameters(), lr=1e-3, weight_decay=1e-3)
    lossf = nn.BCEWithLogitsLoss()
    for _ in range(epochs):
        net.train()
        perm = torch.randperm(len(X))
        for i in range(0, len(perm), 32):
            idx = perm[i:i + 32]
            opt.zero_grad()
            lossf(net(X[idx]), y[idx]).backward()
            opt.step()
    return net, mu, sd


def predict_proba(net, mu, sd, Xte):
    net.eval()
    with torch.no_grad():
        return torch.sigmoid(net(torch.tensor((Xte - mu) / sd, dtype=torch.float32))).numpy()


def load_all(pooled_onehot=True):
    """Per-exercise dict of (seqs_person_normalised, y, person); plus a pooled array with exercise one-hot channels."""
    per, Xs, ys, gs, ex = {}, [], [], [], []
    names = list(NAMES.values())
    for eid, name in NAMES.items():
        df, seqs = load_exercise(eid, name)
        y, g = df["y"].values, df["person"].values
        s = person_norm_seq(seqs, g)
        per[name] = (s, y, g)
        if pooled_onehot:
            oh = np.zeros((len(s), s.shape[1], len(names)), dtype=s.dtype)
            oh[:, :, names.index(name)] = 1.0
            Xs.append(np.concatenate([s, oh], axis=2)); ys.append(y); gs.append(g); ex += [name] * len(y)
    pooled = (np.concatenate(Xs), np.concatenate(ys), np.concatenate(gs), np.array(ex)) if pooled_onehot else None
    return per, pooled
