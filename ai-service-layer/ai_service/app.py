"""DigiCloset AI Microservice (FastAPI)

Features:
 - /health -> simple health check
 - /analyze -> accepts multipart image upload and returns analysis JSON
 - Optional local PyTorch segmentation if torch + torchvision are installed
 - Optional Hugging Face Inference API integration if HF_API_KEY is set
 - Basic in-memory model caching to avoid reloading weights repeatedly
"""
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional
import os, io, time
from PIL import Image
import numpy as np
import requests

app = FastAPI(title="DigiCloset AI Service", version="1.0.0")

HF_API_URL = os.getenv("HF_API_URL", "https://api-inference.huggingface.co/models")
HF_API_KEY = os.getenv("HF_API_KEY")  # optional
LOCAL_MODEL = None
LOCAL_MODEL_LOADED = False
LOCAL_MODEL_LOAD_TIME = None

class AnalyzeResponse(BaseModel):
    colors: List[str]
    dominant_color: str
    fitScore: float
    recommendations: List[str]
    method: Optional[str] = "heuristic"

def _dominant_color_hex(image: Image.Image) -> str:
    """Return dominant color as hex (fast approximate)."""
    small = image.resize((64, 64))
    arr = np.array(small).reshape(-1, 3)
    vals, counts = np.unique(arr.reshape(-1,3), axis=0, return_counts=True)
    idx = counts.argmax()
    rgb = tuple(int(x) for x in vals[idx])
    return '#%02x%02x%02x' % rgb

def _palette_hex(image: Image.Image, max_colors=5):
    small = image.resize((64,64))
    arr = np.array(small).reshape(-1,3)
    vals, counts = np.unique(arr.reshape(-1,3), axis=0, return_counts=True)
    idxs = counts.argsort()[-max_colors:][::-1]
    palette = ['#%02x%02x%02x' % tuple(int(x) for x in vals[i]) for i in idxs]
    return palette

async def _analyze_local_pytorch(image: Image.Image):
    """Attempt local analysis using torchvision segmentation model.
       Returns None if torch/torchvision unavailable or model fails.
    """
    try:
        import torch
        import torchvision.transforms as T
        from torchvision import models
    except Exception:
        return None
    global LOCAL_MODEL, LOCAL_MODEL_LOADED, LOCAL_MODEL_LOAD_TIME
    try:
        if not LOCAL_MODEL_LOADED:
            # load once per process
            LOCAL_MODEL = models.segmentation.fcn_resnet50(pretrained=True).eval()
            LOCAL_MODEL_LOADED = True
            LOCAL_MODEL_LOAD_TIME = time.time()
        tr = T.Compose([T.Resize(256), T.CenterCrop(224), T.ToTensor(),
                        T.Normalize(mean=[0.485, 0.456, 0.406],
                                    std=[0.229, 0.224, 0.225])])
        input_tensor = tr(image).unsqueeze(0)
        with torch.no_grad():
            out = LOCAL_MODEL(input_tensor)['out'][0]
        labels = out.argmax(0).unique().numel()
        fit_score = max(0.25, 1.0 - labels/50.0)
        return {"fitScore": float(fit_score), "method": "local_pytorch", "labels": int(labels)}
    except Exception:
        return None

def _call_hf_inference(image_bytes: bytes, model="openai/clip-vit-base-patch32", task="image-classification", timeout=30):
    if not HF_API_KEY:
        return None
    headers = {"Authorization": f"Bearer {HF_API_KEY}"}
    try:
        resp = requests.post(f"{HF_API_URL}/{model}", headers=headers, data=image_bytes, timeout=timeout)
        if resp.status_code == 200:
            return resp.json()
        return None
    except Exception:
        return None

@app.get("/health")
def health():
    return {"status": "ok", "hf": bool(HF_API_KEY), "local_model_loaded": LOCAL_MODEL_LOADED}

@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze(file: UploadFile = File(...)):
    content = await file.read()
    try:
        img = Image.open(io.BytesIO(content)).convert("RGB")
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid image file")

    dominant = _dominant_color_hex(img)
    palette = _palette_hex(img, max_colors=5)

    local = await _analyze_local_pytorch(img)
    if local:
        recs = ["Local model analysis: use result as higher-confidence guidance."]
        return {"colors": palette, "dominant_color": dominant, "fitScore": local["fitScore"], "recommendations": recs, "method": local.get("method")}

    hf_res = _call_hf_inference(content)
    if hf_res is not None:
        fit_score = 0.75
        recs = ["Hugging Face inference used; treat as medium confidence." ]
        return {"colors": palette, "dominant_color": dominant, "fitScore": fit_score, "recommendations": recs, "method": "huggingface"}

    unique_colors = len(np.unique(np.array(img).reshape(-1,3), axis=0))
    fit_score = max(0.3, 1.0 - unique_colors/500.0)
    recs = ["Heuristic fallback: low confidence. Install PyTorch or set HF_API_KEY for better results."]
    return {"colors": palette, "dominant_color": dominant, "fitScore": float(fit_score), "recommendations": recs, "method": "heuristic"}
from app.api import feedback

app.include_router(feedback.router, prefix="/api/v1")
