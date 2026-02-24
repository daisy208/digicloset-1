from __future__ import annotations

import asyncio
from typing import Callable

from fastapi import Request

from app.core.config import settings


async def request_timeout_middleware(request: Request, call_next: Callable):
    """Global request timeout middleware using asyncio.wait_for.

    Cancels requests taking longer than `settings.request_timeout` seconds.
    """
    timeout = float(settings.request_timeout)

    try:
        return await asyncio.wait_for(call_next(request), timeout=timeout)
    except asyncio.TimeoutError:
        from fastapi.responses import JSONResponse

        return JSONResponse(status_code=504, content={"error": "request_timeout"})
