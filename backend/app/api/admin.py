from fastapi import APIRouter
from app.config.runtime_flags import GLOBAL_DISABLE_AI

router = APIRouter(prefix="/admin")

@router.post("/disable-ai")
def disable_ai():
    GLOBAL_DISABLE_AI = True
    return {"status": "ai_disabled"}
