from typing import Optional
from datetime import datetime
from pydantic import BaseModel

class AlertBase(BaseModel):
    sender: str
    subject: str
    body: str
    category: str # "Broker", "Bank", "General"
    is_read: bool = False

class AlertCreate(AlertBase):
    pass

class AlertUpdate(BaseModel):
    is_read: Optional[bool] = None

class AlertInDBBase(AlertBase):
    id: int
    user_id: int
    timestamp: datetime

    class Config:
        from_attributes = True

class AlertSchema(AlertInDBBase):
    pass
