from typing import Optional
from datetime import datetime
from pydantic import BaseModel

class TradeBase(BaseModel):
    pair: str
    direction: str  # "BUY" or "SELL"
    entry_price: float
    exit_price: Optional[float] = None
    lot_size: float
    stop_loss: Optional[float] = None
    take_profit: Optional[float] = None
    session: str  # "London", "New York", "Asian"
    strategy: Optional[str] = None
    notes: Optional[str] = None
    p_l: Optional[float] = 0.0
    date: Optional[datetime] = None

class TradeCreate(TradeBase):
    pass

class TradeUpdate(BaseModel):
    pair: Optional[str] = None
    direction: Optional[str] = None
    entry_price: Optional[float] = None
    exit_price: Optional[float] = None
    lot_size: Optional[float] = None
    stop_loss: Optional[float] = None
    take_profit: Optional[float] = None
    session: Optional[str] = None
    strategy: Optional[str] = None
    notes: Optional[str] = None
    p_l: Optional[float] = None
    date: Optional[datetime] = None

class TradeInDBBase(TradeBase):
    id: int
    user_id: int
    p_l: float
    date: datetime

    class Config:
        from_attributes = True

class Trade(TradeInDBBase):
    pass

class TradeStats(BaseModel):
    win_rate: float        # e.g., 65.4 for 65.4%
    total_p_l: float
    avg_rr: float
    total_trades: int

class TradeAnalyticsPoint(BaseModel):
    date: str
    value: float
