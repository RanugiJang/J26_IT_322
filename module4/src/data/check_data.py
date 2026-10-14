"""Step 1e — Sanity report on everything downloaded.

Prints a status table and writes reports/data_inventory.md.
Key check: how many DDInter pairs involve two cardiovascular (ATC C) drugs,
since DDInter has no ATC-C bulk file.

Run:  python -m src.data.check_data
"""
from __future__ import annotations

import pandas as pd

from .common import ROOT, load_config, path


def find_col(df: pd.DataFrame, *needles: str) -> str | None:
    for c in df.columns:
        if all(n.lower() in c.lower() for n in needles):
            return c
    return None


def main() -> None:
    cfg = load_config()
    raw = ROOT / cfg["paths"]["raw"]
    lines = ["# Module 4 — Data inventory", ""]

    def status(name: str, ok: bool, detail: str = "") -> None:
        mark = "OK " if ok else "MISSING"
        print(f"[{mark}] {name:<34} {detail}")
        lines.append(f"- **{name}** — {'OK' if ok else 'MISSING'} {detail}")

    # DrugBank full XML
    xml = ROOT / cfg["ddi"]["drugbank_xml"]
    status("DrugBank full XML", xml.exists(), "(optional until licence download opens)")

    # TDC DrugBank
    tdc = raw / "tdc_drugbank" / "ddi_pairs.csv"
    if tdc.exists():
        d = pd.read_csv(tdc, usecols=["Drug1_ID", "Drug2_ID", "Y"])
        status("TDC DrugBank DDI", True,
               f"{len(d):,} pairs | {pd.concat([d.Drug1_ID, d.Drug2_ID]).nunique():,} drugs | {d.Y.nunique()} types")
    else:
        status("TDC DrugBank DDI", False)

    # DDInter
    ddi = raw / "ddinter" / "ddinter_merged.csv"
    if ddi.exists():
        d = pd.read_csv(ddi)
        status("DDInter (severity)", True, f"{len(d):,} pairs | {d.Level.value_counts().to_dict()}")
    else:
        status("DDInter (severity)", False)

    # ClinPGx
    drugs_tsv = next((raw / "clinpgx").glob("drugs/*.tsv"), None) if (raw / "clinpgx").exists() else None
    rel_tsv = next((raw / "clinpgx").glob("relationships/*.tsv"), None) if (raw / "clinpgx").exists() else None
    status("ClinPGx relationships", rel_tsv is not None)
    status("ClinPGx drugs", drugs_tsv is not None)

    cardiac_names: set[str] = set()
    cv_only_names: set[str] = set()
    if drugs_tsv is not None:
        dr = pd.read_csv(drugs_tsv, sep="\t", dtype=str)
        atc_col = find_col(dr, "atc")
        name_col = find_col(dr, "name") or dr.columns[1]
        if atc_col:
            prefixes = tuple(cfg["cardiac_scope"]["atc_prefixes"].keys())
            for _, row in dr.iterrows():
                codes = [c.strip() for c in str(row[atc_col]).replace('"', "").split(",") if c.strip() and c != "nan"]
                if any(c.startswith(prefixes) for c in codes):
                    cardiac_names.add(str(row[name_col]).lower())
                    if codes and all(c.startswith("C") for c in codes):
                        cv_only_names.add(str(row[name_col]).lower())
            status("Cardiac drugs in scope (ATC)", True, f"{len(cardiac_names)} drugs ({len(cv_only_names)} ATC-C only)")

    # DDInter C–C coverage check
    if ddi.exists() and cv_only_names:
        d = pd.read_csv(ddi)
        a, b = d.Drug_A.str.lower(), d.Drug_B.str.lower()
        cc = d[a.isin(cv_only_names) & b.isin(cv_only_names)]
        status("DDInter ATC-C-only pairs", len(cc) > 0,
               f"{len(cc):,} pairs found (low = gap; DrugBank/TDC covers these)")

    # Population
    gn = raw / "population" / "gnomad_frequencies.csv"
    tg = raw / "population" / "thousand_genomes_frequencies.csv"
    if gn.exists():
        g = pd.read_csv(gn)
        status("gnomAD frequencies", True, f"{g.rsid.nunique()} variants | pops: {sorted(g.population.unique())}")
    else:
        status("gnomAD frequencies", False)
    if tg.exists():
        t = pd.read_csv(tg)
        status("1000G frequencies", True, f"{t.rsid.nunique()} variants | STU rows: {(t.population == 'STU').sum()}")
    else:
        status("1000G frequencies", False)

    # FAERS
    ft = raw / "faers" / "tables"
    n = len(list(ft.glob("*.csv.gz"))) if ft.exists() else 0
    status("FAERS tables", n > 0, f"{n} files (needed only for validation phase)")

    out = path(f"{cfg['paths']['reports']}/data_inventory.md")
    out.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"\nreport -> {out.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
