from typing import Literal, Optional
from datetime import datetime
from pydantic import BaseModel, Field


class ImportedTransaction(BaseModel):
    id: int
    status: str
    source: str
    amount: Optional[float]
    type: Optional[str]
    description: Optional[str]
    bank: Optional[str]
    reference: Optional[str]
    occurred_at: Optional[datetime]
    suggested_category: Optional[str]
    subject: Optional[str]
    raw_excerpt: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class GmailConfirmation(BaseModel):
    code: Optional[str]
    link: Optional[str]
    received_at: datetime


class InboundAddressOut(BaseModel):
    enabled: bool
    address: Optional[str]
    last_received_at: Optional[datetime]
    confirmation: Optional[GmailConfirmation]


class PasteRequest(BaseModel):
    text: str = Field(min_length=10, max_length=20000)


class PasteResult(BaseModel):
    duplicate: bool
    item: ImportedTransaction


class ApproveRequest(BaseModel):
    category: str = Field(min_length=1, max_length=50)
    type: Optional[Literal["income", "expense"]] = None
    amount: Optional[float] = Field(default=None, gt=0)
    notes: Optional[str] = Field(default=None, max_length=200)
    date: Optional[datetime] = None
