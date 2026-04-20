"""
dataset_loader.py — Load structured outfit dataset from disk.

Reads outfits_metadata.json alongside the actual image files and
returns a list of outfit dicts ready for the recommendation pipeline.
"""
import os
import json


def load_dataset(data_dir: str | None = None) -> list[dict]:
    """
    Load outfit metadata + resolve absolute image paths.

    Args:
        data_dir: Path to the 'data/' folder.  Defaults to ./data/ next
                  to this file.

    Returns:
        List of outfit dicts, each with 'path' and all metadata fields.
        Outfits whose image file is missing on disk are skipped with a warning.
    """
    if data_dir is None:
        data_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")

    outfits_dir  = os.path.join(data_dir, "outfits")
    metadata_path = os.path.join(data_dir, "outfits_metadata.json")

    # ------------------------------------------------------------------
    # Load metadata
    # ------------------------------------------------------------------
    if not os.path.exists(metadata_path):
        raise FileNotFoundError(
            f"outfits_metadata.json not found at: {metadata_path}\n"
            "Please create a metadata file for your outfit dataset."
        )

    with open(metadata_path, "r", encoding="utf-8") as f:
        metadata: list[dict] = json.load(f)

    # ------------------------------------------------------------------
    # Resolve paths and validate images exist
    # ------------------------------------------------------------------
    dataset: list[dict] = []
    skipped = 0

    for entry in metadata:
        filename = entry.get("filename", "")
        image_path = os.path.join(outfits_dir, filename)

        if not os.path.exists(image_path):
            print(f"[Dataset] WARNING: image not found, skipping — {image_path}")
            skipped += 1
            continue

        outfit = {
            **entry,           # spread all metadata fields
            "path": image_path # add resolved absolute path
        }
        dataset.append(outfit)

    print(f"[Dataset] Loaded {len(dataset)} outfits ({skipped} skipped).")
    return dataset
