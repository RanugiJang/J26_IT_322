"""Response-time benchmark tests (summary maths always; a real run when trained models exist)."""
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]

pytest.importorskip("torch")
pytest.importorskip("torch_geometric")

from src.explain.benchmark import REQUIREMENT_MS, summarise  # noqa: E402


def test_summary_statistics():
    rows = [{"size": 2, "pairs": 1, "ms": v} for v in (10, 20, 30)] + [{"size": 4, "pairs": 6, "ms": 100}]
    s = summarise(rows)
    assert s["cases"] == 4 and s["median_ms"] == 25 and s["max_ms"] == 100 and s["passed"]
    assert s["by_size"][2]["median"] == 20 and s["by_size"][4]["pairs"] == 6
    assert not summarise([{"size": 2, "pairs": 1, "ms": REQUIREMENT_MS + 1}])["passed"]


@pytest.mark.skipif(not (ROOT / "models" / "gnn_warm.pt").exists(), reason="needs trained GNN (Step 4)")
def test_real_checks_meet_requirement():
    from src.explain.benchmark import make_cases, run
    from src.explain.engine import DDIEngine
    eng = DDIEngine()
    cases = make_cases(eng, 14, seed=1)
    assert {c["size"] for c in cases} == {2, 3, 4, 5, 6, 8, 10}
    s = summarise(run(eng, cases, warmup=1))
    assert s["passed"], f"worst case {s['max_ms']:.0f} ms"
