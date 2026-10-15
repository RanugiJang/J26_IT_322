"""Step 2 — Entity resolution + knowledge graph.

Inputs (from Step 1):
  data/raw/clinpgx/drugs/drugs.tsv                 -> drug vocabulary (DrugBank IDs, names, ATC)
  data/raw/tdc_drugbank/ddi_pairs.csv              -> drug-drug edges (86 mechanism types)
  data/raw/tdc_drugbank/ddi_label_map.csv          -> mechanism templates
  data/raw/ddinter/ddinter_merged.csv              -> severity labels
  data/raw/clinpgx/relationships/relationships.tsv -> drug-gene edges (PK / PD)
  data/raw/clinpgx/clinicalAnnotations/clinical_annotations.tsv -> evidence levels
  data/raw/clinpgx/genes/genes.tsv                 -> gene symbols
  data/raw/population/gnomad_frequencies.csv       -> variant allele frequencies
  config/pgx_variants.csv                          -> variant -> gene map

Outputs (data/interim/):
  nodes_drug.csv, nodes_gene.csv, nodes_variant.csv
  edges_ddi.csv, edges_drug_gene.csv, edges_gene_variant.csv
  name_index.csv                                   -> used by the demo to look up typed drug names
Report:
  reports/kg_summary.md, reports/kg_stats.json

Design decision: the GNN is trained on the FULL DrugBank interaction network
(more signal for message passing); every drug is tagged is_cardiac, and
evaluation + the demo focus on edges that involve at least one cardiac drug.

Run:  python -m src.kg.build_kg
"""
from __future__ import annotations

import json
import time

import pandas as pd

from ..data.common import ROOT, load_config, path
from .vocab import build_vocab, lookup, normalize_name

LEVEL_RANK = {"1A": 1, "1B": 2, "2A": 3, "2B": 4, "3": 5, "4": 6}
SEVERITY_RANK = {"Major": 3, "Moderate": 2, "Minor": 1, "Unknown": 0}


def log(msg: str) -> None:
    print(f"  {msg}")


# --------------------------------------------------------------------------- drugs
def load_vocab(cfg: dict) -> tuple[pd.DataFrame, dict[str, str]]:
    raw = ROOT / cfg["paths"]["raw"]
    drugs = pd.read_csv(raw / "clinpgx/drugs/drugs.tsv", sep="\t", dtype=str)
    prefixes = list(cfg["cardiac_scope"]["atc_prefixes"].keys())
    syn_path = ROOT / cfg["kg"]["synonyms_file"]
    synonyms = pd.read_csv(syn_path) if syn_path.exists() else None
    vocab, index = build_vocab(drugs, prefixes, cfg["kg"]["include_trade_names"], synonyms)
    n_db = int((vocab.id_source == "drugbank").sum())
    log(f"ClinPGx drugs: {len(drugs):,} records -> {len(vocab):,} drugs "
        f"({n_db:,} with a DrugBank ID, {len(vocab) - n_db:,} ClinPGx-only; "
        f"{int(vocab.is_cardiac.sum())} cardiac by ATC)")
    log(f"name index: {len(index):,} unambiguous names/synonyms")
    return vocab, index


# --------------------------------------------------------------------------- DDI
def load_ddi(cfg: dict) -> pd.DataFrame:
    raw = ROOT / cfg["paths"]["raw"]
    pairs = pd.read_csv(raw / "tdc_drugbank/ddi_pairs.csv",
                        usecols=["Drug1_ID", "Drug2_ID", "Y"])
    labels = pd.read_csv(raw / "tdc_drugbank/ddi_label_map.csv")
    pairs = pairs.merge(labels, on="Y", how="left").rename(
        columns={"Drug1_ID": "drug1", "Drug2_ID": "drug2", "Y": "mechanism_id", "template": "mechanism"})
    log(f"TDC DrugBank: {len(pairs):,} directed interaction edges, {pairs.mechanism_id.nunique()} mechanism types")
    return pairs


def smiles_table(cfg: dict) -> pd.DataFrame:
    raw = ROOT / cfg["paths"]["raw"]
    p = pd.read_csv(raw / "tdc_drugbank/ddi_pairs.csv")
    a = p[["Drug1_ID", "Drug1"]].rename(columns={"Drug1_ID": "drugbank_id", "Drug1": "smiles"})
    b = p[["Drug2_ID", "Drug2"]].rename(columns={"Drug2_ID": "drugbank_id", "Drug2": "smiles"})
    return pd.concat([a, b]).drop_duplicates("drugbank_id")


