import os
from embedder import get_image_embedding
from feature_extractor import extract_features

def cosine_similarity(a, b):
    return (a @ b.T).item()

# Load dataset
folder = "data/outfits"
images = os.listdir(folder)


# Precompute outfit embeddings
outfits = []

print("Encoding outfit dataset...")

for img in images:
    path = os.path.join(folder, img)
    emb = get_image_embedding(path)

    outfits.append({
        "path": path,
        "embedding": emb
    })

print("Done.\n")

# --- USER INPUT ---
user_image = input("Enter path to your image: ")

features = extract_features(user_image)
user_emb = get_image_embedding(user_image)

# --- FIND SIMILARITY ---
results = []

for outfit in outfits:
    sim = cosine_similarity(user_emb, outfit["embedding"])

    results.append((outfit["path"], sim))

# Sort by similarity
results.sort(key=lambda x: x[1], reverse=True)

# Top 3
top = results[:3]

print("\nTop Recommendations:")
for path, score in top:
    print(f"{path} | Score: {score:.4f}")