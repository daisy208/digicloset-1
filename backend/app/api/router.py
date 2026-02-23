from fastapi import APIRouter

# ---- Core API router ----
api_router = APIRouter()

# ---- Import sub-routers ----
from app.api.ai_bulk import router as ai_bulk_router
from app.api.ai_usage import router as ai_usage_router
from app.api.ai_reports import router as ai_reports_router
from app.api.ai_chat import router as ai_chat_router
from app.api.ai_alerts import router as ai_alerts_router
from app.api.ai_recommendations import router as ai_recommendations_router
from app.api.ai_conversion import router as ai_conversion_router
from app.api.ai_marketing import router as ai_marketing_router
from app.api.health import router as health_router
from app.api.merchant_settings import router as merchant_settings_router

# ---- Register sub-routers ----
api_router.include_router(ai_bulk_router)
api_router.include_router(ai_usage_router)
api_router.include_router(ai_reports_router)
api_router.include_router(ai_chat_router)
api_router.include_router(ai_alerts_router)
api_router.include_router(ai_recommendations_router)
api_router.include_router(ai_conversion_router)
api_router.include_router(ai_marketing_router)
api_router.include_router(health_router)
api_router.include_router(merchant_settings_router)

