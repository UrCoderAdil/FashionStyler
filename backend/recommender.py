"""
recommender.py — Hybrid, explainable outfit recommendation engine (v2).

Scoring formula:
  final_score = 0.50 * CLIP_similarity
              + 0.20 * body_match
              + 0.10 * skin_season_match
              + 0.20 * user_preference_match
"""
import torch
from embedder import get_image_embedding
from utils import normalize_score, budget_to_price_range, skin_tone_to_colors, body_type_to_fits

WEIGHTS = {
    "clip_similarity": 0.50,
    "body_match":      0.20,
    "skin_tone_match": 0.10,
    "user_preference": 0.20,
}

# Season → color family mapping
SEASON_COLOR_MAP = {
    "bright_spring": ["warm", "neutral"],
    "warm_spring":   ["warm", "neutral"],
    "light_spring":  ["warm", "neutral"],
    "light_summer":  ["cool", "neutral"],
    "cool_summer":   ["cool", "neutral"],
    "soft_summer":   ["cool", "neutral"],
    "soft_autumn":   ["warm", "neutral"],
    "warm_autumn":   ["warm", "neutral"],
    "deep_autumn":   ["warm", "neutral"],
    "deep_winter":   ["cool", "neutral"],
    "cool_winter":   ["cool", "neutral"],
    "bright_winter": ["cool", "neutral"],
    "unknown":       ["warm", "cool", "neutral"],
}

# 8-type body → compatible outfit body_suit values
BODY_COMPAT = {
    "hourglass":          ["hourglass", "balanced", "wide_hips"],
    "pear":               ["pear", "wide_hips", "balanced"],
    "inverted_triangle":  ["broad_shoulders", "inverted_triangle", "balanced"],
    "rectangle":          ["balanced", "rectangle"],
    "apple":              ["apple", "balanced"],
    "athletic":           ["broad_shoulders", "athletic", "balanced"],
    "diamond":            ["diamond", "balanced"],
    "oval":               ["oval", "balanced"],
    # legacy keys (kept for backward compat)
    "broad_shoulders":    ["broad_shoulders", "inverted_triangle", "balanced"],
    "wide_hips":          ["wide_hips", "pear", "balanced"],
    "balanced":           ["balanced"],
    "unknown":            [],
}


# ---------------------------------------------------------------------------
# Step 1 — Filter
# ---------------------------------------------------------------------------
def filter_outfits(dataset: list[dict], user_preferences: dict) -> list[dict]:
    prefs = user_preferences or {}
    occasion       = prefs.get("occasion", "").strip().lower()
    budget         = prefs.get("budget", "").strip().lower()
    style          = prefs.get("style", "").strip().lower()
    allowed_prices = budget_to_price_range(budget) if budget else None

    filtered = [
        o for o in dataset
        if (not occasion or o.get("occasion") == occasion)
        and (not allowed_prices or o.get("price_range") in allowed_prices)
        and (not style or o.get("style") == style)
    ]

    if len(filtered) < 3:
        print(f"[Recommender] Filters too strict ({len(filtered)}); using full dataset.")
        return dataset

    print(f"[Recommender] {len(filtered)}/{len(dataset)} outfits passed filters.")
    return filtered


# ---------------------------------------------------------------------------
# Step 2 — Scores
# ---------------------------------------------------------------------------
def compute_similarity(user_emb: torch.Tensor, outfit_emb: torch.Tensor) -> float:

    device = outfit_emb.device
    user_emb = user_emb.to(device)
    
    user_emb = user_emb.float()
    outfit_emb = outfit_emb.float()
    
    return float((user_emb @ outfit_emb.T).item())

def compute_body_match(features: dict, outfit: dict) -> float:
    body_type  = features.get("body_type", "unknown")
    if body_type == "unknown":
        return 0.5
    compat    = BODY_COMPAT.get(body_type, [])
    body_suit = outfit.get("body_suit", [])
    if not compat:
        return 0.5
    return 1.0 if any(b in compat for b in body_suit) else 0.0


def compute_skin_tone_match(features: dict, outfit: dict) -> float:
    # Use 12-season if available, fall back to binary skin_tone
    season     = features.get("color_season", "unknown")
    skin_tone  = features.get("skin_tone", features.get("undertone", "unknown"))
    outfit_clr = outfit.get("color", "neutral")

    if season != "unknown":
        good_colors = SEASON_COLOR_MAP.get(season, ["warm", "cool", "neutral"])
        return 1.0 if outfit_clr in good_colors else 0.0
    elif skin_tone != "unknown":
        good_colors = skin_tone_to_colors(skin_tone)
        return 1.0 if outfit_clr in good_colors else 0.0
    return 0.5


