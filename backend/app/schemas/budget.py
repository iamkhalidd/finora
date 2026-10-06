from pydantic import BaseModel, Field


class BudgetCreate(BaseModel):
    category: str = Field(min_length=1, max_length=50)
    limit: float = Field(gt=0)


class BudgetUpdate(BaseModel):
    limit: float = Field(gt=0)


class Budget(BaseModel):
    id: int
    category: str
    limit: float
    # Spent in the requested month, computed from transactions
    spent: float = 0.0

    class Config:
        from_attributes = True
