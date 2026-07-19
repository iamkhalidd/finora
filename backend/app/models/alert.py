from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.base_class import Base

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    sender = Column(String, nullable=False)
    subject = Column(String, nullable=False)
    body = Column(String, nullable=False)
    category = Column(String, nullable=False) # "Broker", "Bank", "General"
    is_read = Column(Boolean, default=False, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    user = relationship("User", backref="alerts")
