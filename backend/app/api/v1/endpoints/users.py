from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.db.session import get_db
from app.api.v1.deps import get_current_user
from app.models.user import User
from app.models.transaction import Transaction
from app.models.budget import Budget
from app.models.trade import Trade
from app.schemas.user import User as UserSchema

router = APIRouter()

@router.get("/me", response_model=UserSchema)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.get("/me/stats")
async def get_me_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Total Transactions count
    tx_count_result = await db.execute(
        select(func.count(Transaction.id)).where(Transaction.user_id == current_user.id)
    )
    tx_count = tx_count_result.scalar() or 0

    # Total Budgets count
    budget_count_result = await db.execute(
        select(func.count(Budget.id)).where(Budget.user_id == current_user.id)
    )
    budget_count = budget_count_result.scalar() or 0

    # Total Trades count
    trade_count_result = await db.execute(
        select(func.count(Trade.id)).where(Trade.user_id == current_user.id)
    )
    trade_count = trade_count_result.scalar() or 0

    return {
        "transactions_count": tx_count,
        "active_budgets": budget_count,
        "total_trades": trade_count
    }
