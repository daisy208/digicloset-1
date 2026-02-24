from __future__ import annotations

import time
from typing import Callable

from fastapi import Request

from app.core.metrics import emit_metric


async def metrics_middleware(request: Request, call_next: Callable):
    start = time.perf_counter()
    resp = await call_next(request)
    elapsed = time.perf_counter() - start
    endpoint = request.url.path
    emit_metric("request_count", {"endpoint": endpoint})
    emit_metric("request_latency", {"endpoint": endpoint, "value": elapsed})
    return resp