def attach_severity(ddi: pd.DataFrame, index: dict[str, str], cfg: dict) -> tuple[pd.DataFrame, dict]:
    raw = ROOT / cfg["paths"]["raw"]
    dd = pd.read_csv(raw / "ddinter/ddinter_merged.csv")
    name_cache: dict[str, str | None] = {}

    def resolve(n: str):
        if n not in name_cache:
            name_cache[n] = lookup(n, index)
        return name_cache[n]

    dd["db_a"] = dd["Drug_A"].map(resolve)
    dd["db_b"] = dd["Drug_B"].map(resolve)
    names = pd.concat([dd.Drug_A, dd.Drug_B]).unique()
    mapped_names = sum(1 for n in names if name_cache.get(n))
    ok = dd.dropna(subset=["db_a", "db_b"]).copy()
    ok["pair_key"] = ["|".join(sorted(x)) for x in zip(ok.db_a, ok.db_b)]
    ok["sev_rank"] = ok["Level"].map(SEVERITY_RANK).fillna(0)
    sev = (ok.sort_values("sev_rank", ascending=False)
             .drop_duplicates("pair_key")[["pair_key", "Level"]]
             .rename(columns={"Level": "severity"}))

    ddi = ddi.copy()
    ddi["pair_key"] = ["|".join(sorted(x)) for x in zip(ddi.drug1, ddi.drug2)]
    ddi = ddi.merge(sev, on="pair_key", how="left")

    # DDInter pairs not present in DrugBank -> extra edges (severity known, mechanism unknown)
    known = set(ddi.pair_key)
    extra = ok[~ok.pair_key.isin(known)].drop_duplicates("pair_key")
    extra = pd.DataFrame({"drug1": extra.db_a, "drug2": extra.db_b, "mechanism_id": -1,
                          "mechanism": "Interaction reported in DDInter (mechanism not specified).",
                          "pair_key": extra.pair_key, "severity": extra.Level})
    out = pd.concat([ddi.assign(source="drugbank"), extra.assign(source="ddinter")], ignore_index=True)

    stats = dict(ddinter_names=len(names), ddinter_names_mapped=mapped_names,
                 ddinter_pairs=len(dd), ddinter_pairs_mapped=len(ok),
                 drugbank_edges_with_severity=int(ddi.severity.notna().sum()),
                 ddinter_only_edges_added=len(extra))
    log(f"DDInter: {mapped_names:,}/{len(names):,} drug names mapped to DrugBank IDs; "
        f"{len(ok):,}/{len(dd):,} pairs mapped")
    log(f"severity attached to {stats['drugbank_edges_with_severity']:,} DrugBank edges; "
        f"{len(extra):,} DDInter-only edges added")
    return out, stats


