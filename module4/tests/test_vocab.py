"""Unit tests for drug-name resolution (run: python -m pytest -q)."""
import pandas as pd

from src.kg.vocab import (build_vocab, is_cardiac, lookup, normalize_name, parse_atc,
                          parse_drugbank_id, split_list, strip_salt)


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


def test_normalize_and_salt():
    assert normalize_name('  "Amlodipine  Besylate" ') == "amlodipine besylate"
    assert strip_salt("Metoprolol Succinate") == "metoprolol"
    assert strip_salt("Clopidogrel") == "clopidogrel"


def test_is_cardiac():
    assert is_cardiac(["B01AA03"], ["B01", "C07"])
    assert not is_cardiac(["N02BE01"], ["B01", "C07"])


def _vocab():
    df = pd.DataFrame([
        {"PharmGKB Accession Id": "PA451906", "Name": "warfarin", "Generic Names": '"Warfarin sodium"',
         "Trade Names": '"Coumadin"', "Cross-references": "DrugBank:DB00682", "ATC Identifiers": "B01AA03"},
        {"PharmGKB Accession Id": "PA449053", "Name": "clopidogrel", "Generic Names": "",
         "Trade Names": '"Plavix"', "Cross-references": "DrugBank:DB00758", "ATC Identifiers": "B01AC04"},
        {"PharmGKB Accession Id": "PA448497", "Name": "aspirin", "Generic Names": "",
         "Trade Names": '"Shared"', "Cross-references": "DrugBank:DB00945", "ATC Identifiers": "N02BA01"},
        {"PharmGKB Accession Id": "PA1", "Name": "otherdrug", "Generic Names": "",
         "Trade Names": '"Shared"', "Cross-references": "DrugBank:DB99999", "ATC Identifiers": ""},
        {"PharmGKB Accession Id": "PA2", "Name": "no-drugbank", "Generic Names": "",
         "Trade Names": "", "Cross-references": "PubChem Compound:1", "ATC Identifiers": ""},
    ])
    return build_vocab(df, ["B01", "C"])


def test_build_vocab_and_lookup():
    vocab, index = _vocab()
    assert len(vocab) == 4                                   # record without DrugBank ID dropped
    assert set(vocab.loc[vocab.is_cardiac, "drugbank_id"]) == {"DB00682", "DB00758"}
    assert lookup("Warfarin", index) == "DB00682"
    assert lookup("COUMADIN", index) == "DB00682"            # trade name
    assert lookup("warfarin sodium", index) == "DB00682"     # generic name
    assert lookup("Clopidogrel bisulfate", index) is None or lookup("Clopidogrel bisulfate", index) == "DB00758"
    assert lookup("Shared", index) is None                   # ambiguous names never resolve
