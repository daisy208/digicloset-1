from __future__ import annotations

from fastapi import APIRouter, Request, HTTPException

from app.services.billing_service import BillingService, InMemoryStore
from app.services.onboarding_service import OnboardingService

router = APIRouter(prefix="/onboarding", tags=["onboarding"])


@router.get("/status")
async def onboarding_status(request: Request):
    tenant = getattr(request.state, "tenant", None)
    if not tenant:
        raise HTTPException(status_code=401, detail="Missing tenant")

    store = getattr(request.app.state, "store", None) or InMemoryStore()
    billing = BillingService(tenant.shop_domain, tenant.access_token, store)
    service = OnboardingService(billing)
    return await service.status()
