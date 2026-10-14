"""
Module 3 — ECG Signal Preprocessor
Loads, validates, filters and segments raw ECG recordings into
fixed-length windows ready for quality assessment.
"""

import numpy as np
import wfdb
from scipy.signal import butter, sosfiltfilt
from pathlib import Path


# =====================================================================
# Constants
# =====================================================================
TARGET_FS        = 360          # Hz — MIT-BIH native sampling rate
SEGMENT_DURATION = 10           # seconds per quality-assessment window
SEGMENT_SAMPLES  = TARGET_FS * SEGMENT_DURATION   # 3 600 samples
BANDPASS_LOW     = 0.5          # Hz — baseline-wander cut-off
BANDPASS_HIGH    = 40.0         # Hz — high-frequency noise cut-off
BANDPASS_ORDER   = 4


# =====================================================================
# Core functions
# =====================================================================

def load_record(record_path: str, channel: int = 0) -> tuple:
    """
    Load an ECG record from a local WFDB file or PhysioNet.

    Parameters
    ----------
    record_path : str
        Path to the record (without extension), e.g. 'data/mitdb/100'.
    channel : int
        Signal channel index (0 = first lead).

    Returns
    -------
    signal : np.ndarray   Shape (N,)
    fs     : int          Sampling frequency in Hz
    """
    record = wfdb.rdrecord(str(record_path))
    signal = record.p_signal[:, channel].astype(np.float32)
    fs     = int(record.fs)
    return signal, fs


def validate_signal(signal: np.ndarray, fs: int) -> dict:
    """
    Run basic sanity checks on a raw ECG signal.

    Returns a dict with keys:
        ok       bool   — True when all checks pass
        issues   list   — Descriptions of any problems found
    """
    issues = []

    if len(signal) < fs * 5:
        issues.append("Recording is shorter than 5 seconds.")

    nan_count = int(np.isnan(signal).sum())
    if nan_count > 0:
        issues.append(f"Signal contains {nan_count} NaN value(s).")

    if np.max(np.abs(signal)) < 0.01:
        issues.append("Signal amplitude appears too low (possible flat-line).")

    return {"ok": len(issues) == 0, "issues": issues}


def bandpass_filter(signal: np.ndarray, fs: int) -> np.ndarray:
    """
    Apply a zero-phase Butterworth bandpass filter to reduce baseline
    wander and high-frequency noise while preserving QRS morphology.

    Filter range: 0.5 – 40 Hz
    Note: Validate these settings against your specific ECG device and
    downstream task before using in a clinical context.
    """
    sos = butter(
        BANDPASS_ORDER,
        [BANDPASS_LOW, BANDPASS_HIGH],
        btype="bandpass",
        fs=fs,
        output="sos",
    )
    return sosfiltfilt(sos, signal).astype(np.float32)


def normalize_signal(signal: np.ndarray) -> np.ndarray:
    """
    Min-max normalize signal to the [−1, 1] range.
    If the signal is flat (zero range), it is returned unchanged.
    """
    vmin, vmax = signal.min(), signal.max()
    if vmax - vmin < 1e-8:
        return signal
    return ((signal - vmin) / (vmax - vmin) * 2 - 1).astype(np.float32)


def segment_signal(signal: np.ndarray, fs: int,
                   duration: int = SEGMENT_DURATION,
                   overlap: float = 0.0) -> np.ndarray:
    """
    Divide a continuous ECG signal into fixed-length non-overlapping
    (or overlapping) windows.

    Parameters
    ----------
    signal   : np.ndarray  Shape (N,)
    fs       : int         Sampling frequency
    duration : int         Window length in seconds
    overlap  : float       Fractional overlap between consecutive windows
                           (0.0 = no overlap, 0.5 = 50 % overlap)

    Returns
    -------
    segments : np.ndarray  Shape (num_segments, window_samples)
    """
    window  = int(fs * duration)
    step    = int(window * (1 - overlap))
    starts  = range(0, len(signal) - window + 1, step)
    segments = np.stack([signal[s: s + window] for s in starts])
    return segments


def preprocess_record(record_path: str, channel: int = 0) -> dict:
    """
    Full preprocessing pipeline for one ECG record.

    Returns
    -------
    dict with keys:
        raw_signal      np.ndarray  — original signal
        filtered_signal np.ndarray  — bandpass-filtered signal
        segments        np.ndarray  — fixed-length windows, shape (K, 3600)
        fs              int         — sampling frequency
        valid           bool
        issues          list
    """
    signal, fs = load_record(record_path, channel)
    validation = validate_signal(signal, fs)

    filtered  = bandpass_filter(signal, fs)
    normalized = normalize_signal(filtered)
    segments  = segment_signal(normalized, fs)

    return {
        "raw_signal":      signal,
        "filtered_signal": filtered,
        "normalized":      normalized,
        "segments":        segments,
        "fs":              fs,
        "valid":           validation["ok"],
        "issues":          validation["issues"],
    }


# =====================================================================
# Quick self-test
# =====================================================================
if __name__ == "__main__":
    import matplotlib.pyplot as plt

    RECORD = "data/mitdb/100"

    print(f"Loading record: {RECORD}")
    result = preprocess_record(RECORD)

    print(f"Sampling rate   : {result['fs']} Hz")
    print(f"Total samples   : {len(result['raw_signal'])}")
    print(f"Segments created: {result['segments'].shape[0]}")
    print(f"Signal valid    : {result['valid']}")
    if result["issues"]:
        for issue in result["issues"]:
            print(f"  ⚠  {issue}")

    # Plot first 10 seconds: raw vs filtered
    fs  = result["fs"]
    raw = result["raw_signal"][:fs * 10]
    flt = result["filtered_signal"][:fs * 10]
    t   = np.arange(len(raw)) / fs

    fig, axes = plt.subplots(2, 1, figsize=(14, 6), sharex=True)
    axes[0].plot(t, raw, linewidth=0.7, color="#e74c3c")
    axes[0].set_title("Raw ECG Signal")
    axes[0].set_ylabel("Amplitude (mV)")
    axes[0].grid(True, alpha=0.3)

    axes[1].plot(t, flt, linewidth=0.7, color="#2ecc71")
    axes[1].set_title("Filtered ECG Signal (0.5 – 40 Hz bandpass)")
    axes[1].set_xlabel("Time (seconds)")
    axes[1].set_ylabel("Amplitude (mV)")
    axes[1].grid(True, alpha=0.3)

    plt.tight_layout()
    out = Path("results/plots/preprocessing_comparison.png")
    out.parent.mkdir(parents=True, exist_ok=True)
    plt.savefig(out, dpi=150)
    print(f"\nPlot saved → {out.resolve()}")
    plt.show()
