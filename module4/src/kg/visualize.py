"""Step 2b — Slide-ready picture of one drug's neighbourhood in the knowledge graph.

Shows the drug, its pharmacogenes (with PGx variants), and its highest-severity
cardiac interaction partners. Default: warfarin.

Run:  python -m src.kg.visualize               (uses kg.figure_drug from config)
      python -m src.kg.visualize clopidogrel
"""
from __future__ import annotations

import sys

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402
import networkx as nx  # noqa: E402
import pandas as pd  # noqa: E402

from ..data.common import ROOT, load_config, path  # noqa: E402
from .vocab import normalize_name  # noqa: E402

SEV_ORDER = {"Major": 0, "Moderate": 1, "Minor": 2, "Unknown": 3}
COLORS = {"focus": "#C0392B", "drug": "#2E86C1", "cardiac": "#1ABC9C", "gene": "#8E44AD", "variant": "#D68910"}


def main() -> None:
    cfg = load_config()
    inter = ROOT / cfg["paths"]["interim"]
    target = normalize_name(sys.argv[1]) if len(sys.argv) > 1 else normalize_name(cfg["kg"]["figure_drug"])
    max_partners = cfg["kg"]["figure_max_partners"]

    drugs = pd.read_csv(inter / "nodes_drug.csv")
    ddi = pd.read_csv(inter / "edges_ddi.csv")
    dg = pd.read_csv(inter / "edges_drug_gene.csv")
    gv = pd.read_csv(inter / "edges_gene_variant.csv")
    idx = pd.read_csv(inter / "name_index.csv")

    hit = idx[idx.name_normalized == target]
    if hit.empty:
        sys.exit(f"'{target}' not found in name index")
    focus = hit.drugbank_id.iloc[0]
    name_of = dict(zip(drugs.drugbank_id, drugs.name))
    cardiac = set(drugs.loc[drugs.is_cardiac, "drugbank_id"])

    e = ddi[(ddi.drug1 == focus) | (ddi.drug2 == focus)].copy()
    e["partner"] = e.drug2.where(e.drug1 == focus, e.drug1)
    e["sev"] = e.severity.map(SEV_ORDER).fillna(4)
    e["is_cardiac"] = e.partner.isin(cardiac)
    e = e.sort_values(["is_cardiac", "sev"], ascending=[False, True]).drop_duplicates("partner").head(max_partners)

    G = nx.Graph()
    G.add_node(name_of[focus], kind="focus")
    for _, r in e.iterrows():
        p = name_of.get(r.partner, r.partner)
        G.add_node(p, kind="cardiac" if r.is_cardiac else "drug")
        G.add_edge(name_of[focus], p, label=r.severity if isinstance(r.severity, str) else "")
    genes = dg[dg.drugbank_id == focus].copy()
    if "best_level" in genes:
        genes = genes.sort_values("best_level", na_position="last")
    for _, r in genes.head(6).iterrows():
        G.add_node(r.gene_symbol, kind="gene")
        G.add_edge(name_of[focus], r.gene_symbol,
                   label=r.best_level if isinstance(r.get("best_level"), str) else "")
        for _, v in gv[gv.gene_symbol == r.gene_symbol].iterrows():
            G.add_node(v.variant_node, kind="variant")
            G.add_edge(r.gene_symbol, v.variant_node, label="")

    pos = nx.spring_layout(G, seed=7, k=1.5)
    plt.figure(figsize=(13, 9))
    nx.draw_networkx_edges(G, pos, alpha=0.4, width=1.2)
    for kind, color in COLORS.items():
        nodes = [n for n, d in G.nodes(data=True) if d["kind"] == kind]
        nx.draw_networkx_nodes(G, pos, nodelist=nodes, node_color=color,
                               node_size=1400 if kind == "focus" else 600, alpha=0.9)
    label_pos = {n: (x, y - 0.075) for n, (x, y) in pos.items()}
    nx.draw_networkx_labels(G, label_pos, font_size=9, font_color="#1B1B1B", font_weight="bold",
                            bbox=dict(facecolor="white", edgecolor="none", alpha=0.8, pad=1.5))
    nx.draw_networkx_edge_labels(G, pos, edge_labels=nx.get_edge_attributes(G, "label"), font_size=7)
    handles = [plt.Line2D([0], [0], marker="o", color="w", markerfacecolor=c, markersize=12, label=k)
               for k, c in [("Query drug", COLORS["focus"]), ("Cardiac drug", COLORS["cardiac"]),
                            ("Other drug", COLORS["drug"]), ("Gene", COLORS["gene"]),
                            ("PGx variant", COLORS["variant"])]]
    plt.legend(handles=handles, loc="lower left", frameon=False)
    plt.title(f"Knowledge-graph neighbourhood: {name_of[focus]} "
              f"(edge labels = DDInter severity / ClinPGx evidence level)")
    plt.axis("off")
    out = path(f"{cfg['paths']['reports']}/figures/kg_{target.replace(' ', '_')}.png")
    plt.tight_layout()
    plt.savefig(out, dpi=200)
    print(f"  figure -> {out.relative_to(ROOT)}  ({G.number_of_nodes()} nodes, {G.number_of_edges()} edges)")


if __name__ == "__main__":
    main()
