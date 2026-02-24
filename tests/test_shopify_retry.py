import types

import pytest

from app.services.shopify_client import ShopifyClient


class DummyResp:
    def __init__(self, status, headers=None, json_data=None):
        self.status_code = status
        self.headers = headers or {}
        self._json = json_data or {}

    @property
    def ok(self):
        return 200 <= self.status_code < 300

    def json(self):
        return self._json

    def raise_for_status(self):
        if not self.ok:
            raise Exception(f"HTTP {self.status_code}")


def test_shopify_api_429_retry(monkeypatch):
    calls = {"n": 0}

    def fake_request(method, url, params=None, json=None, headers=None, timeout=None):
        calls["n"] += 1
        if calls["n"] == 1:
            return DummyResp(429, headers={"Retry-After": "0", "X-Shopify-Shop-Api-Call-Limit": "10/40"})
        return DummyResp(200, headers={"X-Shopify-Shop-Api-Call-Limit": "11/40"}, json_data={"ok": True})

    client = ShopifyClient("example.myshopify.com", "token", backoff_base=0.001, max_retries=3)
    monkeypatch.setattr(client.session, "request", fake_request)

    resp = client.request("GET", "/admin/api/2024-01/products.json")
    assert resp.status_code == 200
    assert calls["n"] >= 2
