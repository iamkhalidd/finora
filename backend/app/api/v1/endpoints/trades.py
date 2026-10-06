from typing import List, Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import select, and_, desc
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.dates import to_naive
from app.core.trading import estimate_pnl_usd, normalize_pair
from app.db.session import get_db
from app.api.v1.deps import get_current_user
from app.models.user import User
from app.models.trade import Trade
from app.schemas.trade import TradeCreate, TradeUpdate, Trade as TradeSchema, TradeStats

router = APIRouter()

PERIOD_DAYS = {"week": 7, "month": 30, "3m": 90, "year": 365}


def _resolve_pnl(trade: Trade, explicit: Optional[float]) -> float:
    if trade.exit_price is None:
        return 0.0  # open trade
    if explicit is not None:
        return round(explicit, 2)
    estimate = estimate_pnl_usd(trade.pair, trade.direction, trade.entry_price, trade.exit_price, trade.lot_size)
    if estimate is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Can't auto-calculate P&L for {trade.pair}. Enter the profit/loss from your broker.",
        )
    return estimate


async def _get_owned(db: AsyncSession, id: int, user: User) -> Trade:
    result = await db.execute(select(Trade).where(and_(Trade.id == id, Trade.user_id == user.id)))
    trade = result.scalar_one_or_none()
    if not trade:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trade not found")
    return trade


def _planned_rr(t: Trade) -> Optional[float]:
    if t.stop_loss and t.take_profit:
        risk = abs(t.entry_price - t.stop_loss)
        if risk > 0:
            return abs(t.take_profit - t.entry_price) / risk
    return None


@router.get("/", response_model=List[TradeSchema])
async def get_trades(
    status_filter: Optional[str] = Query(None, alias="status", pattern="^(open|closed)$"),
    limit: Optional[int] = Query(None, ge=1, le=500),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(Trade).where(Trade.user_id == current_user.id).order_by(desc(Trade.date), desc(Trade.id))
    if status_filter == "open":
        query = query.where(Trade.exit_price.is_(None))
    elif status_filter == "closed":
        query = query.where(Trade.exit_price.isnot(None))
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
    data = trade_in.model_dump(exclude={"p_l"})
    data["pair"] = normalize_pair(data["pair"]) or data["pair"].upper()
    data["strategy"] = (data.get("strategy") or "").strip() or None
    data["notes"] = (data.get("notes") or "").strip() or None
    data["date"] = to_naive(data.get("date"))
    trade = Trade(**data, user_id=current_user.id)
    trade.p_l = _resolve_pnl(trade, trade_in.p_l)

    db.add(trade)
    await db.flush()
    await db.refresh(trade)
    return trade


@router.get("/stats", response_model=TradeStats)
async def get_trade_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Trade).where(Trade.user_id == current_user.id))
    trades = result.scalars().all()
    closed = [t for t in trades if t.exit_price is not None]
    wins = [t.p_l for t in closed if t.p_l > 0]
    losses = [t.p_l for t in closed if t.p_l < 0]
    rr = [r for r in (_planned_rr(t) for t in closed) if r is not None]
    gross_loss = abs(sum(losses))

    return {
        "total_trades": len(closed),
        "open_trades": len(trades) - len(closed),
        "wins": len(wins),
        "losses": len(losses),
        "win_rate": round(len(wins) / len(closed) * 100, 1) if closed else 0.0,
        "total_p_l": round(sum(t.p_l for t in closed), 2),
        "profit_factor": round(sum(wins) / gross_loss, 2) if gross_loss else None,
        "avg_rr": round(sum(rr) / len(rr), 2) if rr else None,
        "best_trade": max((t.p_l for t in closed), default=None),
        "worst_trade": min((t.p_l for t in closed), default=None),
    }


@router.get("/analytics")
async def get_trade_analytics(
    period: str = Query("3m", pattern="^(week|month|3m|year|all)$"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(Trade).where(
        and_(Trade.user_id == current_user.id, Trade.exit_price.isnot(None))
    ).order_by(Trade.date.asc(), Trade.id.asc())
    if period in PERIOD_DAYS:
        query = query.where(Trade.date >= datetime.utcnow() - timedelta(days=PERIOD_DAYS[period]))
    trades = (await db.execute(query)).scalars().all()

    cumulative, running = [], 0.0
    for t in trades:
        running += t.p_l
        cumulative.append({"date": t.date.strftime("%Y-%m-%d"), "value": round(running, 2)})

    def group(key) -> list[dict]:
        buckets: dict[str, dict] = {}
        for t in trades:
            name = key(t)
            b = buckets.setdefault(name, {"name": name, "p_l": 0.0, "trades": 0, "wins": 0})
            b["p_l"] += t.p_l
            b["trades"] += 1
            b["wins"] += t.p_l > 0
        rows = [
            {**b, "p_l": round(b["p_l"], 2), "win_rate": round(b["wins"] / b["trades"] * 100, 1)}
            for b in buckets.values()
        ]
        return sorted(rows, key=lambda r: r["p_l"], reverse=True)

    return {
        "period": period,
        "total_p_l": round(running, 2),
        "cumulative_p_l": cumulative,
        "by_session": group(lambda t: t.session or "Unknown"),
        "by_strategy": group(lambda t: t.strategy or "Untagged"),
        "by_pair": group(lambda t: t.pair),
    }


@router.get("/{id}", response_model=TradeSchema)
async def get_trade_detail(
    id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await _get_owned(db, id, current_user)


@router.put("/{id}", response_model=TradeSchema)
async def update_trade(
    id: int,
    trade_in: TradeUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    trade = await _get_owned(db, id, current_user)
    update_data = trade_in.model_dump(exclude_unset=True)
    explicit_pnl = update_data.pop("p_l", None)

    if update_data.get("date") is not None:
        update_data["date"] = to_naive(update_data["date"])
    if update_data.get("pair"):
        update_data["pair"] = normalize_pair(update_data["pair"]) or update_data["pair"].upper()
    for field in ("strategy", "notes"):
        if field in update_data:
            update_data[field] = (update_data[field] or "").strip() or None

    # Nullable fields may be cleared (e.g. exit_price=None re-opens a trade)
    nullable = {"exit_price", "stop_loss", "take_profit", "strategy", "notes"}
    for field, value in update_data.items():
        if value is not None or field in nullable:
            setattr(trade, field, value)

    price_changed = any(f in update_data for f in ("pair", "direction", "entry_price", "exit_price", "lot_size"))
    if explicit_pnl is not None or price_changed:
        trade.p_l = _resolve_pnl(trade, explicit_pnl)
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
    trade = await _get_owned(db, id, current_user)
    await db.delete(trade)
    return {"detail": "Trade deleted successfully"}
