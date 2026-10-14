"""Drug vocabulary: one row per drug, keyed by DrugBank ID.

Built from ClinPGx drugs.tsv, which carries the DrugBank cross-reference,
generic/trade names and ATC codes for each drug. This is the translation
table that lets us join:
  TDC (DrugBank IDs)  <->  DDInter (drug names)  <->  ClinPGx (PharmGKB IDs)
"""
from __future__ import annotations

import re
from collections import defaultdict

import pandas as pd

DRUGBANK_RE = re.compile(r"DrugBank:\s*(DB\d{5})")
ATC_RE = re.compile(r"\b([A-Z]\d{2}[A-Z]{2}\d{2})\b")
SALT_SUFFIXES = (
    " hydrochloride", " hcl", " sodium", " potassium", " calcium", " magnesium",
    " mesylate", " maleate", " besylate", " besilate", " tartrate", " succinate",
    " citrate", " sulfate", " sulphate", " phosphate", " acetate", " fumarate",
    " bromide", " chloride", " nitrate", " dihydrate", " monohydrate", " anhydrous",
)


def normalize_name(name: str) -> str:
    """Lower-case, strip quotes/punctuation, collapse spaces."""
    if not isinstance(name, str):
        return ""
    s = name.strip().strip('"').strip("'").lower()
    s = re.sub(r"[\(\)\[\],;]", " ", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s


def strip_salt(name: str) -> str:
    """'amlodipine besylate' -> 'amlodipine' (fallback matching only)."""
    s = normalize_name(name)
    changed = True
    while changed:
        changed = False
        for suf in SALT_SUFFIXES:
            if s.endswith(suf) and len(s) > len(suf) + 2:
                s = s[: -len(suf)].strip()
                changed = True
    return s


def split_list(value) -> list[str]:
    """ClinPGx list cells look like: '"name a", "name b"' or 'name a, name b'."""
    if not isinstance(value, str) or not value.strip():
        return []
    quoted = re.findall(r'"([^"]+)"', value)
    parts = quoted if quoted else value.split(",")
    return [p.strip() for p in parts if p.strip()]


def parse_drugbank_id(crossrefs) -> str | None:
    if not isinstance(crossrefs, str):
        return None
    m = DRUGBANK_RE.search(crossrefs)
    return m.group(1) if m else None


def parse_atc(value) -> list[str]:
    if not isinstance(value, str):
        return []
    return sorted(set(ATC_RE.findall(value)))


def is_cardiac(atc_codes: list[str], prefixes: list[str]) -> bool:
    return any(code.startswith(tuple(prefixes)) for code in atc_codes)


def build_vocab(drugs_tsv: pd.DataFrame, cardiac_prefixes: list[str],
                include_trade_names: bool = True) -> tuple[pd.DataFrame, dict[str, str]]:
    """Return (vocab table keyed by DrugBank ID, name->DrugBank ID index).

    Names that point to more than one DrugBank ID are dropped from the index
    (ambiguous), so a lookup never silently picks the wrong drug.
    """
    rows = []
    for _, r in drugs_tsv.iterrows():
        dbid = parse_drugbank_id(r.get("Cross-references"))
        if not dbid:
            continue
        atc = parse_atc(r.get("ATC Identifiers"))
        generic = split_list(r.get("Generic Names"))
        trade = split_list(r.get("Trade Names")) if include_trade_names else []
        rows.append(dict(
            drugbank_id=dbid,
            pharmgkb_id=r.get("PharmGKB Accession Id"),
            name=str(r.get("Name")).strip(),
            atc_codes=";".join(atc),
            is_cardiac=is_cardiac(atc, cardiac_prefixes),
            generic_names=";".join(generic),
            trade_names=";".join(trade),
            top_clinical_level=r.get("Top Clinical Annotation Level"),
            top_cpic_level=r.get("Top CPIC Pairs Level"),
        ))
    vocab = pd.DataFrame(rows)
    # A DrugBank ID can appear on >1 PharmGKB record (rare) -> keep the first, merge ATC
    if not vocab.empty:
        vocab = (vocab.groupby("drugbank_id", as_index=False)
                 .agg({"pharmgkb_id": "first", "name": "first",
                       "atc_codes": lambda s: ";".join(sorted({c for x in s for c in x.split(";") if c})),
                       "is_cardiac": "max", "generic_names": "first", "trade_names": "first",
                       "top_clinical_level": "first", "top_cpic_level": "first"}))

    # name index: exact names first, salt-stripped as fallback
    candidates: dict[str, set[str]] = defaultdict(set)
    for _, r in vocab.iterrows():
        names = [r["name"]] + [n for n in str(r["generic_names"]).split(";") if n] \
                + [n for n in str(r["trade_names"]).split(";") if n]
        for n in names:
            key = normalize_name(n)
            if key:
                candidates[key].add(r["drugbank_id"])
    index = {k: next(iter(v)) for k, v in candidates.items() if len(v) == 1}

    salt_candidates: dict[str, set[str]] = defaultdict(set)
    for k, dbid in index.items():
        salt_candidates[strip_salt(k)].add(dbid)
    for k, v in salt_candidates.items():
        if k not in index and len(v) == 1:
            index[k] = next(iter(v))
    return vocab, index


def lookup(name: str, index: dict[str, str]) -> str | None:
    key = normalize_name(name)
    return index.get(key) or index.get(strip_salt(key))
