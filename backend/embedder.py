"""
embedder.py — CLIP image embedding with disk-based cache.

Embeddings are computed once and saved to embeddings.pkl so that
subsequent server restarts skip the expensive CLIP forward pass.
"""
import os
import pickle
import torch
import clip
from PIL import Image

# ---------------------------------------------------------------------------
# Model — loaded once at module import time
# ---------------------------------------------------------------------------
device = "cuda" if torch.cuda.is_available() else "cpu"
_model, _preprocess = clip.load("ViT-B/32", device=device)

_CACHE_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "embeddings.pkl")


# ---------------------------------------------------------------------------
# Single-image embedding
# ---------------------------------------------------------------------------
def get_image_embedding(image_path: str) -> torch.Tensor:
    """Return L2-normalised CLIP embedding for a single image (1 × 512)."""
    image = Image.open(image_path).convert("RGB")
    tensor = _preprocess(image).unsqueeze(0).to(device)
    with torch.no_grad():
        emb = _model.encode_image(tensor)
    emb = emb / emb.norm(dim=-1, keepdim=True)
    return emb  # shape (1, 512)


# ---------------------------------------------------------------------------
# Batch embedding with optional caching
# ---------------------------------------------------------------------------
def compute_embeddings(outfits: list[dict], force_recompute: bool = False) -> list[dict]:
    """
    For each outfit dict, add an 'embedding' key (1×512 tensor).

    Strategy:
      1. Try to load from embeddings.pkl (fast path).
      2. If cache is missing / stale / force_recompute=True, recompute
         and save back to cache.

    Args:
        outfits: List of outfit dicts (must have 'path' key).
        force_recompute: Bypass cache and recompute from scratch.

    Returns:
        Same list with 'embedding' populated on every entry.
    """
    if not force_recompute and os.path.exists(_CACHE_PATH):
        print("[Embedder] Loading cached embeddings …")
        with open(_CACHE_PATH, "rb") as f:
            cache: dict[str, torch.Tensor] = pickle.load(f)

        all_cached = all(o["filename"] in cache for o in outfits)
        if all_cached:
            for o in outfits:
                o["embedding"] = cache[o["filename"]]
            print(f"[Embedder] Cache hit — {len(outfits)} embeddings loaded.")
            return outfits
        else:
            print("[Embedder] Cache incomplete — recomputing …")

    # Compute from scratch
    print(f"[Embedder] Computing CLIP embeddings for {len(outfits)} outfits …")
    cache: dict[str, torch.Tensor] = {}
    for o in outfits:
        emb = get_image_embedding(o["path"])
        o["embedding"] = emb
        cache[o["filename"]] = emb
        print(f"  ✓ {o['filename']}")

    with open(_CACHE_PATH, "wb") as f:
        pickle.dump(cache, f)
    print(f"[Embedder] Saved embeddings to {_CACHE_PATH}")
    return outfits
