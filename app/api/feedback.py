from typing import Dict
from fastapi import APIRouter, status
from app.models.feedback import OutfitFeedback
from app.services.feedback_service import save_feedback

# Router for feedback-related endpoints
router = APIRouter(prefix="/feedback", tags=["feedback"])


@router.post("/", status_code=status.HTTP_201_CREATED)
def submit_feedback(feedback: OutfitFeedback) -> Dict[str, str]:
    """Submit outfit feedback and persist it via the feedback service."""
    save_feedback(feedback)
    return {"status": "ok"}