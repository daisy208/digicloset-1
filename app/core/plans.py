from __future__ import annotations

from typing import Dict


PLANS: Dict[str, dict] = {
    "starter": {
        "price_cents": 1900,
        "billing_interval": "EVERY_30_DAYS",
        "trial_days": 7,
        "ai_call_limit_per_month": 500,
    }
}
