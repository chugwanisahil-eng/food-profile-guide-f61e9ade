"""
services/verdict.py
Profile-aware verdict engine.

Takes a normalised product dict + user profile dict and returns:
  {
    "verdict":        "good" | "warn" | "bad",
    "reason":         str,
    "allergen_hits":  list[str],
    "insights":       list[str],
    "nutriment_flags":list[dict],
  }
"""

import json
import logging

logger = logging.getLogger(__name__)

# ── Per-100g thresholds (UK/EU traffic-light style) ──────────────────────────
THRESHOLDS = {
    "fat":           {"warn": 17.5, "bad": 21.0},
    "saturated_fat": {"warn":  5.0, "bad":  6.0},
    "sugars":        {"warn": 11.25,"bad": 13.5},
    "salt":          {"warn":  1.5, "bad":  1.8},
    "sodium":        {"warn":  0.6, "bad":  0.72},
}

# Goal → nutriments to watch (lower is better for flagging)
GOAL_WATCH = {
    "weight loss":  ["energy_kcal", "sugars", "fat"],
    "muscle gain":  [],   # protein is good; just check energy
    "heart health": ["saturated_fat", "salt", "sodium"],
    "gut health":   ["sugars"],
    "low-carb":     ["carbohydrates", "sugars"],
}

# Condition → allergen / ingredient keywords to flag
CONDITION_FLAGS = {
    "type 2 diabetes":  ["sugars", "glucose", "fructose", "corn syrup"],
    "high cholesterol": ["saturated-fat", "palm oil", "hydrogenated"],
    "hypertension":     ["salt", "sodium"],
    "ibs":              ["fructose", "lactose", "sorbitol", "inulin"],
    "celiac":           ["gluten", "wheat", "barley", "rye"],
}


