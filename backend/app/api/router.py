from fastapi import APIRouter

# Import feature routers
from app.api.ai_products import router as ai_products_router

api_router = APIRouter()

# Register routers
api_router.include_router(ai_products_router)
