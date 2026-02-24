from __future__ import annotations

from datetime import datetime
from pydantic import BaseModel
from typing import Optional


class SubscriptionRecord(BaseModel):
    shop_domain: str
    plan_name: str = "starter"
    charge_id: Optional[str] = None
    status: str = "inactive"  # inactive, pending, active, cancelled
    trial_ends_at: Optional[datetime] = None
    activated_at: Optional[datetime] = None


class UsageRecord(BaseModel):
    shop_domain: str
    ai_calls_this_month: int = 0
    products_processed_this_month: int = 0
    last_usage_at: Optional[datetime] = None
    month_period: Optional[str] = None  # YYYY-MM
