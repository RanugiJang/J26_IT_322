"""Synthetic ECG generator so you can test the pipeline without real recordings."""
import numpy as np

FS, N = 300, 3000


def _beat(t, c, a, w):
    return a * np.exp(-((t - c) ** 2) / (2 * w ** 2))


def make(kind="normal", seed=None):
    rng = np.random.default_rng(seed)
    t = np.arange(N) / FS
    sig = np.zeros(N)
    irregular = kind == "irregular"
    ts, cur = [], 0.4
    while cur < N / FS:
        ts.append(cur)
        cur += rng.uniform(0.45, 1.3) if irregular else 0.85 + rng.normal(0, 0.01)
    for b in ts:
        sig += _beat(t, b - 0.2, 0.15, 0.04) * (0 if irregular else 1)   # P wave
        sig += _beat(t, b - 0.03, -0.12, 0.012) + _beat(t, b, 1.2, 0.012) + _beat(t, b + 0.03, -0.2, 0.012)
        sig += _beat(t, b + 0.28, 0.3, 0.07)                              # T wave
    sig += rng.normal(0, 0.02, N)
    if kind == "baseline":
        sig += 1.2 * np.sin(2 * np.pi * 0.25 * t)
    elif kind == "muscle":
        sig += rng.normal(0, 0.25, N)
    elif kind == "motion":
        for p in rng.integers(100, N - 100, 5):
            sig[p:p + 60] += rng.choice([-1, 1]) * rng.uniform(1.5, 3)
    elif kind == "flat":
        sig = rng.normal(0, 1e-4, N)
    return [round(float(v), 5) for v in sig]
