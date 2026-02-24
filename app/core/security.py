from __future__ import annotations

import base64
import hashlib
import hmac
from typing import Tuple

from fastapi import HTTPException

from app.core.config import settings


def verify_oauth_hmac(query_params: dict) -> None:
    """Verify Shopify OAuth HMAC (query param style).

    Raises HTTPException(400) on mismatch.
    """
    params = dict(query_params)
    received_hmac = params.pop("hmac", None)
    if not received_hmac:
        raise HTTPException(status_code=400, detail="Missing HMAC")

    # Shopify requires lexicographically sorted query params
    items = sorted((k, v) for k, v in params.items())
    message = "&".join(f"{k}={v}" for k, v in items)

    digest = hmac.new(
        settings.shopify_api_secret.encode(), message.encode(), hashlib.sha256
    ).hexdigest()

    if not hmac.compare_digest(digest, received_hmac):
        raise HTTPException(status_code=400, detail="Invalid HMAC")


def verify_webhook_hmac(body: bytes, header_hmac: str) -> None:
    """Verify Shopify webhook HMAC (HMAC-SHA256, base64-encoded).

    Raises HTTPException(400) on mismatch.
    """
    if not header_hmac:
        raise HTTPException(status_code=400, detail="Missing webhook HMAC header")

    computed = base64.b64encode(hmac.new(settings.shopify_api_secret.encode(), body, hashlib.sha256).digest()).decode()

    if not hmac.compare_digest(computed, header_hmac):
        raise HTTPException(status_code=400, detail="Invalid webhook signature")


def make_idempotency_key_for_webhook(headers: dict, body: bytes) -> str:
    """Create a deterministic idempotency key for webhook delivery.

    Use delivery id if present, otherwise hash(topic + body).
    """
    delivery = headers.get("x-shopify-delivery") or headers.get("x-shopify-delivery-id")
    if delivery:
        return f"webhook:{delivery}"
    topic = headers.get("x-shopify-topic", "unknown")
    # Use sha256 hex of topic + body
    return "webhook:" + hashlib.sha256(topic.encode() + b"|" + body).hexdigest()
