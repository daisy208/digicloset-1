from __future__ import annotations

from typing import Any

from pydantic import BaseModel


class StandardResponse(BaseModel):
    success: bool
    data: Any | None = None
    error: str | None = None
    request_id: str | None = None
