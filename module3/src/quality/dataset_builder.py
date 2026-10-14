"""
Module 3 — Dataset Builder
Builds the quality-labeled dataset from MIT-BIH + NSTDB recordings.

Strategy
--------
1. Load clean MIT-BIH records → label segments as "Good"
2. Synthesize noisy variants by adding controlled noise → "Borderline" / "Unusable"
3. Load NSTDB records (real noisy ECGs) → label based on SNR thresholds
4. Save segments as .npy files and a metadata CSV

Quality labeling thresholds (illustrative — must be validated):
    SNR ≥ 15 dB  → Good
    5  ≤ SNR < 15 → Borderline
    SNR < 5 dB   → Unusable

These thresholds are starting points for experimentation, not clinically
validated criteria. Adjust and re-evaluate based on your research findings.
"""

import numpy as np
import pandas as pd
from pathlib import Path
from tqdm import tqdm
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from src.preprocessing.ecg_preprocessor import (
    load_record, bandpass_filter, normalize_signal, segment_signal
)
from src.quality.feature_extractor import snr_estimate


# =====================================================================
# Thresholds  (illustrative — tune with validation data)
# =====================================================================
SNR_GOOD        = 15.0   # dB
SNR_BORDERLINE  = 5.0    # dB


# =====================================================================
# Noise injection helpers
# =====================================================================

def add_white_noise(signal: np.ndarray, snr_db: float = 10.0) -> np.ndarray:
    """Add Gaussian white noise at a specified SNR level (dB)."""
    sig_power  = np.mean(signal ** 2)
    noise_power = sig_power / (10 ** (snr_db / 10))
    noise = np.random.normal(0, np.sqrt(noise_power), len(signal)).astype(np.float32)
    return signal + noise


def add_baseline_wander(signal: np.ndarray, fs: int = 360,
                        amplitude: float = 0.15, freq: float = 0.3) -> np.ndarray:
    """Simulate slow baseline drift using a low-frequency sinusoid."""
    t     = np.arange(len(signal)) / fs
    drift = (amplitude * np.sin(2 * np.pi * freq * t)).astype(np.float32)
    return signal + drift


def snr_to_quality_label(snr_db: float) -> str:
    """Map an SNR value to a quality label string."""
    if snr_db >= SNR_GOOD:
        return "Good"
    elif snr_db >= SNR_BORDERLINE:
        return "Borderline"
    else:
        return "Unusable"


LABEL_TO_INT = {"Good": 0, "Borderline": 1, "Unusable": 2}


# =====================================================================
# Main dataset builder
# =====================================================================

