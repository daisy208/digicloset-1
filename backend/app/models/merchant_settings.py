from sqlalchemy import Column, String, Boolean
from app.database import Base

class MerchantSettings(Base):
    __tablename__ = "merchant_settings"

    merchant_id = Column(String, primary_key=True)
    ai_enabled = Column(Boolean, default=True)
