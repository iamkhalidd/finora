from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, and_, func
from backend.app.db.session import get_db
from backend.app.api.v1.deps import get_current_user
from backend.app.models.user import User
from backend.app.models.budget import Budget
from backend.app.models.transaction import Transaction
from backend.app.schemas.budget import BudgetCreate, BudgetUpdate, Budget as BudgetSchema

router = APIRouter()

@router.get("/", response_model=List[BudgetSchema])
async def get_budgets(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Budget).where(Budget.user_id == current_user.id)
    )
    budgets = result.scalars().all()

    # Recalculate 'spent' from transactions to make sure it's accurate
    for budget in budgets:
        sum_res = await db.execute(
            select(func.sum(Transaction.amount)).where(
                and_(
                    Transaction.user_id == current_user.id,
                    Transaction.type == "expense",
                    Transaction.category == budget.category
                )
            )
        )
        total_spent = sum_res.scalar() or 0.0
        if budget.spent != total_spent:
            budget.spent = total_spent
            db.add(budget)

    if budgets:
        await db.flush()

    return budgets

@router.post("/", response_model=BudgetSchema)
async def create_budget(
    budget_in: BudgetCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Check if budget already exists for this category
    existing_res = await db.execute(
        select(Budget).where(
            and_(
                Budget.user_id == current_user.id,
                Budget.category == budget_in.category
            )
        )
    )
    existing = existing_res.scalar_one_or_none()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A budget for this category already exists"
        )

    # Get total spent in this category
    sum_res = await db.execute(
        select(func.sum(Transaction.amount)).where(
            and_(
                Transaction.user_id == current_user.id,
                Transaction.type == "expense",
                Transaction.category == budget_in.category
            )
        )
    )
    total_spent = sum_res.scalar() or 0.0

    budget = Budget(
        category=budget_in.category,
        limit=budget_in.limit,
        spent=total_spent,
        user_id=current_user.id
    )
    db.add(budget)
    await db.flush()
    await db.refresh(budget)
    return budget

@router.put("/{id}", response_model=BudgetSchema)
async def update_budget(
    id: int,
    budget_in: BudgetUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Budget).where(
            and_(Budget.id == id, Budget.user_id == current_user.id)
        )
    )
    budget = result.scalar_one_or_none()
    if not budget:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Budget not found"
        )

    update_data = budget_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(budget, field, value)

    db.add(budget)
    await db.flush()
    await db.refresh(budget)
    return budget

@router.delete("/{id}")
async def delete_budget(
    id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Budget).where(
            and_(Budget.id == id, Budget.user_id == current_user.id)
        )
    )
    budget = result.scalar_one_or_none()
    if not budget:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Budget not found"
        )
    await db.execute(delete(Budget).where(Budget.id == id))
    return {"detail": "Budget deleted successfully"}
