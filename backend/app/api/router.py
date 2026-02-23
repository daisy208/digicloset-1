from fastapi import APIRouter

# Backend feature routers
from .ai_products import router as ai_products_router
from .ai_bulk import router as ai_bulk_router
from .ai_usage import router as ai_usage_router
from .ai_reports import router as ai_reports_router
from .ai_chat import router as ai_chat_router
from .ai_alerts import router as ai_alerts_router
from .ai_recommendations import router as ai_recommendations_router
from .ai_conversion import router as ai_conversion_router
from .ai_marketing import router as ai_marketing_router


api_router = APIRouter(prefix="/backend", tags=["backend"])

# Register backend sub-routers
api_router.include_router(ai_products_router)
api_router.include_router(ai_bulk_router)
api_router.include_router(ai_usage_router)
api_router.include_router(ai_reports_router)
api_router.include_router(ai_chat_router)
api_router.include_router(ai_alerts_router)
api_router.include_router(ai_recommendations_router)
api_router.include_router(ai_conversion_router)
api_router.include_router(ai_marketing_router)

