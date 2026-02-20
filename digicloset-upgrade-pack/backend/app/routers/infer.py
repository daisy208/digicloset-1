from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
import uuid
import os
import json
import httpx
import asyncio

router = APIRouter()

class InferRequest(BaseModel):
    upload_id: str
    garment_id: str | None = None

JOB_DIR = os.getenv("JOB_DIR", "/tmp/digicloset_jobs")
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "/tmp/digicloset_uploads")
MODEL_SERVICE_URL = os.getenv("MODEL_SERVICE_URL", "http://localhost:8001/predict")

os.makedirs(JOB_DIR, exist_ok=True)

async def process_inference(job_id: str, upload_id: str, garment_id: str | None):
    # Retrieve files
    user_img_path = os.path.join(UPLOAD_DIR, upload_id)
    if not os.path.exists(user_img_path):
        # Update job status to failed
        status_file = os.path.join(JOB_DIR, f"{job_id}.json")
        with open(status_file, "w") as f:
            json.dump({"job_id": job_id, "status": "failed", "error": "User image not found"}, f)
        return

    # Prepare multipart form data for httpx
    files = {}
    files['user_image'] = (upload_id, open(user_img_path, 'rb'), 'image/jpeg')
    
    if garment_id:
        garment_img_path = os.path.join(UPLOAD_DIR, garment_id)
        if os.path.exists(garment_img_path):
            files['garment_image'] = (garment_id, open(garment_img_path, 'rb'), 'image/jpeg')

    try:
        async with httpx.AsyncClient(timeout=300.0) as client:
            response = await client.post(MODEL_SERVICE_URL, files=files)
            response.raise_for_status()
            result = response.json()
            
            # Save the successful result to job file
            status_file = os.path.join(JOB_DIR, f"{job_id}.json")
            with open(status_file, "w") as f:
                json.dump({
                    "job_id": job_id, 
                    "status": "success", 
                    "result": result
                }, f)
                
    except Exception as e:
        status_file = os.path.join(JOB_DIR, f"{job_id}.json")
        with open(status_file, "w") as f:
            json.dump({"job_id": job_id, "status": "failed", "error": str(e)}, f)
    finally:
        # Close file handles unconditionally
        for _, file_tuple, _ in files.values():
            file_tuple.close()

@router.post('/', response_model=dict)
async def submit_infer(req: InferRequest, background_tasks: BackgroundTasks):
    jobid = uuid.uuid4().hex
    
    # Initialize job state
    metadata = {"job_id": jobid, "status": "processing", "upload_id": req.upload_id, "garment_id": req.garment_id}
    with open(os.path.join(JOB_DIR, f"{jobid}.json"), 'w') as f:
        json.dump(metadata, f)
        
    # Queue the background task
    background_tasks.add_task(process_inference, jobid, req.upload_id, req.garment_id)
    
    return {"job_id": jobid, "status": "queued"}

@router.get('/{job_id}', response_model=dict)
async def get_status(job_id: str):
    f = os.path.join(JOB_DIR, f"{job_id}.json")
    if not os.path.exists(f):
        raise HTTPException(status_code=404, detail='Job not found')
    with open(f, 'r') as file:
        content = json.load(file)
    return content
