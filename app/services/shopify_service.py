"""Example service layer showing how to use `ShopifyClient`.

This is a lightweight wrapper used by higher-level app code.
"""
from typing import Any, Dict

from app.services.shopify_client import ShopifyClient
from app.core.tenant import TenantContext


class ShopifyService:
    """Tenant-aware Shopify service.

    Note: This service does not hold any global mutable state. A `ShopifyClient` is
    instantiated per-tenant on each call (cheap wrapper around `requests.Session`).
    """

    def __init__(self) -> None:
        pass

    def _client_for_tenant(self, tenant: TenantContext) -> ShopifyClient:
        return ShopifyClient(tenant.shop_domain, tenant.access_token)

    def get_products(self, tenant: TenantContext, limit: int = 10) -> Dict[str, Any]:
        client = self._client_for_tenant(tenant)
        resp = client.request("GET", f"/admin/api/2023-10/products.json?limit={limit}")
        return resp.json()

    def create_product(self, tenant: TenantContext, payload: Dict[str, Any], idempotency_key: str | None = None) -> Dict[str, Any]:
        client = self._client_for_tenant(tenant)
        resp = client.request("POST", "/admin/api/2023-10/products.json", json=payload, idempotency_key=idempotency_key)
        return resp.json()

