from __future__ import annotations

from fastapi import Request, HTTPException
from typing import Callable

from app.core.config import settings
from app.core.plans import PLANS


async def billing_enforcement_middleware(request: Request, call_next: Callable):
    """Middleware to enforce billing for protected routes.

    Expects `request.state.tenant` to be set by tenant middleware.
    Allows billing endpoints and public endpoints.
    """
    path = request.url.path
    # allow billing endpoints and webhooks to pass through
    allow_prefixes = ("/api/billing", "/api/webhooks", "/health", "/api/auth")
    if any(path.startswith(p) for p in allow_prefixes):
        return await call_next(request)

    tenant = getattr(request.state, "tenant", None)
    if tenant is None:
        raise HTTPException(status_code=401, detail="Missing tenant")

    # storage should be attached to app.state.store by startup (fallback handled in service)
    store = getattr(request.app.state, "store", None)
    from app.services.billing_service import BillingService, InMemoryStore

    if store is None:
        store = InMemoryStore()

    svc = BillingService(tenant.shop_domain, tenant.access_token, store)
    allowed = await svc.is_active_or_in_trial()
    if not allowed:
        raise HTTPException(status_code=402, detail="subscription_inactive")

    return await call_next(request)
