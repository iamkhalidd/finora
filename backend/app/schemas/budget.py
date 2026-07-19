from typing import Optional
from pydantic import BaseModel

class BudgetBase(BaseModel):
    category: str
    limit: float
    spent: float = 0.0

class BudgetCreate(BudgetBase):
    pass

class BudgetUpdate(BaseModel):
    category: Optional[str] = None
    limit: Optional[float] = None
    spent: Optional[float] = None

class BudgetInDBBase(BudgetBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True

class Budget(BudgetInDBBase):
    pass
