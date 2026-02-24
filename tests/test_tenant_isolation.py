from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.core.tenant import tenant_middleware


def build_test_app():
    app = FastAPI()

    # attach middleware
    app.middleware("http")(tenant_middleware)

    @app.get("/whoami")
    def whoami(request):
        tenant = request.state.tenant
        return {"shop": tenant.shop_domain}

    return app


def test_middleware_attaches_tenant_and_rejects_mismatch():
    app = build_test_app()
    client = TestClient(app)

    headers = {"x-shopify-shop-domain": "store-a.myshopify.com", "authorization": "Bearer token-a"}
    r = client.get("/whoami", headers=headers)
    assert r.status_code == 200
    assert r.json()["shop"] == "store-a.myshopify.com"

    # mismatched session shop should be rejected
    headers2 = {
        "x-shopify-shop-domain": "store-a.myshopify.com",
        "authorization": "Bearer token-a",
        "x-session-shop": "store-b.myshopify.com",
    }
    r2 = client.get("/whoami", headers=headers2)
    assert r2.status_code == 403


def test_two_tenants_no_cross_contamination():
    app = build_test_app()
    client = TestClient(app)

    headers_a = {"x-shopify-shop-domain": "a.myshopify.com", "authorization": "Bearer tokA"}
    headers_b = {"x-shopify-shop-domain": "b.myshopify.com", "authorization": "Bearer tokB"}

    r1 = client.get("/whoami", headers=headers_a)
    r2 = client.get("/whoami", headers=headers_b)

    assert r1.json()["shop"] == "a.myshopify.com"
    assert r2.json()["shop"] == "b.myshopify.com"


def test_shopify_service_uses_tenant(monkeypatch):
    from app.services import shopify_service

    created = []

    class DummyClient:
        def __init__(self, shop_domain, access_token):
            created.append((shop_domain, access_token))

        def request(self, *args, **kwargs):
            class R:
                status_code = 200

                def json(self):
                    return {"ok": True}

            return R()

    monkeypatch.setattr(shopify_service, "ShopifyClient", DummyClient)

    from app.core.tenant import TenantContext

    svc = shopify_service.ShopifyService()
    t1 = TenantContext("alpha.myshopify.com", "tokA", shop_id=1)
    t2 = TenantContext("bravo.myshopify.com", "tokB", shop_id=2)

    r1 = svc.get_products(t1)
    r2 = svc.get_products(t2)

    assert r1 == {"ok": True}
    assert r2 == {"ok": True}
    # ensure two separate clients were created with correct tenant data
    assert ("alpha.myshopify.com", "tokA") in created
    assert ("bravo.myshopify.com", "tokB") in created