# --------------------------------------------------------------------------- genes
def load_drug_gene(vocab: pd.DataFrame, index: dict[str, str], cfg: dict) -> tuple[pd.DataFrame, pd.DataFrame]:
    raw = ROOT / cfg["paths"]["raw"]
    genes = pd.read_csv(raw / "clinpgx/genes/genes.tsv", sep="\t", dtype=str,
                        usecols=["PharmGKB Accession Id", "Symbol", "Name", "Is VIP", "Has CPIC Dosing Guideline"])
    genes.columns = ["pharmgkb_id", "symbol", "gene_name", "is_vip", "has_cpic_guideline"]
    pa2db = dict(zip(vocab.pharmgkb_id, vocab.drugbank_id))
    pa2sym = dict(zip(genes.pharmgkb_id, genes.symbol))

    # 1) relationships.tsv: Chemical <-> Gene, keep "associated"
    rel = pd.read_csv(raw / "clinpgx/relationships/relationships.tsv", sep="\t", dtype=str)
    keep_assoc = set(cfg["kg"]["relationship_associations"])
    rel = rel[rel.Association.isin(keep_assoc)]
    fwd = rel[(rel.Entity1_type == "Chemical") & (rel.Entity2_type == "Gene")]
    rev = rel[(rel.Entity1_type == "Gene") & (rel.Entity2_type == "Chemical")]
    r1 = pd.DataFrame({"chem": fwd.Entity1_id, "gene": fwd.Entity2_id, "pk": fwd.PK, "pd": fwd.PD,
                       "evidence": fwd.Evidence, "pmids": fwd.PMIDs})
    r2 = pd.DataFrame({"chem": rev.Entity2_id, "gene": rev.Entity1_id, "pk": rev.PK, "pd": rev.PD,
                       "evidence": rev.Evidence, "pmids": rev.PMIDs})
    r = pd.concat([r1, r2], ignore_index=True)
    r["drugbank_id"] = r.chem.map(pa2db)
    r["gene_symbol"] = r.gene.map(pa2sym)
    r = r.dropna(subset=["drugbank_id", "gene_symbol"])
    r["pk"] = r.pk.fillna("").str.contains("PK")
    r["pd"] = r.pd.fillna("").str.contains("PD")
    r = (r.groupby(["drugbank_id", "gene_symbol"], as_index=False)
           .agg(pk=("pk", "max"), pd=("pd", "max"),
                evidence_types=("evidence", lambda s: ";".join(sorted({e for x in s.dropna() for e in str(x).split(",")}))),
                pmid_count=("pmids", lambda s: len({p for x in s.dropna() for p in str(x).split(";") if p}))))
    log(f"relationships: {len(r):,} drug-gene edges (associated)")

    # 2) clinical annotations: evidence level + phenotype category per drug-gene
    ca = pd.read_csv(raw / "clinpgx/clinicalAnnotations/clinical_annotations.tsv", sep="\t", dtype=str)
    max_rank = LEVEL_RANK[cfg["kg"]["min_clinical_level"]]
    rows = []
    for _, a in ca.iterrows():
        lvl = str(a["Level of Evidence"]).strip()
        if LEVEL_RANK.get(lvl, 99) > max_rank:
            continue
        drugs = [d for d in str(a["Drug(s)"]).split(";") if d.strip()]
        gsyms = [g for g in str(a["Gene"]).split(";") if g.strip() and g != "nan"]
        for d in drugs:
            dbid = lookup(d, index)
            if not dbid:
                continue
            for g in gsyms:
                rows.append(dict(drugbank_id=dbid, gene_symbol=g.strip(), level=lvl,
                                 level_rank=LEVEL_RANK[lvl], phenotype=a["Phenotype Category"],
                                 variant=a["Variant/Haplotypes"]))
    c = pd.DataFrame(rows)
    if not c.empty:
        c = (c.sort_values("level_rank")
               .groupby(["drugbank_id", "gene_symbol"], as_index=False)
               .agg(best_level=("level", "first"),
                    phenotypes=("phenotype", lambda s: ";".join(sorted(set(s.dropna())))),
                    annotated_variants=("variant", lambda s: ";".join(sorted(set(s.dropna()))[:10])),
                    n_annotations=("level", "size")))
    log(f"clinical annotations (level <= {cfg['kg']['min_clinical_level']}): {len(c):,} drug-gene pairs")

    edges = r.merge(c, on=["drugbank_id", "gene_symbol"], how="outer") if not c.empty else r
    for col, default in (("pk", False), ("pd", False), ("pmid_count", 0), ("n_annotations", 0)):
        if col in edges:
            edges[col] = edges[col].astype(object).where(edges[col].notna(), default).infer_objects()
    return edges, genes


# --------------------------------------------------------------------------- variants
def load_variants(cfg: dict) -> tuple[pd.DataFrame, pd.DataFrame]:
    raw = ROOT / cfg["paths"]["raw"]
    var = pd.read_csv(ROOT / cfg["population"]["variants_file"])
    gpath = raw / "population/gnomad_frequencies.csv"
    if gpath.exists():
        g = pd.read_csv(gpath)
        g = g[g.source == "genome"]
        wanted = {"all": "af_global", "sas": "af_sas", "nfe": "af_nfe", "eas": "af_eas",
                  "afr": "af_afr", "1kg:stu": "af_stu", "1kg:itu": "af_itu", "1kg:gih": "af_gih",
                  "1kg:ceu": "af_ceu", "1kg:gbr": "af_gbr"}
        g = g[g.population.isin(wanted)].copy()
        g["col"] = g.population.map(wanted)
        piv = g.pivot_table(index="rsid", columns="col", values="af", aggfunc="first").reset_index()
        var = var.merge(piv, on="rsid", how="left")
        vid = g.drop_duplicates("rsid")[["rsid", "variant_id"]]
        var = var.merge(vid, on="rsid", how="left")
    var["variant_node"] = var.gene + " " + var.star_allele.astype(str) + "\n" + var.rsid
    edges = var[["gene", "rsid", "variant_node"]].rename(columns={"gene": "gene_symbol"})
    log(f"variants: {len(var)} pharmacogenomic variants with population frequencies")
    return var, edges


