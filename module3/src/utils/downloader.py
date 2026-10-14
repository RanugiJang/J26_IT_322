"""
Module 3 — ECG Dataset Downloader
Downloads MIT-BIH Arrhythmia Database and MIT-BIH Noise Stress Test Database
from PhysioNet using the WFDB library.
"""

import wfdb
from pathlib import Path
import sys

# =====================================================================
# MIT-BIH Arrhythmia Database — all 48 record IDs
# =====================================================================
MITDB_RECORDS = [
    "100", "101", "102", "103", "104", "105", "106", "107",
    "108", "109", "111", "112", "113", "114", "115", "116",
    "117", "118", "119", "121", "122", "123", "124", "200",
    "201", "202", "203", "205", "207", "208", "209", "210",
    "212", "213", "214", "215", "217", "219", "220", "221",
    "222", "223", "228", "230", "231", "232", "233", "234",
]

# =====================================================================
# MIT-BIH Noise Stress Test Database — noise-added record IDs
# =====================================================================
NSTDB_RECORDS = [
    "118e00", "118e06", "118e12", "118e18", "118e24",
    "119e00", "119e06", "119e12", "119e18", "119e24",
    "bw",     # baseline wander noise record
    "ma",     # muscle artifact noise record
    "em",     # electrode motion noise record
]


def download_mitdb(data_dir: str = "data/mitdb", records: list = None) -> None:
    """
    Download MIT-BIH Arrhythmia Database records.

    Parameters
    ----------
    data_dir : str
        Local folder to save the downloaded files.
    records : list, optional
        Specific record IDs to download. Downloads first 5 if None (quick start).
    """
    dest = Path(data_dir)
    dest.mkdir(parents=True, exist_ok=True)

    if records is None:
        # Quick-start: first 5 records only
        records = MITDB_RECORDS[:5]

    print(f"[MIT-BIH] Downloading {len(records)} record(s) → {dest.resolve()}")
    for rec in records:
        target = dest / f"{rec}.dat"
        if target.exists():
            print(f"  ✓  {rec}  (already exists, skipping)")
            continue
        try:
            wfdb.dl_database("mitdb", dl_dir=str(dest), records=[rec])
            print(f"  ↓  {rec}  downloaded")
        except Exception as exc:
            print(f"  ✗  {rec}  FAILED: {exc}", file=sys.stderr)

    print("[MIT-BIH] Done.\n")


def download_nstdb(data_dir: str = "data/nstdb", records: list = None) -> None:
    """
    Download MIT-BIH Noise Stress Test Database records.

    Parameters
    ----------
    data_dir : str
        Local folder to save the downloaded files.
    records : list, optional
        Specific record IDs to download. Downloads a starter set if None.
    """
    dest = Path(data_dir)
    dest.mkdir(parents=True, exist_ok=True)

    if records is None:
        # Quick-start: two noise-stress records + three pure-noise references
        records = ["118e00", "118e06", "119e00", "119e06", "bw", "ma", "em"]

    print(f"[NSTDB]   Downloading {len(records)} record(s) → {dest.resolve()}")
    for rec in records:
        target = dest / f"{rec}.dat"
        if target.exists():
            print(f"  ✓  {rec}  (already exists, skipping)")
            continue
        try:
            wfdb.dl_database("nstdb", dl_dir=str(dest), records=[rec])
            print(f"  ↓  {rec}  downloaded")
        except Exception as exc:
            print(f"  ✗  {rec}  FAILED: {exc}", file=sys.stderr)

    print("[NSTDB]   Done.\n")


if __name__ == "__main__":
    print("=" * 60)
    print("  Module 3 — ECG Dataset Downloader")
    print("=" * 60)
    download_mitdb()
    download_nstdb()
    print("All downloads complete!")
