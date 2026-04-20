import cv2
import numpy as np
from sklearn.cluster import KMeans
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
import os

_DIR = os.path.dirname(os.path.abspath(__file__))

# ---------- LOAD MODELS (module-level singleton) ----------
base_options_pose = python.BaseOptions(
    model_asset_path=os.path.join(_DIR, "models", "pose.task")
)
pose_detector = vision.PoseLandmarker.create_from_options(
    vision.PoseLandmarkerOptions(
        base_options=base_options_pose,
        running_mode=vision.RunningMode.IMAGE,
    )
)

base_options_face = python.BaseOptions(
    model_asset_path=os.path.join(_DIR, "models", "blaze_face_short_range.tflite")
)
face_detector = vision.FaceDetector.create_from_options(
    vision.FaceDetectorOptions(
        base_options=base_options_face,
        running_mode=vision.RunningMode.IMAGE,
    )
)


# ---------- BODY TYPE ----------
def get_body_type(image_rgb: np.ndarray) -> str:
    """
    Use MediaPipe Pose to classify body shape from shoulder/hip ratio.
    Returns: 'broad_shoulders' | 'wide_hips' | 'balanced' | 'unknown'
    """
    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=image_rgb)
    result = pose_detector.detect(mp_image)

    if not result.pose_landmarks:
        return "unknown"

    landmarks = result.pose_landmarks[0]
    h, w, _ = image_rgb.shape

    def to_xy(lm):
        return int(lm.x * w), int(lm.y * h)

    def dist(a, b):
        return ((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2) ** 0.5

    ls = to_xy(landmarks[11])  # left shoulder
    rs = to_xy(landmarks[12])  # right shoulder
    lh = to_xy(landmarks[23])  # left hip
    rh = to_xy(landmarks[24])  # right hip

    shoulder_width = dist(ls, rs)
    hip_width = dist(lh, rh)

    if hip_width == 0:
        return "unknown"

    ratio = shoulder_width / hip_width
    if ratio > 1.1:
        return "broad_shoulders"
    elif ratio < 0.9:
        return "wide_hips"
    else:
        return "balanced"


# ---------- SKIN TONE ----------
def get_skin_tone(image_rgb: np.ndarray) -> str:
    """
    Detect dominant skin tone from the face region using K-Means clustering.
    Returns: 'warm' | 'cool' | 'unknown'
    """
    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=image_rgb)
    result = face_detector.detect(mp_image)

    if not result.detections:
        return "unknown"

    bbox = result.detections[0].bounding_box
    x, y, w, h = bbox.origin_x, bbox.origin_y, bbox.width, bbox.height
    face_crop = image_rgb[y:y + h, x:x + w]

    if face_crop.size == 0:
        return "unknown"

    pixels = face_crop.reshape(-1, 3).astype(np.float32)
    kmeans = KMeans(n_clusters=3, n_init=10, random_state=42)
    kmeans.fit(pixels)

    colors = kmeans.cluster_centers_
    counts = np.bincount(kmeans.labels_)
    dominant = colors[np.argmax(counts)]

    r, g, b = dominant
    # Warm: red channel dominates → earthy / orange undertones
    return "warm" if r > b else "cool"


# ---------- MAIN ----------
def extract_features(image_path: str) -> dict:
    """
    Extract body type and skin tone from an image file.

    Returns:
        {"body_type": str, "skin_tone": str}
    """
    image_bgr = cv2.imread(image_path)
    if image_bgr is None:
        return {"body_type": "unknown", "skin_tone": "unknown"}

    # OpenCV loads BGR — convert to RGB for MediaPipe
    image_rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)

    body = get_body_type(image_rgb)
    skin = get_skin_tone(image_rgb)

    return {"body_type": body, "skin_tone": skin}
