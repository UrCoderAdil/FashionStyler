# 🔥 AI Personal Stylist (v3.0)

A production-quality AI recommendation system that analyzes your unique silhouette and skin tone to curate a personalized fashion lookbook.

## ✨ Key Features

- **Editorial UI**: A premium magazine-inspired interface built with React and Tailwind.
- **12-Season Color Analysis**: Advanced LAB-space skin analysis to determine your seasonal palette.
- **8-Type Body Classification**: High-precision silhouette detection using MediaPipe Pose landmarks.
- **Virtual Try-On**: AI-guided garment overlay with automatic background removal via `rembg`.
- **Hybrid Recommendation Engine**: 0.5 CLIP + 0.2 Body + 0.1 Color + 0.2 Preferences weighted scoring.
- **Social Sharing**: Generate 1080x1080 Instagram-ready style cards.
- **Shopping Integration**: Rich metadata with product links, brands, and prices.

## 📂 Project Structure

```bash
AI_Personal_Stylist/
├── backend/
│   ├── main.py               # FastAPI v3.0 App
│   ├── color_analysis.py     # 12-season color system
│   ├── feature_extractor.py  # 8-type body + face detection
│   ├── virtual_tryon.py      # rembg + Pose guided overlay
│   ├── social_sharing.py     # Pillow share card generator
│   ├── recommender.py        # Hybrid scoring & ranking (batched matmul)
│   ├── dataset_loader.py     # Metadata JSON loader
│   ├── embedder.py           # CLIP embedding + N×512 retrieval matrix
│   ├── data/
│   │   ├── outfits/          # 579 outfit images (git-ignored — see below)
│   │   └── outfits_metadata.json
│   └── data_collection/
│       └── auto_annotate.py  # Batch CLIP classifier for dataset expansion
└── frontend/
    ├── src/
    │   ├── App.jsx           # Magazine layout & state
    │   ├── components/       # AnalysisCard, OutfitCard, ShareModal, etc.
    │   └── styles/
    │       └── magazine.css  # Editorial design system
```

> **Note on dataset images**: `backend/data/outfits/` is listed in `.gitignore` because it contains 579 images (~30 MB). Download or generate them separately (see [Dataset Expansion](#️-dataset-expansion) below).

## 🚀 Quick Start

### 1. Backend Setup
```bash
cd backend
pip install -r requirements.txt
# Place outfit images in data/outfits/ then generate metadata + embeddings:
python data_collection/auto_annotate.py --input data/outfits --output data/outfits_metadata.json
python -m uvicorn main:app --reload --port 8000
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## 🛠️ Dataset Expansion
To add new outfits, drop images into a folder and run the auto-annotator:
```bash
python backend/data_collection/auto_annotate.py --input ./new_photos --output metadata_new.json
```
Merge the generated JSON into `outfits_metadata.json` and move the images to `backend/data/outfits/`. The CLIP embedding cache will be automatically regenerated on the next server start.

## ⚡ Retrieval Architecture

On startup, all outfit embeddings are stacked into a single **(N × 512)** matrix in GPU/CPU memory. Each recommendation request is resolved with **one batched matrix multiply** — making retrieval time essentially constant regardless of dataset size.

---
*Built with ❤️ by AI Personal Stylist Team.*
