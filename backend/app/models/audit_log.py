from sqlalchemy import Column, String, DateTime
from datetime import datetime
from app.database import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String, primary_key=True)
    merchant_id = Column(String, index=True)
    action = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
