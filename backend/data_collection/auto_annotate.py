"""
auto_annotate.py — Batch CLIP classifier for dataset expansion.

Use this script to automatically generate outfits_metadata.json entries
for a folder of new fashion images.

Usage:
  python auto_annotate.py --input ./my_new_outfits --output metadata_new.json
"""
import os
import json
import torch
import clip
from PIL import Image
from pathlib import Path
import argparse

# ---------------------------------------------------------------------------
# Classification Taxonomies
# ---------------------------------------------------------------------------
TAXONOMY = {
    "style":    ["casual", "formal", "streetwear", "bohemian", "minimalist", "vintage"],
    "occasion": ["daily", "office", "party", "wedding", "sports", "date night"],
    "color":    ["warm", "cool", "neutral", "pastel", "bold"],
    "fit":      ["slim", "regular", "loose", "oversized"],
    "season":   ["spring", "summer", "autumn", "winter"],
}

PROMPTS = {
    "style":    "A photo of a {} style outfit.",
    "occasion": "A photo of clothing for a {} occasion.",
    "color":    "A photo of clothing in {} tones.",
    "fit":      "A photo of clothing with a {} fit.",
    "season":   "A photo of clothing for the {} season.",
}

def auto_annotate(input_dir: str, output_path: str):
    device = "cuda" if torch.cuda.is_available() else "cpu"
    model, preprocess = clip.load("ViT-B/32", device=device)
    
    input_path = Path(input_dir)
    image_files = list(input_path.glob("*.jpg")) + list(input_path.glob("*.png")) + list(input_path.glob("*.jpeg"))
    
    print(f"[AutoAnnotate] Found {len(image_files)} images in {input_dir}")
    
    results = []
    
    # Pre-tokenize all prompts
    tokenized_prompts = {}
    for key, options in TAXONOMY.items():
        texts = [PROMPTS[key].format(opt) for opt in options]
        tokenized_prompts[key] = clip.tokenize(texts).to(device)

    with torch.no_grad():
        for i, img_p in enumerate(image_files):
            print(f"  ({i+1}/{len(image_files)}) Processing {img_p.name} ...")
            
            image = preprocess(Image.open(img_p)).unsqueeze(0).to(device)
            image_features = model.encode_image(image)
            image_features /= image_features.norm(dim=-1, keepdim=True)
            
            entry = {
                "filename": img_p.name,
                "brand": "Unlabeled",
                "actual_price": "$0",
                "product_url": "",
                "description": "Auto-annotated ensemble.",
                "tags": ["auto-annotated"],
                "gender": "unisex",
                "body_suit": ["balanced"]
            }
            
            for key, options in TAXONOMY.items():
                text_tokens = tokenized_prompts[key]
                text_features = model.encode_text(text_tokens)
                text_features /= text_features.norm(dim=-1, keepdim=True)
                
                # Similarity
                probs = (100.0 * image_features @ text_features.T).softmax(dim=-1)
                entry[key] = options[probs.argmax().item()]
            
            results.append(entry)

    with open(output_path, "w") as f:
        json.dump(results, f, indent=2)
    
    print(f"\n[AutoAnnotate] SUCCESS! Metadata saved to {output_path}")
    print("Next steps: Merge this into your backend/data/outfits_metadata.json and move images to backend/data/outfits/")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", type=str, default=".")
    parser.add_argument("--output", type=str, default="metadata_auto.json")
    args = parser.parse_args()
    
    if os.path.exists(args.input):
        auto_annotate(args.input, args.output)
    else:
        print(f"Error: Input directory {args.input} does not exist.")
