"""Explanation-layer tests that do not need trained models."""
import pandas as pd
import pytest

pytest.importorskip("torch")
pytest.importorskip("torch_geometric")

from src.explain.engine import DDIEngine  # noqa: E402


def _bare_engine():
    eng = object.__new__(DDIEngine)          # skip model loading
    eng.thr = {"warm": 0.5, "cold": 0.5}
    eng.name = {"DB1": "warfarin", "DB2": "aspirin", "DB3": "metformin"}
    eng.templates = {48: "#Drug1 may increase the anticoagulant activities of #Drug2."}
    eng.pgx = pd.DataFrame({"gene": ["CYP2C9", "CYP2C9"], "star_allele": ["*2", "*3"],
                            "rsid": ["rs1799853", "rs1057910"], "cardiac_drugs": ["warfarin", "warfarin"],
                            "clinical_effect": ["reduced clearance", "strongly reduced clearance"]})
    eng.var = pd.DataFrame({"gene": ["CYP2C9"], "rsid": ["rs1057910"], "af_sas": [0.05], "af_stu": [0.04], "af_nfe": [0.07]})
    return eng


def test_curated_severity_wins():
    eng = _bare_engine()
    assert eng.risk_level(0.1, "warm", "", "Major", "DB1", "DB2") == ("High", "DDInter (curated severity)")
    assert eng.risk_level(0.99, "warm", "", "Minor", "DB1", "DB2")[0] == "Low"


def test_model_estimated_levels():
    eng = _bare_engine()
    bleed = "Aspirin may increase the anticoagulant activities of Warfarin."
    assert eng.risk_level(0.95, "warm", bleed, None, "DB1", "DB2")[0] == "High"
    assert eng.risk_level(0.95, "warm", "Drug A affects drug B.", None, "DB3", "DB2")[0] == "Moderate"
    assert eng.risk_level(0.2, "warm", bleed, None, "DB1", "DB2")[0] == "Low"


def test_template_filling_uses_tdc_order():
    eng = _bare_engine()
    # TDC stores (ID1, ID2) with #Drug1 = ID2: warfarin(ID1) + aspirin(ID2)
    assert eng.fill(48, "DB1", "DB2") == "Aspirin may increase the anticoagulant activities of Warfarin."


def test_pgx_carrier_detection():
    eng = _bare_engine()
    carried = eng.pgx_alerts("DB1", {"CYP2C9": "*1/*3"})
    assert len(carried) == 1 and carried[0]["severity"] == "High" and "*3" in carried[0]["variant"]
    assert carried[0]["frequencies"]["Sri Lankan Tamil"] == 0.04
    info = eng.pgx_alerts("DB1", None)                       # no genotype -> testing suggestion for both alleles
    assert len(info) == 2 and all(a["severity"] == "Info" for a in info)
    assert eng.pgx_alerts("DB3", None) == []
