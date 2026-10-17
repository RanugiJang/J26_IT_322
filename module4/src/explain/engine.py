"""Step 5 — Explanation engine: risk + reason + safer alternative + pharmacogenomics.

For a patient's medication list it returns, for every drug pair:
  * risk probability and confidence (MC-dropout spread on the decoder)
  * risk level  High / Moderate / Low — from DDInter severity when the pair is
    curated, otherwise estimated from the model score + predicted mechanism
  * WHY, in plain language:
      - mechanism sentence (documented DrugBank text, or the model's predicted
        mechanism type filled in with the drug names)
      - shared pharmacogenes (e.g. both drugs metabolised by CYP3A4)
      - attention evidence: the graph neighbours the GAT weighted most when it
        built each drug's representation, preferring ones linked to the other drug
  * safer alternative: drugs from the same therapeutic class (ATC level 4, then 3)
    with the lowest predicted risk against every other medicine on the list
Plus pharmacogenomic alerts per drug (patient genotype if given; otherwise a
"consider testing" note with South Asian / Sri Lankan Tamil vs European allele
frequencies).

All embeddings and attention weights are computed ONCE at start-up, so each
check takes milliseconds (NFR: < 3 s).
"""
from __future__ import annotations

import itertools
import re
import time
from dataclasses import dataclass, field

import numpy as np
import pandas as pd
import torch

from ..data.common import ROOT, load_config
from ..kg.vocab import lookup
from ..model.gnn import build_model
from ..model.graph import (DDI_UNKNOWN, DG_PK, GD_PK, N_MECH, load_graph_inputs, message_graph)

SEVERITY_LEVEL = {"Major": "High", "Moderate": "Moderate", "Minor": "Low"}
HIGH_RISK_TERMS = ("anticoagulant", "bleed", "hemorrhag", "haemorrhag", "qtc", "arrhythm", "bradycard",
                   "hypotens", "hyperkal", "cardiotox", "av block", "rhabdomyolysis", "myopath",
                   "nephrotox", "hypoglyc", "serotonin", "torsade", "heart failure")
NARROW_INDEX = {"warfarin", "digoxin", "amiodarone", "dofetilide", "flecainide", "phenytoin", "lithium",
                "theophylline", "cyclosporine", "tacrolimus", "carbamazepine", "quinidine", "dabigatran",
                "rivaroxaban", "apixaban", "clopidogrel", "ticagrelor", "sotalol", "propafenone"}
LEVEL_RANK = {"High": 3, "Moderate": 2, "Low": 1, "None": 0}


@dataclass
class PairResult:
    a: str
    b: str
    name_a: str
    name_b: str
    risk: float
    uncertainty: float
    level: str
    level_source: str
    documented: str | None
    severity: str | None
    mechanism: str
    mechanism_source: str
    mechanism_confidence: float
    shared_genes: list[str] = field(default_factory=list)
    attention_evidence: list[str] = field(default_factory=list)
    alternatives: list[dict] = field(default_factory=list)
    model_used: str = "warm"
    replace: str | None = None

    def as_dict(self) -> dict:
        return self.__dict__.copy()


def _title(name: str) -> str:
    return name[:1].upper() + name[1:] if isinstance(name, str) else str(name)


