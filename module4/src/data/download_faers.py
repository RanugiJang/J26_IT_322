"""Step 1d — FAERS quarterly ASCII extracts (external validation set).

Downloads the quarters listed in config.yaml, extracts only the DEMO, DRUG,
REAC and OUTC tables, and converts them to compressed CSV so later steps load fast.

FAERS is used ONLY for validation (WBS 5), never for training labels —
keeping it out of training is what makes the FAERS cross-check meaningful.

Each quarter is ~70 MB zipped. Run this whenever convenient; nothing in
Steps 2-4 depends on it.

Run:  python -m src.data.download_faers
"""
from __future__ import annotations

import io
import zipfile

import pandas as pd

from .common import download, load_config, path


def extract_quarter(zip_path, out_dir, keep: list[str]) -> None:
    q = zip_path.stem.replace("faers_ascii_", "")
    with zipfile.ZipFile(zip_path) as z:
        for name in z.namelist():
            base = name.rsplit("/", 1)[-1].upper()
            table = next((t for t in keep if base.startswith(t) and base.endswith(".TXT")), None)
            if not table:
                continue
            dest = out_dir / f"{table.lower()}_{q}.csv.gz"
            if dest.exists():
                continue
            with z.open(name) as f:
                df = pd.read_csv(io.TextIOWrapper(f, encoding="latin-1"), sep="$",
                                 dtype=str, on_bad_lines="skip", low_memory=False)
            df.to_csv(dest, index=False, compression="gzip")
            print(f"  [extracted] {dest.name}: {len(df):,} rows")


def main() -> None:
    cfg = load_config()
    raw = path(f"{cfg['paths']['raw']}/faers/zips/x").parent
    out = path(f"{cfg['paths']['raw']}/faers/tables/x").parent
    print("\n== FAERS ==")
    for q in cfg["faers"]["quarters"]:
        fname = f"faers_ascii_{q}.zip"
        if download(cfg["faers"]["base_url"] + fname, raw / fname, timeout=300):
            extract_quarter(raw / fname, out, cfg["faers"]["keep_tables"])
        else:
            print(f"  [warn] {fname} not available — check https://fis.fda.gov/extensions/FPD-QDE-FAERS/FPD-QDE-FAERS.html")


if __name__ == "__main__":
    main()
