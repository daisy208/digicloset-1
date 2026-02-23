from fastapi import FastAPI
from app.api.router import api_router
from app.ai.services.ai_service import AIService
from app.core.config import settings


app = FastAPI(title=settings.app_name)


@app.on_event("startup")
async def startup_event() -> None:
    """Initialize shared services on startup."""
    # Attach a shared AI service instance to the app state
    app.state.ai_service = AIService(model_name=None)


# Mount application routers under /api
app.include_router(api_router, prefix="/api")


@app.get("/health")
def health() -> dict:
    """Health check endpoint used by load balancers and tests."""
    return {"status": "ok"}
