"""Rule-based Diet Swap Recommender (Module 3 - Diet domain).

Uses a combined Sri Lankan food reference + USDA SR28 lookup table.
This is a prototype decision-support component, not a clinical diet prescription.

Safety/reliability rules:
  1. Match only like-for-like food families where a family can be identified;
     otherwise require the same broad category.
  2. Only compare non-missing values for the selected nutrient.
  3. Refuse a comparison when the selected nutrient's source note indicates a
     rough proxy, recipe-dependent value, or missing preparation ingredients.
  4. Apply the same confidence filter to the original food and every candidate.
  5. Candidate calories must remain within 30%-120% of the original. If no
     candidate passes, return no_swap rather than bypassing the calorie rule.
  6. Never return raw/unprepared foods, by-products, or variety meats.
  7. Prefer Sri Lankan FCDB entries when candidates are otherwise comparable.
  8. If the original nutrient is already low, return already_low.

Important: LOW_THRESHOLDS are provisional prototype thresholds and must be
verified against the selected reference and clinical supervisor before being
presented as validated CVD guidance.
"""
import re
import pandas as pd

_DF = None

LOW_THRESHOLDS = {"Sodium_mg": 120.0, "Sugar_g": 5.0, "Fat_g": 3.0}
VALID_METRICS = set(LOW_THRESHOLDS)
SL_SOURCE = "Sri Lankan FCDB (Opatha et al. 2025)"
_EXCLUDE = r"\bRAW\b|UNPREP|BY-PRODUCTS|VAR MEATS|\bVARIETY MEATS\b"

# Conservative flags: these make a nutrient value unreliable for a food swap.
# A flag in the note only affects the metric to which the note refers.
_RISK_TERMS = (
    "overestimate", "underestimate", "not reflected", "no reasonable match",
    "no single reasonable", "no usda equivalent", "no single", "mixed dish",
    "varies heavily", "highly variable", "varies by recipe", "base ingredient only",
    "proxy", "not reflected here", "not reflected in", "not counted",
)


def load_table(path="Diet_Lookup_Combined_Final.xlsx"):
    global _DF
    df = pd.read_excel(path)
    required = {"Food_Item", "Category", "Calories_kcal", "Sodium_mg", "Sugar_g", "Fat_g", "Source"}
    missing = required - set(df.columns)
    if missing:
        raise ValueError(f"Lookup table is missing required columns: {sorted(missing)}")
    _DF = df
    return _DF


def _metric_note(row, metric):
    """Return only note fragments relevant to the selected nutrient."""
    raw = row.get("Sodium_Sugar_Note", "")
    if pd.isna(raw) or not str(raw).strip():
        return ""
    parts = [p.strip() for p in str(raw).split("|") if p.strip()]
    selected = []
    for part in parts:
        p = part.lower()
        mentions_sodium = bool(re.search(r"sodium|salt", p))
        mentions_sugar = bool(re.search(r"sugar|sweet", p))
        mentions_fat = bool(re.search(r"fat|oil|coconut|tempering", p))
        # Do not let a sodium-only warning contaminate sugar/fat confidence,
        # or a sugar-only missing-value note contaminate sodium/fat confidence.
        if metric == "Sodium_mg" and mentions_sugar and not mentions_sodium:
            continue
        if metric == "Sugar_g" and mentions_sodium and not mentions_sugar:
            continue
        if metric == "Fat_g" and (mentions_sodium or mentions_sugar) and not re.search(r"\bfat\b|\boil\b|tempering", p):
            continue
        general_risk = any(term in p for term in (
            "overestimate", "underestimate", "not reflected", "no reasonable match",
            "no single reasonable", "no usda equivalent", "mixed dish", "varies heavily",
            "highly variable", "varies by recipe", "base ingredient only", "proxy",
            "not reflected here", "not reflected in", "not counted",
        ))
        nutrient_match = (
            (metric == "Sodium_mg" and (mentions_sodium or re.search(r"recipe|preparation|base ingredient|proxy|mixed dish|no reasonable|no usda equivalent", p)))
            or (metric == "Sugar_g" and (mentions_sugar or re.search(r"fruit|recipe|preparation|base ingredient|proxy|mixed dish|no reasonable|no usda equivalent", p)))
            or (metric == "Fat_g" and (mentions_fat or re.search(r"recipe|preparation|base ingredient|proxy|mixed dish|no reasonable|no usda equivalent", p)))
        )
        if nutrient_match or general_risk and not (mentions_sodium or mentions_sugar or mentions_fat):
            selected.append(part)
    return " | ".join(dict.fromkeys(selected))


