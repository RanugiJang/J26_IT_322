"""Step 6 — demo helper tests (+ a full app smoke test when trained models are present)."""
from pathlib import Path

import pandas as pd
import pytest

from src.demo.helpers import (build_genotypes, choice_index, drug_options, genotype_choices, load_patients,
                              match_options, missing_from_options, overall_reason, parse_free_text, pgx_table,
                              summary_counts)

ROOT = Path(__file__).resolve().parents[1]
PGX = pd.DataFrame({"gene": ["CYP2C19", "CYP2C19", "VKORC1"], "star_allele": ["*2", "*3", "-1639G>A"]})


def test_demo_patients_file_is_valid():
    pts = load_patients(ROOT / "config" / "demo_patients.yaml")
    assert len(pts) >= 3
    assert len({p["id"] for p in pts}) == len(pts)
    for p in pts:
        assert p["name"] and p["current"] and isinstance(p["genotype"], dict)


def test_genotype_choices_and_defaults():
    ch = genotype_choices(PGX)
    values = [v for _, v in ch["CYP2C19"]]
    assert values[0] is None and "*1/*1" in values and "*1/*2" in values and "*2/*3" in values
    assert [v for _, v in ch["VKORC1"]] == [None, "wild-type", "-1639G>A", "-1639G>A/-1639G>A"]
    assert choice_index(ch["CYP2C19"], "*2/*2") > 0 and choice_index(ch["CYP2C19"], "*9/*9") == 0


def test_build_genotypes_keeps_tested_genes_only():
    assert build_genotypes({"CYP2C19": None, "VKORC1": None}) is None
    assert build_genotypes({"CYP2C19": "*1/*1", "VKORC1": None}) == {"CYP2C19": "*1/*1"}


def test_medicine_inputs():
    names = {"DB1": "warfarin", "DB2": "Aspirin", "DB3": "DB3", "DB4": "aspirin", "DB9": "not in graph"}
    row = {"DB1": 0, "DB2": 1, "DB3": 2, "DB4": 3}
    opts = drug_options(names, row)
    assert opts == ["Aspirin", "warfarin"]                       # ID-only, duplicate and off-graph names removed
    assert parse_free_text("ezetimibe/simvastatin, metformin;\nlosartan") == ["ezetimibe/simvastatin", "metformin", "losartan"]
    assert match_options(["Warfarin", "furosemide"], opts) == ["warfarin"]
    assert missing_from_options(["Warfarin", "furosemide"], opts) == ["furosemide"]


def test_result_tables():
    res = {"drugs": ["A", "B"], "pairs": [{}], "n_flagged": 1, "elapsed_ms": 12.3,
           "pgx": [{"severity": "High", "drug": "Clopidogrel", "variant": "CYP2C19 *2 (rs4244285)", "effect": "loss",
                    "frequencies": {"Sri Lankan Tamil": 0.42, "South Asian": 0.33, "European": 0.15}}]}
    assert summary_counts(res) == {"medicines": 2, "pairs": 1, "flagged": 1, "genetic": 1, "ms": 12.3}
    t = pgx_table(res["pgx"])
    assert t.loc[0, "Sri Lankan Tamil"] == 0.42 and t.loc[0, "Status"].endswith("Carrier")


def test_overall_reason_names_the_driver():
    pair = {"name_a": "Clopidogrel", "name_b": "Omeprazole", "level": "Moderate", "level_source": "model-estimated"}
    gene = {"severity": "High", "drug": "Clopidogrel", "variant": "CYP2C19 *2 (rs4244285)"}
    assert "genetic result: Clopidogrel — CYP2C19 *2" in overall_reason(
        {"overall_level": "High", "pairs": [pair], "pgx": [gene]})
    assert overall_reason({"overall_level": "Moderate", "pairs": [pair], "pgx": []}).startswith(
        "Driven by Clopidogrel + Omeprazole")
    assert overall_reason({"overall_level": "None", "pairs": [], "pgx": []}) == ""


@pytest.mark.skipif(not (ROOT / "models" / "gnn_warm.pt").exists(), reason="needs trained GNN (Step 4)")
def test_app_runs_end_to_end():
    pytest.importorskip("streamlit")
    from streamlit.testing.v1 import AppTest
    at = AppTest.from_file(str(ROOT / "app.py"), default_timeout=120).run()
    assert not at.exception
    at.button[0].click().run()
    assert not at.exception
    assert any("Overall risk" in m.value for m in at.markdown)
