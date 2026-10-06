from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.base_class import Base

class Trade(Base):
    __tablename__ = "trades"

    id = Column(Integer, primary_key=True, index=True)
    pair = Column(String, nullable=False)           # e.g., "XAUUSD" or "EURUSD"
    direction = Column(String, nullable=False)      # "BUY" or "SELL"
    entry_price = Column(Float, nullable=False)
    exit_price = Column(Float, nullable=True)       # optional
    lot_size = Column(Float, nullable=False)
    stop_loss = Column(Float, nullable=True)
    take_profit = Column(Float, nullable=True)
    session = Column(String, nullable=False)        # "London", "New York", "Asian"
    strategy = Column(String, nullable=True)
    notes = Column(String, nullable=True)
    p_l = Column(Float, default=0.0, nullable=False) # profit/loss in account currency (USD)
    date = Column(DateTime, default=datetime.utcnow, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    user = relationship("User", backref="trades")
