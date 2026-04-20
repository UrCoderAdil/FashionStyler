"""
recommender.py — Hybrid, explainable outfit recommendation engine.

Pipeline:
  1. filter_outfits()      — hard filter by occasion / budget / style
  2. compute_similarity()  — CLIP cosine similarity
  3. compute_final_score() — weighted hybrid score
  4. get_top_recommendations() — diversity-aware top-N selection
  5. generate_explanation() — human-readable reasoning
"""
import torch
from embedder import get_image_embedding
from utils import (
    normalize_score,
    budget_to_price_range,
    skin_tone_to_colors,
    body_type_to_fits,
)

# ---------------------------------------------------------------------------
# Scoring weights (must sum to 1.0)
# ---------------------------------------------------------------------------
WEIGHTS = {
    "clip_similarity":     0.50,
    "body_match":          0.20,
    "skin_tone_match":     0.10,
    "user_preference":     0.20,
}


# ---------------------------------------------------------------------------
# Step 1 — Filter
# ---------------------------------------------------------------------------
def filter_outfits(
    dataset: list[dict],
    user_preferences: dict,
) -> list[dict]:
    """
    Hard-filter the dataset by occasion, budget, and style.
    Returns a (potentially smaller) list to score.

    Filtering rules:
    - occasion: exact match if provided
    - budget:   price_range must be within budget tier
    - style:    exact match if provided

    Falls back to the full dataset if the filter is too aggressive (<3 results).
    """
    prefs = user_preferences or {}
    occasion  = prefs.get("occasion", "").strip().lower()
    budget    = prefs.get("budget", "").strip().lower()
    style     = prefs.get("style", "").strip().lower()

    allowed_prices = budget_to_price_range(budget) if budget else None

    filtered = []
    for outfit in dataset:
        # Occasion filter
        if occasion and outfit.get("occasion") != occasion:
            continue
        # Budget filter
        if allowed_prices and outfit.get("price_range") not in allowed_prices:
            continue
        # Style filter
        if style and outfit.get("style") != style:
            continue

        filtered.append(outfit)

    if len(filtered) < 3:
        # Filters are too strict — relax to full dataset
        print(f"[Recommender] Filter too strict ({len(filtered)} results); using full dataset.")
        return dataset

    print(f"[Recommender] {len(filtered)}/{len(dataset)} outfits passed filters.")
    return filtered


# ---------------------------------------------------------------------------
# Step 2 — CLIP similarity
# ---------------------------------------------------------------------------
def compute_similarity(user_embedding: torch.Tensor, outfit_embedding: torch.Tensor) -> float:
    """Cosine similarity between two L2-normalised CLIP embeddings → [0, 1]."""
    return float((user_embedding @ outfit_embedding.T).item())


# ---------------------------------------------------------------------------
# Step 3 — Rule-based subscores
# ---------------------------------------------------------------------------
def compute_body_match(features: dict, outfit: dict) -> float:
    """
    1.0 if the user's body type is in outfit['body_suit'], else 0.0.
    Returns 0.5 if body_type is unknown (neutral penalty).
    """
    body_type = features.get("body_type", "unknown")
    if body_type == "unknown":
        return 0.5
    body_suit = outfit.get("body_suit", [])
    return 1.0 if body_type in body_suit else 0.0


def compute_skin_tone_match(features: dict, outfit: dict) -> float:
    """
    1.0 if outfit color complements the detected skin tone, else 0.0.
    Returns 0.5 if skin_tone is unknown.
    """
    skin_tone = features.get("skin_tone", "unknown")
    if skin_tone == "unknown":
        return 0.5
    complementary_colors = skin_tone_to_colors(skin_tone)
    outfit_color = outfit.get("color", "neutral")
    return 1.0 if outfit_color in complementary_colors else 0.0


def compute_preference_match(user_preferences: dict, outfit: dict) -> float:
    """
    Score based on how many user preferences the outfit satisfies.
    Possible signals: style, occasion, color_preference.
    Each matching signal adds (1 / total_signals) to the score.
    """
    prefs   = user_preferences or {}
    signals = []

    # Style preference
    pref_style = prefs.get("style", "").strip().lower()
    if pref_style:
        signals.append(outfit.get("style") == pref_style)

    # Occasion preference
    pref_occasion = prefs.get("occasion", "").strip().lower()
    if pref_occasion:
        signals.append(outfit.get("occasion") == pref_occasion)

    # Color preference
    pref_color = prefs.get("color_preference", "").strip().lower()
    if pref_color:
        outfit_color = outfit.get("color", "neutral")
        signals.append(outfit_color == pref_color or outfit_color == "neutral")

    # Budget match (softer signal — check fit within tier)
    pref_budget = prefs.get("budget", "").strip().lower()
    if pref_budget:
        allowed = budget_to_price_range(pref_budget)
        signals.append(outfit.get("price_range") in allowed)

    if not signals:
        return 0.5  # No preferences given → neutral

    return sum(signals) / len(signals)


# ---------------------------------------------------------------------------
# Step 4 — Combine into final hybrid score
# ---------------------------------------------------------------------------
def compute_final_score(
    clip_sim: float,
    body_match: float,
    skin_match: float,
    pref_match: float,
) -> float:
    """Weighted hybrid score (all components already in [0, 1])."""
    score = (
        WEIGHTS["clip_similarity"]  * clip_sim   +
        WEIGHTS["body_match"]       * body_match  +
        WEIGHTS["skin_tone_match"]  * skin_match  +
        WEIGHTS["user_preference"]  * pref_match
    )
    return normalize_score(score)


