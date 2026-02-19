from datetime import datetime
from pydantic import BaseModel

class OutfitFeedback(BaseModel):
    outfit_id: str
    approved: bool
    reason: str | None = None
    timestamp: datetime = datetime.utcnow()