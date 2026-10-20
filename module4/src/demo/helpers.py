"""Step 6 — Pure helper functions for the Streamlit demo (no Streamlit import, so they are unit-testable)."""
from __future__ import annotations

import json
import re
from pathlib import Path

import pandas as pd
import yaml

LEVEL_STYLE = {      # colour, soft background, icon, plain-language action
    "High": ("#c0362c", "rgba(192,54,44,0.12)", "🔴", "Avoid or change — review before prescribing"),
    "Moderate": ("#b8650a", "rgba(184,101,10,0.12)", "🟠", "Use with caution — monitor the patient"),
    "Low": ("#2f7d4f", "rgba(47,125,79,0.12)", "🟢", "No important interaction expected"),
    "None": ("#6b7280", "rgba(107,114,128,0.12)", "⚪", "Add at least two medicines to check"),
    "Info": ("#2563eb", "rgba(37,99,235,0.12)", "ℹ️", "For information"),
}
NOT_TESTED = "Not tested"


# ------------------------------------------------------------------ patients
def load_patients(path: str | Path) -> list[dict]:
    p = Path(path)
    if not p.exists():
        return []
    data = yaml.safe_load(p.read_text(encoding="utf-8")) or {}
    out = []
    for r in data.get("patients", []):
        r = dict(r)
        r.setdefault("current", [])
        r.setdefault("new", None)
        r["genotype"] = dict(r.get("genotype") or {})
        r.setdefault("conditions", [])
        out.append(r)
    return out


def patient_label(p: dict) -> str:
    return f"{p['name']} · {p['id']}"


# ------------------------------------------------------------------ genotypes
def genotype_choices(pgx: pd.DataFrame) -> dict[str, list[tuple[str, str | None]]]:
    """Per gene: list of (label shown in the dropdown, value passed to the engine).
    Star alleles -> diplotypes (*1/*1, *1/*2, *2/*2, *2/*3 ...); other variants -> none / one / two copies."""
    out: dict[str, list[tuple[str, str | None]]] = {}
    if pgx is None or pgx.empty:
        return out
    for gene, grp in pgx.groupby("gene", sort=False):
        alleles = [str(a) for a in grp.star_allele]
        opts: list[tuple[str, str | None]] = [(NOT_TESTED, None)]
        stars = [a for a in alleles if a.startswith("*")]
        others = [a for a in alleles if not a.startswith("*")]
        if stars:
            opts.append(("*1/*1 (no variant)", "*1/*1"))
            for a in stars:
                opts.append((f"*1/{a} (one copy)", f"*1/{a}"))
            for i, a in enumerate(stars):
                for b in stars[i:]:
                    opts.append((f"{a}/{b} (two copies)", f"{a}/{b}"))
        for a in others:
            opts += [(f"{a}: no variant", "wild-type"), (f"{a}: one copy", a), (f"{a}: two copies", f"{a}/{a}")]
        out[gene] = opts
    return out


def choice_index(options: list[tuple[str, str | None]], value: str | None) -> int:
    for i, (_, v) in enumerate(options):
        if v == value:
            return i
    return 0


def build_genotypes(selected: dict[str, str | None]) -> dict[str, str] | None:
    """Every tested gene is passed on (a normal result like *1/*1 stops the 'consider testing' message)."""
    gt = {g: v for g, v in selected.items() if v}
    return gt or None


def tested_genes(selected: dict[str, str | None]) -> list[str]:
    return [g for g, v in selected.items() if v]


# ------------------------------------------------------------------ medicines
def drug_options(names: dict[str, str], row: dict[str, int]) -> list[str]:
    """Named drugs in the graph, alphabetical (unnamed compounds and ID-only entries left out)."""
    seen, out = set(), []
    for d, n in names.items():
        n = str(n).strip()
        if d not in row or not n or n == d or n.lower() in seen:
            continue
        seen.add(n.lower())
        out.append(n)
    return sorted(out, key=str.lower)


