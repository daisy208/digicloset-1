from __future__ import annotations

import time
import logging
from typing import Callable
from fastapi import Request

logger = logging.getLogger("app.observability")


async def latency_middleware(request: Request, call_next: Callable):
    start = time.time()
    response = await call_next(request)
    dur = (time.time() - start) * 1000.0
    # attach header and log
    response.headers["X-Request-Latency-ms"] = f"{dur:.2f}"
    logger.info("Request %s %s completed in %.2f ms", request.method, request.url.path, dur, extra={"shop": getattr(request.state, "tenant", None) and getattr(request.state.tenant, "shop_domain", None)})
    return response
