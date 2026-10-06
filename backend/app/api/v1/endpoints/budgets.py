from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import select, and_, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.dates import month_range
from app.db.session import get_db
from app.api.v1.deps import get_current_user
from app.models.user import User
from app.models.budget import Budget
from app.models.transaction import Transaction
from app.schemas.budget import BudgetCreate, BudgetUpdate, Budget as BudgetSchema

router = APIRouter()


async def _spent_by_category(db: AsyncSession, user: User, month: Optional[str]) -> dict[str, float]:
    _, start, end = month_range(month)
    result = await db.execute(
        select(Transaction.category, func.sum(Transaction.amount))
        .where(
            and_(
                Transaction.user_id == user.id,
                Transaction.type == "expense",
                Transaction.date >= start,
                Transaction.date < end,
            )
        )
        .group_by(Transaction.category)
    )
    return {cat: float(total or 0) for cat, total in result.all()}


def _to_schema(budget: Budget, spent: dict[str, float]) -> BudgetSchema:
    return BudgetSchema(
        id=budget.id,
        category=budget.category,
        limit=budget.limit,
        spent=spent.get(budget.category, 0.0),
    )


async def _get_owned(db: AsyncSession, id: int, user: User) -> Budget:
    result = await db.execute(select(Budget).where(and_(Budget.id == id, Budget.user_id == user.id)))
    budget = result.scalar_one_or_none()
    if not budget:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Budget not found")
    return budget


@router.get("/", response_model=List[BudgetSchema])
async def get_budgets(
    month: Optional[str] = Query(None, description="YYYY-MM"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Budget).where(Budget.user_id == current_user.id).order_by(Budget.category)
    )
    spent = await _spent_by_category(db, current_user, month)
    return [_to_schema(b, spent) for b in result.scalars().all()]


@router.post("/", response_model=BudgetSchema)
async def create_budget(
    budget_in: BudgetCreate,
    month: Optional[str] = Query(None, description="YYYY-MM"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    existing = await db.execute(
        select(Budget).where(
            and_(Budget.user_id == current_user.id, Budget.category == budget_in.category)
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You already have a budget for this category"
        )

    budget = Budget(category=budget_in.category, limit=budget_in.limit, spent=0.0, user_id=current_user.id)
    db.add(budget)
    await db.flush()
    await db.refresh(budget)
    return _to_schema(budget, await _spent_by_category(db, current_user, month))


@router.put("/{id}", response_model=BudgetSchema)
async def update_budget(
    id: int,
    budget_in: BudgetUpdate,
    month: Optional[str] = Query(None, description="YYYY-MM"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    budget = await _get_owned(db, id, current_user)
    budget.limit = budget_in.limit
    db.add(budget)
    await db.flush()
    await db.refresh(budget)
    return _to_schema(budget, await _spent_by_category(db, current_user, month))


@router.delete("/{id}")
async def delete_budget(
    id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    budget = await _get_owned(db, id, current_user)
    await db.delete(budget)
    return {"detail": "Budget deleted successfully"}