def parse_free_text(text: str | None) -> list[str]:
    """'ezetimibe/simvastatin, metformin; losartan' -> ['ezetimibe/simvastatin', 'metformin', 'losartan']
    (combination products are split into components later by the engine)."""
    if not text:
        return []
    return [t.strip() for t in re.split(r"[,;\n]", text) if t.strip()]


def match_options(wanted: list[str], options: list[str]) -> list[str]:
    low = {o.lower(): o for o in options}
    return [low[w.lower()] for w in wanted if w and w.lower() in low]


def missing_from_options(wanted: list[str], options: list[str]) -> list[str]:
    low = {o.lower() for o in options}
    return [w for w in wanted if w and w.lower() not in low]


# ------------------------------------------------------------------ results
def pgx_table(alerts: list[dict]) -> pd.DataFrame:
    rows = []
    for a in alerts:
        fr = a.get("frequencies", {})
        rows.append({"Status": ("🔴 Carrier" if a["severity"] == "High" else "ℹ️ Not tested"),
                     "Drug": a["drug"], "Variant": a["variant"],
                     "Sri Lankan Tamil": fr.get("Sri Lankan Tamil"), "South Asian": fr.get("South Asian"),
                     "European": fr.get("European"), "Effect": a["effect"]})
    return pd.DataFrame(rows, columns=["Status", "Drug", "Variant", "Sri Lankan Tamil", "South Asian",
                                       "European", "Effect"])


def overall_reason(res: dict) -> str:
    """One line saying what drives the overall level (a drug pair or a genetic alert)."""
    rank = {"High": 3, "Moderate": 2, "Low": 1, "None": 0}
    pairs = res.get("pairs", [])
    top = pairs[0] if pairs else None
    carriers = [a for a in res.get("pgx", []) if a.get("severity") == "High"]
    if top and rank.get(top["level"], 0) >= rank.get(res.get("overall_level", "None"), 0):
        txt = f"Driven by {top['name_a']} + {top['name_b']} ({top['level']}, {top['level_source']})"
    elif carriers:
        txt = "Driven by genetic result: " + "; ".join(f"{a['drug']} — {a['variant'].split(' (')[0]}" for a in carriers)
    else:
        return ""
    if carriers and top and rank.get(top["level"], 0) >= rank.get(res.get("overall_level", "None"), 0):
        txt += f" · plus {len(carriers)} genetic alert(s)"
    return txt


def summary_counts(res: dict) -> dict:
    return {"medicines": len(res.get("drugs", [])), "pairs": len(res.get("pairs", [])),
            "flagged": res.get("n_flagged", 0),
            "genetic": sum(a["severity"] == "High" for a in res.get("pgx", [])),
            "ms": res.get("elapsed_ms", 0.0)}


def model_card(reports_dir: str | Path) -> pd.DataFrame:
    """Cardiac test-pair results table (baselines + GNN) from the Step 3/4 reports, if present."""
    rd = Path(reports_dir)
    rows = []
    base = rd / "baselines.json"
    gnn = rd / "gnn_results.json"
    bj = json.loads(base.read_text()) if base.exists() else {}
    gj = json.loads(gnn.read_text()) if gnn.exists() else {}
    for setting in ("warm", "cold"):
        for model, res in (bj.get(setting) or {}).items():
            c = res.get("cardiac", {}) if isinstance(res, dict) else {}
            if c:
                rows.append({"Setting": setting, "Model": model, "AUROC": c.get("auroc"), "F1": c.get("f1")})
        c = (gj.get(setting) or {}).get("cardiac", {})
        if c:
            rows.append({"Setting": setting, "Model": "GNN (GATv2)", "AUROC": c.get("auroc"), "F1": c.get("f1")})
    df = pd.DataFrame(rows, columns=["Setting", "Model", "AUROC", "F1"])
    if not df.empty:
        df[["AUROC", "F1"]] = df[["AUROC", "F1"]].astype(float).round(3)
    return df
