from __future__ import annotations

import logging
import uuid
from typing import Callable

from fastapi import Request

logger = logging.getLogger(__name__)


async def request_id_middleware(request: Request, call_next: Callable):
    """Attach a unique `request_id` to each request and a LoggerAdapter.

    The `request_id` is placed on `request.state.request_id` and included in
    logs via a `LoggerAdapter`. This improves traceability across services.
    """
    rid = str(uuid.uuid4())
    request.state.request_id = rid

    shop = getattr(request.state, "tenant", None)
    shop_domain = getattr(shop, "shop_domain", None) if shop is not None else None

    adapter = logging.LoggerAdapter(logging.getLogger("app"), {"request_id": rid, "shop_domain": shop_domain})
    request.state.logger = adapter

    response = await call_next(request)
    response.headers["X-Request-ID"] = rid
    return response
