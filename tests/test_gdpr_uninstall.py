import base64
import hmac
import hashlib

from app.core.config import settings


def make_hmac(body: bytes) -> str:
    return base64.b64encode(hmac.new(settings.shopify_api_secret.encode(), body, hashlib.sha256).digest()).decode()


def test_gdpr_data_request_and_uninstall(client):
    body = b'{"request":"data"}'
    sig = make_hmac(body)
    headers = {"X-Shopify-Hmac-Sha256": sig, "X-Shopify-Shop-Domain": "gdpr.myshopify.com"}

    # GDPR data_request
    r = client.post("/api/webhooks/customers/data_request", data=body, headers=headers)
    assert r.status_code == 200
    assert r.json()["status"] in ("accepted", "duplicate")

    # Uninstall
    r2 = client.post("/api/webhooks/app-uninstalled", data=b'{}', headers={"X-Shopify-Hmac-Sha256": make_hmac(b'{}'), "X-Shopify-Shop-Domain": "gdpr.myshopify.com"})
    assert r2.status_code == 200
    assert r2.json()["status"] in ("ok", "duplicate")
