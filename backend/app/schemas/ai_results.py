from pydantic import BaseModel
from typing import List, Dict, Optional

class AIImageResult(BaseModel):
    background_removed_url: str
    enhanced_image_url: str
    alt_text: str
    tags: List[str]
    attributes: Dict[str, str]
class AIErrorResponse(BaseModel):
    status: str
    reason: str
    retryable: bool
class RecommendationReason(BaseModel):
    rule: str
    confidence: float
