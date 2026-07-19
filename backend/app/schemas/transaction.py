from typing import Optional
from datetime import datetime
from pydantic import BaseModel

class TransactionBase(BaseModel):
    amount: float
    type: str  # "income" or "expense"
    category: str
    notes: Optional[str] = None
    date: Optional[datetime] = None

class TransactionCreate(TransactionBase):
    pass

class TransactionUpdate(BaseModel):
    amount: Optional[float] = None
    type: Optional[str] = None
    category: Optional[str] = None
    notes: Optional[str] = None
    date: Optional[datetime] = None

class TransactionInDBBase(TransactionBase):
    id: int
    user_id: int
    date: datetime

    class Config:
        from_attributes = True

class Transaction(TransactionInDBBase):
    pass

class TransactionSummary(BaseModel):
    total_balance: float
    total_income: float
    total_expenses: float
