"""Step 4 — Graph attention network for drug–drug interaction prediction.

Encoder: GATv2 layers over the drug–gene–variant knowledge graph. Each edge type
(e.g. "increases anticoagulant activity", "drug→gene PK link") has a learned
vector that feeds the attention score, so the model learns WHICH kinds of
neighbours matter. The attention weights are what Step 5 turns into explanations.

Heads:
  * link head       — probability that drugs A and B interact (symmetric in A, B)
  * mechanism head  — which of the 86 DrugBank mechanism types (directional: A acts on B)

Direct feature path: the decoder sees graph embedding AND each drug's own input
encoding, so new drugs with no interaction history fall back on chemistry/genes.

Uncertainty: Monte-Carlo dropout (dropout kept on at prediction time, N passes)
gives a mean risk and a spread → confidence shown to the clinician.
"""
from __future__ import annotations

import torch
import torch.nn.functional as F
from torch import nn
from torch_geometric.nn import GATv2Conv

from .graph import N_EDGE_TYPES, N_MECH, GraphInputs


class DDIGAT(nn.Module):
    def __init__(self, drug_in: int, var_in: int, n_genes: int, n_vars: int, hidden: int = 128,
                 heads: int = 4, layers: int = 2, edge_dim: int = 16, dropout: float = 0.2):
        super().__init__()
        self.dropout = dropout
        self.drug_enc = nn.Sequential(nn.Linear(drug_in, hidden), nn.ReLU(), nn.Dropout(dropout),
                                      nn.Linear(hidden, hidden))
        self.gene_emb = nn.Embedding(n_genes, hidden)
        self.var_enc = nn.Linear(var_in, hidden)
        self.var_emb = nn.Embedding(max(n_vars, 1), hidden)
        self.type_emb = nn.Embedding(3, hidden)
        self.edge_emb = nn.Embedding(N_EDGE_TYPES, edge_dim)
        self.convs = nn.ModuleList([
            GATv2Conv(hidden, hidden // heads, heads=heads, edge_dim=edge_dim, dropout=dropout,
                      add_self_loops=True, fill_value="mean") for _ in range(layers)])
        self.norms = nn.ModuleList([nn.LayerNorm(hidden) for _ in range(layers)])
        out = 2 * hidden   # graph embedding + direct feature path
        self.link = nn.Sequential(nn.Linear(3 * out, hidden), nn.ReLU(), nn.Dropout(dropout), nn.Linear(hidden, 1))
        self.mech = nn.Sequential(nn.Linear(2 * out, hidden), nn.ReLU(), nn.Dropout(dropout), nn.Linear(hidden, N_MECH))

    def node_inputs(self, gi: GraphInputs) -> torch.Tensor:
        d = self.drug_enc(gi.x_drug) + self.type_emb.weight[0]
        g = self.gene_emb.weight + self.type_emb.weight[1]
        v = self.var_enc(gi.x_var) + self.var_emb.weight[: gi.n_vars] + self.type_emb.weight[2]
        return torch.cat([d, g, v], dim=0)

    def encode(self, gi: GraphInputs, ei: torch.Tensor, et: torch.Tensor, return_attention: bool = False):
        h0 = self.node_inputs(gi)
        h = h0
        ea = self.edge_emb(et)
        attns = []
        for conv, norm in zip(self.convs, self.norms):
            if return_attention:
                out, (aei, alpha) = conv(h, ei, edge_attr=ea, return_attention_weights=True)
                attns.append((aei, alpha.detach()))
            else:
                out = conv(h, ei, edge_attr=ea)
            h = norm(h + F.elu(out))
            h = F.dropout(h, self.dropout, self.training)
        # direct feature path: the decoder always sees each drug's own features too, so a drug
        # with no known interactions (new drug) still gets a sensible prediction
        return torch.cat([h, h0], dim=-1), attns

    def score(self, h: torch.Tensor, ia: torch.Tensor, ib: torch.Tensor) -> torch.Tensor:
        ha, hb = h[ia], h[ib]
        return self.link(torch.cat([ha * hb, (ha - hb).abs(), ha + hb], dim=-1)).squeeze(-1)

    def mechanism(self, h: torch.Tensor, src: torch.Tensor, tgt: torch.Tensor) -> torch.Tensor:
        return self.mech(torch.cat([h[src], h[tgt]], dim=-1))


def build_model(gi: GraphInputs, mc: dict) -> DDIGAT:
    return DDIGAT(drug_in=gi.x_drug.shape[1], var_in=gi.x_var.shape[1], n_genes=gi.n_genes,
                  n_vars=gi.n_vars, hidden=mc["hidden"], heads=mc["heads"], layers=mc["layers"],
                  edge_dim=mc["edge_dim"], dropout=mc["dropout"])


@torch.no_grad()
def predict(model: DDIGAT, gi: GraphInputs, ei, et, ia, ib, mc_samples: int = 0, batch: int = 200_000):
    """Interaction probability for pairs (ia, ib). With mc_samples > 0 also returns the MC-dropout std."""
    def once(train_mode: bool) -> torch.Tensor:
        model.train(train_mode)
        h, _ = model.encode(gi, ei, et)
        return torch.cat([torch.sigmoid(model.score(h, ia[i:i + batch], ib[i:i + batch]))
                          for i in range(0, len(ia), batch)])
    if mc_samples <= 0:
        p = once(False)
        model.eval()
        return p, None
    runs = torch.stack([once(True) for _ in range(mc_samples)])
    model.eval()
    return runs.mean(0), runs.std(0)
