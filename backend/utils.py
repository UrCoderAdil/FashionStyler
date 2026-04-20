"""
utils.py — Shared utility helpers for AI Personal Stylist backend.
"""


def normalize_score(value: float, min_val: float = 0.0, max_val: float = 1.0) -> float:
    """Clamp a value to [min_val, max_val]."""
    return max(min_val, min(max_val, value))


def budget_to_price_range(budget: str) -> list[str]:
    """
    Map a user-facing budget string to allowed price_range values.
    Budget tiers: 'low' → ['low'], 'medium' → ['low', 'medium'], 'high' → all
    """
    mapping = {
        "low":    ["low"],
        "medium": ["low", "medium"],
        "high":   ["low", "medium", "high"],
    }
    return mapping.get(budget.lower(), ["low", "medium", "high"])


def skin_tone_to_colors(skin_tone: str) -> list[str]:
    """
    Map detected skin tone to complementary outfit color categories.
    warm skin → earthy/warm outfits
    cool skin → jewel-tone/cool outfits
    Both always include neutral.
    """
    mapping = {
        "warm":    ["warm", "neutral"],
        "cool":    ["cool", "neutral"],
        "unknown": ["warm", "cool", "neutral"],
    }
    return mapping.get(skin_tone, ["warm", "cool", "neutral"])


def body_type_to_fits(body_type: str) -> list[str]:
    """
    Recommend fits based on body type.
    broad_shoulders → prefer slim / structured
    wide_hips        → prefer loose / A-line
    balanced         → both work
    """
    mapping = {
        "broad_shoulders": ["slim"],
        "wide_hips":       ["loose"],
        "balanced":        ["slim", "loose"],
        "unknown":         ["slim", "loose"],
    }
    return mapping.get(body_type, ["slim", "loose"])
