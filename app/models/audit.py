from __future__ import annotations

from datetime import datetime
from pydantic import BaseModel


class DeletionAudit(BaseModel):
    shop_domain: str
    action: str
    details: dict
    timestamp: datetime = datetime.utcnow()
