import cv2
import numpy as np
from sklearn.cluster import KMeans

import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision


# ---------- LOAD MODELS ----------
base_options_pose = python.BaseOptions(model_asset_path="models/pose.task")
pose_options = vision.PoseLandmarkerOptions(
    base_options=base_options_pose,
    running_mode=vision.RunningMode.IMAGE
)

pose_detector = vision.PoseLandmarker.create_from_options(pose_options)


model_path = "models/blaze_face_short_range.tflite" 

base_options_face = python.BaseOptions(model_asset_path=model_path)
face_options = vision.FaceDetectorOptions(
    base_options=base_options_face,
    running_mode=vision.RunningMode.IMAGE
)

face_detector = vision.FaceDetector.create_from_options(face_options)

# ---------- BODY TYPE ----------
def get_body_type(image):

    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=image)

    result = pose_detector.detect(mp_image)

    if not result.pose_landmarks:
        return "unknown"

    landmarks = result.pose_landmarks[0]

    def to_xy(lm):
        h, w, _ = image.shape
        return int(lm.x * w), int(lm.y * h)

    ls = to_xy(landmarks[11])
    rs = to_xy(landmarks[12])
    lh = to_xy(landmarks[23])
    rh = to_xy(landmarks[24])

    def dist(a, b):
        return ((a[0]-b[0])**2 + (a[1]-b[1])**2) ** 0.5

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
def get_skin_tone(image):

    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=image)

    result = face_detector.detect(mp_image)

    if not result.detections:
        return "unknown"

    bbox = result.detections[0].bounding_box

    x, y, w, h = bbox.origin_x, bbox.origin_y, bbox.width, bbox.height

    face_img = image[y:y+h, x:x+w]

    if face_img.size == 0:
        return "unknown"

    pixels = face_img.reshape(-1, 3)

    kmeans = KMeans(n_clusters=3, n_init=10)
    kmeans.fit(pixels)

    colors = kmeans.cluster_centers_
    counts = np.bincount(kmeans.labels_)
    dominant = colors[np.argmax(counts)]

    r, g, b = dominant

    if r > b:
        return "warm"
    else:
        return "cool"


# ---------- MAIN ----------
def extract_features(image_path):

    image = cv2.imread(image_path)

    body = get_body_type(image)
    skin = get_skin_tone(image)

    return {
        "body_type": body,
        "skin_tone": skin
    }