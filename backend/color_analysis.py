"""
color_analysis.py — 12-Season Color Analysis System

Classifies skin undertone into one of 12 seasonal subtypes using
LAB color space analysis on the detected face region.

Season families:
  Spring (warm + light/clear): bright_spring, warm_spring, light_spring
  Summer (cool + soft/muted):  light_summer, cool_summer, soft_summer
  Autumn (warm + deep/muted):  soft_autumn, warm_autumn, deep_autumn
  Winter (cool + deep/clear):  deep_winter, cool_winter, bright_winter
"""
import cv2
import numpy as np
from sklearn.cluster import KMeans

# ---------------------------------------------------------------------------
# Season Palette Database
# ---------------------------------------------------------------------------
SEASONAL_PALETTES = {
    "bright_spring": {
        "family": "spring", "undertone": "warm",
        "description": "Clear, warm tones with high contrast and brightness.",
        "characteristics": ["warm", "clear", "bright"],
        "best_colors": ["#FF6B6B", "#FFA07A", "#FFD700", "#FF69B4", "#00CED1", "#7FFF00"],
        "avoid_colors": ["#2C3E50", "#7F8C8D", "#708090"],
        "metals": ["gold", "copper"],
        "makeup_tips": "Coral blush, warm-toned lipsticks (orange-red, coral, bright pink).",
    },
    "warm_spring": {
        "family": "spring", "undertone": "warm",
        "description": "Peachy, golden warmth — sun-kissed and fresh.",
        "characteristics": ["warm", "light", "clear"],
        "best_colors": ["#FFDAB9", "#FFB347", "#F0E68C", "#98FB98", "#87CEEB", "#DDA0DD"],
        "avoid_colors": ["#000000", "#191970", "#8B008B"],
        "metals": ["gold", "rose_gold"],
        "makeup_tips": "Peach blush, warm nude lips, golden highlighter.",
    },
    "light_spring": {
        "family": "spring", "undertone": "warm",
        "description": "Delicate, airy pastels with a warm golden base.",
        "characteristics": ["warm", "light", "delicate"],
        "best_colors": ["#FFF5EE", "#FFEFD5", "#F0FFF0", "#E0FFFF", "#FFE4E1", "#FFFACD"],
        "avoid_colors": ["#000000", "#8B0000", "#00008B"],
        "metals": ["light_gold", "rose_gold"],
        "makeup_tips": "Soft peach blush, light coral lips, subtle shimmer.",
    },
    "light_summer": {
        "family": "summer", "undertone": "cool",
        "description": "Soft, cool pastels — pale and ethereal.",
        "characteristics": ["cool", "light", "soft"],
        "best_colors": ["#E6E6FA", "#B0E0E6", "#DDA0DD", "#FFB6C1", "#D8BFD8", "#E0B0FF"],
        "avoid_colors": ["#FF4500", "#8B4513", "#FFD700"],
        "metals": ["silver", "white_gold"],
        "makeup_tips": "Rose blush, mauve or soft berry lips, pink-toned highlighter.",
    },
    "cool_summer": {
        "family": "summer", "undertone": "cool",
        "description": "Muted cool tones — sophisticated and understated.",
        "characteristics": ["cool", "soft", "muted"],
        "best_colors": ["#B0C4DE", "#778899", "#9370DB", "#BA55D3", "#DDA0DD", "#C0C0C0"],
        "avoid_colors": ["#FF8C00", "#FF6347", "#DAA520"],
        "metals": ["silver", "platinum"],
        "makeup_tips": "Cool-toned blush, berry or mauve lips, silver highlights.",
    },
    "soft_summer": {
        "family": "summer", "undertone": "cool",
        "description": "Neutral-cool, grayed muted tones — quietly elegant.",
        "characteristics": ["cool", "muted", "neutral"],
        "best_colors": ["#C0C0C0", "#B0C4DE", "#D8BFD8", "#DEB887", "#BC8F8F", "#D3D3D3"],
        "avoid_colors": ["#FF0000", "#FFD700", "#00FF00"],
        "metals": ["silver", "brushed_silver"],
        "makeup_tips": "Dusty rose blush, muted berry lips, soft shimmer.",
    },
    "soft_autumn": {
        "family": "autumn", "undertone": "warm",
        "description": "Muted, earthy warmth — approachable and grounded.",
        "characteristics": ["warm", "muted", "soft"],
        "best_colors": ["#D2B48C", "#BC8F8F", "#F4A460", "#CD853F", "#DEB887", "#BDB76B"],
        "avoid_colors": ["#FF1493", "#00CED1", "#7FFF00"],
        "metals": ["bronze", "antique_gold"],
        "makeup_tips": "Terracotta blush, nude/brick lips, warm bronzer.",
    },
    "warm_autumn": {
        "family": "autumn", "undertone": "warm",
        "description": "Rich, golden earth tones — vibrant and grounded.",
        "characteristics": ["warm", "rich", "earthy"],
        "best_colors": ["#8B4513", "#D2691E", "#FF8C00", "#DAA520", "#B8860B", "#556B2F"],
        "avoid_colors": ["#FF69B4", "#00CED1", "#E0FFFF"],
        "metals": ["gold", "bronze"],
        "makeup_tips": "Warm rust or terracotta lips, bronze contour, gold highlighter.",
    },
    "deep_autumn": {
        "family": "autumn", "undertone": "warm",
        "description": "Deep, lush, jewel-toned warmth — dramatic and bold.",
        "characteristics": ["warm", "deep", "rich"],
        "best_colors": ["#8B0000", "#800000", "#8B4513", "#556B2F", "#2F4F4F", "#6B3FA0"],
        "avoid_colors": ["#FFC0CB", "#E0FFFF", "#F0FFF0"],
        "metals": ["gold", "copper"],
        "makeup_tips": "Deep burgundy or red-brown lips, rich bronzer.",
    },
    "deep_winter": {
        "family": "winter", "undertone": "cool",
        "description": "Deep, cool, ultra-saturated — commanding and sleek.",
        "characteristics": ["cool", "deep", "clear"],
        "best_colors": ["#000080", "#4B0082", "#800080", "#006400", "#8B0000", "#191970"],
        "avoid_colors": ["#FFDAB9", "#FFE4B5", "#F0E68C"],
        "metals": ["silver", "platinum"],
        "makeup_tips": "True red or burgundy lips, cool-toned contour, silver highlighter.",
    },
    "cool_winter": {
        "family": "winter", "undertone": "cool",
        "description": "Icy, cool, striking — high contrast and crystal-clear.",
        "characteristics": ["cool", "clear", "icy"],
        "best_colors": ["#0000FF", "#FF1493", "#00FF7F", "#00CED1", "#FF00FF", "#FFFFFF"],
        "avoid_colors": ["#D2691E", "#CD853F", "#BC8F8F"],
        "metals": ["silver", "white_gold"],
        "makeup_tips": "Blue-red or hot pink lips, cool highlighter, icy shimmer.",
    },
    "bright_winter": {
        "family": "winter", "undertone": "cool",
        "description": "Vivid, cool, high contrast — electric and modern.",
        "characteristics": ["cool", "clear", "bright"],
        "best_colors": ["#FF0000", "#0000FF", "#FF00FF", "#00FF00", "#000000", "#FFFFFF"],
        "avoid_colors": ["#D2B48C", "#F4A460", "#DEB887"],
        "metals": ["silver", "platinum"],
        "makeup_tips": "True red or electric pink lips, dramatic eye, bright highlighter.",
    },
}


