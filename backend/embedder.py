"""
embedder.py — CLIP image embedding with disk-based cache & fast batch retrieval.

Key optimisation (v2):
  All outfit embeddings are stacked into a single (N×512) tensor at startup.
  Per-request similarity is then a single batched matmul — O(1) regardless
  of dataset size — instead of 579 individual dot-product calls.
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
_model.eval()

_CACHE_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "embeddings.pkl")


# ---------------------------------------------------------------------------
# Single-image embedding  (used at query time)
# ---------------------------------------------------------------------------
def get_image_embedding(image_path: str) -> torch.Tensor:
    """Return L2-normalised CLIP embedding for a single image — shape (1, 512)."""
    image = Image.open(image_path).convert("RGB")
    tensor = _preprocess(image).unsqueeze(0).to(device)
    with torch.no_grad():
        emb = _model.encode_image(tensor).float()
    emb = emb / emb.norm(dim=-1, keepdim=True)
    return emb  # (1, 512)


# ---------------------------------------------------------------------------
# Batch embedding with caching  (called once at server startup)
# ---------------------------------------------------------------------------
def compute_embeddings(outfits: list[dict], force_recompute: bool = False) -> list[dict]:
    """
    Attach an 'embedding' tensor to every outfit dict and pre-build a stacked
    matrix for fast batch retrieval.

    Strategy:
      1. Load embeddings.pkl (fast path — skips all CLIP inference).
      2. If missing/incomplete/forced, recompute and save.
      3. Stack all embeddings into outfit_matrix (N×512) and attach it as
         a module-level global so recommender can do one matmul per request.

    Args:
        outfits: List of outfit dicts (each must have 'filename' and 'path').
        force_recompute: Bypass cache and re-run CLIP on every image.

    Returns:
        Same list with 'embedding' (1×512) populated on each entry.
    """
    global outfit_matrix  # (N, 512) — used by batch_similarities()

    # ---- 1. Try cache -------------------------------------------------------
    if not force_recompute and os.path.exists(_CACHE_PATH):
        print("[Embedder] Loading cached embeddings …")
        with open(_CACHE_PATH, "rb") as f:
            cache: dict[str, torch.Tensor] = pickle.load(f)

        all_cached = all(o["filename"] in cache for o in outfits)
        if all_cached:
            for o in outfits:
                o["embedding"] = cache[o["filename"]]
            print(f"[Embedder] Cache hit — {len(outfits)} embeddings loaded.")
            _build_matrix(outfits)
            return outfits
        else:
            print("[Embedder] Cache incomplete — recomputing …")

    # ---- 2. Compute from scratch --------------------------------------------
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

    _build_matrix(outfits)
    return outfits


# ---------------------------------------------------------------------------
# Matrix builder  (called internally after embeddings are ready)
# ---------------------------------------------------------------------------
outfit_matrix: torch.Tensor | None = None   # (N, 512) — pre-stacked

def _build_matrix(outfits: list[dict]) -> None:
    """Stack all 1×512 tensors into one N×512 matrix on the right device."""
    global outfit_matrix
    vecs = [o["embedding"].squeeze(0).float() for o in outfits]  # list of (512,)
    outfit_matrix = torch.stack(vecs).to(device)                 # (N, 512)
    print(f"[Embedder] Retrieval matrix ready — shape {tuple(outfit_matrix.shape)}")


# ---------------------------------------------------------------------------
# Fast batch similarity  (called per-request from recommender)
# ---------------------------------------------------------------------------
def batch_similarities(user_emb: torch.Tensor) -> torch.Tensor:
    """
    Compute cosine similarity between a single user embedding and all outfits
    in one batched matmul.

    Args:
        user_emb: (1, 512) normalised user embedding.

    Returns:
        (N,) float tensor of similarity scores in dataset order.
    """
    assert outfit_matrix is not None, "outfit_matrix not initialised — call compute_embeddings first."
    user_vec = user_emb.squeeze(0).float().to(device)  # (512,)
    return (outfit_matrix @ user_vec)                  # (N,) — cosine sim (both L2-normed)
