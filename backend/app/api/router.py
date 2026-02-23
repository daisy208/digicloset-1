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
