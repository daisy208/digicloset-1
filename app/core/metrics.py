from __future__ import annotations

import logging
from typing import Any, Dict, Optional

logger = logging.getLogger(__name__)

try:
    from prometheus_client import Counter, Histogram

    REQUEST_COUNT = Counter("app_requests_total", "Total HTTP requests", ["endpoint"])
    REQUEST_LATENCY = Histogram("app_request_latency_seconds", "Request latency seconds", ["endpoint"])
    AI_INFERENCE_TIME = Histogram("ai_inference_seconds", "AI inference duration seconds")
    SHOPIFY_RETRY_COUNT = Counter("shopify_retry_count", "Shopify retry attempts")
except Exception:  # pragma: no cover - metrics optional
    REQUEST_COUNT = None
    REQUEST_LATENCY = None
    AI_INFERENCE_TIME = None
    SHOPIFY_RETRY_COUNT = None


def emit_metric(name: str, payload: Dict[str, Any]) -> None:
    # lightweight hook used by services; keep it safe if prometheus not installed
    try:
        if name == "request_count" and REQUEST_COUNT is not None:
            REQUEST_COUNT.labels(endpoint=payload.get("endpoint", "unknown")).inc()
        if name == "request_latency" and REQUEST_LATENCY is not None:
            REQUEST_LATENCY.labels(endpoint=payload.get("endpoint", "unknown")).observe(payload.get("value", 0.0))
        if name == "ai_inference_time" and AI_INFERENCE_TIME is not None:
            AI_INFERENCE_TIME.observe(payload.get("value", 0.0))
        if name == "shopify_retry":
            if SHOPIFY_RETRY_COUNT is not None:
                SHOPIFY_RETRY_COUNT.inc()
    except Exception:
        logger.debug("metric emit failed for %s", name, exc_info=True)