def compute_preference_match(prefs: dict, outfit: dict) -> float:
    signals = []
    if prefs.get("style"):
        signals.append(outfit.get("style") == prefs["style"])
    if prefs.get("occasion"):
        signals.append(outfit.get("occasion") == prefs["occasion"])
    if prefs.get("color_preference"):
        signals.append(outfit.get("color") in [prefs["color_preference"], "neutral"])
    if prefs.get("budget"):
        signals.append(outfit.get("price_range") in budget_to_price_range(prefs["budget"]))
    return sum(signals) / len(signals) if signals else 0.5


def compute_final_score(clip_sim, body, skin, pref) -> float:
    return normalize_score(
        WEIGHTS["clip_similarity"] * clip_sim +
        WEIGHTS["body_match"]      * body     +
        WEIGHTS["skin_tone_match"] * skin     +
        WEIGHTS["user_preference"] * pref
    )


# ---------------------------------------------------------------------------
# Step 3 — Explanation
# ---------------------------------------------------------------------------
def generate_explanation(features: dict, prefs: dict, outfit: dict, scores: dict) -> str:
    reasons = []

    sim = scores["clip_similarity"]
    if sim > 0.75:
        reasons.append("Visually very similar to your photo")
    elif sim > 0.55:
        reasons.append("Visually similar style to your photo")

    body_type = features.get("body_type", "unknown")
    if body_type != "unknown" and scores["body_match"] == 1.0:
        reasons.append(f"Cut is flattering for {body_type.replace('_', ' ')} body type")

    season = features.get("color_season", "unknown")
    outfit_clr = outfit.get("color", "neutral")
    if season != "unknown" and scores["skin_tone_match"] == 1.0:
        reasons.append(f"Color ({outfit_clr}) works beautifully for {season.replace('_', ' ')} season")

    if prefs.get("style") and outfit.get("style") == prefs["style"]:
        reasons.append(f"Matches your '{prefs['style']}' style preference")
    if prefs.get("occasion") and outfit.get("occasion") == prefs["occasion"]:
        reasons.append(f"Perfect for a {prefs['occasion']} occasion")
    if prefs.get("budget"):
        if outfit.get("price_range") in budget_to_price_range(prefs["budget"]):
            reasons.append(f"Within your {prefs['budget']} budget")

    if not reasons:
        reasons.append("Strong overall match with your profile")

    return "Recommended because:\n• " + "\n• ".join(reasons)


# ---------------------------------------------------------------------------
# Step 4 — Diversity & top-N
# ---------------------------------------------------------------------------
def _diversity_penalty(candidate: dict, selected: list[dict]) -> float:
    for s in selected:
        if s.get("style") == candidate.get("style") and s.get("color") == candidate.get("color"):
            return 0.85
    return 1.0


def get_top_recommendations(scored: list[dict], top_n: int = 5) -> list[dict]:
    selected, remaining = [], sorted(scored, key=lambda x: x["final_score"], reverse=True)
    while remaining and len(selected) < top_n:
        for c in remaining:
            c["_div"] = c["final_score"] * _diversity_penalty(c, selected)
        remaining.sort(key=lambda x: x["_div"], reverse=True)
        selected.append(remaining.pop(0))
    return selected


# ---------------------------------------------------------------------------
# Master entry point
# ---------------------------------------------------------------------------
def recommend(
    user_image_path: str,
    features: dict,
    dataset: list[dict],
    user_preferences: dict | None = None,
    top_n: int = 5,
) -> list[dict]:
    prefs = user_preferences or {}

    candidates = filter_outfits(dataset, prefs)
    user_emb   = get_image_embedding(user_image_path)

    scored = []
    for outfit in candidates:
        clip_sim   = compute_similarity(user_emb, outfit["embedding"])
        body_match = compute_body_match(features, outfit)
        skin_match = compute_skin_tone_match(features, outfit)
        pref_match = compute_preference_match(prefs, outfit)
        final      = compute_final_score(clip_sim, body_match, skin_match, pref_match)

        sub = {
            "clip_similarity": round(clip_sim,   4),
            "body_match":      round(body_match, 4),
            "skin_tone_match": round(skin_match, 4),
            "pref_match":      round(pref_match, 4),
        }
        scored.append({
            **outfit,
            "scores":      sub,
            "final_score": round(final, 4),
            "explanation": generate_explanation(features, prefs, outfit, sub),
        })

    results = get_top_recommendations(scored, top_n=top_n)
    for r in results:
        r.pop("_div", None)
        r.pop("embedding", None)
    return results
