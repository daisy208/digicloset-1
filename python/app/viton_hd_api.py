import io
import time
import torch
import uvicorn
from PIL import Image
from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse, StreamingResponse
from prometheus_client import Counter, Histogram, Gauge, generate_latest, CONTENT_TYPE_LATEST
from starlette.responses import Response
from viton_model import VITONHDModel

app = FastAPI(title="VITON-HD Inference Service", version="1.0")

REQUEST_COUNT = Counter('virtualfit_requests_total', 'Total request count', ['method', 'endpoint', 'status_code'])
REQUEST_DURATION = Histogram('virtualfit_request_duration_seconds', 'Request duration in seconds', ['method', 'endpoint'])
QUEUE_LENGTH = Gauge('virtualfit_queue_length', 'Current queue length')
ACTIVE_REQUESTS = Gauge('virtualfit_active_requests', 'Number of active requests')
GPU_MEMORY_USED = Gauge('virtualfit_gpu_memory_used_bytes', 'GPU memory used in bytes')
GPU_UTILIZATION = Gauge('virtualfit_gpu_utilization', 'GPU utilization percentage')

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model = VITONHDModel(device=device)

def update_gpu_metrics():
    if torch.cuda.is_available():
        GPU_MEMORY_USED.set(torch.cuda.memory_allocated())
        GPU_UTILIZATION.set(torch.cuda.utilization())
# model.load_state_dict(torch.load("models/viton_hd_weights.pth", map_location=device))

@app.get("/metrics")
async def metrics():
    update_gpu_metrics()
    return Response(content=generate_latest(), media_type=CONTENT_TYPE_LATEST)

@app.get("/health")
async def health():
    return {"status": "healthy", "device": str(device)}

@app.post("/tryon")
async def try_on(person_image: UploadFile = File(...), cloth_image: UploadFile = File(...)):
    start_time = time.time()
    ACTIVE_REQUESTS.inc()
    status_code = 200

    try:
        person_img = Image.open(io.BytesIO(await person_image.read())).convert("RGB")
        cloth_img = Image.open(io.BytesIO(await cloth_image.read())).convert("RGB")
        output_img = model.infer(person_img, cloth_img)
        buf = io.BytesIO()
        output_img.save(buf, format="PNG")
        buf.seek(0)

        update_gpu_metrics()
        return StreamingResponse(buf, media_type="image/png")
    except Exception as e:
        status_code = 500
        return JSONResponse(content={"error": str(e)}, status_code=500)
    finally:
        duration = time.time() - start_time
        ACTIVE_REQUESTS.dec()
        REQUEST_COUNT.labels(method="POST", endpoint="/tryon", status_code=status_code).inc()
        REQUEST_DURATION.labels(method="POST", endpoint="/tryon").observe(duration)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
