from prometheus_client import Counter, generate_latest
from fastapi import APIRouter, Response

router = APIRouter()
REQUEST_COUNT = Counter("inference_requests_total", "Total inference requests")

@router.get("/metrics")
def metrics():
    return Response(generate_latest(), media_type="text/plain")

def count_request():
    REQUEST_COUNT.inc()