from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, and_, update, func
from backend.app.db.session import get_db
from backend.app.api.v1.deps import get_current_user
from backend.app.models.user import User
from backend.app.models.alert import Alert
from backend.app.schemas.alert import AlertSchema, AlertCreate, AlertUpdate

router = APIRouter()

MOCK_INITIAL_ALERTS = [
    {
        "sender": "Fidelity Investments",
        "subject": "Trade Confirmation: Bought 50 AAPL",
        "body": "Your order to buy 50 shares of Apple Inc (AAPL) at market price has been executed at $182.40 per share on your portfolio account. Total debit $9,120.00.",
        "category": "Broker",
        "is_read": False,
        "timestamp": datetime.utcnow() - timedelta(minutes=45)
    },
    {
        "sender": "Chase Bank",
        "subject": "Incoming Wire Transfer Received",
        "body": "A wire transfer of $10,000.00 from an external account has been successfully credited to your primary checking account. Your available balance is updated.",
        "category": "Bank",
        "is_read": True,
        "timestamp": datetime.utcnow() - timedelta(days=1)
    },
    {
        "sender": "Robinhood",
        "subject": "Margin Call Warning",
        "body": "Your account is approaching its margin maintenance limit. Please review your active positions and collateral immediately to avoid liquidations.",
        "category": "Broker",
        "is_read": True,
        "timestamp": datetime.utcnow() - timedelta(days=2)
    }
]

@router.get("/", response_model=List[AlertSchema])
async def get_alerts(
    category: Optional[str] = Query(None), # "All", "Unread", "Broker", "Bank"
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    existing_count_res = await db.execute(
        select(func.count(Alert.id)).where(Alert.user_id == current_user.id)
    )
    existing_count = existing_count_res.scalar() or 0
    if existing_count == 0:
        for alert_data in MOCK_INITIAL_ALERTS:
            dt = alert_data["timestamp"]
            if dt.tzinfo is not None:
                dt = dt.replace(tzinfo=None)
            db_alert = Alert(
                sender=alert_data["sender"],
                subject=alert_data["subject"],
                body=alert_data["body"],
                category=alert_data["category"],
                is_read=alert_data["is_read"],
                timestamp=dt,
                user_id=current_user.id
            )
            db.add(db_alert)
        await db.flush()

    query = select(Alert).where(Alert.user_id == current_user.id).order_by(Alert.timestamp.desc())
    if category and category.lower() != "all":
        if category.lower() == "unread":
            query = query.where(Alert.is_read == False)
        else:
            query = query.where(Alert.category.ilike(category))

    result = await db.execute(query)
    return result.scalars().all()

@router.put("/{id}", response_model=AlertSchema)
async def update_alert(
    id: int,
    alert_in: AlertUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Alert).where(
            and_(Alert.id == id, Alert.user_id == current_user.id)
        )
    )
    alert = result.scalar_one_or_none()
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert not found"
        )
    if alert_in.is_read is not None:
        alert.is_read = alert_in.is_read
    db.add(alert)
    await db.flush()
    await db.refresh(alert)
    return alert

@router.post("/read-all")
async def read_all_alerts(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await db.execute(
        update(Alert)
        .where(and_(Alert.user_id == current_user.id, Alert.is_read == False))
        .values(is_read=True)
    )
    await db.flush()
    return {"detail": "All alerts marked as read"}
