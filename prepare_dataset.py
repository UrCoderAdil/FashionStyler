import os
import shutil
import subprocess
import sys

PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
DATASET_CLEAN = os.path.join(PROJECT_ROOT, "dataset_clean")
BACKEND_DATA = os.path.join(PROJECT_ROOT, "backend", "data")
OUTFITS_DIR = os.path.join(BACKEND_DATA, "outfits")
OUTFITS_BACKUP = os.path.join(BACKEND_DATA, "outfits_backup")
METADATA_JSON = os.path.join(BACKEND_DATA, "outfits_metadata.json")
EMBEDDINGS_PKL = os.path.join(PROJECT_ROOT, "backend", "embeddings.pkl")

def main():
    print("1. Backing up old outfits directory...")
    if os.path.exists(OUTFITS_DIR):
        if os.path.exists(OUTFITS_BACKUP):
            shutil.rmtree(OUTFITS_BACKUP)
        shutil.move(OUTFITS_DIR, OUTFITS_BACKUP)
        print(f"Backed up to {OUTFITS_BACKUP}")
    
    os.makedirs(OUTFITS_DIR, exist_ok=True)
    
    print("2. Flattening and copying dataset_clean to backend/data/outfits...")
    for category in os.listdir(DATASET_CLEAN):
        cat_path = os.path.join(DATASET_CLEAN, category)
        if os.path.isdir(cat_path):
            for filename in os.listdir(cat_path):
                if filename.lower().endswith(('.png', '.jpg', '.jpeg')):
                    src_path = os.path.join(cat_path, filename)
                    # Prefix filename with category to avoid collisions
                    new_filename = f"{category}_{filename}"
                    dst_path = os.path.join(OUTFITS_DIR, new_filename)
                    shutil.copy2(src_path, dst_path)
    
    print("3. Running auto_annotate.py on the new dataset...")
    auto_annotate_script = os.path.join(PROJECT_ROOT, "backend", "data_collection", "auto_annotate.py")
    
    # We will call it via subprocess
    cmd = [
        sys.executable, auto_annotate_script,
        "--input", OUTFITS_DIR,
        "--output", METADATA_JSON
    ]
    print(f"Running: {' '.join(cmd)}")
    subprocess.run(cmd, check=True)
    
    print("4. Clearing embeddings cache...")
    if os.path.exists(EMBEDDINGS_PKL):
        os.remove(EMBEDDINGS_PKL)
        print(f"Deleted {EMBEDDINGS_PKL}")
    else:
        print(f"No embeddings cache found at {EMBEDDINGS_PKL}")

    print("Dataset preparation complete!")

if __name__ == "__main__":
    main()