def _rgb_to_lab(rgb_pixel: np.ndarray) -> tuple[float, float, float]:
    """Convert single RGB pixel (0-255) to LAB values."""
    img = (rgb_pixel / 255.0).reshape(1, 1, 3).astype(np.float32)
    lab = cv2.cvtColor(img, cv2.COLOR_RGB2LAB)
    L, a, b = lab[0, 0]
    return float(L), float(a), float(b)


def analyze_seasonal_color_type(face_rgb: np.ndarray) -> dict:
    """
    Classify the user's seasonal color type from a face crop (RGB numpy array).

    Process:
      1. Filter out too-dark / too-bright pixels
      2. K-means to find dominant skin color
      3. Convert to LAB: L=lightness, a*=red-green, b*=blue-yellow
      4. Derive: undertone (warm/cool), value (light/deep), chroma (clear/muted)
      5. Map to 12 seasonal types

    Returns dict with: season, confidence, undertone, value, chroma, palette
    """
    pixels = face_rgb.reshape(-1, 3).astype(np.float32)

    # Remove very dark / very bright pixels (hair, specular highlights)
    brightness = pixels.mean(axis=1)
    mask = (brightness > 50) & (brightness < 210)
    skin_pixels = pixels[mask]

    if len(skin_pixels) < 50:
        fallback = "warm_autumn"
        return {
            "season": fallback,
            "confidence": 0.40,
            "undertone": "warm",
            "value": "medium",
            "chroma": "medium",
            "palette": SEASONAL_PALETTES[fallback],
        }

    # Dominant skin color via K-means
    n_clusters = min(3, len(skin_pixels))
    kmeans = KMeans(n_clusters=n_clusters, n_init=10, random_state=42)
    kmeans.fit(skin_pixels)
    colors = kmeans.cluster_centers_
    counts = np.bincount(kmeans.labels_)
    dominant = colors[np.argmax(counts)]

    L, a_star, b_star = _rgb_to_lab(dominant)

    # --- Classify characteristics ---
    # Undertone: b* (yellow-blue axis) vs a* (green-red axis)
    # More yellow warmth → warm undertone
    is_warm = b_star > (a_star * 0.8)

    # Value: L* lightness [0–100]
    is_light = L > 68
    is_deep  = L < 48

    # Chroma: distance from gray in a*b* plane
    chroma = float(np.sqrt(a_star**2 + b_star**2))
    is_clear  = chroma > 32
    is_muted  = chroma < 18

    value_label  = "light" if is_light else ("deep" if is_deep else "medium")
    chroma_label = "clear" if is_clear else ("muted" if is_muted else "medium")
    undertone    = "warm" if is_warm else "cool"

    # --- Season mapping ---
    season = _map_to_season(is_warm, is_light, is_deep, is_clear, is_muted)
    confidence = _estimate_confidence(L, chroma, is_warm, is_light, is_deep, is_clear, is_muted)

    return {
        "season":     season,
        "confidence": round(confidence, 2),
        "undertone":  undertone,
        "value":      value_label,
        "chroma":     chroma_label,
        "palette":    SEASONAL_PALETTES[season],
        "raw":        {"L": round(L, 2), "a": round(a_star, 2), "b": round(b_star, 2)},
    }


def _map_to_season(is_warm, is_light, is_deep, is_clear, is_muted) -> str:
    """Rule-based mapping from color characteristics to 12 seasons."""
    if is_warm:
        if is_light:
            return "bright_spring" if is_clear else "light_spring"
        elif is_deep:
            return "deep_autumn" if is_clear else "warm_autumn"
        else:
            return "warm_spring" if is_clear else "soft_autumn"
    else:  # cool
        if is_light:
            return "light_summer" if not is_clear else "bright_winter"
        elif is_deep:
            return "deep_winter" if is_clear else "cool_winter"
        else:
            return "bright_winter" if is_clear else ("soft_summer" if is_muted else "cool_summer")


def _estimate_confidence(L, chroma, is_warm, is_light, is_deep, is_clear, is_muted) -> float:
    """Higher confidence when characteristics are unambiguous."""
    base = 0.65
    # Strong signals boost confidence
    if (is_light or is_deep) and (is_clear or is_muted):
        base += 0.15
    if chroma > 40 or chroma < 12:
        base += 0.10
    if L > 75 or L < 40:
        base += 0.05
    return min(0.95, base)
