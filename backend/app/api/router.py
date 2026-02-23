from fastapi import APIRouter

# Import feature routers
from app.api.ai_products import router as ai_products_router

api_router = APIRouter()

# Register routers
api_router.include_router(ai_products_router)
from app.api.ai_bulk import router as ai_bulk_router
from app.api.ai_usage import router as ai_usage_router
from app.api.ai_reports import router as ai_reports_router
from app.api.ai_chat import router as ai_chat_router
from app.api.ai_alerts import router as ai_alerts_router
from app.api.ai_recommendations import router as ai_recommendations_router
from app.api.ai_conversion import router as ai_conversion_router
from app.api.ai_marketing import router as ai_marketing_router
@router.post("/webhooks/app_uninstalled")
def app_uninstalled(shop_id: str):
    cleanup_merchant_data(shop_id)
    return {"status": "ok"}
from app.api.health import router as health_router
router.include_router(health_router)
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
@limiter.limit("60/minute")
@router.post("/ai/recommendations")
from app.api.merchant_settings import router as merchant_settings_router
router.include_router(merchant_settings_router)
