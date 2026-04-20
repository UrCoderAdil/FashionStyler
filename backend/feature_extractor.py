import cv2
import numpy as np
from sklearn.cluster import KMeans
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
import os

_DIR = os.path.dirname(os.path.abspath(__file__))

# ---------- LOAD MODELS (module-level singleton) ----------
_pose_detector = vision.PoseLandmarker.create_from_options(
    vision.PoseLandmarkerOptions(
        base_options=python.BaseOptions(
            model_asset_path=os.path.join(_DIR, "models", "pose.task")
        ),
        running_mode=vision.RunningMode.IMAGE,
    )
)
_face_detector = vision.FaceDetector.create_from_options(
    vision.FaceDetectorOptions(
        base_options=python.BaseOptions(
            model_asset_path=os.path.join(_DIR, "models", "blaze_face_short_range.tflite")
        ),
        running_mode=vision.RunningMode.IMAGE,
    )
)

# ---------- BODY TYPE STYLE GUIDE ----------
BODY_TYPE_GUIDE = {
    "hourglass": {
        "description": "Balanced proportions with a defined waist.",
        "recommended": ["wrap dresses", "fitted tops", "high-waisted bottoms", "belted styles"],
        "avoid":       ["boxy shapes", "shapeless tunics"],
    },
    "pear": {
        "description": "Hips wider than shoulders — feminine and classic.",
        "recommended": ["A-line skirts", "boat necklines", "statement tops", "dark bottoms"],
        "avoid":       ["tight skirts at hip", "horizontal patterns on lower half"],
    },
    "inverted_triangle": {
        "description": "Broad shoulders, narrow hips — athletic and powerful.",
        "recommended": ["V-neck tops", "A-line skirts", "wide-leg pants", "flared bottoms"],
        "avoid":       ["shoulder pads", "boat necks", "halter tops"],
    },
    "rectangle": {
        "description": "Balanced frame with minimal waist definition.",
        "recommended": ["layered looks", "peplum tops", "ruffles", "belted styles"],
        "avoid":       ["boxy silhouettes", "straight cuts without waist detail"],
    },
    "apple": {
        "description": "Fuller midsection with slimmer legs — confident and bold.",
        "recommended": ["empire waist", "V-necks", "structured jackets", "A-line dresses"],
        "avoid":       ["tight belts at waist", "crop tops", "clingy fabrics at midsection"],
    },
    "athletic": {
        "description": "Muscular build with broad shoulders and defined lines.",
        "recommended": ["soft fabrics", "curved silhouettes", "feminine details", "flared bottoms"],
        "avoid":       ["overly boxy cuts", "shapeless pieces"],
    },
    "diamond": {
        "description": "Wider midsection with narrower shoulders and hips.",
        "recommended": ["wide necklines", "flared pants", "detailed shoulder/hip area"],
        "avoid":       ["tight waistbands", "clingy fabrics at midsection"],
    },
    "oval": {
        "description": "Rounded midsection with slimmer limbs — elegant in the right cuts.",
        "recommended": ["long vertical lines", "V-necks", "elongating silhouettes", "wrap styles"],
        "avoid":       ["horizontal stripes", "tight waistbands", "cropped tops"],
    },
    "unknown": {
        "description": "Could not detect body landmarks clearly.",
        "recommended": ["classic silhouettes work for most body types"],
        "avoid":       [],
    },
}


# ---------- 8-TYPE BODY CLASSIFICATION ----------
def get_body_type(image_rgb: np.ndarray) -> dict:
    """
    Classify body type into 8 categories using MediaPipe Pose landmark ratios.

    Uses shoulder-width / hip-width ratio as primary signal,
    with torso proportions as a secondary signal.

    Returns:
        body_type (str), confidence (float), measurements (dict), style_tips (dict)
    """
    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=image_rgb)
    result = _pose_detector.detect(mp_image)

    if not result.pose_landmarks:
        return {
            "body_type": "unknown",
            "confidence": 0.0,
            "measurements": {},
            "style_tips": BODY_TYPE_GUIDE["unknown"],
        }

    lm = result.pose_landmarks[0]
    h, w, _ = image_rgb.shape

    def pt(idx) -> np.ndarray:
        return np.array([lm[idx].x * w, lm[idx].y * h])

    def dist(a, b) -> float:
        return float(np.linalg.norm(a - b))

    left_shoulder  = pt(11)
    right_shoulder = pt(12)
    left_hip       = pt(23)
    right_hip      = pt(24)
    left_elbow     = pt(13)
    right_elbow    = pt(14)

    shoulder_w  = dist(left_shoulder, right_shoulder)
    hip_w       = dist(left_hip, right_hip)
    torso_h     = dist(
        (left_shoulder + right_shoulder) / 2,
        (left_hip + right_hip) / 2,
    )
    elbow_w   = dist(left_elbow, right_elbow)

    if hip_w == 0:
        return {"body_type": "unknown", "confidence": 0.0, "measurements": {}, "style_tips": BODY_TYPE_GUIDE["unknown"]}

    shr = shoulder_w / hip_w          # shoulder-hip ratio
    elbow_ratio = elbow_w / shoulder_w  # elbow breadth vs shoulders

    # Classification rules
    body_type, confidence = _classify_body(shr, elbow_ratio, torso_h, shoulder_w)

    return {
        "body_type": body_type,
        "confidence": round(confidence, 2),
        "measurements": {
            "shoulder_width_px":  round(shoulder_w, 1),
            "hip_width_px":       round(hip_w, 1),
            "shoulder_hip_ratio": round(shr, 3),
            "torso_height_px":    round(torso_h, 1),
        },
        "style_tips": BODY_TYPE_GUIDE[body_type],
    }


