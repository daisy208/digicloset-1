from fastapi import APIRouter, Depends, HTTPException
from typing import Dict
import asyncio

from app.ai.schemas import AIRequest, AIResponse
from app.core.config import settings
from fastapi import status

try:
    from rq import Queue
    from rq.job import Job
except Exception:
    Queue = None
    Job = None

from jobs.redis_conn import get_redis_connection

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/infer", response_model=AIResponse)
async def infer_endpoint(body: AIRequest, app=Depends(lambda: None)) -> Dict:
    """Direct inference endpoint (backwards compatible).

    NOTE: This remains for compatibility but heavy inference should use `/ai/process`.
    """
    try:
        from app.main import app as fastapi_app
    except Exception:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Application not initialized")

    ai_service = getattr(fastapi_app.state, "ai_service", None)
    if ai_service is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="AI service not available")

    try:
        result = await asyncio.wait_for(ai_service.infer(body.prompt, max_tokens=body.max_tokens), timeout=settings.ai_inference_timeout)
        return AIResponse(**result)
    except asyncio.TimeoutError:
        # safe fallback response for timeouts
        return AIResponse(text="The AI service timed out. Please try again later.", confidence=0.0)
    except Exception:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="AI_inference_failed")


@router.post("/process")
def enqueue_inference(body: AIRequest) -> Dict:
    """Enqueue an AI inference job and return immediately with a job_id.

    Example curl:
    curl -X POST -H "Content-Type: application/json" -d '{"prompt":"hello","max_tokens":64}' \
      ${API_BASE:-http://localhost:8000}/ai/process
    """
    conn = get_redis_connection()
    if Queue is None:
        raise HTTPException(status_code=503, detail="Background queue not configured")
    q = Queue("ai", connection=conn)
    # job timeout in seconds
    job_timeout = int(body.max_tokens) * 2 if body.max_tokens else int(60)
    # Use the job function in jobs.ai_tasks.process_inference
    job = q.enqueue("jobs.ai_tasks.process_inference", body.prompt, body.max_tokens, job_timeout=job_timeout)
    return {"job_id": job.id}


@router.get("/status/{job_id}")
def job_status(job_id: str) -> Dict:
    """Return job status, result, and error if any.

    Response shape: { status: str, result: Optional[dict], error: Optional[str] }
    """
    conn = get_redis_connection()
    if Job is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Background job support not available")
    try:
        job = Job.fetch(job_id, connection=conn)
    except Exception:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

    status_map = {
        "queued": "queued",
        "deferred": "deferred",
        "started": "started",
        "finished": "finished",
        "failed": "failed",
    }
    state = job.get_status()
    res = None
    err = None
    if state == "finished":
        res = job.result
    elif state == "failed":
        # job.exc_info contains traceback; surface short message
        err = getattr(job, "exc_info", None)

    return {"status": status_map.get(state, state), "result": res, "error": err}