def _value_is_reliable(row, metric):
    value = row.get(metric)
    if pd.isna(value):
        return False, "The selected nutrient value is missing."
    note = _metric_note(row, metric)
    low_note = note.lower()
    risky = any(term in low_note for term in _RISK_TERMS)
    # The explicit 'good match, real USDA values' note is not itself a risk.
    if risky:
        return False, note or "The source note indicates this value may be unreliable."
    return True, note


def _food_family(food_name):
    """Classify foods into practical families for safer food swaps."""
    import re

    name = str(food_name).lower().strip()
    name = re.sub(r"[^a-z0-9\\s]", " ", name)
    name = re.sub(r"\\s+", " ", name).strip()

    # Prepared foods
    if "sambol" in name:
        return "sambol_condiment"
    if any(x in name for x in ("soup", "broth")):
        return "soup"
    if "salad" in name:
        if "fruit" in name:
            return "fruit_salad"
        if any(x in name for x in ("vegetable", "cucumber", "carrot", "cabbage")):
            return "vegetable_salad"
        return "mixed_salad"

    # Fruits
    if any(x in name for x in (
        "grape", "mango", "banana", "apple", "orange", "papaya",
        "pineapple", "guava", "watermelon", "fruit"
    )):
        return "fruit"

    # Poultry
    if re.search(r"\b(chicken|hen|turkey|quail)\b", name):
        return "poultry"

    # Fish and seafood
    if any(x in name for x in (
        "fish", "tuna", "salmon", "sardine", "prawn", "shrimp",
        "crab", "seafood", "mackerel", "herring"
    )):
        return "seafood"

    # Other meats
    if any(x in name for x in (
        "beef", "pork", "mutton", "lamb", "goat", "duck"
    )):
        return "other_meat"

    # Legumes
    if any(x in name for x in (
        "lima bean", "lima bns", "kidney bean", "chickpea",
        "lentil", "green gram", "mung bean", "dhal", "pulse",
        "cowpea", "soybean"
    )):
        return "legume"

    # Rice and grains
    if any(x in name for x in (
        "rice", "samba", "nadu", "kekulu", "wheat", "oat",
        "barley", "bread", "noodle", "pasta", "roti", "string hopper"
    )):
        return "grain"

    # Vegetables
    if any(x in name for x in (
        "cabbage", "carrot", "beetroot", "okra", "ladies fingers",
        "potato", "pumpkin", "spinach", "gotukola", "mukunuwenna",
        "snake gourd", "bitter gourd", "bottle gourd", "brinjal",
        "eggplant", "cucumber", "leeks", "tomato", "cauliflower",
        "broccoli", "ash plantain", "manioc", "cassava",
        "sweet potato", "vegetable", "mallung", "beans boiled"
    )):
        return "vegetable"

    # Coconut products
    if "coconut" in name:
        return "coconut"

    # Nuts and seeds
    if any(x in name for x in (
        "peanut", "almond", "cashew", "walnut", "hazelnut",
        "sesame seed", "sunflower seed", "pumpkin seed",
        "chia seed", "flaxseed"
    )):
        return "nuts_seeds"

    # Drinks
    if any(x in name for x in (
        "juice", "tea", "coffee", "beverage", "cordial",
        "smoothie", "milo"
    )):
        return "beverage"

    return "other"

def _same_food_type(original, candidate):
    original_family = _food_family(original["Food_Item"])
    candidate_family = _food_family(candidate["Food_Item"])

    # If either food has a known family, require both to match.
    known = (None, "", "other")

    if original_family not in known or candidate_family not in known:
        return (
            original_family not in known
            and candidate_family not in known
            and original_family == candidate_family
        )

    # If both families are unknown, use a safer category fallback.
    original_category = original["Category"]
    candidate_category = candidate["Category"]

    return (
        original_category == candidate_category
        and original_category != "Other/Mixed"
    )