def _classify_body(shr: float, elbow_ratio: float, torso_h: float, shoulder_w: float) -> tuple[str, float]:
    """Map ratio values to 8 body types."""
    if shr > 1.25:
        # Very broad shoulders vs hips
        if elbow_ratio > 0.85:
            return "athletic", 0.82
        return "inverted_triangle", 0.85

    elif shr > 1.10:
        return "athletic", 0.75

    elif shr < 0.80:
        return "pear", 0.85

    elif 0.80 <= shr < 0.92:
        return "hourglass", 0.75  # hips slightly wider + balanced

    elif 0.92 <= shr <= 1.10:
        # Balanced — differentiate by elbow (midsection estimate)
        if elbow_ratio > 0.90:
            return "oval", 0.68
        elif elbow_ratio > 0.80:
            return "apple", 0.72
        elif elbow_ratio < 0.60:
            return "diamond", 0.68
        else:
            return "rectangle", 0.78

    else:
        return "balanced", 0.65  # fallback


# ---------- SKIN TONE (uses color_analysis module) ----------
def get_skin_tone_and_season(image_rgb: np.ndarray) -> dict:
    """
    Detect face, extract skin region, and run 12-season color analysis.
    Returns full color_analysis dict, or fallback if no face detected.
    """
    from color_analysis import analyze_seasonal_color_type

    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=image_rgb)
    result = _face_detector.detect(mp_image)

    if not result.detections:
        return {
            "season": "unknown", "confidence": 0.0,
            "undertone": "unknown", "value": "unknown", "chroma": "unknown",
            "palette": {}, "raw": {},
        }

    bbox = result.detections[0].bounding_box
    x, y, bw, bh = bbox.origin_x, bbox.origin_y, bbox.width, bbox.height
    face_crop = image_rgb[y : y + bh, x : x + bw]

    if face_crop.size == 0:
        return {
            "season": "unknown", "confidence": 0.0,
            "undertone": "unknown", "value": "unknown", "chroma": "unknown",
            "palette": {}, "raw": {},
        }

    return analyze_seasonal_color_type(face_crop)


# ---------- MAIN ----------
def extract_features(image_path: str) -> dict:
    """
    Full feature extraction pipeline:
      - 8-type body classification (MediaPipe Pose)
      - 12-season color analysis  (MediaPipe Face + LAB K-means)

    Returns a flat dict for easy JSON serialization.
    """
    image_bgr = cv2.imread(image_path)
    if image_bgr is None:
        return {
            "body_type": "unknown", "body_confidence": 0.0,
            "measurements": {}, "style_tips": BODY_TYPE_GUIDE["unknown"],
            "color_season": "unknown", "color_confidence": 0.0,
            "undertone": "unknown", "color_palette": {},
        }

    image_rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)

    body  = get_body_type(image_rgb)
    color = get_skin_tone_and_season(image_rgb)

    return {
        # Body
        "body_type":       body["body_type"],
        "body_confidence": body["confidence"],
        "measurements":    body["measurements"],
        "style_tips":      body["style_tips"],
        # Color season
        "color_season":    color["season"],
        "color_confidence": color["confidence"],
        "undertone":        color.get("undertone", "unknown"),
        "color_value":      color.get("value", "unknown"),
        "color_chroma":     color.get("chroma", "unknown"),
        "color_palette":    color.get("palette", {}),
        # Legacy backward-compat fields
        "skin_tone":        color.get("undertone", "unknown"),
    }
