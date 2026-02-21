from fastapi import APIRouter
from app.services.ai_chat import explain_product_score

router = APIRouter(prefix="/ai/chat", tags=["AI Chat"])


@router.post("/explain")
def explain(product: dict):
    return {
        "message": explain_product_score(product)
    }
