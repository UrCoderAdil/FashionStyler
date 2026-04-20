# AI Personal Stylist — Multimodal Fashion Recommendation System

## Overview

This project presents a **multimodal fashion recommendation system** that combines computer vision, embedding-based retrieval, and structured human attribute analysis to generate personalized outfit suggestions.

The system analyzes a user’s image to extract **body shape** and **skin tone features**, and integrates these with **visual embeddings (CLIP)** to retrieve and rank stylistically compatible outfits from a curated dataset.

---

## Key Features

### 1. Human Attribute Extraction

* **12-Season Color Analysis**

  * Detects facial region using MediaPipe Face Detector
  * Extracts dominant skin tone using K-Means clustering
  * Converts RGB → LAB color space for perceptual analysis
  * Classifies into one of 12 seasonal palettes (e.g., Cool Summer, Deep Autumn)

* **8-Type Body Classification**

  * Uses MediaPipe Pose Landmarker (33 keypoints)
  * Computes proportional features (shoulder, hip, torso ratios)
  * Classifies into shapes such as Hourglass, Pear, Inverted Triangle, etc.

---

### 2. Hybrid Recommendation Engine

A weighted scoring system combining:

* **Visual Similarity (50%)**

  * Uses CLIP embeddings for image-to-image similarity
  * Cosine similarity used for retrieval

* **Body Compatibility (20%)**

  * Matches outfit silhouettes with detected body shape

* **Color Compatibility (10%)**

  * Ensures outfit colors align with seasonal palette

* **User Preferences (20%)**

  * Filters based on occasion, style, and budget

* **Diversity Penalty**

  * Prevents redundant recommendations in top results

---

### 3. Automated Dataset Expansion

* Uses CLIP for **zero-shot tagging**
* Automatically annotates new outfit images with:

  * style
  * color
  * occasion
* Outputs structured metadata for integration

---

### 4. Social Sharing Engine

* Generates 1080×1080 “Style Cards”
* Includes:

  * user’s season
  * body type
  * recommended outfit
* Implemented using PIL

---

## System Architecture

```
User Image
   ↓
Feature Extraction (Body + Skin Tone)
   ↓
CLIP Embedding
   ↓
Hybrid Scoring Engine
   ↓
Top-K Outfit Retrieval
   ↓
Explanation + Visualization
```

---

## Tech Stack

* **Computer Vision**: MediaPipe Tasks API
* **Embeddings**: CLIP (ViT-B/32)
* **Image Processing**: OpenCV, Pillow
* **ML Utilities**: Scikit-learn (K-Means)
* **Frontend**: React + Tailwind CSS
* **Backend**: Python

---

## Dataset

A curated subset of real-world **men’s outfit images** was used to ensure:

* consistent visual distribution
* reduced background bias
* improved embedding quality

This avoids issues commonly found in catalog-style datasets.

---

## How to Run

```bash
pip install -r requirements.txt
python main.py
```

---

## Future Work

* Replace rule-based weighting with learned ranking model
* Improve virtual try-on using generative models (VTON)
* Expand dataset with automated filtering pipelines
* Introduce user feedback loop for adaptive personalization

---

## Key Insight

This project demonstrates how **pretrained multimodal models** can be combined with **structured reasoning** to build practical AI systems without large-scale training.

---
