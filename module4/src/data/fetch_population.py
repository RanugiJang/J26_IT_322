"""Step 1c — Population allele frequencies for cardiac pharmacogenes.

For each variant in config/pgx_variants.csv:
  1. Ensembl REST resolves the rsID to an exact GRCh38 variant ID
     (chrom-pos-ref-alt), using the expected 'alt' allele in the CSV.
     This avoids gnomAD's "Multiple variants found" error for multi-allelic rsIDs.
  2. gnomAD v4 (GraphQL) returns allele counts per genetic-ancestry group.
     The genome block also contains the 1000 Genomes / HGDP subsets, so
     '1kg:stu' (Sri Lankan Tamil), '1kg:itu', '1kg:gih', '1kg:pjl', '1kg:beb'
     come straight from gnomAD.
  3. Ensembl 1000 Genomes frequencies are fetched as a secondary source
     (with retries — Ensembl's population endpoint sometimes returns 500).

Output (long format):
  data/raw/population/gnomad_frequencies.csv
  data/raw/population/thousand_genomes_frequencies.csv

Run:  python -m src.data.fetch_population
"""
from __future__ import annotations

import time

import pandas as pd
import requests

from .common import ROOT, load_config, path

GNOMAD_QUERY = """
query($variantId: String!, $dataset: DatasetId!) {
  variant(variantId: $variantId, dataset: $dataset) {
    variant_id
    rsids
    ref
    alt
    exome  { ac an populations { id ac an } }
    genome { ac an populations { id ac an } }
  }
}
"""

PRIMARY_CHROMS = {str(i) for i in range(1, 23)} | {"X", "Y"}
HEADERS = {"Content-Type": "application/json", "Accept": "application/json"}


def get_json(url: str, retries: int = 4, timeout: int = 60) -> dict:
    """GET with retry/backoff — Ensembl intermittently returns 500/429."""
    last = None
    for attempt in range(1, retries + 1):
        try:
            r = requests.get(url, headers=HEADERS, timeout=timeout)
            if r.status_code in (429, 500, 502, 503, 504):
                last = f"HTTP {r.status_code}"
                time.sleep(2 ** attempt)
                continue
            r.raise_for_status()
            return r.json()
        except requests.RequestException as e:
            last = str(e)
            time.sleep(2 ** attempt)
    raise RuntimeError(f"failed after {retries} attempts: {last}")


def resolve_variant_id(rsid: str, expected_alt: str | None, cfg: dict) -> str:
    """rsID -> 'chrom-pos-ref-alt' on GRCh38 via Ensembl."""
    data = get_json(f"{cfg['population']['ensembl_api']}/variation/human/{rsid}")
    mappings = [m for m in data.get("mappings", [])
                if str(m.get("seq_region_name")) in PRIMARY_CHROMS
                and m.get("assembly_name", "GRCh38") == "GRCh38"]
    if not mappings:
        raise RuntimeError("no GRCh38 mapping on a primary chromosome")
    m = mappings[0]
    alleles = m["allele_string"].split("/")
    ref, alts = alleles[0], alleles[1:]
    if expected_alt and isinstance(expected_alt, str):
        if expected_alt not in alts:
            raise RuntimeError(f"expected alt {expected_alt} not in Ensembl alleles {m['allele_string']}")
        alt = expected_alt
    elif len(alts) == 1:
        alt = alts[0]
    else:
        raise RuntimeError(f"multi-allelic ({m['allele_string']}); set 'alt' in pgx_variants.csv")
    return f"{m['seq_region_name']}-{m['start']}-{ref}-{alt}"


GNOMAD_RSID_QUERY = """
query($rsid: String!, $dataset: DatasetId!) {
  variant(rsid: $rsid, dataset: $dataset) { variant_id alt }
}
"""


def resolve_via_gnomad(rsid: str, expected_alt: str | None, cfg: dict) -> str:
    """Fallback when Ensembl is down: ask gnomAD directly (works for single-allele rsIDs)."""
    pop_cfg = cfg["population"]
    r = requests.post(pop_cfg["gnomad_api"],
                      json={"query": GNOMAD_RSID_QUERY,
                            "variables": {"rsid": rsid, "dataset": pop_cfg["gnomad_dataset"]}},
                      timeout=60)
    r.raise_for_status()
    payload = r.json()
    if payload.get("errors"):
        raise RuntimeError(payload["errors"][0].get("message", "gnomAD error"))
    v = payload["data"]["variant"]
    if v is None:
        raise RuntimeError("not found in gnomAD")
    if expected_alt and isinstance(expected_alt, str) and v["alt"] != expected_alt:
        raise RuntimeError(f"gnomAD alt {v['alt']} != expected {expected_alt}")
    return v["variant_id"]


def keep_population(pid: str) -> bool:
    """Drop sex-split groups ('XX', 'sas_XX', '1kg:XX')."""
    tail = pid.split(":")[-1]
    return tail not in ("XX", "XY") and not tail.endswith(("_XX", "_XY"))