def build_dataset(
    mitdb_dir:    str = "data/mitdb",
    nstdb_dir:    str = "data/nstdb",
    output_dir:   str = "data/processed",
    mitdb_records: list = None,
    nstdb_records: list = None,
    segment_sec:  int  = 10,
    fs:           int  = 360,
) -> pd.DataFrame:
    """
    Build a quality-labeled ECG segment dataset.

    Returns
    -------
    metadata : pd.DataFrame
        One row per segment with columns:
        segment_id, record_id, source, quality_label, quality_int,
        snr_db, segment_path
    """
    mitdb_dir  = Path(mitdb_dir)
    nstdb_dir  = Path(nstdb_dir)
    seg_dir    = Path(output_dir) / "segments"
    label_dir  = Path(output_dir) / "labels"
    seg_dir.mkdir(parents=True, exist_ok=True)
    label_dir.mkdir(parents=True, exist_ok=True)

    if mitdb_records is None:
        mitdb_records = [p.stem for p in mitdb_dir.glob("*.dat")]
    if nstdb_records is None:
        nstdb_records = [p.stem for p in nstdb_dir.glob("*.dat")]

    rows = []
    seg_id = 0

    # ------------------------------------------------------------------
    # 1. MIT-BIH clean records → Good + synthetic noisy variants
    # ------------------------------------------------------------------
    print("Processing MIT-BIH records …")
    for rec in tqdm(mitdb_records):
        rec_path = mitdb_dir / rec
        try:
            signal, rec_fs = load_record(str(rec_path))
        except Exception as exc:
            print(f"  ⚠ Skipping {rec}: {exc}", file=sys.stderr)
            continue

        filtered = bandpass_filter(signal, rec_fs)
        norm     = normalize_signal(filtered)
        segments = segment_signal(norm, rec_fs, duration=segment_sec)

        for seg in segments:
            # --- Original (Good) ---
            _save_and_record(seg, "Good", rec, "mitdb", seg_id, seg_dir, rows, rec_fs)
            seg_id += 1

            # --- Mild noise (may be Borderline) ---
            noisy_mild = add_white_noise(seg, snr_db=12.0)
            snr_m = snr_estimate(noisy_mild, rec_fs)
            label_m = snr_to_quality_label(snr_m)
            _save_and_record(noisy_mild, label_m, rec, "mitdb_noisy_mild",
                             seg_id, seg_dir, rows, rec_fs, snr_db=snr_m)
            seg_id += 1

            # --- Severe noise (likely Unusable) ---
            noisy_heavy = add_white_noise(seg, snr_db=2.0)
            snr_h = snr_estimate(noisy_heavy, rec_fs)
            label_h = snr_to_quality_label(snr_h)
            _save_and_record(noisy_heavy, label_h, rec, "mitdb_noisy_heavy",
                             seg_id, seg_dir, rows, rec_fs, snr_db=snr_h)
            seg_id += 1

            # --- Baseline wander ---
            bw_seg = add_baseline_wander(seg, rec_fs)
            snr_bw = snr_estimate(bw_seg, rec_fs)
            label_bw = snr_to_quality_label(snr_bw)
            _save_and_record(bw_seg, label_bw, rec, "mitdb_bw",
                             seg_id, seg_dir, rows, rec_fs, snr_db=snr_bw)
            seg_id += 1

    # ------------------------------------------------------------------
    # 2. NSTDB records → label by estimated SNR
    # ------------------------------------------------------------------
    print("\nProcessing NSTDB records …")
    for rec in tqdm(nstdb_records):
        rec_path = nstdb_dir / rec
        try:
            signal, rec_fs = load_record(str(rec_path))
        except Exception as exc:
            print(f"  ⚠ Skipping {rec}: {exc}", file=sys.stderr)
            continue

        norm     = normalize_signal(signal)
        segments = segment_signal(norm, rec_fs, duration=segment_sec)

        for seg in segments:
            snr_db = snr_estimate(seg, rec_fs)
            label  = snr_to_quality_label(snr_db)
            _save_and_record(seg, label, rec, "nstdb", seg_id, seg_dir, rows,
                             rec_fs, snr_db=snr_db)
            seg_id += 1

    # ------------------------------------------------------------------
    # 3. Save metadata CSV
    # ------------------------------------------------------------------
    metadata = pd.DataFrame(rows)
    metadata_path = label_dir / "ecg_metadata.csv"
    metadata.to_csv(metadata_path, index=False)

    # Summary
    print(f"\nDataset built: {len(metadata)} segments total")
    print(metadata["quality_label"].value_counts().to_string())
    print(f"\nMetadata saved → {metadata_path.resolve()}")
    return metadata


def _save_and_record(segment, label, record_id, source, seg_id,
                     seg_dir, rows, fs, snr_db=None):
    """Save one segment as .npy and append a metadata row."""
    fname = f"seg_{seg_id:06d}.npy"
    fpath = seg_dir / fname
    np.save(str(fpath), segment)

    if snr_db is None:
        snr_db = snr_estimate(segment, fs)

    rows.append({
        "segment_id":    seg_id,
        "record_id":     record_id,
        "source":        source,
        "quality_label": label,
        "quality_int":   LABEL_TO_INT[label],
        "snr_db":        round(snr_db, 3),
        "segment_path":  str(fpath),
    })


# =====================================================================
# Quick self-test
# =====================================================================
if __name__ == "__main__":
    print("Building dataset from available records …\n")
    df = build_dataset()
    print("\nFirst 5 rows:")
    print(df.head())
