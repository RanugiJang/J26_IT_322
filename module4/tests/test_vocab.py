"""Unit tests for drug-name resolution (run: python -m pytest -q)."""
import pandas as pd

from src.kg.vocab import (build_vocab, compact, drop_brackets, is_cardiac, lookup, normalize_name,
                          parse_atc, parse_drugbank_id, split_list, strip_salt)


def test_parse_drugbank_id():
    assert parse_drugbank_id("PubChem Compound:54678486, DrugBank:DB00682, ChEBI:10033") == "DB00682"
    assert parse_drugbank_id("PubChem Compound:1") is None
    assert parse_drugbank_id(None) is None


def test_parse_atc():
    assert parse_atc("B01AA03, B01AA53") == ["B01AA03", "B01AA53"]
    assert parse_atc(None) == []


def test_split_list_quoted_and_plain():
    assert split_list('"Coumadin", "Jantoven"') == ["Coumadin", "Jantoven"]
    assert split_list("a, b") == ["a", "b"]
    assert split_list(float("nan")) == []


def test_normalisation_tiers():
    assert normalize_name('  "Amlodipine  Besylate" ') == "amlodipine besylate"
    assert drop_brackets("Doxepin (topical)") == "doxepin"
    assert strip_salt("Metoprolol Succinate") == "metoprolol"
    assert strip_salt("Fluticasone propionate") == "fluticasone"
    assert compact("Ethinyl estradiol") == compact("ethinylestradiol")


def test_is_cardiac():
    assert is_cardiac(["B01AA03"], ["B01", "C07"])
    assert not is_cardiac(["N02BA01"], ["B01", "C07"])


ROW = dict.fromkeys(["PharmGKB Accession Id", "Name", "Generic Names", "Trade Names",
                     "Cross-references", "ATC Identifiers"], "")


def _vocab(synonyms=None):
    recs = [
        ("PA451906", "warfarin", '"Warfarin sodium"', '"Coumadin"', "DrugBank:DB00682", "B01AA03"),
        ("PA449053", "clopidogrel", "", '"Plavix"', "DrugBank:DB00758", "B01AC04"),
        ("PA448497", "aspirin", "", '"Shared"', "DrugBank:DB00945", "B01AC06, N02BA01"),
        ("PA1", "otherdrug", "", '"Shared"', "DrugBank:DB99999", ""),
        ("PA166114461", "ticagrelor", "", '"Brilinta"', "PubChem Compound:9871419", "B01AC24"),
        ("PA2", "warfarin", "", "", "", ""),                     # duplicate name without DrugBank ID
        ("PA3", "ethinyl estradiol", "", "", "DrugBank:DB00977", "G03CA01"),
    ]
    df = pd.DataFrame([{**ROW, "PharmGKB Accession Id": a, "Name": n, "Generic Names": g,
                        "Trade Names": t, "Cross-references": x, "ATC Identifiers": c}
                       for a, n, g, t, x, c in recs])
    return build_vocab(df, ["B01", "C"], synonyms=synonyms)


def test_vocab_keys_and_cardiac_flag():
    vocab, _ = _vocab()
    assert "PGKB:PA166114461" in set(vocab.drugbank_id)          # ticagrelor kept without DrugBank ID
    cardiac = set(vocab.loc[vocab.is_cardiac, "drugbank_id"])
    assert {"DB00682", "DB00758", "DB00945", "PGKB:PA166114461"} <= cardiac


def test_lookup_tiers():
    _, index = _vocab()
    assert lookup("Warfarin", index) == "DB00682"                # DrugBank ID wins over PGKB duplicate
    assert lookup("COUMADIN", index) == "DB00682"                # trade name
    assert lookup("warfarin sodium", index) == "DB00682"         # generic name
    assert lookup("Warfarin (oral)", index) == "DB00682"         # bracket qualifier
    assert lookup("Ticagrelor", index) == "PGKB:PA166114461"     # ClinPGx-only drug
    assert lookup("ethinylestradiol", index) == "DB00977"        # spaces ignored
    assert lookup("Shared", index) is None                       # ambiguous names never resolve
    assert lookup("", index) is None


def test_manual_synonyms():
    syn = pd.DataFrame({"alias": ["acetylsalicylic acid"], "canonical": ["aspirin"]})
    _, index = _vocab(syn)
    assert lookup("Acetylsalicylic acid", index) == "DB00945"
