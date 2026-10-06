from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import select, and_, desc, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.dates import month_range, to_naive
from app.db.session import get_db
from app.api.v1.deps import get_current_user
from app.models.user import User
from app.models.transaction import Transaction
from app.schemas.transaction import (
    TransactionCreate, TransactionUpdate, Transaction as TransactionSchema, TransactionSummary,
)

router = APIRouter()


async def _get_owned(db: AsyncSession, id: int, user: User) -> Transaction:
    result = await db.execute(
        select(Transaction).where(and_(Transaction.id == id, Transaction.user_id == user.id))
    )
    tx = result.scalar_one_or_none()
    if not tx:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")
    return tx


@router.get("/", response_model=List[TransactionSchema])
async def get_transactions(
    month: Optional[str] = Query(None, description="YYYY-MM; omit for all time"),
    type: Optional[str] = Query(None, pattern="^(income|expense)$"),
    limit: Optional[int] = Query(None, ge=1, le=500),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = (
        select(Transaction)
        .where(Transaction.user_id == current_user.id)
        .order_by(desc(Transaction.date), desc(Transaction.id))
    )
    if month:
        _, start, end = month_range(month)
        query = query.where(and_(Transaction.date >= start, Transaction.date < end))
    if type:
        query = query.where(Transaction.type == type)
    if limit:
        query = query.limit(limit)

    result = await db.execute(query)
    return result.scalars().all()


@router.get("/summary", response_model=TransactionSummary)
async def get_transactions_summary(
    month: Optional[str] = Query(None, description="YYYY-MM"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    key, start, end = month_range(month)
    in_month = and_(
        Transaction.user_id == current_user.id,
        Transaction.date >= start,
        Transaction.date < end,
    )

    totals_res = await db.execute(
        select(Transaction.type, func.sum(Transaction.amount)).where(in_month).group_by(Transaction.type)
    )
    totals = {t: float(v or 0) for t, v in totals_res.all()}
    total_income = totals.get("income", 0.0)
    total_expenses = totals.get("expense", 0.0)

    cat_res = await db.execute(
        select(Transaction.category, func.sum(Transaction.amount))
        .where(and_(in_month, Transaction.type == "expense"))
        .group_by(Transaction.category)
        .order_by(func.sum(Transaction.amount).desc())
    )
    categories = [
        {
            "name": cat,
            "value": float(total),
            "percentage": round(float(total) / total_expenses * 100, 1) if total_expenses else 0.0,
        }
        for cat, total in cat_res.all()
    ]

    return {
        "month": key,
        "total_income": total_income,
        "total_expenses": total_expenses,
        "net": total_income - total_expenses,
        "categories": categories,
    }


@router.post("/", response_model=TransactionSchema)
async def create_transaction(
    tx_in: TransactionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    tx = Transaction(
        amount=tx_in.amount,
        type=tx_in.type,
        category=tx_in.category.strip(),
        notes=(tx_in.notes or "").strip() or None,
        date=to_naive(tx_in.date),
        user_id=current_user.id
    )
    db.add(tx)
    await db.flush()
    await db.refresh(tx)
    return tx


@router.get("/{id}", response_model=TransactionSchema)
async def get_transaction(
    id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await _get_owned(db, id, current_user)


@router.put("/{id}", response_model=TransactionSchema)
async def update_transaction(
    id: int,
    tx_in: TransactionUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    tx = await _get_owned(db, id, current_user)
    update_data = tx_in.model_dump(exclude_unset=True)
    if update_data.get("date") is not None:
        update_data["date"] = to_naive(update_data["date"])
    if "notes" in update_data:
        update_data["notes"] = (update_data["notes"] or "").strip() or None
    for field, value in update_data.items():
        if value is not None or field == "notes":
            setattr(tx, field, value)

    db.add(tx)
    await db.flush()
    await db.refresh(tx)
    return tx


@router.delete("/{id}")
async def delete_transaction(
    id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    tx = await _get_owned(db, id, current_user)
    await db.delete(tx)
    return {"detail": "Transaction deleted successfully"}
