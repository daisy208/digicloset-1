from __future__ import annotations

import logging
import traceback
from typing import Any, Dict

from fastapi import Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel

logger = logging.getLogger(__name__)


class ErrorResponse(BaseModel):
    error: str
    code: int
    request_id: str | None = None
    details: Dict[str, Any] | None = None


async def global_exception_handler(request: Request, exc: Exception):
    # Log full traceback with request context
    request_id = getattr(request.state, "request_id", None)
    shop = getattr(request.state, "tenant", None)
    shop_domain = getattr(shop, "shop_domain", None) if shop else None

    logger.error(
        "Unhandled exception: %s",
        exc,
        extra={"request_id": request_id, "shop_domain": shop_domain},
    )
    logger.debug(traceback.format_exc())

    payload = ErrorResponse(error="internal_server_error", code=500, request_id=request_id)
    return JSONResponse(status_code=500, content=payload.model_dump())
