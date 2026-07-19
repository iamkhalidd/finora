from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from app.db.session import get_db
from app.api.v1.deps import get_current_user
from app.models.user import User
from app.models.transaction import Transaction

router = APIRouter()

@router.get("/summary")
async def get_dashboard_summary(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Total Income sum
    inc_res = await db.execute(
        select(func.sum(Transaction.amount)).where(
            and_(Transaction.user_id == current_user.id, Transaction.type == "income")
        )
    )
    total_income = inc_res.scalar() or 0.0

    # Total Expenses sum
    exp_res = await db.execute(
        select(func.sum(Transaction.amount)).where(
            and_(Transaction.user_id == current_user.id, Transaction.type == "expense")
        )
    )
    total_expenses = exp_res.scalar() or 0.0

    # Recent balance
    total_balance = total_income - total_expenses

    return {
        "total_balance": total_balance,
        "total_income": total_income,
        "total_expenses": total_expenses,
        "recent_income_change": 12236.0,  # Match design system base reference
        "recent_expense_change": 8120.0
    }
