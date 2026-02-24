import base64
import hmac
import hashlib


def test_uninstall_webhook_cleanup(client, monkeypatch):
    called = {"ok": False}

    async def cleanup(shop_domain: str):
        called["ok"] = True

    # override dependency
    from app.main import app as fastapi_app
    fastapi_app.dependency_overrides["shopify_cleanup"] = cleanup

    body = b'{"foo":"bar"}'
    signature = base64.b64encode(hmac.new(fastapi_app.state.redis._d.get('shopify_api_secret','').encode() if fastapi_app.state.redis._d.get('shopify_api_secret') else b"secret", body, hashlib.sha256).digest()).decode()

    # To avoid relying on internal state, compute HMAC using configured secret
    from app.core.config import settings
    signature = base64.b64encode(hmac.new(settings.shopify_api_secret.encode(), body, hashlib.sha256).digest()).decode()

    res = client.post("/api/webhooks/app-uninstalled", data=body, headers={"X-Shopify-Hmac-Sha256": signature, "X-Shopify-Shop-Domain": "a.myshopify.com"})
    assert res.status_code == 200
    assert res.json().get("status") == "ok"
