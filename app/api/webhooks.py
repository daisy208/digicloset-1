from __future__ import annotations

import json
import logging
from typing import Any

from fastapi import APIRouter, Header, HTTPException, Request

from app.core.security import make_idempotency_key_for_webhook, verify_webhook_hmac
from app.services.data_deletion import DataDeletionService
from app.services.billing_service import InMemoryStore

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/webhooks", tags=["webhooks"])


async def _mark_idempotent(request: Request, key: str) -> bool:
    """Return True if this webhook was already processed (idempotent).

    Uses Redis SETNX to mark key; expiry 1 day.
    """
    r = getattr(request.app.state, "redis", None)
    if not r:
        return False
    # SETNX semantics: set if not exists
    was_set = r.setnx(key, "1")
    if was_set:
        r.expire(key, 86400)
        return False
    return True


@router.post("/app-uninstalled")
async def app_uninstalled(request: Request, x_shopify_hmac_sha256: str | None = Header(None)) -> Any:
    body = await request.body()
    verify_webhook_hmac(body, x_shopify_hmac_sha256)

    key = make_idempotency_key_for_webhook(request.headers, body)
    already = await _mark_idempotent(request, key)
    if already:
        logger.info("Ignored duplicate uninstall webhook %s", key)
        return {"status": "duplicate"}

    # Perform cleanup: invalidate tokens and remove shop records
    shop = request.headers.get("x-shopify-shop-domain")
    if not shop:
        raise HTTPException(status_code=400, detail="missing_shop_header")

    store = getattr(request.app.state, "store", None) or InMemoryStore()
    deletion = DataDeletionService(store)
    try:
        audit = await deletion.delete_shop_data(shop)
        logger.info("Uninstall cleanup completed for %s: %s", shop, audit.json())
    except Exception:
        logger.exception("Failed to cleanup shop %s on uninstall webhook", shop)
        raise HTTPException(status_code=500, detail="cleanup_failed")

    return {"status": "ok"}


@router.post("/gdpr/data_request")
async def gdpr_data_request(request: Request, x_shopify_hmac_sha256: str | None = Header(None)) -> Any:
    body = await request.body()
    verify_webhook_hmac(body, x_shopify_hmac_sha256)
    payload = await request.json()
    shop = request.headers.get("x-shopify-shop-domain")
    if not shop:
        raise HTTPException(status_code=400, detail="missing_shop_header")

    # Idempotent handling
    key = make_idempotency_key_for_webhook(request.headers, body)
    already = await _mark_idempotent(request, key)
    if already:
        return {"status": "duplicate"}

    # Acknowledge and trigger internal data export (placeholder)
    logger.info("Received GDPR data_request for %s: %s", shop, payload)
    return {"status": "accepted"}


@router.post("/gdpr/redact")
async def gdpr_redact(request: Request, x_shopify_hmac_sha256: str | None = Header(None)) -> Any:
    body = await request.body()
    verify_webhook_hmac(body, x_shopify_hmac_sha256)
    payload = await request.json()
    shop = request.headers.get("x-shopify-shop-domain")
    if not shop:
        raise HTTPException(status_code=400, detail="missing_shop_header")

    key = make_idempotency_key_for_webhook(request.headers, body)
    already = await _mark_idempotent(request, key)
    if already:
        return {"status": "duplicate"}

    store = getattr(request.app.state, "store", None) or InMemoryStore()
    deletion = DataDeletionService(store)
    try:
        audit = await deletion.delete_shop_data(shop)
        logger.info("GDPR redact executed for %s: %s", shop, audit.json())
    except Exception:
        logger.exception("Failed GDPR redact for %s", shop)
        raise HTTPException(status_code=500, detail="redact_failed")

    return {"status": "accepted"}


@router.post("/customers/data_request")
async def customers_data_request(request: Request, x_shopify_hmac_sha256: str | None = Header(None)):
    body = await request.body()
    verify_webhook_hmac(body, x_shopify_hmac_sha256)
    return await gdpr_data_request(request, x_shopify_hmac_sha256)


@router.post("/customers/redact")
async def customers_redact(request: Request, x_shopify_hmac_sha256: str | None = Header(None)):
    body = await request.body()
    verify_webhook_hmac(body, x_shopify_hmac_sha256)
    return await gdpr_redact(request, x_shopify_hmac_sha256)


@router.post("/shop/redact")
async def shop_redact(request: Request, x_shopify_hmac_sha256: str | None = Header(None)):
    body = await request.body()
    verify_webhook_hmac(body, x_shopify_hmac_sha256)
    return await gdpr_redact(request, x_shopify_hmac_sha256)
