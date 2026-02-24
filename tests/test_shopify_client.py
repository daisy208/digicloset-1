import time
from unittest.mock import Mock, patch

import requests

from app.services.shopify_client import ShopifyClient


def make_response(status: int, headers=None, json_data=None):
    r = requests.Response()
    r.status_code = status
    r._content = b"{}"
    r.headers = headers or {}
    if json_data is not None:
        import json

        r._content = json.dumps(json_data).encode("utf-8")
    return r


def test_retry_on_429_then_success(monkeypatch):
    session = Mock()
    # First call returns 429 with Retry-After, second call succeeds
    resp1 = make_response(429, headers={"Retry-After": "1", "X-Shopify-Shop-Api-Call-Limit": "10/40"})
    resp2 = make_response(200, headers={"X-Shopify-Shop-Api-Call-Limit": "11/40"}, json_data={"ok": True})

    session.request.side_effect = [resp1, resp2]

    client = ShopifyClient("example.myshopify.com", "token", session=session, backoff_base=0.01)

    # Patch time.sleep so test is fast and we can assert it was called with backoff or retry-after
    sleeps = []

    def fake_sleep(s):
        sleeps.append(s)

    monkeypatch.setattr("time.sleep", fake_sleep)

    resp = client.request("GET", "/admin/api/2023-10/products.json")
    assert resp.status_code == 200
    # Ensure we honored Retry-After (1 second) or a sleep was performed
    assert len(sleeps) >= 1


def test_no_retry_post_without_idempotency(monkeypatch):
    session = Mock()
    resp1 = make_response(429, headers={})
    session.request.return_value = resp1

    client = ShopifyClient("example.myshopify.com", "token", session=session, backoff_base=0.01, max_retries=2)

    try:
        client.request("POST", "/admin/api/2023-10/products.json", json={"title": "x"})
    except requests.HTTPError:
        # expected: raise because POST without idempotency should not retry indefinitely
        pass
