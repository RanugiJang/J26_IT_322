"""
Module 3 — ECG Signal Quality Features
Extracts handcrafted signal-quality features from a preprocessed ECG segment.
These features are used both for training a baseline classifier and as
complementary inputs to the 1D CNN quality model.
"""

import numpy as np
from scipy.signal import welch
from scipy.stats import kurtosis, skew


# =====================================================================
# Individual feature functions
# =====================================================================

def snr_estimate(segment: np.ndarray, fs: int = 360) -> float:
    """
    Estimate Signal-to-Noise Ratio using power in the QRS band (5-40 Hz)
    versus the high-frequency noise band (100-150 Hz, if fs allows).
    Returns a ratio in dB; higher is cleaner.
    """
    freqs, psd = welch(segment, fs=fs, nperseg=min(512, len(segment)))
    qrs_mask   = (freqs >= 5)  & (freqs <= 40)
    noise_mask = (freqs >= 100) & (freqs <= min(150, fs / 2 - 1))

    qrs_power   = np.trapz(psd[qrs_mask],   freqs[qrs_mask])   if qrs_mask.any()   else 1e-9
    noise_power = np.trapz(psd[noise_mask], freqs[noise_mask]) if noise_mask.any() else 1e-9

    if noise_power < 1e-12:
        return 40.0  # effectively noise-free
    return float(10 * np.log10(qrs_power / (noise_power + 1e-12)))


def baseline_wander_score(segment: np.ndarray, fs: int = 360) -> float:
    """
    Estimate baseline-wander energy in the very-low-frequency band (< 0.5 Hz)
    relative to total signal energy. Higher → more baseline wander.
    """
    freqs, psd = welch(segment, fs=fs, nperseg=min(512, len(segment)))
    bw_mask    = freqs < 0.5
    bw_power   = np.trapz(psd[bw_mask], freqs[bw_mask]) if bw_mask.any() else 0.0
    total      = np.trapz(psd, freqs) + 1e-12
    return float(bw_power / total)


def muscle_noise_score(segment: np.ndarray, fs: int = 360) -> float:
    """
    Estimate high-frequency muscle noise (EMG) energy above 50 Hz
    relative to total signal energy. Higher → more muscle noise.
    """
    freqs, psd  = welch(segment, fs=fs, nperseg=min(512, len(segment)))
    emg_mask    = freqs > 50
    emg_power   = np.trapz(psd[emg_mask], freqs[emg_mask]) if emg_mask.any() else 0.0
    total       = np.trapz(psd, freqs) + 1e-12
    return float(emg_power / total)


def powerline_score(segment: np.ndarray, fs: int = 360,
                    powerline_hz: float = 50.0) -> float:
    """
    Estimate powerline interference at 50 Hz (or 60 Hz) relative
    to total signal energy. Higher → more powerline noise.
    """
    freqs, psd = welch(segment, fs=fs, nperseg=min(512, len(segment)))
    band_mask  = (freqs >= powerline_hz - 1) & (freqs <= powerline_hz + 1)
    band_power = np.trapz(psd[band_mask], freqs[band_mask]) if band_mask.any() else 0.0
    total      = np.trapz(psd, freqs) + 1e-12
    return float(band_power / total)


def amplitude_variance(segment: np.ndarray) -> float:
    """Standard deviation of the segment amplitude."""
    return float(np.std(segment))


def zero_crossing_rate(segment: np.ndarray) -> float:
    """Number of zero crossings per sample (normalized)."""
    crossings = np.where(np.diff(np.signbit(segment)))[0]
    return float(len(crossings) / len(segment))


def kurtosis_feature(segment: np.ndarray) -> float:
    """Excess kurtosis; high values indicate impulsive noise."""
    return float(kurtosis(segment))


def skewness_feature(segment: np.ndarray) -> float:
    """Signal skewness."""
    return float(skew(segment))


def flatline_ratio(segment: np.ndarray, threshold: float = 0.005) -> float:
    """
    Fraction of samples where the absolute amplitude is below 'threshold'.
    High values suggest electrode disconnection or flat-line.
    """
    return float(np.mean(np.abs(segment) < threshold))


# =====================================================================
# Feature vector assembly
# =====================================================================

FEATURE_NAMES = [
    "snr_db",
    "baseline_wander",
    "muscle_noise",
    "powerline_50hz",
    "amplitude_std",
    "zero_crossing_rate",
    "kurtosis",
    "skewness",
    "flatline_ratio",
]


def extract_features(segment: np.ndarray, fs: int = 360) -> np.ndarray:
    """
    Extract a 9-dimensional quality feature vector from one ECG segment.

    Parameters
    ----------
    segment : np.ndarray  Shape (N,)  — single channel ECG window
    fs      : int          Sampling frequency in Hz

    Returns
    -------
    features : np.ndarray  Shape (9,)  — one value per feature
    """
    features = np.array([
        snr_estimate(segment, fs),
        baseline_wander_score(segment, fs),
        muscle_noise_score(segment, fs),
        powerline_score(segment, fs),
        amplitude_variance(segment),
        zero_crossing_rate(segment),
        kurtosis_feature(segment),
        skewness_feature(segment),
        flatline_ratio(segment),
    ], dtype=np.float32)
    return features


def extract_feature_batch(segments: np.ndarray, fs: int = 360) -> np.ndarray:
    """
    Extract features for a batch of ECG segments.

    Parameters
    ----------
    segments : np.ndarray  Shape (K, N)
    fs       : int

    Returns
    -------
    feature_matrix : np.ndarray  Shape (K, 9)
    """
    return np.stack([extract_features(seg, fs) for seg in segments])


# =====================================================================
# Quick self-test
# =====================================================================
if __name__ == "__main__":
    rng      = np.random.default_rng(42)
    demo_seg = rng.standard_normal(3600).astype(np.float32)
    feats    = extract_features(demo_seg, fs=360)

    print("Feature extraction test")
    print("-" * 35)
    for name, val in zip(FEATURE_NAMES, feats):
        print(f"  {name:<22}: {val:+.4f}")
    print("\nFeature vector shape:", feats.shape)
