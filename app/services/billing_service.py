from __future__ import annotations

import logging
from datetime import datetime, timedelta
from typing import Optional

from app.models.billing import SubscriptionRecord, UsageRecord
from app.core.plans import PLANS
from app.services.shopify_client import ShopifyClient

logger = logging.getLogger(__name__)


class StorageInterface:
    """Abstract storage interface. Implementations must be provided in production.

    For tests we attach an in-memory store to `app.state.store`.
    """

    async def get_subscription(self, shop: str) -> Optional[SubscriptionRecord]:
        raise NotImplementedError()

    async def save_subscription(self, record: SubscriptionRecord) -> None:
        raise NotImplementedError()

    async def get_usage(self, shop: str) -> Optional[UsageRecord]:
        raise NotImplementedError()

    async def save_usage(self, usage: UsageRecord) -> None:
        raise NotImplementedError()


class InMemoryStore(StorageInterface):
    def __init__(self):
        self.subs: dict[str, SubscriptionRecord] = {}
        self.usage: dict[str, UsageRecord] = {}

    async def get_subscription(self, shop: str) -> Optional[SubscriptionRecord]:
        return self.subs.get(shop)

    async def save_subscription(self, record: SubscriptionRecord) -> None:
        self.subs[record.shop_domain] = record

    async def get_usage(self, shop: str) -> Optional[UsageRecord]:
        return self.usage.get(shop)

    async def save_usage(self, usage: UsageRecord) -> None:
        self.usage[usage.shop_domain] = usage


class BillingService:
    def __init__(self, shop_domain: str, access_token: str, store: StorageInterface, shopify_client: Optional[ShopifyClient] = None):
        self.shop = shop_domain
        self.store = store
        self.client = shopify_client or ShopifyClient(shop_domain, access_token)

    async def create_recurring_charge(self, plan_name: str = "starter") -> dict:
        """Create a recurring application charge via Shopify GraphQL and persist pending state.

        Idempotent: if an active or pending charge exists, return it instead of creating duplicate.
        """
        existing = await self.store.get_subscription(self.shop)
        if existing and existing.status in ("active", "pending"):
            logger.info("Existing subscription found for %s: %s", self.shop, existing.status)
            return existing.dict()

        plan = PLANS[plan_name]
        trial_days = plan.get("trial_days", 0)

        mutation = f"""
        mutation {{
          appSubscriptionCreate(
            name: "{plan_name.capitalize()} Plan",
            returnUrl: "https://yourapp.com/api/billing/activate",
            test: true,
            trialDays: {trial_days},
            lineItems: [{{ plan: {{ appRecurringPricingDetails: {{ price: {{ amount: 19.0, currencyCode: USD }} interval: {plan['billing_interval']} }} }} }}]
          ) {{
            userErrors {{ field message }}
            confirmationUrl
            appSubscription {{ id status trialDaysbillingOn }}
          }}
        }}
        """

        resp = self.client.request("POST", f"/admin/api/{self.client.session.headers.get('X-Shopify-Access-Token')}/graphql.json", json={"query": mutation}, timeout=10)
        # For safety, we won't parse exact fields here; real implementation would parse response
        record = SubscriptionRecord(shop_domain=self.shop, plan_name=plan_name, status="pending", trial_ends_at=(datetime.utcnow() + timedelta(days=trial_days) if trial_days else None))
        await self.store.save_subscription(record)
        return record.dict()

    async def activate_charge(self, charge_id: str) -> SubscriptionRecord:
        # mark subscription active
        rec = await self.store.get_subscription(self.shop) or SubscriptionRecord(shop_domain=self.shop)
        rec.charge_id = charge_id
        rec.status = "active"
        rec.activated_at = datetime.utcnow()
        await self.store.save_subscription(rec)
        logger.info("Activated charge %s for %s", charge_id, self.shop)
        return rec

    async def cancel_subscription(self) -> None:
        rec = await self.store.get_subscription(self.shop)
        if not rec:
            return
        rec.status = "cancelled"
        await self.store.save_subscription(rec)
        logger.info("Cancelled subscription for %s", self.shop)

    async def is_active_or_in_trial(self) -> bool:
        rec = await self.store.get_subscription(self.shop)
        if not rec:
            return False
        if rec.status == "active":
            return True
        if rec.trial_ends_at and rec.trial_ends_at > datetime.utcnow():
            return True
        return False

    async def increment_usage(self, ai_calls: int = 0, products: int = 0) -> UsageRecord:
        usage = await self.store.get_usage(self.shop)
        now = datetime.utcnow()
        ym = now.strftime("%Y-%m")
        if not usage or usage.month_period != ym:
            usage = UsageRecord(shop_domain=self.shop, ai_calls_this_month=0, products_processed_this_month=0, month_period=ym)
        usage.ai_calls_this_month += ai_calls
        usage.products_processed_this_month += products
        usage.last_usage_at = now
        await self.store.save_usage(usage)
        return usage
