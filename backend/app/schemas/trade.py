from typing import Literal, Optional
from datetime import datetime
from pydantic import BaseModel, Field

Direction = Literal["BUY", "SELL"]


class TradeBase(BaseModel):
    pair: str = Field(min_length=2, max_length=20)
    direction: Direction
    entry_price: float = Field(gt=0)
    exit_price: Optional[float] = Field(default=None, gt=0)
    lot_size: float = Field(gt=0)
    stop_loss: Optional[float] = Field(default=None, gt=0)
    take_profit: Optional[float] = Field(default=None, gt=0)
    session: str = Field(min_length=1, max_length=20)
    strategy: Optional[str] = Field(default=None, max_length=50)
    notes: Optional[str] = Field(default=None, max_length=2000)
    date: Optional[datetime] = None


class TradeCreate(TradeBase):
    # P&L in account currency (USD). When omitted on a closed trade it is
    # estimated from prices for instruments we know how to price.
    p_l: Optional[float] = None


class TradeUpdate(BaseModel):
    pair: Optional[str] = Field(default=None, min_length=2, max_length=20)
    direction: Optional[Direction] = None
    entry_price: Optional[float] = Field(default=None, gt=0)
    exit_price: Optional[float] = Field(default=None, gt=0)
    lot_size: Optional[float] = Field(default=None, gt=0)
    stop_loss: Optional[float] = Field(default=None, gt=0)
    take_profit: Optional[float] = Field(default=None, gt=0)
    session: Optional[str] = Field(default=None, min_length=1, max_length=20)
    strategy: Optional[str] = Field(default=None, max_length=50)
    notes: Optional[str] = Field(default=None, max_length=2000)
    p_l: Optional[float] = None
    date: Optional[datetime] = None


class Trade(TradeBase):
    id: int
    user_id: int
    p_l: float
    date: datetime

    class Config:
        from_attributes = True


class TradeStats(BaseModel):
    total_trades: int        # closed trades
    open_trades: int
    wins: int
    losses: int
    win_rate: float          # e.g. 65.4 for 65.4%
    total_p_l: float
    profit_factor: Optional[float]
    avg_rr: Optional[float]  # planned reward:risk from SL/TP
    best_trade: Optional[float]
    worst_trade: Optional[float]
