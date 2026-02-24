from fastapi import APIRouter, Depends, Request

from app.core.tenant import get_tenant_from_request, TenantContext
from app.services.shopify_service import ShopifyService

router = APIRouter(prefix="/shopify", tags=["shopify"])

service = ShopifyService()


@router.get("/products")
def list_products(request: Request, tenant: TenantContext = Depends(get_tenant_from_request)):
    """Example tenant-scoped route that lists products for the authenticated shop.

    Requires headers: `x-shopify-shop-domain` and `authorization: Bearer <token>`
    """
    return service.get_products(tenant, limit=10)
