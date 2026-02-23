from sqlalchemy import Column, String, Integer
from app.database import Base

class MerchantConfig(Base):
    __tablename__ = "merchant_config"

    merchant_id = Column(String, primary_key=True)
    max_bundle_size = Column(Integer, default=3)
