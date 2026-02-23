from fastapi import APIRouter

# Import application routers
from app.api.feedback import router as feedback_router
from app.api.ai_infer import router as ai_infer_router


api_router = APIRouter()

# Include sub-routers
api_router.include_router(feedback_router)
api_router.include_router(ai_infer_router)