def compute_verdict(product: dict, profile: dict) -> dict:
    """
    product  — normalised OFF dict (from services/openfoodfacts.py)
    profile  — user_profiles row (conditions, goals, allergies, diet as lists)
    """
    allergens    = _parse_list(product.get("allergens", []))
    nutriments   = product.get("nutriments", {})
    ingredients  = (product.get("ingredients") or "").lower()
    labels       = _parse_list(product.get("labels", []))

    user_allergies   = [a.lower() for a in _parse_list(profile.get("allergies",   []))]
    user_conditions  = [c.lower() for c in _parse_list(profile.get("conditions",  []))]
    user_goals       = [g.lower() for g in _parse_list(profile.get("goals",       []))]
    user_diet        = [d.lower() for d in _parse_list(profile.get("diet",        []))]

    insights         = []
    nutriment_flags  = []
    allergen_hits    = []
    bad_reasons      = []
    warn_reasons     = []

    # ── 1. Allergy check (immediate BAD) ────────────────────────────────────
    for allergy in user_allergies:
        for allergen in allergens:
            if allergy in allergen or allergen in allergy:
                allergen_hits.append(allergen)
                bad_reasons.append(f"Contains {allergen} — listed in your allergy profile")

    # Also scan ingredients text for allergy words
    for allergy in user_allergies:
        if allergy in ingredients and allergy not in [a.lower() for a in allergen_hits]:
            allergen_hits.append(allergy)
            bad_reasons.append(f"Ingredient list contains '{allergy}'")

    # ── 2. Nutriment traffic-light check ────────────────────────────────────
    for key, limits in THRESHOLDS.items():
        val = nutriments.get(key, 0) or 0
        label = key.replace("_", " ").title()
        if val >= limits["bad"]:
            nutriment_flags.append({"nutriment": key, "value": val, "level": "bad"})
            warn_reasons.append(f"{label} is high ({val}g per 100g)")
        elif val >= limits["warn"]:
            nutriment_flags.append({"nutriment": key, "value": val, "level": "warn"})
            insights.append(f"{label} is moderate — keep an eye on portions")

    # ── 3. Goal-based insights ───────────────────────────────────────────────
    for goal in user_goals:
        for goal_key, watch_keys in GOAL_WATCH.items():
            if goal_key in goal:
                for wk in watch_keys:
                    val = nutriments.get(wk, 0) or 0
                    label = wk.replace("_", " ").title()
                    if val > 0:
                        if goal_key == "weight loss" and wk == "energy_kcal" and val > 250:
                            warn_reasons.append(f"Calories ({val} kcal/100g) may be high for weight loss")
                        elif goal_key == "low-carb" and wk == "carbohydrates" and val > 20:
                            warn_reasons.append(f"Carbs ({val}g/100g) — higher than low-carb threshold")
                        else:
                            insights.append(f"{label} noted for your '{goal}' goal")

    # ── 4. Condition-based checks ────────────────────────────────────────────
    for condition in user_conditions:
        for cond_key, cond_flags in CONDITION_FLAGS.items():
            if cond_key in condition:
                for flag in cond_flags:
                    if flag in ingredients:
                        warn_reasons.append(f"'{flag}' detected — relevant for {cond_key}")
                    # Check nutriments too
                    nm_key = flag.replace("-", "_")
                    if nutriments.get(nm_key, 0) and flag in THRESHOLDS:
                        pass  # already caught by nutriment check above

    # ── 5. Diet compatibility ────────────────────────────────────────────────
    for diet_pref in user_diet:
        if diet_pref == "vegan":
            vegan_non = ["milk", "eggs", "honey", "gelatin", "whey", "casein", "lactose"]
            for item in vegan_non:
                if item in ingredients:
                    warn_reasons.append(f"Contains '{item}' — may not be vegan")
                    break
        elif diet_pref == "vegetarian":
            for item in ["gelatin", "lard", "rennet", "anchovies"]:
                if item in ingredients:
                    warn_reasons.append(f"Contains '{item}' — not vegetarian")
                    break
        elif diet_pref == "halal":
            for item in ["pork", "lard", "alcohol", "wine", "beer"]:
                if item in ingredients:
                    bad_reasons.append(f"Contains '{item}' — not halal")
                    break
        elif "gluten" in diet_pref or diet_pref == "celiac":
            for item in ["wheat", "barley", "rye", "gluten"]:
                if item in ingredients or item in " ".join(allergens):
                    bad_reasons.append(f"Contains gluten ({item})")
                    break

    # ── 6. Positive insights ─────────────────────────────────────────────────
    protein = nutriments.get("proteins", 0) or 0
    fiber   = nutriments.get("fiber", 0) or 0
    if protein >= 10:
        insights.append(f"Good protein content ({protein}g/100g)")
    if fiber >= 3:
        insights.append(f"Good source of fiber ({fiber}g/100g)")
    if "organic" in " ".join(labels):
        insights.append("Certified organic")
    if "vegan" in " ".join(labels) and "vegan" in user_diet:
        insights.append("Vegan-certified — matches your diet")

    # ── 7. Determine final verdict ───────────────────────────────────────────
    if bad_reasons:
        verdict = "bad"
        reason  = bad_reasons[0]
    elif warn_reasons:
        verdict = "warn"
        reason  = warn_reasons[0]
    else:
        verdict = "good"
        reason  = "Looks good for your profile!"

    # Deduplicate insights
    seen = set()
    unique_insights = []
    for i in insights:
        if i not in seen:
            seen.add(i)
            unique_insights.append(i)

    return {
        "verdict":         verdict,
        "reason":          reason,
        "allergen_hits":   list(set(allergen_hits)),
        "warn_reasons":    warn_reasons,
        "insights":        unique_insights[:6],
        "nutriment_flags": nutriment_flags,
    }


def _parse_list(value) -> list:
    if isinstance(value, list):
        return value
    if isinstance(value, str):
        try:
            return json.loads(value)
        except (json.JSONDecodeError, TypeError):
            return []
    return []
