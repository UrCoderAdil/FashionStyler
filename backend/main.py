"""
main.py — AI Personal Stylist FastAPI backend v3.0

Endpoints:
  GET  /                    → health check
  POST /api/analyze         → image + prefs → features + recommendations
  POST /api/virtual-tryon   → image + outfit → try-on PNG
  POST /api/share-card      → image + outfit + stats → 1080x1080 PNG (base64)
"""
import os, sys, shutil, tempfile
from contextlib import asynccontextmanager
from typing import Annotated
import asyncio
from concurrent.futures import ThreadPoolExecutor

from fastapi import FastAPI, File, Form, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
import logging

logging.basicConfig(level=logging.INFO, format="[%(levelname)s] %(asctime)s - %(message)s")
logger = logging.getLogger("AIStylist")

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dataset_loader import load_dataset
from embedder import compute_embeddings
from feature_extractor import extract_features
from recommender import recommend

# ---------------------------------------------------------------------------
# Startup — preload dataset + embeddings
# ---------------------------------------------------------------------------
outfit_dataset: list[dict] = []
executor = ThreadPoolExecutor(max_workers=1)

def _background_load(data_dir: str):
    global outfit_dataset
    try:
        logger.info("Loading outfit dataset in background…")
        outfits = load_dataset(data_dir)
        logger.info(f"Loaded {len(outfits)} items. Computing embeddings...")
        outfit_dataset = compute_embeddings(outfits)
        logger.info(f"Ready — {len(outfit_dataset)} outfits indexed.")
    except Exception as e:
        logger.error(f"Failed to load outfit dataset: {e}", exc_info=True)

@asynccontextmanager
async def lifespan(app: FastAPI):
    global outfit_dataset
    data_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
    # Run in background to prevent Railway health check timeout (60s)
    asyncio.get_event_loop().run_in_executor(executor, _background_load, data_dir)
    yield
    outfit_dataset = []

app = FastAPI(title="AI Personal Stylist", version="3.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"],
)

_OUTFITS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "outfits")
app.mount("/outfits", StaticFiles(directory=_OUTFITS_DIR), name="outfits")

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _save_upload(file: UploadFile) -> str:
    suffix = os.path.splitext(file.filename or "photo")[-1] or ".jpg"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        shutil.copyfileobj(file.file, tmp)
        return tmp.name


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@app.get("/")
def health():
    return {"status": "ok", "version": "3.0.0", "outfits_loaded": len(outfit_dataset)}


@app.post("/api/analyze")
async def analyze(
    file:             Annotated[UploadFile, File()],
    style:            Annotated[str, Form()] = "",
    occasion:         Annotated[str, Form()] = "",
    budget:           Annotated[str, Form()] = "",
    color_preference: Annotated[str, Form()] = "",
):
    """Analyze photo → body type + color season + outfit recommendations."""
    if not file.content_type.startswith("image/"):
        logger.warning(f"Invalid file type uploaded: {file.content_type}")
        raise HTTPException(400, "Uploaded file must be an image.")
    if not outfit_dataset:
        logger.error("Analyze called but dataset is not loaded.")
        raise HTTPException(503, "Dataset still loading — retry shortly.")

    tmp_path = _save_upload(file)
    try:
        try:
            features = extract_features(tmp_path)
        except Exception as e:
            logger.error(f"Feature extraction failed: {e}", exc_info=True)
            raise HTTPException(500, "Failed to analyze image features. Please try another photo.")

        prefs = {k: v.strip().lower() for k, v in {
            "style": style, "occasion": occasion,
            "budget": budget, "color_preference": color_preference,
        }.items() if v.strip()}

        try:
            results = recommend(tmp_path, features, outfit_dataset, prefs, top_n=5)
        except Exception as e:
            logger.error(f"Recommendation engine failed: {e}", exc_info=True)
            raise HTTPException(500, "Failed to generate recommendations.")

        recommendations = [{
            "filename":    r["filename"],
            "image_url":   f"/outfits/{r['filename']}",
            "style":       r.get("style", ""),
            "occasion":    r.get("occasion", ""),
            "color":       r.get("color", ""),
            "fit":         r.get("fit", ""),
            "price_range": r.get("price_range", ""),
            "brand":       r.get("brand", ""),
            "actual_price": r.get("actual_price", ""),
            "product_url": r.get("product_url", ""),
            "description": r.get("description", ""),
            "scores":      r["scores"],
            "final_score": r["final_score"],
            "explanation": r["explanation"],
        } for r in results]

        return {
            "features":         features,
            "preferences_used": prefs,
            "recommendations":  recommendations,
        }
    finally:
        os.unlink(tmp_path)


@app.post("/api/virtual-tryon")
async def virtual_tryon(
    file:            Annotated[UploadFile, File()],
    outfit_filename: Annotated[str, Form()],
):
    """Overlay outfit image over user photo using pose-guided compositing."""
    from virtual_tryon import create_virtual_tryon

    if not file.content_type.startswith("image/"):
        raise HTTPException(400, "Uploaded file must be an image.")

    outfit_path = os.path.join(_OUTFITS_DIR, outfit_filename)
    if not os.path.exists(outfit_path):
        raise HTTPException(404, f"Outfit '{outfit_filename}' not found.")

    user_path = _save_upload(file)
    out_path  = os.path.join(tempfile.gettempdir(), f"tryon_{outfit_filename}.png")

    try:
        result_path = create_virtual_tryon(user_path, outfit_path, out_path)
        return FileResponse(result_path, media_type="image/png",
                            filename=f"tryon_{outfit_filename}.png")
    except Exception as e:
        logger.error(f"Try-on generation failed for {outfit_filename}: {e}", exc_info=True)
        raise HTTPException(500, f"Try-on generation failed: {e}")
    finally:
        os.unlink(user_path)


@app.post("/api/share-card")
async def share_card(
    file:            Annotated[UploadFile, File()],
    outfit_filename: Annotated[str, Form()],
    body_type:       Annotated[str, Form()] = "",
    color_season:    Annotated[str, Form()] = "",
    match_score:     Annotated[float, Form()] = 0.0,
    style:           Annotated[str, Form()] = "",
    occasion:        Annotated[str, Form()] = "",
):
    """Generate 1080×1080 Instagram-ready share card as base64 PNG."""
    from social_sharing import create_share_card

    outfit_path = os.path.join(_OUTFITS_DIR, outfit_filename)
    if not os.path.exists(outfit_path):
        raise HTTPException(404, f"Outfit '{outfit_filename}' not found.")

    user_path = _save_upload(file)
    try:
        card_b64 = create_share_card(
            user_image_path=user_path,
            outfit_image_path=outfit_path,
            body_type=body_type or "unknown",
            color_season=color_season or "unknown",
            match_score=match_score,
            style=style,
            occasion=occasion,
        )
        return {"share_card": card_b64}
    except Exception as e:
        logger.error(f"Share card generation failed: {e}", exc_info=True)
        raise HTTPException(500, f"Share card generation failed: {e}")
    finally:
        os.unlink(user_path)
