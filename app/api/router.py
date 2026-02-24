from fastapi import APIRouter

# Import application routers
from app.api.feedback import router as feedback_router
from app.api.ai_infer import router as ai_infer_router
from app.api.shopify_routes import router as shopify_router
from app.api.billing import router as billing_router
from app.api.onboarding import router as onboarding_router


api_router = APIRouter()

# Include sub-routers
api_router.include_router(feedback_router)
api_router.include_router(ai_infer_router)
api_router.include_router(shopify_router)
api_router.include_router(billing_router)
api_router.include_router(onboarding_router)