def fetch_gnomad(variant_id: str, rsid: str, cfg: dict) -> list[dict]:
    pop_cfg = cfg["population"]
    r = requests.post(pop_cfg["gnomad_api"],
                      json={"query": GNOMAD_QUERY,
                            "variables": {"variantId": variant_id, "dataset": pop_cfg["gnomad_dataset"]}},
                      timeout=60)
    r.raise_for_status()
    payload = r.json()
    if payload.get("errors"):
        raise RuntimeError(payload["errors"][0].get("message", "unknown gnomAD error"))
    v = payload["data"]["variant"]
    if v is None:
        raise RuntimeError(f"{variant_id} not found in gnomAD")

    rows = []
    for source in ("exome", "genome"):
        block = v.get(source)
        if not block:
            continue
        base = dict(rsid=rsid, variant_id=v["variant_id"], ref=v["ref"], alt=v["alt"], source=source)
        rows.append({**base, "population": "all", "ac": block["ac"], "an": block["an"]})
        for p in block["populations"]:
            if keep_population(p["id"]):
                rows.append({**base, "population": p["id"], "ac": p["ac"], "an": p["an"]})
    return rows


def fetch_ensembl_1kg(rsid: str, cfg: dict) -> list[dict]:
    pop_cfg = cfg["population"]
    data = get_json(f"{pop_cfg['ensembl_api']}/variation/human/{rsid}?pops=1")
    wanted = {f"1000GENOMES:phase_3:{p}" for p in pop_cfg["thousand_genomes_pops"]}
    return [dict(rsid=rsid,
                 population=p["population"].split(":")[-1],
                 allele=p["allele"],
                 frequency=p["frequency"],
                 allele_count=p.get("allele_count"),
                 minor_allele=data.get("minor_allele"))
            for p in data.get("populations", []) if p.get("population") in wanted]


def main() -> None:
    cfg = load_config()
    variants = pd.read_csv(ROOT / cfg["population"]["variants_file"])
    out_dir = path(f"{cfg['paths']['raw']}/population/x").parent
    delay = cfg["population"]["request_delay_s"]
    failures: list[tuple[str, str, str]] = []

    print("\n== Resolve rsIDs -> GRCh38 variant IDs (Ensembl) ==")
    ids: dict[str, str] = {}
    for _, row in variants.iterrows():
        try:
            ids[row.rsid] = resolve_variant_id(row.rsid, row.get("alt"), cfg)
            print(f"  [ok] {row.rsid} -> {ids[row.rsid]}")
        except Exception as e:  # noqa: BLE001
            try:
                ids[row.rsid] = resolve_via_gnomad(row.rsid, row.get("alt"), cfg)
                print(f"  [ok] {row.rsid} -> {ids[row.rsid]} (via gnomAD; Ensembl: {str(e)[:40]})")
            except Exception as e2:  # noqa: BLE001
                failures.append(("resolve", row.rsid, f"Ensembl: {e} | gnomAD: {e2}"))
                print(f"  [fail] {row.rsid}: {e} / {e2}")
        time.sleep(0.3)

    print("\n== gnomAD v4 ==")
    g_rows = []
    for rsid, vid in ids.items():
        try:
            rows = fetch_gnomad(vid, rsid, cfg)
            g_rows += rows
            print(f"  [ok] {rsid} ({vid}): {len(rows)} rows")
        except Exception as e:  # noqa: BLE001
            failures.append(("gnomad", rsid, str(e)))
            print(f"  [fail] {rsid}: {e}")
        time.sleep(delay)
    if g_rows:
        g = pd.DataFrame(g_rows)
        g["af"] = g["ac"] / g["an"].where(g["an"] > 0)
        g = g.merge(variants[["rsid", "gene", "star_allele"]], on="rsid", how="left")
        g.to_csv(out_dir / "gnomad_frequencies.csv", index=False)
        stu = g[g.population == "1kg:stu"]
        print(f"  saved {len(g):,} rows | {g.rsid.nunique()} variants | "
              f"Sri Lankan Tamil (1kg:stu) available for {stu.rsid.nunique()} variants")

    print("\n== 1000 Genomes via Ensembl (secondary) ==")
    e_rows = []
    for rsid in variants["rsid"]:
        try:
            rows = fetch_ensembl_1kg(rsid, cfg)
            e_rows += rows
            print(f"  [ok] {rsid}: {len(rows)} rows")
        except Exception as e:  # noqa: BLE001
            failures.append(("ensembl", rsid, str(e)))
            print(f"  [fail] {rsid}: {e}")
        time.sleep(0.5)
    if e_rows:
        e = pd.DataFrame(e_rows).merge(variants[["rsid", "gene", "star_allele"]], on="rsid", how="left")
        e.to_csv(out_dir / "thousand_genomes_frequencies.csv", index=False)

    if failures:
        print("\n  failures:")
        for stage, rsid, msg in failures:
            print(f"   - [{stage}] {rsid}: {msg[:140]}")
        print("  Ensembl-only failures are OK — gnomAD already includes the 1000 Genomes subsets.")
    else:
        print("\n  all variants fetched.")


if __name__ == "__main__":
    main()
