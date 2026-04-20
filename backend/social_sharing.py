"""
social_sharing.py — Generate a 1080x1080 Instagram-ready share card.

Output: base64-encoded PNG string for direct embedding in JSON.
"""
import io
import base64
import os
import textwrap
import numpy as np
from PIL import Image, ImageDraw, ImageFont

_DIR = os.path.dirname(os.path.abspath(__file__))

# Attempt to load nice fonts; fall back to default if unavailable
def _load_font(size: int, bold: bool = False) -> ImageFont.ImageFont:
    font_paths = [
        r"C:\Windows\Fonts\arialbd.ttf" if bold else r"C:\Windows\Fonts\arial.ttf",
        r"C:\Windows\Fonts\calibri.ttf",
        r"/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ]
    for p in font_paths:
        if os.path.exists(p):
            try:
                return ImageFont.truetype(p, size)
            except Exception:
                pass
    return ImageFont.load_default()


def create_share_card(
    user_image_path: str,
    outfit_image_path: str,
    body_type: str,
    color_season: str,
    match_score: float,
    style: str = "",
    occasion: str = "",
) -> str:
    """
    Generate a 1080×1080 share card and return it as a base64 PNG data URI.

    Layout:
      ┌─────────────────────────────┐
      │  BLACK HEADER — "STYLE AI"  │
      ├──────────────┬──────────────┤
      │  User Photo  │ Outfit Photo │
      ├──────────────┴──────────────┤
      │ Stats footer (body/season)  │
      └─────────────────────────────┘
    """
    SIZE = 1080
    HEADER_H = 140
    FOOTER_H = 160
    IMG_H = SIZE - HEADER_H - FOOTER_H

    BLACK   = (0, 0, 0)
    WHITE   = (255, 255, 255)
    CREAM   = (250, 249, 246)
    RED     = (196, 30, 58)
    GRAY    = (100, 100, 100)

    canvas = Image.new("RGB", (SIZE, SIZE), CREAM)
    draw   = ImageDraw.Draw(canvas)

    # --- HEADER ---
    draw.rectangle([(0, 0), (SIZE, HEADER_H)], fill=BLACK)
    font_title = _load_font(56, bold=True)
    font_sub   = _load_font(20)
    draw.text((SIZE // 2, HEADER_H // 2 - 12), "STYLE  AI", font=font_title, fill=WHITE, anchor="mm")
    draw.text((SIZE // 2, HEADER_H // 2 + 30), "AI-Powered Personal Styling", font=font_sub, fill=GRAY, anchor="mm")

    # --- IMAGES ---
    half = SIZE // 2

    def paste_image(img_path: str, box: tuple[int, int, int, int]):
        try:
            img = Image.open(img_path).convert("RGB")
            bw = box[2] - box[0]
            bh = box[3] - box[1]
            # Crop center to fill box
            iw, ih = img.size
            scale = max(bw / iw, bh / ih)
            nw, nh = int(iw * scale), int(ih * scale)
            img = img.resize((nw, nh), Image.LANCZOS)
            left = (nw - bw) // 2
            top  = (nh - bh) // 2
            img  = img.crop((left, top, left + bw, top + bh))
            canvas.paste(img, (box[0], box[1]))
        except Exception as e:
            print(f"[ShareCard] Could not load image {img_path}: {e}")

    # Divider line
    paste_image(user_image_path,    (0,    HEADER_H, half,   HEADER_H + IMG_H))
    paste_image(outfit_image_path,  (half, HEADER_H, SIZE,   HEADER_H + IMG_H))

    # Center divider
    draw.line([(half, HEADER_H), (half, HEADER_H + IMG_H)], fill=WHITE, width=4)

    # Labels on images
    font_label = _load_font(22, bold=True)
    draw.rectangle([(0, HEADER_H), (120, HEADER_H + 36)], fill=BLACK)
    draw.text((60, HEADER_H + 18), "YOU", font=font_label, fill=WHITE, anchor="mm")
    draw.rectangle([(half, HEADER_H), (half + 130, HEADER_H + 36)], fill=RED)
    draw.text((half + 65, HEADER_H + 18), "OUTFIT", font=font_label, fill=WHITE, anchor="mm")

    # --- FOOTER ---
    footer_y = HEADER_H + IMG_H
    draw.rectangle([(0, footer_y), (SIZE, SIZE)], fill=BLACK)

    # Score bar
    bar_w = SIZE - 80
    bar_x, bar_y = 40, footer_y + 24
    draw.rectangle([(bar_x, bar_y), (bar_x + bar_w, bar_y + 10)], fill=(40, 40, 40))
    score_w = int(bar_w * min(1.0, match_score))
    draw.rectangle([(bar_x, bar_y), (bar_x + score_w, bar_y + 10)], fill=RED)

    # Stats
    font_stat_label = _load_font(18)
    font_stat_val   = _load_font(26, bold=True)

    stats = [
        ("BODY TYPE",    body_type.replace("_", " ").upper()),
        ("COLOR SEASON", color_season.replace("_", " ").upper()),
        ("MATCH SCORE",  f"{match_score * 100:.0f}%"),
    ]
    if style:
        stats.append(("STYLE", style.upper()))

    col_w = SIZE // len(stats)
    for i, (label, value) in enumerate(stats):
        cx = col_w * i + col_w // 2
        cy = footer_y + 55
        draw.text((cx, cy),       label, font=font_stat_label, fill=GRAY,  anchor="mm")
        clr = RED if label == "MATCH SCORE" else WHITE
        draw.text((cx, cy + 34), value, font=font_stat_val,   fill=clr,   anchor="mm")

    # Watermark
    font_wm = _load_font(16)
    draw.text((SIZE // 2, SIZE - 18), "AI Personal Stylist · CLIP + MediaPipe",
              font=font_wm, fill=(60, 60, 60), anchor="mm")

    # --- Encode ---
    buf = io.BytesIO()
    canvas.save(buf, format="PNG", optimize=True)
    buf.seek(0)
    b64 = base64.b64encode(buf.read()).decode()
    return f"data:image/png;base64,{b64}"
