from fastapi import APIRouter
from app.models.feedback import OutfitFeedback
from app.services.feedback_service import save_feedback

router = APIRouter()

@router.post("/feedback")
def submit_feedback(feedback: OutfitFeedback):
    save_feedback(feedback)
    return {"status": "ok"}