class DDIEngine:
    def __init__(self, cfg: dict | None = None):
        t0 = time.time()
        self.cfg = cfg or load_config()
        inter = ROOT / self.cfg["paths"]["interim"]
        proc = ROOT / self.cfg["paths"]["processed"]
        raw = ROOT / self.cfg["paths"]["raw"]
        self.gi = load_graph_inputs(self.cfg)
        self.row = self.gi.drug_row

        nodes = pd.read_csv(inter / "nodes_drug.csv")
        self.name = dict(zip(nodes.drugbank_id, nodes.name.astype(str)))
        self.atc = dict(zip(nodes.drugbank_id, nodes.atc_codes.fillna("").astype(str)))
        self.is_cardiac = dict(zip(nodes.drugbank_id, nodes.is_cardiac.astype(bool)))
        idx = pd.read_csv(inter / "name_index.csv")
        self.index = dict(zip(idx.name_normalized.astype(str), idx.drugbank_id))

        lm = raw / "tdc_drugbank" / "ddi_label_map.csv"
        self.templates = (dict(zip(pd.read_csv(lm).Y.astype(int), pd.read_csv(lm).template.astype(str)))
                          if lm.exists() else {})

        # every documented interaction (all splits) — the deployed knowledge graph
        pos = pd.read_csv(proc / "pairs_warm.csv.gz")
        pos = pos[pos.label == 1].reset_index(drop=True)
        self.known = {(r.a, r.b): r for r in pos.itertuples(index=False)}
        self.partners: dict[str, set] = {}
        for x, y in zip(pos.a, pos.b):
            self.partners.setdefault(x, set()).add(y)
            self.partners.setdefault(y, set()).add(x)
        self.ei, self.et = message_graph(self.gi, pos)
        self.n_static = self.gi.static_ei.shape[1]
        deg = np.bincount(np.concatenate([pos.a.map(self.row), pos.b.map(self.row)]), minlength=self.gi.n_drugs)
        self.has_history = deg > 0

        # pharmacogenomics tables
        self.dg = pd.read_csv(inter / "edges_drug_gene.csv")
        self.genes_of = self.dg.groupby("drugbank_id").gene_symbol.apply(lambda s: set(map(str, s))).to_dict()
        self.var = pd.read_csv(inter / "nodes_variant.csv")
        pgx_path = ROOT / self.cfg["population"]["variants_file"]
        self.pgx = pd.read_csv(pgx_path) if pgx_path.exists() else pd.DataFrame()

        # models: warm (drugs with interaction history) and cold (drugs without)
        self.models, self.H, self.thr = {}, {}, {}
        self.attn = None
        for setting in ("warm", "cold"):
            ck_path = ROOT / "models" / f"gnn_{setting}.pt"
            if not ck_path.exists():
                continue
            ck = torch.load(ck_path, map_location="cpu", weights_only=False)
            m = build_model(self.gi, ck["gnn_cfg"])
            m.load_state_dict(ck["state"])
            m.eval()
            with torch.no_grad():
                h, attns = m.encode(self.gi, self.ei, self.et, return_attention=(setting == "warm"))
            self.models[setting], self.H[setting], self.thr[setting] = m, h, float(ck.get("threshold", 0.5))
            if attns:
                aei, alpha = attns[-1]
                self.attn = (aei, alpha.mean(dim=1))
        if not self.models:
            raise FileNotFoundError("No trained GNN found in models/ — run python -m src.model.train_gnn first")
        self.load_seconds = time.time() - t0

    # ------------------------------------------------------------------ names
    def resolve(self, text: str) -> list[str]:
        """Drug name / brand / combination ('ezetimibe / simvastatin') -> drug IDs in the graph."""
        parts = [p.strip() for p in re.split(r"\s*(?:/|\+| and )\s*", str(text)) if p.strip()]
        out = []
        for p in parts or [text]:
            d = lookup(p, self.index)
            if d is not None and d in self.row:
                out.append(d)
        return out

    def display(self, d: str) -> str:
        return _title(self.name.get(d, d))

    # ------------------------------------------------------------------ scoring
    def _setting_for(self, a: str, b: str) -> str:
        warm_ok = self.has_history[self.row[a]] and self.has_history[self.row[b]]
        return "warm" if (warm_ok and "warm" in self.models) or "cold" not in self.models else "cold"

    @torch.no_grad()
    def score(self, a: str, b: str, mc: int | None = None) -> tuple[float, float, str]:
        s = self._setting_for(a, b)
        m, h = self.models[s], self.H[s]
        ia, ib = torch.tensor([self.row[a]]), torch.tensor([self.row[b]])
        p = torch.sigmoid(m.score(h, ia, ib)).item()
        n = mc if mc is not None else self.cfg["gnn"].get("mc_samples", 20)
        if n and n > 1:                                    # MC dropout on the decoder → spread = uncertainty
            m.link.train()
            runs = torch.stack([torch.sigmoid(m.score(h, ia, ib)) for _ in range(n)])
            m.link.eval()
            return p, float(runs.std()), s
        return p, 0.0, s

    @torch.no_grad()
    def predicted_mechanism(self, a: str, b: str, setting: str) -> tuple[str, float]:
        m, h = self.models[setting], self.H[setting]
        ia, ib = self.row[a], self.row[b]
        lab = torch.softmax(m.mechanism(h, torch.tensor([ia, ib]), torch.tensor([ib, ia])), dim=-1)
        best = torch.argmax(lab.flatten()).item()
        direction, cls = divmod(best, N_MECH)
        src, tgt = (a, b) if direction == 0 else (b, a)
        return self.fill(cls + 1, src, tgt), float(lab.flatten()[best])

    def fill(self, mech_id: int, src: str, tgt: str) -> str:
        """Fill a DrugBank template for a pair stored as (ID1=src, ID2=tgt).
        In the TDC DrugBank file the template's #Drug1 refers to ID2 and #Drug2 to ID1
        (verified on warfarin+aspirin, digoxin+amiodarone, simvastatin+clarithromycin)."""
        t = self.templates.get(int(mech_id), "#Drug1 may interact with #Drug2.")
        return t.replace("#Drug1", self.display(tgt)).replace("#Drug2", self.display(src))

    # ------------------------------------------------------------------ explanations
    def shared_genes(self, a: str, b: str) -> list[str]:
        shared = [g for g in self.genes_of.get(a, set()) & self.genes_of.get(b, set())
                  if re.fullmatch(r"[A-Z0-9][A-Z0-9\-]{1,14}", g)]
        shared.sort(key=lambda g: (not g.startswith(("CYP", "ABC", "SLC", "VKORC", "UGT", "NAT")), g))
        pk = set(self.dg[(self.dg.drugbank_id.isin([a, b])) & (self.dg.pk == True)].gene_symbol.astype(str))  # noqa: E712
        return [f"{g} (metabolism/transport)" if g in pk else g for g in shared][:6]

    def attention_evidence(self, a: str, b: str, k: int = 3) -> list[str]:
        """Top graph neighbours by GAT attention for each drug; neighbours that also connect
        to the other drug (A — N — B paths) are listed first because they explain the pair."""
        if self.attn is None:
            return []
        aei, w = self.attn
        out = []
        for d, other in ((a, b), (b, a)):
            node = self.row[d]
            idx = torch.nonzero((aei[1] == node) & (aei[0] != node)).flatten()
            if len(idx) == 0:
                continue
            n_in = len(idx)
            idx = idx[torch.argsort(w[idx], descending=True)][:200]
            other_partners = self.partners.get(other, set())
            other_genes = self.genes_of.get(other, set())
            picked = []
            for e in idx.tolist():
                kind, label = self.gi.node_label(int(aei[0, e]))
                et = int(self.et[e]) if e < len(self.et) else -1
                if kind == "drug":
                    if self.name.get(label, label) == label:      # unnamed compound -> not useful to a clinician
                        continue
                    path = label in other_partners
                    txt = f"{self.display(d)} ← {self.display(label)}"
                    if path:
                        txt += f" (which also interacts with {self.display(other)})"
                elif kind == "gene":
                    path = label in other_genes
                    txt = f"{self.display(d)} ← gene {label}{' (metabolism/transport)' if et in (DG_PK, GD_PK) else ''}"
                    if path:
                        txt += f", shared with {self.display(other)}"
                else:
                    continue
                rel = float(w[e]) * n_in                          # 1.0 = average neighbour
                picked.append((0 if path else 1, -rel, txt, rel))
            picked.sort()
            out += [f"{t} [attention {rel:.1f}× average]" for _, _, t, rel in picked[:k]]
        return out

    # ------------------------------------------------------------------ risk level
    def risk_level(self, p: float, setting: str, mechanism: str, severity: str | None, a: str, b: str) -> tuple[str, str]:
        if isinstance(severity, str) and severity in SEVERITY_LEVEL:
            return SEVERITY_LEVEL[severity], "DDInter (curated severity)"
        thr = self.thr.get(setting, 0.5)
        mech = mechanism.lower()
        narrow = {self.name.get(a, "").lower(), self.name.get(b, "").lower()} & NARROW_INDEX
        high_mech = any(t in mech for t in HIGH_RISK_TERMS) or (narrow and "serum concentration" in mech and "increase" in mech)
        if p >= max(thr, 0.8) and high_mech:
            return "High", "model-estimated"
        if p >= thr:
            return "Moderate", "model-estimated"
        return "Low", "model-estimated"

    # ------------------------------------------------------------------ alternatives
    def alternatives(self, replace: str, others: list[str], current_level: str = "High", top: int = 2) -> list[dict]:
        codes = [c for c in self.atc.get(replace, "").split(";") if c]
        cardiac = [c for c in codes if c.startswith(tuple(self.cfg["cardiac_scope"]["atc_prefixes"]))]
        codes = cardiac or codes[:1]            # e.g. aspirin -> B01AC (antiplatelet), not A01AD (dental)
        if not codes:
            return []
        cands = []
        for level in (5, 4):                                   # ATC level 4 (e.g. B01AC), then level 3 (B01A)
            pref = {c[:level] for c in codes}
            cands = [d for d, atc in self.atc.items()
                     if d != replace and d in self.row and d not in others
                     and any(x[:level] in pref for x in atc.split(";") if x)
                     and "/" not in self.name.get(d, "") and self.has_history[self.row[d]]]
            if len(cands) >= 2:
                break
        scored = []
        for c in cands:
            worst, worst_lvl = 0.0, "Low"
            for o in others:
                key = tuple(sorted((c, o)))
                k = self.known.get(key)
                p, _, s = self.score(c, o, mc=0)
                sev = getattr(k, "severity", None) if k is not None else None
                lvl, _ = self.risk_level(p, s, "", sev if isinstance(sev, str) else None, c, o)
                if LEVEL_RANK[lvl] > LEVEL_RANK[worst_lvl] or (lvl == worst_lvl and p > worst):
                    worst, worst_lvl = p, lvl
            scored.append((LEVEL_RANK[worst_lvl], worst, c, worst_lvl))
        scored.sort()
        return [{"drug": self.display(c), "id": c, "worst_risk": round(p, 3), "worst_level": lvl,
                 "atc": self.atc.get(c, "")} for rank, p, c, lvl in scored
                if rank < LEVEL_RANK[current_level] and self.name.get(c, c) != c][:top]

    # ------------------------------------------------------------------ pharmacogenomics
    def pgx_alerts(self, drug: str, genotypes: dict[str, str] | None) -> list[dict]:
        if self.pgx.empty:
            return []
        name = self.name.get(drug, "").lower()
        rows = self.pgx[self.pgx.cardiac_drugs.astype(str).str.lower().str.split(";").apply(lambda xs: name in xs)]
        alerts = []
        for gene, grp in rows.groupby("gene"):
            freq = self.var[self.var.gene == gene]
            gt = (genotypes or {}).get(gene)
            carried = []
            if gt:
                tokens = {t.strip() for t in re.split(r"[/|,\s]+", gt) if t.strip()}
                carried = [r for r in grp.itertuples() if str(r.star_allele) in tokens or str(r.star_allele) in gt]
            for r in (carried if gt else grp.itertuples()):
                f = freq[freq.rsid == r.rsid]
                fr = {k: (float(f[c].iloc[0]) if c in f and len(f) and pd.notna(f[c].iloc[0]) else None)
                      for k, c in (("South Asian", "af_sas"), ("Sri Lankan Tamil", "af_stu"), ("European", "af_nfe"))}
                alerts.append({
                    "drug": self.display(drug), "gene": gene, "variant": f"{gene} {r.star_allele} ({r.rsid})",
                    "status": "patient carries this variant" if gt else "genotype not provided — consider testing",
                    "effect": r.clinical_effect, "frequencies": fr, "severity": "High" if gt else "Info"})
        return alerts

    # ------------------------------------------------------------------ main entry point
    def check(self, current: list[str], new: str | None = None, genotypes: dict[str, str] | None = None,
              with_alternatives: bool = True) -> dict:
        t0 = time.time()
        names = list(current) + ([new] if new else [])
        resolved, unknown = {}, []
        for n in names:
            ids = self.resolve(n)
            if ids:
                for d in ids:
                    resolved[d] = n
            else:
                unknown.append(n)
        drugs = list(resolved)
        new_ids = set(self.resolve(new)) if new else set()

        pairs = []
        for a, b in itertools.combinations(drugs, 2):
            if a == b:
                continue
            key = tuple(sorted((a, b)))
            k = self.known.get(key)
            p, unc, setting = self.score(a, b)
            if k is not None and getattr(k, "in_drugbank", False) and 1 <= int(k.mechanism_id) <= N_MECH:
                mech, msrc, mconf = self.fill(int(k.mechanism_id), k.mech_src, k.mech_tgt), "DrugBank (documented)", 1.0
            else:
                mech, mconf = self.predicted_mechanism(a, b, setting)
                msrc = "model-predicted mechanism type"
            sev = k.severity if k is not None and isinstance(getattr(k, "severity", None), str) else None
            level, lsrc = self.risk_level(p, setting, mech, sev, a, b)
            documented = None
            if k is not None:
                documented = " + ".join(s for s, f in (("DrugBank", k.in_drugbank), ("DDInter", k.in_ddinter)) if f)
            pr = PairResult(a=a, b=b, name_a=self.display(a), name_b=self.display(b), risk=round(p, 3),
                            uncertainty=round(unc, 3), level=level, level_source=lsrc, documented=documented,
                            severity=sev, mechanism=mech, mechanism_source=msrc, mechanism_confidence=round(mconf, 3),
                            shared_genes=self.shared_genes(a, b), attention_evidence=self.attention_evidence(a, b),
                            model_used=setting)
            if with_alternatives and level in ("High", "Moderate"):
                targets = [d for d in (a, b) if d in new_ids] or [b, a]
                for t in targets[:1]:
                    pr.alternatives = self.alternatives(t, [d for d in drugs if d != t], level)
                    pr.replace = self.display(t)
            pairs.append(pr)
        pairs.sort(key=lambda r: (-LEVEL_RANK[r.level], -r.risk))

        pgx = [al for d in drugs for al in self.pgx_alerts(d, genotypes)]
        overall = pairs[0].level if pairs else "None"
        if any(al["severity"] == "High" for al in pgx) and LEVEL_RANK[overall] < 3:
            overall = "High"
        return {"overall_level": overall, "drugs": [self.display(d) for d in drugs], "unknown": unknown,
                "pairs": [p.as_dict() for p in pairs], "pgx": pgx,
                "n_flagged": sum(p.level in ("High", "Moderate") for p in pairs),
                "elapsed_ms": round((time.time() - t0) * 1000, 1)}
