from typing import Literal, Optional
from datetime import datetime
from pydantic import BaseModel, Field

TransactionType = Literal["income", "expense"]


class TransactionBase(BaseModel):
    amount: float = Field(gt=0)
    type: TransactionType
    category: str = Field(min_length=1, max_length=50)
    notes: Optional[str] = Field(default=None, max_length=200)
    date: Optional[datetime] = None


class TransactionCreate(TransactionBase):
    pass


class TransactionUpdate(BaseModel):
    amount: Optional[float] = Field(default=None, gt=0)
    type: Optional[TransactionType] = None
    category: Optional[str] = Field(default=None, min_length=1, max_length=50)
    notes: Optional[str] = Field(default=None, max_length=200)
    date: Optional[datetime] = None


class Transaction(TransactionBase):
    id: int
    user_id: int
    date: datetime

    class Config:
        from_attributes = True


class CategoryTotal(BaseModel):
    name: str
    value: float
    percentage: float


class TransactionSummary(BaseModel):
    month: str
    total_income: float
    total_expenses: float
    net: float
    categories: list[CategoryTotal]
