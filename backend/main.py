"""
main.py — AI Personal Stylist FastAPI backend.

Endpoints:
  GET  /              → health check
  POST /api/analyze   → upload image + optional preferences → recommendations

On startup:
  • loads dataset metadata
  • computes / loads cached CLIP embeddings
"""
import os
import sys
import shutil
import tempfile
from contextlib import asynccontextmanager
from typing import Annotated

from fastapi import FastAPI, File, Form, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# Resolve imports relative to this file
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dataset_loader import load_dataset
from embedder import compute_embeddings
from feature_extractor import extract_features
from recommender import recommend

# ---------------------------------------------------------------------------
# Lifespan — dataset + embeddings loaded once on startup
# ---------------------------------------------------------------------------
outfit_dataset: list[dict] = []

@asynccontextmanager
async def lifespan(app: FastAPI):
    global outfit_dataset
    data_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
    print("[Server] Starting AI Personal Stylist backend …")

    outfits = load_dataset(data_dir)              # load metadata + paths
    outfit_dataset = compute_embeddings(outfits)  # attach CLIP embeddings (cached)

    print(f"[Server] Ready — {len(outfit_dataset)} outfits indexed.")
    yield
    outfit_dataset = []


# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------
app = FastAPI(
    title="AI Personal Stylist",
    description="Hybrid CLIP + rule-based outfit recommendation API",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve outfit images as static files
_OUTFITS_DIR = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "data", "outfits"
)
app.mount("/outfits", StaticFiles(directory=_OUTFITS_DIR), name="outfits")


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@app.get("/")
def health():
    return {
        "status": "ok",
        "version": "2.0.0",
        "outfits_loaded": len(outfit_dataset),
    }


@app.post("/api/analyze")
async def analyze(
    file: Annotated[UploadFile, File(description="User selfie / full-body photo")],
    style: Annotated[str, Form()] = "",
    occasion: Annotated[str, Form()] = "",
    budget: Annotated[str, Form()] = "",
    color_preference: Annotated[str, Form()] = "",
):
    """
    Analyze an uploaded image and return personalized outfit recommendations.

    Form fields (all optional):
      - style: casual | formal | streetwear
      - occasion: daily | party | office
      - budget: low | medium | high
      - color_preference: warm | cool | neutral
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be an image.")

    if not outfit_dataset:
        raise HTTPException(status_code=503, detail="Dataset is still loading, retry in a moment.")

    # Save upload to a temp file
    suffix = os.path.splitext(file.filename or "photo")[-1] or ".jpg"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = tmp.name

    try:
        # Build user preferences dict from form fields
        user_preferences = {
            k: v.strip().lower()
            for k, v in {
                "style":            style,
                "occasion":         occasion,
                "budget":           budget,
                "color_preference": color_preference,
            }.items()
            if v.strip()
        }

        # Feature extraction
        features = extract_features(tmp_path)

        # Recommendation pipeline
        results = recommend(
            user_image_path=tmp_path,
            features=features,
            dataset=outfit_dataset,
            user_preferences=user_preferences,
            top_n=5,
        )

        # Shape API response
        recommendations = []
        for r in results:
            recommendations.append({
                "filename":    r["filename"],
                "image_url":   f"/outfits/{r['filename']}",
                "style":       r.get("style", ""),
                "occasion":    r.get("occasion", ""),
                "color":       r.get("color", ""),
                "fit":         r.get("fit", ""),
                "price_range": r.get("price_range", ""),
                "scores":      r["scores"],
                "final_score": r["final_score"],
                "explanation": r["explanation"],
            })

        return {
            "features":        features,
            "preferences_used": user_preferences,
            "recommendations": recommendations,
        }

    finally:
        os.unlink(tmp_path)
