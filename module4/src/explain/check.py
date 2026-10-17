"""Step 5 — Command-line interaction checker + slide-ready example report.

Examples:
  python -m src.explain.check --current warfarin amiodarone --new aspirin --genotype CYP2C9=*1/*3
  python -m src.explain.check --examples          # writes reports/explanation_examples.md (+ .json)
"""
from __future__ import annotations

import argparse
import json

from ..data.common import load_config, path
from .engine import DDIEngine

ICON = {"High": "🔴", "Moderate": "🟠", "Low": "🟢", "None": "⚪", "Info": "ℹ️"}

EXAMPLES = [
    {"title": "Anticoagulant + antiplatelet", "current": ["warfarin"], "new": "aspirin",
     "genotypes": {"CYP2C9": "*1/*3", "VKORC1": "-1639G>A"}},
    {"title": "Anticoagulant + antiarrhythmic", "current": ["warfarin"], "new": "amiodarone", "genotypes": None},
    {"title": "Antiarrhythmic + cardiac glycoside", "current": ["digoxin"], "new": "amiodarone", "genotypes": None},
    {"title": "Antiplatelet + proton-pump inhibitor (CYP2C19)", "current": ["clopidogrel"], "new": "omeprazole",
     "genotypes": {"CYP2C19": "*2/*2"}},
    {"title": "Statin + macrolide antibiotic", "current": ["simvastatin"], "new": "clarithromycin", "genotypes": None},
    {"title": "Beta-blocker + calcium-channel blocker", "current": ["metoprolol"], "new": "verapamil", "genotypes": None},
    {"title": "Polypharmacy: statin + CCB + new antiplatelet", "current": ["atorvastatin", "amlodipine"],
     "new": "ticagrelor", "genotypes": None},
]


def render(res: dict, title: str | None = None) -> str:
    lines = []
    if title:
        lines.append(f"## {title}")
    lines.append(f"**Medications:** {', '.join(res['drugs'])}  ")
    if res["unknown"]:
        lines.append(f"**Not recognised:** {', '.join(res['unknown'])}  ")
    lines.append(f"**Overall risk:** {ICON.get(res['overall_level'], '')} {res['overall_level']} · "
                 f"{res['n_flagged']} flagged pair(s) · "
                 f"{sum(g['severity'] == 'High' for g in res['pgx'])} genetic alert(s) · checked in {res['elapsed_ms']:.0f} ms")
    lines.append("")
    for p in res["pairs"]:
        lines.append(f"### {ICON[p['level']]} {p['name_a']} + {p['name_b']} — {p['level']} "
                     f"({p['level_source']})")
        lines.append(f"- **Interaction probability:** {p['risk']:.2f} ± {p['uncertainty']:.2f} "
                     f"(model: {p['model_used']})")
        if p["documented"]:
            lines.append(f"- **Documented in:** {p['documented']}" + (f" · severity {p['severity']}" if p["severity"] else ""))
        lines.append(f"- **Why:** {p['mechanism']} _({p['mechanism_source']}"
                     + (f", confidence {p['mechanism_confidence']:.0%}" if p["mechanism_source"].startswith("model") else "")
                     + ")_")
        if p["shared_genes"]:
            lines.append(f"- **Shared pharmacogenes:** {', '.join(p['shared_genes'])}")
        if p["attention_evidence"]:
            lines.append("- **Model evidence (graph attention):**")
            lines += [f"  - {e}" for e in p["attention_evidence"]]
        if p["level"] in ("High", "Moderate") and p.get("replace"):
            if p["alternatives"]:
                alt = "; ".join(f"{a['drug']} ({a['worst_level']} risk with the other medicines)" for a in p["alternatives"])
                lines.append(f"- **Lower-risk alternative to {p['replace']}:** {alt}")
            else:
                lines.append(f"- **Alternative:** no lower-risk option in the same class as {p['replace']} — "
                             f"if co-prescribed, monitor closely")
        lines.append("")
    if res["pgx"]:
        lines.append("### 🧬 Pharmacogenomic alerts")
        for g in res["pgx"]:
            fr = g["frequencies"]
            ftxt = ", ".join(f"{k} {v:.1%}" for k, v in fr.items() if v is not None)
            lines.append(f"- {ICON.get(g['severity'], '')} **{g['drug']} — {g['variant']}**: {g['effect']} "
                         f"_({g['status']})_" + (f" · allele frequency: {ftxt}" if ftxt else ""))
        lines.append("")
    lines.append("> Decision support only — final prescribing decisions rest with the clinician.")
    return "\n".join(lines)


def parse_genotypes(items: list[str] | None) -> dict[str, str] | None:
    if not items:
        return None
    out = {}
    for it in items:
        if "=" in it:
            g, v = it.split("=", 1)
            out[g.strip().upper()] = v.strip()
    return out


def main() -> None:
    ap = argparse.ArgumentParser(description="Cardiac drug interaction checker")
    ap.add_argument("--current", nargs="*", default=[], help="current medications")
    ap.add_argument("--new", default=None, help="newly prescribed medication")
    ap.add_argument("--genotype", nargs="*", help="e.g. CYP2C9=*1/*3 VKORC1=-1639G>A")
    ap.add_argument("--examples", action="store_true", help="run the built-in example cases")
    ap.add_argument("--json", action="store_true", help="print raw JSON")
    args = ap.parse_args()

    cfg = load_config()
    eng = DDIEngine(cfg)
    print(f"engine ready in {eng.load_seconds:.1f}s (models: {', '.join(eng.models)})\n")

    if args.examples:
        md = ["# Module 4 — Explanation examples", "",
              "Generated by `python -m src.explain.check --examples`. Risk levels come from DDInter when the pair is",
              "curated; otherwise they are model-estimated from the GNN score and the predicted mechanism.", ""]
        dump, times = [], []
        for ex in EXAMPLES:
            res = eng.check(ex["current"], ex["new"], ex["genotypes"])
            times.append(res["elapsed_ms"])
            md += [render(res, ex["title"]), "", "---", ""]
            dump.append({"case": ex, "result": res})
            print(f"  {ex['title']:<48} overall {res['overall_level']:<8} {res['elapsed_ms']:.0f} ms")
        md.insert(4, f"_Engine start-up {eng.load_seconds:.1f}s · per-check time: median {sorted(times)[len(times)//2]:.0f} ms, "
                     f"max {max(times):.0f} ms (requirement: < 3,000 ms)_\n")
        path(f"{cfg['paths']['reports']}/explanation_examples.md").write_text("\n".join(md), encoding="utf-8")
        path(f"{cfg['paths']['reports']}/explanation_examples.json").write_text(json.dumps(dump, indent=2, default=str))
        print("\n  report -> reports/explanation_examples.md")
        return

    if not args.current and not args.new:
        ap.error("give --current and/or --new, or --examples")
    res = eng.check(args.current, args.new, parse_genotypes(args.genotype))
    print(json.dumps(res, indent=2, default=str) if args.json else render(res))


if __name__ == "__main__":
    main()
