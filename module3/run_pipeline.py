"""
Module 3 — End-to-End Pipeline Runner
Runs the complete Module 3 workflow on one ECG record:

  load → preprocess → segment → quality gate → report

Usage
-----
python run_pipeline.py
python run_pipeline.py --record data/mitdb/100 --use-model
"""

import argparse
import json
import sys
import numpy as np
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from src.preprocessing.ecg_preprocessor import preprocess_record
from src.quality.feature_extractor import extract_features, FEATURE_NAMES
from src.quality.quality_gate import rule_based_quality, ECGQualityGate


def run_pipeline(record_path: str, use_model: bool = False,
                 model_path: str = "models/saved/best_model.pt") -> None:

    print("=" * 65)
    print(" Module 3 — ECG Quality Assessment Pipeline")
    print("=" * 65)

    # ------------------------------------------------------------------
    # Step 1 — Load & Preprocess
    # ------------------------------------------------------------------
    print(f"\n[1/4] Loading and preprocessing: {record_path}")
    result = preprocess_record(record_path)
    fs       = result["fs"]
    segments = result["segments"]

    print(f"      Sampling rate : {fs} Hz")
    print(f"      Segments      : {len(segments)}  ({len(segments) * 10}s total)")
    if not result["valid"]:
        for issue in result["issues"]:
            print(f"      ⚠  {issue}")

    # ------------------------------------------------------------------
    # Step 2 — Feature extraction
    # ------------------------------------------------------------------
    print("\n[2/4] Extracting quality features (first segment) …")
    seg0   = segments[0]
    feats  = extract_features(seg0, fs)
    print("      Features:")
    for name, val in zip(FEATURE_NAMES, feats):
        print(f"        {name:<22}: {val:+.4f}")

    # ------------------------------------------------------------------
    # Step 3 — Quality gate
    # ------------------------------------------------------------------
    print("\n[3/4] Running quality gate …")
    if use_model and Path(model_path).exists():
        gate   = ECGQualityGate(model_path)
        assess = gate.predict(seg0, fs)
        assess["method"] = "1D ResNet"
    else:
        if use_model:
            print(f"      ⚠ Model not found at {model_path}. "
                  f"Using rule-based fallback.")
        assess = rule_based_quality(seg0, fs)

    print(f"\n      Quality class : {assess['quality_class']}")
    print(f"      Quality score : {assess['quality_score']}")
    print(f"      Decision      : {assess['decision']}")
    if "probabilities" in assess:
        print(f"      Probabilities : {assess['probabilities']}")

    # ------------------------------------------------------------------
    # Step 4 — Report
    # ------------------------------------------------------------------
    print("\n[4/4] Pipeline report")
    print("-" * 65)
    report = {
        "record":          record_path,
        "fs_hz":           fs,
        "segments":        int(len(segments)),
        "signal_valid":    result["valid"],
        "quality_result":  assess,
    }
    print(json.dumps(report, indent=2))

    out = Path("results/pipeline_report.json")
    out.parent.mkdir(parents=True, exist_ok=True)
    with open(out, "w") as f:
        json.dump(report, f, indent=2)
    print(f"\nReport saved → {out.resolve()}")
    print("=" * 65)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Module 3 ECG Quality Pipeline")
    parser.add_argument("--record",    default="data/mitdb/100",
                        help="Path to the WFDB record (no extension)")
    parser.add_argument("--use-model", action="store_true",
                        help="Use trained ResNet model (if available)")
    parser.add_argument("--model",     default="models/saved/best_model.pt",
                        help="Path to trained model weights")
    args = parser.parse_args()

    run_pipeline(
        record_path=args.record,
        use_model=args.use_model,
        model_path=args.model,
    )
