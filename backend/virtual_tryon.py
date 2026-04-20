"""
virtual_tryon.py — Basic Virtual Try-On via background removal + pose overlay.

Uses rembg for background removal and MediaPipe Pose for body keypoints
to position the outfit image over the user's torso.

NOTE: This is a simple heuristic overlay — not a deep learning VITON model.
      Quality depends heavily on image quality and pose.
"""
import os
import numpy as np
import cv2
from PIL import Image
import tempfile

try:
    from rembg import remove as rembg_remove
    REMBG_AVAILABLE = True
except ImportError:
    REMBG_AVAILABLE = False
    print("[VirtualTryOn] rembg not installed — background removal disabled.")

import mediapipe as mp

_DIR = os.path.dirname(os.path.abspath(__file__))

_mp_pose = mp.solutions.pose
_pose = _mp_pose.Pose(static_image_mode=True, model_complexity=1)


def _load_rgba(path: str) -> np.ndarray:
    """Load image as RGBA numpy array."""
    img = Image.open(path).convert("RGBA")
    return np.array(img)


def _alpha_composite(base: np.ndarray, overlay: np.ndarray, x: int, y: int) -> np.ndarray:
    """Paste RGBA overlay onto RGB base at (x, y) using alpha blending."""
    result = base.copy()
    oh, ow = overlay.shape[:2]
    bh, bw = base.shape[:2]

    # Clip to canvas
    x1, y1 = max(0, x), max(0, y)
    x2, y2 = min(bw, x + ow), min(bh, y + oh)
    ox1, oy1 = x1 - x, y1 - y
    ox2, oy2 = ox1 + (x2 - x1), oy1 + (y2 - y1)

    if x2 <= x1 or y2 <= y1:
        return result

    alpha = overlay[oy1:oy2, ox1:ox2, 3:4] / 255.0
    fg    = overlay[oy1:oy2, ox1:ox2, :3].astype(float)
    bg    = result[y1:y2, x1:x2, :3].astype(float)

    result[y1:y2, x1:x2, :3] = (alpha * fg + (1 - alpha) * bg).astype(np.uint8)
    return result


def create_virtual_tryon(
    person_image_path: str,
    outfit_image_path: str,
    output_path: str,
) -> str:
    """
    Overlay an outfit image over a person's photo using pose-guided placement.

    Steps:
      1. Load person image; optionally remove background via rembg.
      2. Detect body pose (shoulder + hip keypoints).
      3. Scale outfit to torso dimensions and alpha-blend.
      4. Fallback: center-paste at 1/3 height if pose fails.

    Returns:
        Path to the saved output PNG.
    """
    person_pil = Image.open(person_image_path).convert("RGB")

    # Step 1 — Background removal (optional)
    if REMBG_AVAILABLE:
        person_no_bg = rembg_remove(person_pil)          # RGBA
        person_np = np.array(person_no_bg.convert("RGB"))
    else:
        person_np = np.array(person_pil)

    h, w = person_np.shape[:2]

    # Step 2 — Pose detection
    results = _pose.process(cv2.cvtColor(person_np, cv2.COLOR_RGB2BGR))

    if results.pose_landmarks:
        lm = results.pose_landmarks.landmark

        def pt(idx):
            return int(lm[idx].x * w), int(lm[idx].y * h)

        ls = pt(_mp_pose.PoseLandmark.LEFT_SHOULDER)
        rs = pt(_mp_pose.PoseLandmark.RIGHT_SHOULDER)
        lh = pt(_mp_pose.PoseLandmark.LEFT_HIP)
        rh = pt(_mp_pose.PoseLandmark.RIGHT_HIP)

        # Bounding box for torso
        shoulder_cx = (ls[0] + rs[0]) // 2
        shoulder_cy = (ls[1] + rs[1]) // 2
        hip_cy      = (lh[1] + rh[1]) // 2

        torso_w = max(60, int(abs(rs[0] - ls[0]) * 1.4))  # 140% shoulder width
        torso_h = max(80, int(abs(hip_cy - shoulder_cy) * 1.2))

        x_offset = shoulder_cx - torso_w // 2
        y_offset = shoulder_cy - int(torso_h * 0.05)      # slight upward shift
    else:
        # Fallback: center at 1/3 height
        torso_w = w // 2
        torso_h = int(h * 0.45)
        x_offset = w // 4
        y_offset = int(h * 0.2)

    # Step 3 — Load and resize outfit
    outfit_pil = Image.open(outfit_image_path).convert("RGBA")

    # Maintain aspect ratio
    orig_w, orig_h = outfit_pil.size
    scale = min(torso_w / orig_w, torso_h / orig_h)
    new_w = max(1, int(orig_w * scale))
    new_h = max(1, int(orig_h * scale))

    outfit_resized = np.array(outfit_pil.resize((new_w, new_h), Image.LANCZOS))

    # Step 4 — Composite
    result_np = _alpha_composite(person_np, outfit_resized, x_offset, y_offset)

    # Save
    Image.fromarray(result_np).save(output_path, format="PNG")
    return output_path
