from typing import List, Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, and_, desc, func
from app.db.session import get_db
from app.api.v1.deps import get_current_user
from app.models.user import User
from app.models.trade import Trade
from app.schemas.trade import TradeCreate, TradeUpdate, Trade as TradeSchema, TradeStats

router = APIRouter()

def calculate_trade_p_l(trade_data) -> float:
    if trade_data.exit_price is None:
        return 0.0

    pair_upper = trade_data.pair.upper()
    if "XAU" in pair_upper or "GOLD" in pair_upper:
        contract_size = 100.0
    elif "BTC" in pair_upper or "ETH" in pair_upper or "USD" in pair_upper or "JPY" in pair_upper or "EUR" in pair_upper or "GBP" in pair_upper:
        contract_size = 100000.0 if not any(c in pair_upper for c in ["JPY", "HUF"]) else 1000.0
    else:
        contract_size = 100000.0

    multiplier = 1.0
    if "JPY" in pair_upper:
        multiplier = 0.01

    diff = (trade_data.exit_price - trade_data.entry_price)
    if trade_data.direction.upper() == "SELL":
        diff = -diff

    p_l = diff * contract_size * trade_data.lot_size * multiplier
    return round(p_l, 2)

@router.get("/", response_model=List[TradeSchema])
async def get_trades(
    limit: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(Trade).where(Trade.user_id == current_user.id).order_by(desc(Trade.date))
    if limit:
        query = query.limit(limit)
    result = await db.execute(query)
    return result.scalars().all()

@router.post("/", response_model=TradeSchema)
async def create_trade(
    trade_in: TradeCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    p_l = trade_in.p_l or 0.0
    if trade_in.exit_price is not None:
        p_l = calculate_trade_p_l(trade_in)

    dt = trade_in.date or datetime.utcnow()
    if dt.tzinfo is not None:
        dt = dt.replace(tzinfo=None)

    trade = Trade(
        pair=trade_in.pair,
        direction=trade_in.direction,
        entry_price=trade_in.entry_price,
        exit_price=trade_in.exit_price,
        lot_size=trade_in.lot_size,
        stop_loss=trade_in.stop_loss,
        take_profit=trade_in.take_profit,
        session=trade_in.session,
        strategy=trade_in.strategy,
        notes=trade_in.notes,
        p_l=p_l,
        date=dt,
        user_id=current_user.id
    )
    db.add(trade)
    await db.flush()
    await db.refresh(trade)
    return trade

@router.get("/stats", response_model=TradeStats)
async def get_trade_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Trade).where(
            and_(Trade.user_id == current_user.id, Trade.exit_price.isnot(None))
        )
    )
    trades = result.scalars().all()
    total_trades = len(trades)

    if total_trades == 0:
        return {
            "win_rate": 0.0,
            "total_p_l": 0.0,
            "avg_rr": 0.0,
            "total_trades": 0
        }

    wins = [t for t in trades if t.p_l > 0]
    win_rate = (len(wins) / total_trades) * 100
    total_p_l = sum(t.p_l for t in trades)

    rr_values = []
    for t in trades:
        if t.stop_loss and t.take_profit and t.entry_price:
            risk = abs(t.entry_price - t.stop_loss)
            reward = abs(t.take_profit - t.entry_price)
            if risk > 0:
                rr_values.append(reward / risk)
    avg_rr = sum(rr_values) / len(rr_values) if rr_values else 2.0

    return {
        "win_rate": round(win_rate, 1),
        "total_p_l": round(total_p_l, 2),
        "avg_rr": round(avg_rr, 2),
        "total_trades": total_trades
    }

@router.get("/analytics")
async def get_trade_analytics(
    period: str = Query("3m"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    days = 90
    if period == "week":
        days = 7
    elif period == "month":
        days = 30
    elif period == "year":
        days = 365

    since_date = datetime.utcnow() - timedelta(days=days)
    result = await db.execute(
        select(Trade).where(
            and_(
                Trade.user_id == current_user.id,
                Trade.date >= since_date,
                Trade.exit_price.isnot(None)
            )
        ).order_by(Trade.date.asc())
    )
    trades = result.scalars().all()

    cumulative_points = []
    running_p_l = 0.0

    cumulative_points.append({
        "date": (datetime.utcnow() - timedelta(days=days + 1)).strftime("%Y-%m-%d"),
        "value": 0.0
    })

    for t in trades:
        running_p_l += t.p_l
        cumulative_points.append({
            "date": t.date.strftime("%Y-%m-%d"),
            "value": round(running_p_l, 2)
        })

    sessions = {"London": 0.0, "New York": 0.0, "Asian": 0.0}
    session_counts = {"London": 0, "New York": 0, "Asian": 0}
    for t in trades:
        sess = t.session or "London"
        if sess in sessions:
            sessions[sess] += t.p_l
            session_counts[sess] += 1

    session_performance = [
        {"name": k, "value": round(v, 2), "trades": session_counts[k]}
        for k, v in sessions.items()
    ]

    strategies = {}
    for t in trades:
        strat = t.strategy or "Scalp"
        strategies[strat] = strategies.get(strat, 0.0) + t.p_l

    strategy_performance = [
        {"name": k, "p_l": round(v, 2)} for k, v in strategies.items()
    ]
    strategy_performance = sorted(strategy_performance, key=lambda x: x["p_l"], reverse=True)

    return {
        "period": period,
        "cumulative_p_l": cumulative_points,
        "session_performance": session_performance,
        "strategy_performance": strategy_performance
    }

@router.get("/{id}", response_model=TradeSchema)
async def get_trade_detail(
    id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Trade).where(
            and_(Trade.id == id, Trade.user_id == current_user.id)
        )
    )
    trade = result.scalar_one_or_none()
    if not trade:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trade log not found"
        )
    return trade

@router.put("/{id}", response_model=TradeSchema)
async def update_trade(
    id: int,
    trade_in: TradeUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Trade).where(
            and_(Trade.id == id, Trade.user_id == current_user.id)
        )
    )
    trade = result.scalar_one_or_none()
    if not trade:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trade log not found"
        )

    update_data = trade_in.model_dump(exclude_unset=True)
    if "date" in update_data and update_data["date"] is not None:
        dt = update_data["date"]
        if dt.tzinfo is not None:
            update_data["date"] = dt.replace(tzinfo=None)

    for field, value in update_data.items():
        setattr(trade, field, value)

    if trade.exit_price is not None:
        trade.p_l = calculate_trade_p_l(trade)

    db.add(trade)
    await db.flush()
    await db.refresh(trade)
    return trade

@router.delete("/{id}")
async def delete_trade(
    id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Trade).where(
            and_(Trade.id == id, Trade.user_id == current_user.id)
        )
    )
    trade = result.scalar_one_or_none()
    if not trade:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trade log not found"
        )
    await db.execute(delete(Trade).where(Trade.id == id))
    return {"detail": "Trade log deleted successfully"}
