from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, and_, desc, func
from app.db.session import get_db
from app.api.v1.deps import get_current_user
from app.models.user import User
from app.models.transaction import Transaction
from app.models.budget import Budget
from app.schemas.transaction import TransactionCreate, TransactionUpdate, Transaction as TransactionSchema

router = APIRouter()

@router.get("/", response_model=List[TransactionSchema])
async def get_transactions(
    type: Optional[str] = Query(None), # "income" or "expense"
    from_date: Optional[str] = Query(None, alias="from"),
    to_date: Optional[str] = Query(None, alias="to"),
    limit: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(Transaction).where(Transaction.user_id == current_user.id).order_by(desc(Transaction.date))

    if type:
        query = query.where(Transaction.type == type)

    if from_date:
        try:
            fd = datetime.fromisoformat(from_date).replace(tzinfo=None)
            query = query.where(Transaction.date >= fd)
        except ValueError:
            pass

    if to_date:
        try:
            td = datetime.fromisoformat(to_date).replace(tzinfo=None)
            query = query.where(Transaction.date <= td)
        except ValueError:
            pass

    if limit:
        query = query.limit(limit)

    result = await db.execute(query)
    return result.scalars().all()

@router.post("/", response_model=TransactionSchema)
async def create_transaction(
    tx_in: TransactionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    dt = tx_in.date or datetime.utcnow()
    if isinstance(dt, str):
        dt = datetime.fromisoformat(dt)
    # Strip timezone offset so it matches postgres naive timestamp format
    if dt.tzinfo is not None:
        dt = dt.replace(tzinfo=None)

    tx = Transaction(
        amount=tx_in.amount,
        type=tx_in.type,
        category=tx_in.category,
        notes=tx_in.notes,
        date=dt,
        user_id=current_user.id
    )
    db.add(tx)
    await db.flush()
    await db.refresh(tx)

    # Automatically update matching budget if it is an expense
    if tx.type == "expense":
        budget_result = await db.execute(
            select(Budget).where(
                and_(
                    Budget.user_id == current_user.id,
                    Budget.category == tx.category
                )
            )
        )
        budget = budget_result.scalar_one_or_none()
        if budget:
            budget.spent += tx.amount
            db.add(budget)
            await db.flush()

    return tx

@router.put("/{id}", response_model=TransactionSchema)
async def update_transaction(
    id: int,
    tx_in: TransactionUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Transaction).where(
            and_(Transaction.id == id, Transaction.user_id == current_user.id)
        )
    )
    tx = result.scalar_one_or_none()
    if not tx:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found"
        )

    # Track original amount and category for budget updates
    old_amount = tx.amount
    old_type = tx.type
    old_category = tx.category

    update_data = tx_in.model_dump(exclude_unset=True)
    if "date" in update_data and update_data["date"] is not None:
        dt = update_data["date"]
        if dt.tzinfo is not None:
            update_data["date"] = dt.replace(tzinfo=None)

    for field, value in update_data.items():
        setattr(tx, field, value)

    db.add(tx)
    await db.flush()

    # Re-evaluate budget impacts
    if old_type == "expense" or tx.type == "expense":
        # Subtract old amount from old budget
        if old_type == "expense":
            old_b_res = await db.execute(
                select(Budget).where(
                    and_(Budget.user_id == current_user.id, Budget.category == old_category)
                )
            )
            old_b = old_b_res.scalar_one_or_none()
            if old_b:
                old_b.spent = max(0.0, old_b.spent - old_amount)
                db.add(old_b)

        # Add new amount to new budget
        if tx.type == "expense":
            new_b_res = await db.execute(
                select(Budget).where(
                    and_(Budget.user_id == current_user.id, Budget.category == tx.category)
                )
            )
            new_b = new_b_res.scalar_one_or_none()
            if new_b:
                new_b.spent += tx.amount
                db.add(new_b)

        await db.flush()

    return tx

@router.delete("/{id}")
async def delete_transaction(
    id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Transaction).where(
            and_(Transaction.id == id, Transaction.user_id == current_user.id)
        )
    )
    tx = result.scalar_one_or_none()
    if not tx:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found"
        )

    # Deduct budget if deleted transaction was an expense
    if tx.type == "expense":
        b_res = await db.execute(
            select(Budget).where(
                and_(Budget.user_id == current_user.id, Budget.category == tx.category)
            )
        )
        budget = b_res.scalar_one_or_none()
        if budget:
            budget.spent = max(0.0, budget.spent - tx.amount)
            db.add(budget)
            await db.flush()

    await db.execute(delete(Transaction).where(Transaction.id == id))
    return {"detail": "Transaction deleted successfully"}

@router.get("/summary")
async def get_transactions_summary(
    period: str = Query("month"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    inc_res = await db.execute(
        select(func.sum(Transaction.amount)).where(
            and_(Transaction.user_id == current_user.id, Transaction.type == "income")
        )
    )
    total_income = inc_res.scalar() or 0.0

    exp_res = await db.execute(
        select(func.sum(Transaction.amount)).where(
            and_(Transaction.user_id == current_user.id, Transaction.type == "expense")
        )
    )
    total_expenses = exp_res.scalar() or 0.0

    cat_res = await db.execute(
        select(Transaction.category, func.sum(Transaction.amount)).where(
            and_(Transaction.user_id == current_user.id, Transaction.type == "expense")
        ).group_by(Transaction.category)
    )
    categories = []
    category_totals = cat_res.all()
    for cat, total in category_totals:
        pct = (total / total_expenses * 100) if total_expenses > 0 else 0
        categories.append({
            "name": cat,
            "value": total,
            "percentage": round(pct, 1)
        })

    categories = sorted(categories, key=lambda x: x["value"], reverse=True)

    return {
        "period": period,
        "total_income": total_income,
        "total_expenses": total_expenses,
        "total_balance": total_income - total_expenses,
        "categories": categories
    }
