
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
import uuid
import os
import shutil
from typing import Optional

from app.core.config import settings
from app.services.inference_provider import ProviderFactory
from app.evaluation.harness import evaluation_harness

app = FastAPI(title=settings.APP_NAME)

@app.post('/predict')
async def predict(
    user_image: UploadFile = File(...), 
    garment_image: Optional[UploadFile] = File(None)
):
    try:
        # Read images
        user_bytes = await user_image.read()
        garment_bytes = await garment_image.read() if garment_image else None
        
        # Get Provider (with fallback logic)
        provider = ProviderFactory.get_provider()
        
        # Generate
        result = await provider.generate(
            user_image=user_bytes, 
            garment_image=garment_bytes,
            steps=settings.DEFAULT_STEPS,
            resolution=settings.DEFAULT_RESOLUTION
        )
        
        # Convert bytes to base64 for JSON serialization
        if "image_bytes" in result and result["image_bytes"]:
            import base64
            result["image_base64"] = base64.b64encode(result["image_bytes"]).decode('utf-8')
            del result["image_bytes"]
            
        return JSONResponse(content=result)
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get('/')
def root():
    return {
        "message": "Model Service Running", 
        "provider": settings.INFERENCE_PROVIDER,
        "debug": settings.DEBUG
    }
