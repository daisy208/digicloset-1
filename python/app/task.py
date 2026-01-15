
import os
from celery_app import celery_app
from backend.models.viton_hd import VITONModel 
from pathlib import Path
import time
import json


MODEL_PATH = os.getenv("VITON_WEIGHTS_PATH", "/models/viton_hd.pth")
_model = None

def get_model():
    global _model
    if _model is None:
        _model = VITONModel(device=os.getenv("AI_DEVICE", "cpu"))
        _model.load_weights(MODEL_PATH)
    return _model

@celery_app.task(bind=True)
def run_tryon(self, input_image_path: str, clothing_meta: dict, options: dict):
    """
    Celery task to run virtual try-on.
    Returns a dict with result path and metrics.
    """
    start = time.time()
    try:
        model = get_model()
        # model.run_tryon is a placeholder — adapt to your actual inference API
        result_image_path = model.run_tryon(input_image_path, clothing_meta, options)
        duration = time.time() - start
        return {
            "status": "success",
            "result_path": result_image_path,
            "metrics": {"latency_seconds": duration}
        }
    except Exception as e:
        # Celery will capture this exception. You can also call self.update_state(...)
        raise

