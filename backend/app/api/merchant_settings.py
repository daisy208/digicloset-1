from fastapi import APIRouter, Depends
from app.services.merchant_settings import is_ai_enabled, set_ai_enabled

router = APIRouter(prefix="/merchant/settings")

@router.get("/ai")
def get_ai_setting(merchant_id: str, db=Depends(get_db)):
    return {"ai_enabled": is_ai_enabled(db, merchant_id)}

@router.post("/ai")
def update_ai_setting(merchant_id: str, enabled: bool, db=Depends(get_db)):
    set_ai_enabled(db, merchant_id, enabled)
    return {"status": "updated"}
