"""Response-time benchmark for the interaction checker (non-functional requirement: < 3,000 ms per check).

Runs many random medicine lists (2–10 medicines, mostly cardiac, half with a genotype) through the
same DDIEngine.check() call the demo uses, and reports median / 95th percentile / worst case.

    python -m src.explain.benchmark              # 200 cases (default)
    python -m src.explain.benchmark --cases 500

Outputs: reports/response_time.md, reports/response_time.json, reports/figures/response_time.png
"""
from __future__ import annotations

import argparse
import json
import platform
import random
import time

import numpy as np

from ..data.common import load_config, path
from .engine import DDIEngine

REQUIREMENT_MS = 3000.0
SIZES = [2, 3, 4, 5, 6, 8, 10]          # medicines per patient (polypharmacy up to 10)


def drug_pools(eng: DDIEngine) -> tuple[list[str], list[str]]:
    """Named drugs with interaction history, split into cardiac and all."""
    named = [d for d in eng.row if eng.name.get(d, d) != d and eng.has_history[eng.row[d]]]
    cardiac = [d for d in named if eng.is_cardiac.get(d, False)]
    return cardiac, named


def make_cases(eng: DDIEngine, n: int, seed: int = 42, cardiac_share: float = 0.7) -> list[dict]:
    rng = random.Random(seed)
    cardiac, named = drug_pools(eng)
    genes = {}
    if not eng.pgx.empty:
        for g, grp in eng.pgx.groupby("gene"):
            genes[g] = [str(a) for a in grp.star_allele]
    cases = []
    for i in range(n):
        size = SIZES[i % len(SIZES)]
        picked: list[str] = []
        while len(picked) < size:
            pool = cardiac if (cardiac and rng.random() < cardiac_share) else named
            d = rng.choice(pool)
            if d not in picked:
                picked.append(d)
        names = [eng.name[d] for d in picked]
        gt = None
        if genes and rng.random() < 0.5:
            gt = {}
            for g in rng.sample(sorted(genes), k=min(2, len(genes))):
                gt[g] = f"*1/{rng.choice(genes[g])}" if genes[g][0].startswith("*") else rng.choice(genes[g])
        cases.append({"current": names[:-1], "new": names[-1], "genotypes": gt, "size": size})
    return cases


def run(eng: DDIEngine, cases: list[dict], warmup: int = 3) -> list[dict]:
    for c in cases[:warmup]:                                  # first calls warm up caches
        eng.check(c["current"], c["new"], c["genotypes"])
    rows = []
    for c in cases:
        t0 = time.perf_counter()
        res = eng.check(c["current"], c["new"], c["genotypes"])
        ms = (time.perf_counter() - t0) * 1000
        rows.append({"size": c["size"], "pairs": len(res["pairs"]), "ms": round(ms, 2),
                     "genotype": c["genotypes"] is not None, "overall": res["overall_level"]})
    return rows


def summarise(rows: list[dict]) -> dict:
    ms = np.array([r["ms"] for r in rows])
    by_size = {}
    for s in sorted({r["size"] for r in rows}):
        x = np.array([r["ms"] for r in rows if r["size"] == s])
        pairs = int(np.median([r["pairs"] for r in rows if r["size"] == s]))
        by_size[s] = {"n": len(x), "pairs": pairs, "median": float(np.median(x)),
                      "p95": float(np.percentile(x, 95)), "max": float(x.max())}
    return {"cases": len(rows), "median_ms": float(np.median(ms)), "p95_ms": float(np.percentile(ms, 95)),
            "max_ms": float(ms.max()), "min_ms": float(ms.min()), "requirement_ms": REQUIREMENT_MS,
            "passed": bool(ms.max() < REQUIREMENT_MS), "share_under_requirement": float((ms < REQUIREMENT_MS).mean()),
            "by_size": by_size}