# --------------------------------------------------------------------------- main
def main() -> None:
    t0 = time.time()
    cfg = load_config()
    out = path(f"{cfg['paths']['interim']}/x").parent
    print("\n== Step 2: building knowledge graph ==")

    vocab, index = load_vocab(cfg)
    ddi = load_ddi(cfg)
    ddi, sev_stats = attach_severity(ddi, index, cfg)

    # drug nodes = every drug that appears in an interaction edge
    ids = pd.Index(pd.concat([ddi.drug1, ddi.drug2]).unique(), name="drugbank_id")
    nodes = pd.DataFrame(index=ids).reset_index().merge(vocab, on="drugbank_id", how="left")
    nodes = nodes.merge(smiles_table(cfg), on="drugbank_id", how="left")
    nodes["is_cardiac"] = nodes["is_cardiac"].astype("boolean").fillna(False).astype(bool)
    nodes["in_clinpgx"] = nodes["pharmgkb_id"].notna()
    nodes["name"] = nodes["name"].fillna(nodes["drugbank_id"])

    dg, all_genes = load_drug_gene(vocab, index, cfg)
    dg = dg[dg.drugbank_id.isin(ids)]
    var, gv = load_variants(cfg)
    # gene nodes = genes linked to a drug OR carrying one of our PGx variants
    gene_nodes = all_genes[all_genes.symbol.isin(set(dg.gene_symbol) | set(var.gene))].drop_duplicates("symbol")
    gv = gv[gv.gene_symbol.isin(gene_nodes.symbol)]

    # cardiac-focused counts
    cardiac = set(nodes.loc[nodes.is_cardiac, "drugbank_id"])
    ddi["cardiac_drugs"] = ddi.drug1.isin(cardiac).astype(int) + ddi.drug2.isin(cardiac).astype(int)
    cardiac_edges = ddi[ddi.cardiac_drugs > 0]

    # write
    nodes.to_csv(out / "nodes_drug.csv", index=False)
    gene_nodes.to_csv(out / "nodes_gene.csv", index=False)
    var.to_csv(out / "nodes_variant.csv", index=False)
    ddi.drop(columns=["pair_key"]).to_csv(out / "edges_ddi.csv", index=False)
    dg.to_csv(out / "edges_drug_gene.csv", index=False)
    gv.to_csv(out / "edges_gene_variant.csv", index=False)
    pd.DataFrame(sorted(index.items()), columns=["name_normalized", "drugbank_id"]).to_csv(
        out / "name_index.csv", index=False)

    # audit: cardiac drugs known to ClinPGx but with no interaction edge in the graph
    missing = vocab[vocab.is_cardiac & ~vocab.drugbank_id.isin(ids)][["drugbank_id", "name", "atc_codes"]]
    missing.to_csv(path(f"{cfg['paths']['reports']}/missing_cardiac_drugs.csv"), index=False)
    log(f"audit: {len(missing)} cardiac drugs have no interaction edge -> reports/missing_cardiac_drugs.csv")

    # ---------------------------------------------------------------- stats
    name_of = dict(zip(nodes.drugbank_id, nodes.name))
    deg = pd.concat([cardiac_edges.drug1, cardiac_edges.drug2]).value_counts()
    top_cardiac = [(name_of.get(d, d), int(n)) for d, n in deg.items() if d in cardiac][:10]
    top_mech = (cardiac_edges[cardiac_edges.mechanism_id >= 0].mechanism.value_counts().head(8))
    sev_c = cardiac_edges.severity.value_counts(dropna=False).to_dict()
    sev_c = {("not in DDInter" if pd.isna(k) else k): int(v) for k, v in sev_c.items()}

    stats = {
        "drug_nodes": int(len(nodes)),
        "drug_nodes_mapped_to_clinpgx": int(nodes.in_clinpgx.sum()),
        "drug_nodes_clinpgx_only_id": int(nodes.drugbank_id.str.startswith("PGKB:").sum()),
        "cardiac_drugs_missing": int(len(missing)),
        "cardiac_drug_nodes": int(nodes.is_cardiac.sum()),
        "gene_nodes": int(len(gene_nodes)),
        "variant_nodes": int(len(var)),
        "ddi_edges_total": int(len(ddi)),
        "ddi_edges_drugbank": int((ddi.source == "drugbank").sum()),
        "ddi_edges_ddinter_only": int((ddi.source == "ddinter").sum()),
        "ddi_edges_with_cardiac_drug": int(len(cardiac_edges)),
        "ddi_edges_both_cardiac": int((ddi.cardiac_drugs == 2).sum()),
        "drug_gene_edges": int(len(dg)),
        "drug_gene_edges_cardiac": int(dg.drugbank_id.isin(cardiac).sum()),
        "gene_variant_edges": int(len(gv)),
        "cardiac_edge_severity": sev_c,
        **sev_stats,
        "build_seconds": round(time.time() - t0, 1),
    }
    rep = path(f"{cfg['paths']['reports']}/kg_stats.json")
    rep.write_text(json.dumps(stats, indent=2), encoding="utf-8")

    md = ["# Module 4 — Knowledge graph summary", "",
          "## Nodes", "| Type | Count |", "|---|---|",
          f"| Drug | {stats['drug_nodes']:,} ({stats['cardiac_drug_nodes']:,} cardiac) |",
          f"| Gene | {stats['gene_nodes']:,} |",
          f"| Variant (PGx) | {stats['variant_nodes']:,} |", "",
          "## Edges", "| Type | Count |", "|---|---|",
          f"| Drug–drug (DrugBank, 86 mechanisms) | {stats['ddi_edges_drugbank']:,} |",
          f"| Drug–drug (DDInter only, severity) | {stats['ddi_edges_ddinter_only']:,} |",
          f"| — involving a cardiac drug | {stats['ddi_edges_with_cardiac_drug']:,} |",
          f"| — both drugs cardiac | {stats['ddi_edges_both_cardiac']:,} |",
          f"| Drug–gene (ClinPGx) | {stats['drug_gene_edges']:,} ({stats['drug_gene_edges_cardiac']:,} cardiac) |",
          f"| Gene–variant | {stats['gene_variant_edges']:,} |", "",
          "## Entity resolution",
          f"- Drug nodes matched to ClinPGx: {stats['drug_nodes_mapped_to_clinpgx']:,} / {stats['drug_nodes']:,}",
          f"- DDInter drug names matched: {sev_stats['ddinter_names_mapped']:,} / {sev_stats['ddinter_names']:,}",
          f"- DrugBank edges with DDInter severity: {sev_stats['drugbank_edges_with_severity']:,}", "",
          "## Cardiac interaction severity", "| Severity | Edges |", "|---|---|",
          *[f"| {k} | {v:,} |" for k, v in sev_c.items()], "",
          "## Most-connected cardiac drugs", "| Drug | Interactions |", "|---|---|",
          *[f"| {n} | {c:,} |" for n, c in top_cardiac], "",
          "## Most common mechanisms (cardiac edges)", "| Mechanism | Edges |", "|---|---|",
          *[f"| {m} | {c:,} |" for m, c in top_mech.items()], ""]
    path(f"{cfg['paths']['reports']}/kg_summary.md").write_text("\n".join(md), encoding="utf-8")

    print("\n== Summary ==")
    for k in ("drug_nodes", "cardiac_drug_nodes", "gene_nodes", "variant_nodes", "ddi_edges_total",
              "ddi_edges_with_cardiac_drug", "ddi_edges_both_cardiac", "drug_gene_edges",
              "drug_gene_edges_cardiac"):
        print(f"  {k:<32} {stats[k]:>10,}")
    print(f"  cardiac edge severity            {sev_c}")
    print(f"  top cardiac drugs                {top_cardiac[:5]}")
    print(f"\n  outputs -> {cfg['paths']['interim']}/   report -> reports/kg_summary.md  ({stats['build_seconds']}s)")


if __name__ == "__main__":
    main()
