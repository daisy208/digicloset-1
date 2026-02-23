from pydantic import BaseModel, Field
from typing import Optional


class AIRequest(BaseModel):
    prompt: str = Field(..., min_length=1)
    max_tokens: Optional[int] = Field(128, ge=1, le=2048)


class AIResponse(BaseModel):
    text: str
    confidence: float = Field(..., ge=0.0, le=1.0)
    model: Optional[str] = None