# ---------------------------------------------------------------------------
# Step 5 — Explainable output
# ---------------------------------------------------------------------------
def generate_explanation(
    features: dict,
    user_preferences: dict,
    outfit: dict,
    scores: dict,
) -> str:
    """
    Build a human-readable explanation of why this outfit was recommended.
    """
    reasons: list[str] = []

    # CLIP similarity signal
    sim = scores["clip_similarity"]
    if sim > 0.75:
        reasons.append("Visually very similar to your photo")
    elif sim > 0.55:
        reasons.append("Visually similar style to your photo")

    # Body type
    body_type = features.get("body_type", "unknown")
    body_suit = outfit.get("body_suit", [])
    if body_type != "unknown" and body_type in body_suit:
        label = body_type.replace("_", " ")
        reasons.append(f"Cut designed for {label} body type")
    elif body_type == "unknown":
        reasons.append("Works for a variety of body types")

    # Skin tone
    skin_tone = features.get("skin_tone", "unknown")
    outfit_color = outfit.get("color", "neutral")
    if skin_tone != "unknown":
        complementary = skin_tone_to_colors(skin_tone)
        if outfit_color in complementary:
            reasons.append(
                f"Color ({outfit_color}) complements your {skin_tone} skin tone"
            )

    # Style preference
    pref_style = (user_preferences or {}).get("style", "").strip()
    if pref_style and outfit.get("style") == pref_style:
        reasons.append(f"Matches your preferred '{pref_style}' style")

    # Occasion
    pref_occasion = (user_preferences or {}).get("occasion", "").strip()
    if pref_occasion and outfit.get("occasion") == pref_occasion:
        reasons.append(f"Perfect for a {pref_occasion} occasion")

    # Budget
    pref_budget = (user_preferences or {}).get("budget", "").strip()
    if pref_budget:
        allowed = budget_to_price_range(pref_budget)
        if outfit.get("price_range") in allowed:
            reasons.append(f"Within your {pref_budget} budget")

    if not reasons:
        reasons.append("Strong overall match with your profile")

    return "Recommended because:\n• " + "\n• ".join(reasons)


# ---------------------------------------------------------------------------
# Step 6 — Diversity-aware top-N selection
# ---------------------------------------------------------------------------
def _diversity_penalty(candidate: dict, already_selected: list[dict]) -> float:
    """
    Soft penalty if candidate has the same (style, color) as an already-selected outfit.
    Returns a multiplier: 1.0 (no penalty) → 0.85 (slight penalty).
    """
    for sel in already_selected:
        if sel.get("style") == candidate.get("style") and sel.get("color") == candidate.get("color"):
            return 0.85
    return 1.0


def get_top_recommendations(
    scored_outfits: list[dict],
    top_n: int = 5,
    diversity: bool = True,
) -> list[dict]:
    """
    Select top_n recommendations from a sorted (descending final_score) list.
    With diversity=True, applies a soft penalty for duplicated style+color combos
    to ensure variety in the results.
    """
    if not diversity:
        return scored_outfits[:top_n]

    selected: list[dict] = []
    remaining = sorted(scored_outfits, key=lambda x: x["final_score"], reverse=True)

    while remaining and len(selected) < top_n:
        # Re-sort remaining by penalised score at each step
        for candidate in remaining:
            penalty = _diversity_penalty(candidate, selected)
            candidate["_diversity_score"] = candidate["final_score"] * penalty

        remaining.sort(key=lambda x: x["_diversity_score"], reverse=True)
        best = remaining.pop(0)
        selected.append(best)

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
    """
    Full recommendation pipeline.

    Args:
        user_image_path: Absolute path to the uploaded user image.
        features:        Result from feature_extractor.extract_features().
        dataset:         Outfit list from dataset_loader (with embeddings attached).
        user_preferences: Optional dict with style, occasion, budget, color_preference.
        top_n:           How many recommendations to return.

    Returns:
        List of top_n outfit dicts enriched with scoring and explanation.
    """
    prefs = user_preferences or {}

    # Step 1 — Filter
    candidates = filter_outfits(dataset, prefs)

    # Step 2 — Embed user image
    user_emb = get_image_embedding(user_image_path)

    # Step 3 + 4 — Score every candidate
    scored: list[dict] = []
    for outfit in candidates:
        clip_sim   = compute_similarity(user_emb, outfit["embedding"])
        body_match = compute_body_match(features, outfit)
        skin_match = compute_skin_tone_match(features, outfit)
        pref_match = compute_preference_match(prefs, outfit)
        final      = compute_final_score(clip_sim, body_match, skin_match, pref_match)

        sub_scores = {
            "clip_similarity": round(clip_sim,   4),
            "body_match":      round(body_match, 4),
            "skin_tone_match": round(skin_match, 4),
            "pref_match":      round(pref_match, 4),
        }

        explanation = generate_explanation(features, prefs, outfit, sub_scores)

        scored.append({
            **outfit,
            "scores":      sub_scores,
            "final_score": round(final, 4),
            "explanation": explanation,
        })

    # Step 5 — Diversity-aware top-N
    results = get_top_recommendations(scored, top_n=top_n, diversity=True)

    # Clean up internal keys before returning
    for r in results:
        r.pop("_diversity_score", None)
        r.pop("embedding", None)   # Don't serialise tensors

    return results
