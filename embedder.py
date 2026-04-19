# CLIP embeddings
import torch
import clip
from PIL import Image

# Load model once
device = "cuda" if torch.cuda.is_available() else "cpu"
model, preprocess = clip.load("ViT-B/32", device=device)

def get_image_embedding(image_path):
    image = Image.open(image_path).convert("RGB")
    image = preprocess(image).unsqueeze(0).to(device)

    with torch.no_grad():
        embedding = model.encode_image(image)

    # Normalize
    embedding = embedding / embedding.norm(dim=-1, keepdim=True)

    return embedding