def figure(summary: dict, out_png) -> None:
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt

    ink, muted, grid, bar = "#0b0b0b", "#52514e", "#e1e0d9", "#2a78d6"
    sizes = list(summary["by_size"])
    med = [summary["by_size"][s]["median"] for s in sizes]
    worst = [summary["by_size"][s]["max"] for s in sizes]
    fig, ax = plt.subplots(figsize=(9, 4.6), dpi=200)
    fig.patch.set_facecolor("#fcfcfb")
    ax.set_facecolor("#fcfcfb")
    xs = np.arange(len(sizes))
    ax.bar(xs, med, width=0.55, color=bar, zorder=3)
    ax.vlines(xs, med, worst, color=muted, linewidth=1.2, zorder=4)
    ax.scatter(xs, worst, s=18, color=muted, zorder=5)
    top = max(worst) * 1.25
    for x, m, w in zip(xs, med, worst):
        ax.text(x, w + top * 0.02, f"{m:.0f} ms", ha="center", va="bottom", fontsize=9, color=ink)
    ax.set_ylim(0, top)
    ax.set_xticks(xs, [f"{s}\n({summary['by_size'][s]['pairs']} pair{'s' if summary['by_size'][s]['pairs'] != 1 else ''})" for s in sizes], fontsize=9, color=muted)
    ax.set_xlabel("Medicines per patient", fontsize=10, color=muted)
    ax.set_ylabel("Response time (ms)", fontsize=10, color=muted)
    ax.tick_params(axis="y", colors=muted, labelsize=9)
    ax.grid(axis="y", color=grid, linewidth=0.8, zorder=0)
    for s in ("top", "right", "left"):
        ax.spines[s].set_visible(False)
    ax.spines["bottom"].set_color(grid)
    ax.set_title(f"Every check under {REQUIREMENT_MS:,.0f} ms — worst case {summary['max_ms']:.0f} ms "
                 f"over {summary['cases']} random patients", loc="left", fontsize=12, color=ink, pad=14)
    fig.text(0.01, 0.01, "Bar = median · line and dot = slowest case · numbers above = median",
             fontsize=8.5, color=muted)
    fig.tight_layout(rect=(0, 0.03, 1, 1))
    fig.savefig(out_png, facecolor=fig.get_facecolor())
    plt.close(fig)


def report_md(summary: dict, load_s: float, machine: str) -> str:
    verdict = "✅ PASS" if summary["passed"] else "❌ FAIL"
    lines = [
        "# Module 4 — Response-time test", "",
        f"Requirement: each interaction check returns in under **{REQUIREMENT_MS:,.0f} ms**. **{verdict}**", "",
        f"- Cases: {summary['cases']} random patients (2–10 medicines, ~70% cardiac drugs, half with a genotype)",
        f"- Machine: {machine}",
        f"- Engine start-up (once, when the app opens): {load_s:.1f} s", "",
        "| Measure | Time |", "|---|---|",
        f"| Median | {summary['median_ms']:.1f} ms |",
        f"| 95th percentile | {summary['p95_ms']:.1f} ms |",
        f"| Worst case | {summary['max_ms']:.1f} ms |",
        f"| Checks under {REQUIREMENT_MS:,.0f} ms | {summary['share_under_requirement']:.0%} |", "",
        "## By number of medicines", "",
        "| Medicines | Drug pairs | Cases | Median | 95th pct | Worst |", "|---|---|---|---|---|---|",
    ]
    for s, v in summary["by_size"].items():
        lines.append(f"| {s} | {v['pairs']} | {v['n']} | {v['median']:.1f} ms | {v['p95']:.1f} ms | {v['max']:.1f} ms |")
    lines += ["", "Each check includes scoring every pair with Monte-Carlo dropout, explanations, safer-alternative "
                  "search and pharmacogenomic alerts — the same call the demo makes.", "",
              "![Response time](figures/response_time.png)", ""]
    return "\n".join(lines)


def main() -> None:
    ap = argparse.ArgumentParser(description="Response-time benchmark")
    ap.add_argument("--cases", type=int, default=200)
    ap.add_argument("--seed", type=int, default=42)
    args = ap.parse_args()

    cfg = load_config()
    eng = DDIEngine(cfg)
    print(f"engine ready in {eng.load_seconds:.1f}s — running {args.cases} cases…")
    rows = run(eng, make_cases(eng, args.cases, args.seed))
    summary = summarise(rows)
    machine = f"{platform.system()} {platform.machine()}, Python {platform.python_version()}"

    rep = cfg["paths"]["reports"]
    path(f"{rep}/response_time.json").write_text(json.dumps(
        {"summary": summary, "engine_load_s": eng.load_seconds, "machine": machine, "cases": rows}, indent=2))
    path(f"{rep}/response_time.md").write_text(report_md(summary, eng.load_seconds, machine), encoding="utf-8")
    figure(summary, path(f"{rep}/figures/response_time.png"))

    print(f"  median {summary['median_ms']:.1f} ms · p95 {summary['p95_ms']:.1f} ms · worst {summary['max_ms']:.1f} ms"
          f" → {'PASS' if summary['passed'] else 'FAIL'} (< {REQUIREMENT_MS:,.0f} ms)")
    print("  report -> reports/response_time.md, figure -> reports/figures/response_time.png")


if __name__ == "__main__":
    main()
