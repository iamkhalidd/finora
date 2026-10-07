from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, UniqueConstraint
from app.db.base_class import Base


class InboundAddress(Base):
    """A user's private forwarding address: <token>@<INBOUND_EMAIL_DOMAIN>."""
    __tablename__ = "inbound_addresses"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    token = Column(String(32), unique=True, index=True, nullable=False)
    last_received_at = Column(DateTime, nullable=True)
    # Gmail sends a confirmation email to a new forwarding address; we surface it in the app
    confirmation_code = Column(String(32), nullable=True)
    confirmation_link = Column(String(500), nullable=True)
    confirmation_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class ImportedTransaction(Base):
    """A transaction read from a bank alert, waiting for the user to approve it."""
    __tablename__ = "imported_transactions"
    __table_args__ = (UniqueConstraint("user_id", "dedupe_key", name="uq_import_dedupe"),)

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    status = Column(String(16), nullable=False, default="pending")  # pending | unreadable | approved | dismissed
    source = Column(String(16), nullable=False, default="email")    # email | paste
    amount = Column(Float, nullable=True)
    type = Column(String(16), nullable=True)                        # income | expense
    description = Column(String(300), nullable=True)
    bank = Column(String(50), nullable=True)
    reference = Column(String(100), nullable=True)
    occurred_at = Column(DateTime, nullable=True)
    merchant_key = Column(String(100), nullable=True, index=True)
    suggested_category = Column(String(50), nullable=True)
    subject = Column(String(300), nullable=True)
    # Kept only for alerts we couldn't read, so the user can see what arrived
    raw_excerpt = Column(String(2000), nullable=True)
    dedupe_key = Column(String(64), nullable=False)
    transaction_id = Column(Integer, ForeignKey("transactions.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
