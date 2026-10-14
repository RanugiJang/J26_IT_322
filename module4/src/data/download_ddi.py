"""Step 1a — Drug-drug interaction sources.

1. DrugBank-derived DDI set from Therapeutics Data Commons (Ryu et al. 2018,
   DrugBank 5.0): ~192k pairs, ~1.7k drugs, 86 mechanism-typed interaction
   templates (e.g. "#Drug1 may increase the anticoagulant activities of #Drug2").
   Downloaded directly from Harvard Dataverse (TDC datafile 4139573), so the
   PyTDC package itself is NOT required.
2. DDInter bulk files: severity labels (Major / Moderate / Minor / Unknown)
   for the rule-based baseline.

Full DrugBank XML is not downloaded here (licence-gated). Put it at the path in
config.yaml when your academic download becomes available.

Run:  python -m src.data.download_ddi
"""
from __future__ import annotations

import pandas as pd

from .common import download, load_config, path

TDC_DRUGBANK_URL = "https://dataverse.harvard.edu/api/access/datafile/4139573"


def fetch_tdc_drugbank(cfg: dict) -> None:
    print("\n== TDC DrugBank DDI ==")
    out_dir = path(f"{cfg['paths']['raw']}/tdc_drugbank/x").parent
    raw_tab = out_dir / "drugbank_ddi.tab"
    pairs_csv = out_dir / "ddi_pairs.csv"
    labels_csv = out_dir / "ddi_label_map.csv"

    if pairs_csv.exists() and labels_csv.exists():
        print("  [skip] TDC DrugBank already saved")
        return

    if not download(TDC_DRUGBANK_URL, raw_tab, timeout=300):
        print("  [error] Dataverse download failed. Retry later, or download manually:")
        print(f"          {TDC_DRUGBANK_URL}")
        print(f"          and save it as {raw_tab}")
        return

    df = pd.read_csv(raw_tab, sep="\t")
    # Dataverse file uses ID1/ID2 (DrugBank IDs) and X1/X2 (SMILES)
    df = df.rename(columns={"ID1": "Drug1_ID", "ID2": "Drug2_ID", "X1": "Drug1", "X2": "Drug2"})
    print(f"  columns: {list(df.columns)}")

    needed = {"Drug1_ID", "Drug2_ID", "Y"}
    if not needed.issubset(df.columns):
        print(f"  [error] unexpected format, missing {needed - set(df.columns)}")
        return

    # Label map: Y -> mechanism template text (TDC stores it in the 'Map' column)
    map_col = next((c for c in ("Map", "map", "Label", "Description") if c in df.columns), None)
    if map_col:
        labels = (df[["Y", map_col]].drop_duplicates("Y")
                  .rename(columns={map_col: "template"}).sort_values("Y"))
        labels.to_csv(labels_csv, index=False)
    else:
        print("  [warn] no label-text column found; saving Y codes only")
        pd.DataFrame({"Y": sorted(df["Y"].unique()), "template": ""}).to_csv(labels_csv, index=False)

    keep = [c for c in ("Drug1_ID", "Drug1", "Drug2_ID", "Drug2", "Y") if c in df.columns]
    df[keep].to_csv(pairs_csv, index=False)

    drugs = pd.concat([df.Drug1_ID, df.Drug2_ID]).nunique()
    print(f"  [ok] {len(df):,} pairs | {drugs:,} drugs | {df['Y'].nunique()} interaction types")


def fetch_ddinter(cfg: dict) -> None:
    print("\n== DDInter severity files ==")
    out_dir = path(f"{cfg['paths']['raw']}/ddinter/x").parent
    failed = []
    for code in cfg["ddi"]["ddinter_codes"]:
        fname = f"ddinter_downloads_code_{code}.csv"
        ok = any(download(base + fname, out_dir / fname) for base in cfg["ddi"]["ddinter_base_urls"])
        if not ok:
            failed.append(fname)

    files = sorted(out_dir.glob("ddinter_downloads_code_*.csv"))
    if not files:
        print("  [error] no DDInter files downloaded")
        return

    frames = []
    for f in files:
        d = pd.read_csv(f)
        d["source_file"] = f.stem.rsplit("_", 1)[-1]
        frames.append(d)
    df = pd.concat(frames, ignore_index=True)

    # Same pair appears in several ATC files -> de-duplicate on unordered pair
    a, b = df["DDInterID_A"].astype(str), df["DDInterID_B"].astype(str)
    df["pair_key"] = ["|".join(sorted(x)) for x in zip(a, b)]
    merged = (df.groupby("pair_key", as_index=False)
                .agg(DDInterID_A=("DDInterID_A", "first"), Drug_A=("Drug_A", "first"),
                     DDInterID_B=("DDInterID_B", "first"), Drug_B=("Drug_B", "first"),
                     Level=("Level", "first"),
                     atc_files=("source_file", lambda s: ",".join(sorted(set(s))))))
    merged.drop(columns="pair_key").to_csv(out_dir / "ddinter_merged.csv", index=False)

    print(f"  [ok] {len(merged):,} unique pairs")
    print("  severity:", merged["Level"].value_counts().to_dict())
    if failed:
        print("  [warn] failed:", failed, "-> download manually from https://ddinter.scbdd.com/download/")


def main() -> None:
    cfg = load_config()
    if cfg["ddi"].get("tdc_drugbank", True):
        fetch_tdc_drugbank(cfg)
    fetch_ddinter(cfg)


if __name__ == "__main__":
    main()
