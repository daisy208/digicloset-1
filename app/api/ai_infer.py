from fastapi import APIRouter, Depends, HTTPException
from typing import Dict
from app.ai.schemas import AIRequest, AIResponse
from fastapi import status

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/infer", response_model=AIResponse)
async def infer_endpoint(body: AIRequest, app=Depends(lambda: None)) -> Dict:
    """Inference endpoint. Uses shared `app.state.ai_service` when available."""
    # Access FastAPI application via import to get app state lazily
    from fastapi import Request
    from fastapi import APIRouter
    from fastapi import Depends
    from fastapi import FastAPI
    from fastapi import Response
    from fastapi import HTTPException
    from fastapi import status
    # Import app to access state
    try:
        from app.main import app as fastapi_app
    except Exception:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Application not initialized")

    ai_service = getattr(fastapi_app.state, "ai_service", None)
    if ai_service is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="AI service not available")

    result = await ai_service.infer(body.prompt, max_tokens=body.max_tokens)
    return AIResponse(**result)
