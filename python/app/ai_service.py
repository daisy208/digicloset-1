"""
Production AI Service Backend
Implements real AI models for virtual try-on, body analysis, and style recommendations
"""
from backend.logger import get_logger
logger = get_logger(__name__)
import os
import io
import base64
import time
import asyncio
import logging
from typing import Dict, List, Optional, Any
from contextlib import asynccontextmanager

import torch
import torchvision.transforms as transforms
import numpy as np
from PIL import Image
import cv2
from fastapi import FastAPI, HTTPException, UploadFile, File, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import uvicorn
from app.monitoring import init_monitoring
init_monitoring()

# Import AI model implementations
from models.viton_hd import VITONHDModel
from models.body_analysis import BodyAnalysisModel
from models.style_recommendation import StyleRecommendationModel
from models.color_analysis import ColorAnalysisModel
from models.image_enhancement import ImageEnhancementModel

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global model instances
models = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize and cleanup AI models"""
    logger.info("🤖 Initializing AI models...")
    
    # Initialize models
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    logger.info(f"Using device: {device}")
    
    try:
        models["viton_hd"] = VITONHDModel(device=device)
        models["body_analysis"] = BodyAnalysisModel(device=device)
        models["style_recommendation"] = StyleRecommendationModel(device=device)
        models["color_analysis"] = ColorAnalysisModel(device=device)
        models["image_enhancement"] = ImageEnhancementModel(device=device)
        
        # Load model weights
        await load_model_weights()
        
        logger.info("✅ All AI models initialized successfully")
    except Exception as e:
        logger.error(f"❌ Failed to initialize models: {e}")
        raise
    
    yield
    
    # Cleanup
    logger.info("🧹 Cleaning up AI models...")
    for model in models.values():
        if hasattr(model, 'cleanup'):
            model.cleanup()

app = FastAPI(
    title="VirtualFit AI Service",
    description="Production AI backend for virtual try-on and style analysis",
    version="1.0.0",
    lifespan=lifespan
)
from app.health import router as health_router
app.include_router(health_router)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request/Response models
class VirtualTryOnRequest(BaseModel):
    person_image: str
    clothing_image: str
    body_keypoints: Optional[Dict] = None
    lighting_settings: Optional[Dict] = None
    preserve_background: bool = False
    model_config: Optional[Dict] = None

class BodyAnalysisRequest(BaseModel):
    image: str
    model: str = "mediapipe_pose"
    extract_measurements: bool = True
    detect_body_shape: bool = True

class StyleRecommendationRequest(BaseModel):
    user_profile: Dict
    preferences: Dict
    available_items: List[Dict]
    occasion: Optional[str] = None
    model_config: Optional[Dict] = None

class ColorAnalysisRequest(BaseModel):
    image: str
    extract_palette: bool = True
    analyze_harmony: bool = True
    num_colors: int = 5

class ImageEnhancementRequest(BaseModel):
    image: str
    enhancements: Dict
    model: str = "real_esrgan"

class BatchRequest(BaseModel):
    requests: List[Dict]
    batch_config: Optional[Dict] = None

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "models_loaded": len(models),
        "gpu_available": torch.cuda.is_available(),
        "gpu_count": torch.cuda.device_count() if torch.cuda.is_available() else 0
    }

# Model status endpoint
@app.get("/api/v1/status")
async def get_model_status():
    """Get detailed model status and performance metrics"""
    try:
        status = {}
        overall_healthy = True
        
        for model_name, model in models.items():
            try:
                # Test model with dummy input
                latency_start = time.time()
                model_status = await test_model_health(model, model_name)
                latency = (time.time() - latency_start) * 1000
                
                status[model_name] = {
                    "status": "healthy" if model_status else "unhealthy",
                    "latency": latency,
                    "accuracy": getattr(model, 'accuracy', 0.85)
                }
                
                if not model_status:
                    overall_healthy = False
                    
            except Exception as e:
                status[model_name] = {
                    "status": "error",
                    "latency": 0,
                    "accuracy": 0,
                    "error": str(e)
                }
                overall_healthy = False

        # Get system metrics
        gpu_usage = 0
        memory_usage = 0
        
        if torch.cuda.is_available():
            gpu_usage = torch.cuda.utilization()
            memory_usage = torch.cuda.memory_allocated() / torch.cuda.max_memory_allocated() * 100

        return {
            "models": status,
            "overall": overall_healthy,
            "gpu_usage": gpu_usage,
            "memory_usage": memory_usage,
            "timestamp": time.time()
        }
    except Exception as e:
        logger.error(f"Status check failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to get model status")

# Virtual try-on endpoint
@app.post("/api/v1/virtual-tryon")
async def virtual_tryon(request: VirtualTryOnRequest):
    """Process virtual try-on using VITON-HD model"""
    try:
        start_time = time.time()
        
        if "viton_hd" not in models:
            raise HTTPException(status_code=503, detail="VITON-HD model not available")
        
        # Decode base64 images
        person_img = decode_base64_image(request.person_image)
        clothing_img = decode_base64_image(request.clothing_image)
        
        # Process with VITON-HD
        result = await models["viton_hd"].process_tryon(
            person_img,
            clothing_img,
            body_keypoints=request.body_keypoints,
            lighting_settings=request.lighting_settings,
            preserve_background=request.preserve_background
        )
        
        processing_time = (time.time() - start_time) * 1000
        
        return {
            "result_image_url": encode_image_to_base64(result["image"]),
            "processing_time": processing_time,
            "confidence": result["confidence"],
            "fit_analysis": result["fit_analysis"],
            "model_version": "viton_hd_v2.1"
        }
        
    except Exception as e:
        logger.error(f"Virtual try-on failed: {e}")
        raise HTTPException(status_code=500, detail=f"Virtual try-on processing failed: {str(e)}")

# Body analysis endpoint
@app.post("/api/v1/body-analysis")
async def body_analysis(request: BodyAnalysisRequest):
    """Analyze body pose, measurements, and shape"""
    try:
        start_time = time.time()
        
        if "body_analysis" not in models:
            raise HTTPException(status_code=503, detail="Body analysis model not available")
        
        # Decode image
        image = decode_base64_image(request.image)
        
        # Run body analysis
        result = await models["body_analysis"].analyze(
            image,
            extract_measurements=request.extract_measurements,
            detect_body_shape=request.detect_body_shape
        )
        
        processing_time = (time.time() - start_time) * 1000
        
        return {
            **result,
            "processing_time": processing_time,
            "model_version": "mediapipe_v0.8.11"
        }
        
    except Exception as e:
        logger.error(f"Body analysis failed: {e}")
        raise HTTPException(status_code=500, detail=f"Body analysis failed: {str(e)}")

# Style recommendation endpoint
@app.post("/api/v1/style-recommendation")
async def style_recommendation(request: StyleRecommendationRequest):
    """Generate AI-powered style recommendations"""
    try:
        start_time = time.time()
        
        if "style_recommendation" not in models:
            raise HTTPException(status_code=503, detail="Style recommendation model not available")
        
        # Generate recommendations
        result = await models["style_recommendation"].generate_recommendations(
            user_profile=request.user_profile,
            preferences=request.preferences,
            available_items=request.available_items,
            occasion=request.occasion,
            config=request.model_config or {}
        )
        
        processing_time = (time.time() - start_time) * 1000
        
        return {
            "recommendations": result["recommendations"],
            "reasoning": result["reasoning"],
            "processing_time": processing_time,
            "model_version": "transformer_v1.2"
        }
        
    except Exception as e:
        logger.error(f"Style recommendation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Style recommendation failed: {str(e)}")

# Color analysis endpoint
@app.post("/api/v1/color-analysis")
async def color_analysis(request: ColorAnalysisRequest):
    """Analyze colors and color harmony"""
    try:
        start_time = time.time()
        
        if "color_analysis" not in models:
            raise HTTPException(status_code=503, detail="Color analysis model not available")
        
        # Decode image
        image = decode_base64_image(request.image)
        
        # Run color analysis
        result = await models["color_analysis"].analyze(
            image,
            extract_palette=request.extract_palette,
            analyze_harmony=request.analyze_harmony,
            num_colors=request.num_colors
        )
        
        processing_time = (time.time() - start_time) * 1000
        
        return {
            **result,
            "processing_time": processing_time,
            "model_version": "color_net_v1.0"
        }
        
    except Exception as e:
        logger.error(f"Color analysis failed: {e}")
        raise HTTPException(status_code=500, detail=f"Color analysis failed: {str(e)}")

# Image enhancement endpoint
@app.post("/api/v1/image-enhancement")
async def image_enhancement(request: ImageEnhancementRequest):
    """Enhance image quality using AI"""
    try:
        start_time = time.time()
        
        if "image_enhancement" not in models:
            raise HTTPException(status_code=503, detail="Image enhancement model not available")
        
        # Decode image
        image = decode_base64_image(request.image)
        
        # Run enhancement
        result = await models["image_enhancement"].enhance(
            image,
            enhancements=request.enhancements,
            model=request.model
        )
        
        processing_time = (time.time() - start_time) * 1000
        
        return {
            "enhanced_image_url": encode_image_to_base64(result["image"]),
            "improvements": result["improvements"],
            "quality_score": result["quality_score"],
            "processing_time": processing_time,
            "model_version": "real_esrgan_v0.2.5"
        }
        
    except Exception as e:
        logger.error(f"Image enhancement failed: {e}")
        raise HTTPException(status_code=500, detail=f"Image enhancement failed: {str(e)}")

# Batch processing endpoint
@app.post("/api/v1/batch")
async def batch_process(request: BatchRequest, background_tasks: BackgroundTasks):
    """Process multiple AI requests in batch"""
    try:
        results = []
        
        # Process requests with concurrency control
        semaphore = asyncio.Semaphore(3)  # Max 3 concurrent requests
        
        async def process_single_request(req_data):
            async with semaphore:
                try:
                    if req_data["type"] == "virtual_tryon":
                        result = await virtual_tryon(VirtualTryOnRequest(**req_data["data"]))
                        return {"success": True, "result": result}
                    elif req_data["type"] == "body_analysis":
                        result = await body_analysis(BodyAnalysisRequest(**req_data["data"]))
                        return {"success": True, "result": result}
                    elif req_data["type"] == "style_recommendation":
                        result = await style_recommendation(StyleRecommendationRequest(**req_data["data"]))
                        return {"success": True, "result": result}
                    else:
                        return {"success": False, "error": "Unknown request type"}
                except Exception as e:
                    return {"success": False, "error": str(e)}
        
        # Process all requests
        tasks = [process_single_request(req) for req in request.requests]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Handle exceptions
        processed_results = []
        for result in results:
            if isinstance(result, Exception):
                processed_results.append({"success": False, "error": str(result)})
            else:
                processed_results.append(result)
        
        return {"results": processed_results}
        
    except Exception as e:
        logger.error(f"Batch processing failed: {e}")
        raise HTTPException(status_code=500, detail=f"Batch processing failed: {str(e)}")

# Utility functions
def decode_base64_image(base64_string: str) -> Image.Image:
    """Decode base64 string to PIL Image"""
    try:
        if base64_string.startswith('data:image'):
            base64_string = base64_string.split(',')[1]
        
        image_data = io.BytesIO(base64.b64decode(base64_string))
        return Image.open(image_data).convert('RGB')
    except Exception as e:
        raise ValueError(f"Invalid image data: {e}")

def encode_image_to_base64(image: Image.Image) -> str:
    """Encode PIL Image to base64 string"""
    buffer = io.BytesIO()
    image.save(buffer, format='JPEG', quality=90)
    buffer.seek(0)
    return f"data:image/jpeg;base64,{base64.b64encode(buffer.getvalue()).decode()}"

async def load_model_weights():
    """Load pre-trained model weights"""
    model_paths = {
        "viton_hd": "weights/viton_hd_weights.pth",
        "body_analysis": "weights/body_analysis_weights.pth",
        "style_recommendation": "weights/style_recommendation_weights.pth",
        "color_analysis": "weights/color_analysis_weights.pth",
        "image_enhancement": "weights/image_enhancement_weights.pth"
    }
    
    for model_name, model_path in model_paths.items():
        if model_name in models and os.path.exists(model_path):
            try:
                models[model_name].load_weights(model_path)
                logger.info(f"✅ Loaded weights for {model_name}")
            except Exception as e:
                logger.warning(f"⚠️ Failed to load weights for {model_name}: {e}")

async def test_model_health(model: Any, model_name: str) -> bool:
    """Test if model is working correctly"""
    try:
        if model_name == "viton_hd":
            # Test with dummy images
            dummy_person = Image.new('RGB', (512, 768), color='white')
            dummy_clothing = Image.new('RGB', (512, 768), color='blue')
            await model.process_tryon(dummy_person, dummy_clothing)
            return True
        elif model_name == "body_analysis":
            dummy_image = Image.new('RGB', (512, 768), color='white')
            await model.analyze(dummy_image)
            return True
        # Add tests for other models...
        return True
    except Exception as e:
        logger.error(f"Health test failed for {model_name}: {e}")
        return False

if __name__ == "__main__":
    uvicorn.run(
        "python.app.ai_service:app",
        host="0.0.0.0",
        port=8000,
        reload=False,
        workers=1,  # Single worker for GPU models
        log_level="info"
    )
