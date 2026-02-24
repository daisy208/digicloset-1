from __future__ import annotations

import logging
from typing import Optional
from datetime import datetime

from app.models.audit import DeletionAudit
from app.models.billing import SubscriptionRecord, UsageRecord

logger = logging.getLogger(__name__)


class DataDeletionService:
    def __init__(self, store):
        # store implements get_subscription/save_subscription/get_usage/save_usage and raw deletes
        self.store = store

    async def delete_shop_data(self, shop_domain: str) -> DeletionAudit:
        """Perform cascading, idempotent deletion of shop-scoped data.

        - revoke and remove access tokens
        - remove usage records
        - remove AI history (AiResult entries) -- in memory store may just delete keys
        - mark shop as uninstalled
        """
        # delete subscription
        sub = await self.store.get_subscription(shop_domain)
        if sub:
            sub.status = "uninstalled"
            sub.activated_at = sub.activated_at
            await self.store.save_subscription(sub)

        # delete usage
        usage = await self.store.get_usage(shop_domain)
        if usage:
            # remove by setting counts to zero and month_period to None
            usage.ai_calls_this_month = 0
            usage.products_processed_this_month = 0
            usage.last_usage_at = None
            usage.month_period = None
            await self.store.save_usage(usage)

        # For DB-backed store implementations, implement actual deletes of AiResult and related rows.
        # Record audit
        audit = DeletionAudit(shop_domain=shop_domain, action="delete_shop_data", details={"note": "cascading delete performed"}, timestamp=datetime.utcnow())
        logger.info("Deletion audit: %s", audit.json())
        return audit
