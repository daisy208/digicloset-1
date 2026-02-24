from __future__ import annotations

from datetime import datetime
from typing import Any

from fastapi import APIRouter, Depends, Request, HTTPException

from app.services.billing_service import BillingService, InMemoryStore
from app.models.billing import SubscriptionRecord
from app.core.plans import PLANS

router = APIRouter(prefix="/billing", tags=["billing"])


def _store_for_app(request: Request):
    return getattr(request.app.state, "store", InMemoryStore())


@router.post("/create")
async def create_charge(request: Request):
    tenant = getattr(request.state, "tenant", None)
    if not tenant:
        raise HTTPException(status_code=401, detail="Missing tenant")

    svc = BillingService(tenant.shop_domain, tenant.access_token, _store_for_app(request))
    # create idempotently
    return await svc.create_recurring_charge("starter")


@router.post("/activate")
async def activate_charge(request: Request):
    body = await request.json()
    shop = body.get("shop")
    charge_id = body.get("charge_id")
    if not shop or not charge_id:
        raise HTTPException(status_code=400, detail="missing_params")

    svc = BillingService(shop, "", _store_for_app(request))
    rec = await svc.activate_charge(charge_id)
    return {"status": "activated", "subscription": rec.dict()}


@router.post("/webhook")
async def billing_webhook(request: Request):
    # placeholder: Shopify billing webhooks should be verified similarly to other webhooks
    payload = await request.json()
    topic = payload.get("topic")
    shop = request.headers.get("x-shopify-shop-domain")
    svc = BillingService(shop, "", _store_for_app(request))
    if topic == "app/subscription/cancelled":
        await svc.cancel_subscription()
    return {"status": "ok"}


@router.get("/status")
async def billing_status(request: Request):
    tenant = getattr(request.state, "tenant", None)
    if not tenant:
        raise HTTPException(status_code=401, detail="Missing tenant")

    store = _store_for_app(request)
    svc = BillingService(tenant.shop_domain, tenant.access_token, store)
    sub = await store.get_subscription(tenant.shop_domain)
    usage = await store.get_usage(tenant.shop_domain)
    plan = sub.plan_name if sub else "starter"
    plan_conf = PLANS.get(plan, {})
    trial_days_remaining = None
    if sub and sub.trial_ends_at:
        delta = sub.trial_ends_at - datetime.utcnow()
        trial_days_remaining = max(0, delta.days)

    return {
        "plan_name": plan,
        "trial_days_remaining": trial_days_remaining,
        "usage_this_month": usage.ai_calls_this_month if usage else 0,
        "usage_limit": plan_conf.get("ai_call_limit_per_month"),
        "subscription_active": (sub.status == "active") if sub else False,
    }
