"""Drug vocabulary: one row per drug.

Built from ClinPGx drugs.tsv, which carries the DrugBank cross-reference,
generic/trade names and ATC codes for each drug. This is the translation
table that lets us join:
  TDC (DrugBank IDs)  <->  DDInter (drug names)  <->  ClinPGx (PharmGKB IDs)

Drug key (`drugbank_id` column):
  * the DrugBank ID (e.g. DB00682) when ClinPGx lists one
  * otherwise "PGKB:<PharmGKB ID>" (e.g. newer drugs such as ticagrelor that
    ClinPGx lists without a DrugBank cross-reference). `id_source` says which.

Name matching (most to least strict):
  1. exact normalised name / generic name / trade name
  2. same name with bracketed qualifiers removed ("doxepin (topical)" -> "doxepin")
  3. salt/ester suffix removed ("fluticasone propionate" -> "fluticasone")
  4. spaces and hyphens ignored ("ethinyl estradiol" == "ethinylestradiol")
  5. manual synonyms from config/drug_synonyms.csv
A name that points to two different drugs is never used (ambiguous).
"""
from __future__ import annotations

import re
from collections import defaultdict

import pandas as pd

DRUGBANK_RE = re.compile(r"DrugBank:\s*(DB\d{5})")
ATC_RE = re.compile(r"\b([A-Z]\d{2}[A-Z]{2}\d{2})\b")
SALT_SUFFIXES = (
    " hydrochloride", " hcl", " hydrobromide", " sodium", " potassium", " calcium", " magnesium",
    " mesylate", " mesilate", " maleate", " besylate", " besilate", " tartrate", " bitartrate",
    " succinate", " citrate", " sulfate", " sulphate", " bisulfate", " phosphate", " acetate",
    " fumarate", " bromide", " chloride", " nitrate", " dihydrate", " monohydrate", " trihydrate",
    " anhydrous", " propionate", " dipropionate", " furoate", " valerate", " hyclate",
    " tromethamine", " lactate", " gluconate", " carbonate", " oxalate", " embonate",
    " pamoate", " disodium", " dimesylate", " erbumine", " medoxomil", " cilexetil",
)


def normalize_name(name: str) -> str:
    """Lower-case, strip quotes/punctuation, collapse spaces."""
    if not isinstance(name, str):
        return ""
    s = name.strip().strip('"').strip("'").lower()
    s = re.sub(r"[\[\],;]", " ", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s


def drop_brackets(name: str) -> str:
    """'doxepin (topical)' -> 'doxepin'."""
    s = re.sub(r"\([^)]*\)", " ", normalize_name(name))
    return re.sub(r"\s+", " ", s).strip()


def strip_salt(name: str) -> str:
    """'amlodipine besylate' -> 'amlodipine' (fallback matching only)."""
    s = drop_brackets(name)
    changed = True
    while changed:
        changed = False
        for suf in SALT_SUFFIXES:
            if s.endswith(suf) and len(s) > len(suf) + 2:
                s = s[: -len(suf)].strip()
                changed = True
    return s


def compact(name: str) -> str:
    """Ignore spaces and hyphens: 'ethinyl estradiol' -> 'ethinylestradiol'."""
    return re.sub(r"[\s\-]", "", strip_salt(name))


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


def _pick(ids: set[str]) -> str | None:
    """Resolve a name's candidate drugs: unique -> it; one DrugBank ID among
    PharmGKB-only duplicates -> the DrugBank ID; otherwise ambiguous -> None."""
    if len(ids) == 1:
        return next(iter(ids))
    db = {i for i in ids if i.startswith("DB")}
    return next(iter(db)) if len(db) == 1 else None


def build_vocab(drugs_tsv: pd.DataFrame, cardiac_prefixes: list[str],
                include_trade_names: bool = True,
                synonyms: pd.DataFrame | None = None) -> tuple[pd.DataFrame, dict[str, str]]:
    """Return (vocab table, name -> drug key index)."""
    rows = []
    for _, r in drugs_tsv.iterrows():
        pa = r.get("PharmGKB Accession Id")
        dbid = parse_drugbank_id(r.get("Cross-references"))
        key, source = (dbid, "drugbank") if dbid else (f"PGKB:{pa}", "clinpgx")
        if not isinstance(pa, str) and not dbid:
            continue
        atc = parse_atc(r.get("ATC Identifiers"))
        generic = split_list(r.get("Generic Names"))
        trade = split_list(r.get("Trade Names")) if include_trade_names else []
        rows.append(dict(
            drugbank_id=key, id_source=source, pharmgkb_id=pa,
            name=str(r.get("Name")).strip(),
            atc_codes=";".join(atc), is_cardiac=is_cardiac(atc, cardiac_prefixes),
            generic_names=";".join(generic), trade_names=";".join(trade),
            top_clinical_level=r.get("Top Clinical Annotation Level"),
            top_cpic_level=r.get("Top CPIC Pairs Level"),
        ))
    vocab = pd.DataFrame(rows)
    if not vocab.empty:
        vocab = (vocab.groupby("drugbank_id", as_index=False)
                 .agg({"id_source": "first", "pharmgkb_id": "first", "name": "first",
                       "atc_codes": lambda s: ";".join(sorted({c for x in s for c in x.split(";") if c})),
                       "is_cardiac": "max", "generic_names": "first", "trade_names": "first",
                       "top_clinical_level": "first", "top_cpic_level": "first"}))

    # tiered candidate maps: exact -> no brackets -> no salt -> compact
    tiers = [normalize_name, drop_brackets, strip_salt, compact]
    cand = [defaultdict(set) for _ in tiers]
    for _, r in vocab.iterrows():
        names = [r["name"]] + [n for n in str(r["generic_names"]).split(";") if n] \
                + [n for n in str(r["trade_names"]).split(";") if n]
        for n in names:
            for t, fn in enumerate(tiers):
                k = fn(n)
                if k:
                    cand[t][k].add(r["drugbank_id"])

    index: dict[str, str] = {}
    for t in range(len(tiers)):
        for k, ids in cand[t].items():
            prefixed = k if t < 3 else f"~{k}"           # compact keys live in their own namespace
            if prefixed not in index:
                pick = _pick(ids)
                if pick:
                    index[prefixed] = pick

    # manual synonyms: alias -> canonical name (resolved through the index above)
    if synonyms is not None and not synonyms.empty:
        for _, s in synonyms.iterrows():
            target = lookup(str(s["canonical"]), index)
            if target:
                index[normalize_name(str(s["alias"]))] = target
    return vocab, index


def lookup(name: str, index: dict[str, str]) -> str | None:
    if not isinstance(name, str) or not name.strip():
        return None
    for key in (normalize_name(name), drop_brackets(name), strip_salt(name)):
        if key in index:
            return index[key]
    return index.get(f"~{compact(name)}")