def recommend_swap(food_name, metric="Sodium_mg", max_results=3):
    df = _DF if _DF is not None else load_table()
    if metric not in VALID_METRICS:
        return {"status": "invalid_metric", "message": f"Metric must be one of: {', '.join(sorted(VALID_METRICS))}."}
    if max_results < 1:
        return {"status": "invalid_request", "message": "max_results must be at least 1."}

    match = df[df["Food_Item"].astype(str).str.contains(str(food_name), case=False, na=False, regex=False)]
    if match.empty:
        return {"status": "not_found", "message": f"'{food_name}' is not in the lookup table."}
    exact = match[match["Food_Item"].astype(str).str.lower() == str(food_name).lower()]
    item = exact.iloc[0] if not exact.empty else match.iloc[0]

    if item["Category"] == "Other/Mixed":
        return {"status": "no_category", "food": item["Food_Item"],
                "message": "This food has no reliable category, so no like-for-like swap is offered."}

    reliable, reliability_note = _value_is_reliable(item, metric)
    if not reliable:
        status = "no_value" if pd.isna(item[metric]) else "low_confidence"
        return {"status": status, "food": item["Food_Item"], "metric": metric,
                "message": "The selected nutrient value is missing or not reliable enough for a safe comparison; no swap is suggested.",
                "data_note": reliability_note}

    value = float(item[metric])
    low = LOW_THRESHOLDS.get(metric)
    if low is not None and value <= low:
        return {"status": "already_low", "food": item["Food_Item"], "metric": metric,
                "current_value": value,
                "message": f"{metric} is already within the prototype's low band ({value:g} per 100 g); no swap suggested.",
                "threshold_note": "Prototype threshold only; validate its reference before clinical or dissertation claims."}

    pool = df[(df[metric].notna()) & (df[metric].astype(float) < value)].copy()
    pool = pool[~pool["Food_Item"].astype(str).str.contains(_EXCLUDE, case=False, regex=True, na=False)]
    pool = pool[~pool["Food_Item"].astype(str).str.contains(
        r"\b(?:alcoholic|wine|beer|liquor)\b|fat-free.*sliced|sliced.*fat-free|mesq flavor",
        case=False, regex=True, na=False
    )]
    pool = pool[pool.apply(lambda candidate: _same_food_type(item, candidate), axis=1)]
    # Curry dishes must match the preparation and main ingredient.
    original_name = str(item["Food_Item"]).lower()

    if "curry" in original_name:
        pool = pool[
            pool["Food_Item"].astype(str).str.contains(
                r"\\bcurry\\b", case=False, regex=True, na=False
            )
        ]

        ingredient_groups = [
            ("chicken",),
            ("fish", "tuna", "salmon", "sardine", "mackerel"),
            ("prawn", "shrimp", "crab"),
            ("dhal", "lentil", "green gram", "mung bean"),
            ("potato",),
            ("beef",),
            ("pork",),
            ("mutton", "lamb", "goat"),
            ("egg",),
            ("cabbage", "carrot", "pumpkin", "brinjal", "okra",
             "ladies fingers", "snake gourd", "ash plantain"),
        ]

        anchors = [
            group for group in ingredient_groups
            if any(term in original_name for term in group)
        ]

        if anchors:
            pool = pool[
                pool["Food_Item"].astype(str).apply(
                    lambda candidate_name: any(
                        any(term in candidate_name.lower() for term in group)
                        for group in anchors
                    )
                )
            ]
        else:
            pool = pool.iloc[0:0]


    # Apply metric-specific reliability checks to every alternative too.
    reliability_results = pool.apply(lambda candidate: _value_is_reliable(candidate, metric)[0], axis=1)
    pool = pool[reliability_results]

    # Restore required lookup columns if an earlier operation removed them.
    if "Calories_kcal" not in pool.columns:
        pool["Calories_kcal"] = df.loc[pool.index, "Calories_kcal"]
    if "Source" not in pool.columns:
        pool["Source"] = df.loc[pool.index, "Source"]

    if pd.notna(item.get("Calories_kcal")) and float(item["Calories_kcal"]) > 0:
        lo, hi = float(item["Calories_kcal"]) * 0.30, float(item["Calories_kcal"]) * 1.20
        calorie_values = pool["Calories_kcal"]
        pool = pool[calorie_values.notna() & calorie_values.between(lo, hi)]

    if pool.empty:
        return {"status": "no_swap", "food": item["Food_Item"], "category": item["Category"], "metric": metric,
                "message": "No reliable, like-for-like alternative passed the nutrient and calorie rules. Do not force a swap; review the food data or serving size."}

    pool = pool.assign(_src=(pool["Source"] != SL_SOURCE).astype(int))
    pool = pool.sort_values(["_src", metric, "Calories_kcal"], ascending=[True, True, True]).head(max_results)
    return {
        "status": "ok", "food": item["Food_Item"], "category": item["Category"], "metric": metric,
        "current_value": value,
        "note": "Candidates passed the current nutrient-confidence, food-family, and calorie filters. Values are per 100 g; recipe and portion differences still matter.",
        "data_note": reliability_note,
        "swaps": [{"food": r["Food_Item"], "value": float(r[metric]),
                   "calories": None if pd.isna(r["Calories_kcal"]) else float(r["Calories_kcal"]),
                   "source": r["Source"], "data_note": _metric_note(r, metric)}
                  for _, r in pool.iterrows()],
    }


if __name__ == "__main__":
    table = load_table()
    print(f"Loaded {len(table):,} foods from Diet_Lookup_Combined_Final.xlsx")
    print("Example: recommend_swap('Ash plantain curry', metric='Sugar_g')")
    print(recommend_swap("Ash plantain curry", metric="Sugar_g"))
