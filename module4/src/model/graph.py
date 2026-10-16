"""Graph tensors for the GNN.

One graph with three node types, stored in a single index space:
  [0, D)            drugs      — features from Step 3b (structure, ATC, pharmacogenes)
  [D, D+G)          genes      — learned embedding
  [D+G, D+G+V)      variants   — population allele frequencies (gnomAD SAS / STU / NFE / ...)

Edge types (each gets its own learned vector, so attention can weigh them differently):
  1..86   drug–drug, DrugBank mechanism type (from TDC labels)
  87      drug–drug, DDInter-only (mechanism unknown)
  88 / 89 drug→gene (PK link / other), 90 / 91 gene→drug
  92 / 93 gene→variant, variant→gene

Only TRAINING interactions are ever used as drug–drug message edges (no label leakage).
"""
from __future__ import annotations

from dataclasses import dataclass, field

import numpy as np
import pandas as pd
import torch

from ..data.common import ROOT
from .features import load_features

N_MECH = 86
DDI_UNKNOWN = 87
DG_PK, DG_OTHER, GD_PK, GD_OTHER, GV, VG = 88, 89, 90, 91, 92, 93
N_EDGE_TYPES = 94
VAR_COLS = ["af_global", "af_sas", "af_stu", "af_itu", "af_gih", "af_nfe", "af_ceu", "af_gbr", "af_eas", "af_afr"]


@dataclass
class GraphInputs:
    x_drug: torch.Tensor
    x_var: torch.Tensor
    n_drugs: int
    n_genes: int
    n_vars: int
    drug_row: dict[str, int]
    drug_ids: list[str]
    gene_symbols: list[str]
    variant_names: list[str]
    static_ei: torch.Tensor          # drug–gene + gene–variant edges, both directions
    static_et: torch.Tensor
    feature_names: list[str] = field(default_factory=list)

    @property
    def n_nodes(self) -> int:
        return self.n_drugs + self.n_genes + self.n_vars

    def node_label(self, i: int) -> tuple[str, str]:
        """(type, name) of a node index — used by the explanation layer."""
        if i < self.n_drugs:
            return "drug", self.drug_ids[i]
        if i < self.n_drugs + self.n_genes:
            return "gene", self.gene_symbols[i - self.n_drugs]
        return "variant", self.variant_names[i - self.n_drugs - self.n_genes]


def load_graph_inputs(cfg: dict) -> GraphInputs:
    inter = ROOT / cfg["paths"]["interim"]
    X, row, names = load_features(cfg)
    drug_ids = [None] * len(row)
    for d, i in row.items():
        drug_ids[i] = d

    genes = pd.read_csv(inter / "nodes_gene.csv").symbol.astype(str).tolist()
    var = pd.read_csv(inter / "nodes_variant.csv")
    dg = pd.read_csv(inter / "edges_drug_gene.csv")
    gv = pd.read_csv(inter / "edges_gene_variant.csv")

    D, G, V = len(drug_ids), len(genes), len(var)
    g_idx = {g: D + j for j, g in enumerate(genes)}
    v_idx = {v: D + G + k for k, v in enumerate(var.variant_node)}

    src, dst, typ = [], [], []
    for _, r in dg.iterrows():
        d, g = row.get(r.drugbank_id), g_idx.get(str(r.gene_symbol))
        if d is None or g is None:
            continue
        pk = bool(r.get("pk")) if not pd.isna(r.get("pk")) else False
        src += [d, g]
        dst += [g, d]
        typ += [DG_PK if pk else DG_OTHER, GD_PK if pk else GD_OTHER]
    for _, r in gv.iterrows():
        g, v = g_idx.get(str(r.gene_symbol)), v_idx.get(r.variant_node)
        if g is None or v is None:
            continue
        src += [g, v]
        dst += [v, g]
        typ += [GV, VG]

    xv = np.zeros((V, len(VAR_COLS)), dtype=np.float32)
    for j, c in enumerate(VAR_COLS):
        if c in var:
            xv[:, j] = var[c].fillna(0).to_numpy(dtype=np.float32)

    return GraphInputs(
        x_drug=torch.tensor(X, dtype=torch.float32), x_var=torch.tensor(xv),
        n_drugs=D, n_genes=G, n_vars=V, drug_row=row, drug_ids=drug_ids,
        gene_symbols=genes, variant_names=var.variant_node.tolist(),
        static_ei=torch.tensor([src, dst], dtype=torch.long).reshape(2, -1),
        static_et=torch.tensor(typ, dtype=torch.long), feature_names=names)


def ddi_message_edges(pos: pd.DataFrame, row: dict[str, int]) -> tuple[torch.Tensor, torch.Tensor]:
    """Positive pairs -> drug–drug message edges in both directions, typed by mechanism."""
    a = torch.tensor(pos.a.map(row).to_numpy(), dtype=torch.long)
    b = torch.tensor(pos.b.map(row).to_numpy(), dtype=torch.long)
    m = pos.mechanism_id.fillna(-1).to_numpy().astype(int)
    t = torch.tensor(np.where((m >= 1) & (m <= N_MECH), m, DDI_UNKNOWN), dtype=torch.long)
    return torch.stack([torch.cat([a, b]), torch.cat([b, a])]), torch.cat([t, t])


def message_graph(gi: GraphInputs, pos: pd.DataFrame) -> tuple[torch.Tensor, torch.Tensor]:
    ei, et = ddi_message_edges(pos, gi.drug_row)
    return torch.cat([gi.static_ei, ei], dim=1), torch.cat([gi.static_et, et])
