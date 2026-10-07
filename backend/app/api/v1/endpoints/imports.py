import hashlib
import hmac
import secrets
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, Header, HTTPException, Query, Request, status
from sqlalchemy import select, and_, desc
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.v1.deps import get_current_user
from app.core import alerts
from app.core.config import settings
from app.core.dates import to_naive
from app.db.session import get_db
from app.models.email_import import ImportedTransaction, InboundAddress
from app.models.transaction import Transaction
from app.models.user import User
from app.schemas.email_import import (
    ApproveRequest, ImportedTransaction as ImportedSchema, InboundAddressOut, PasteRequest, PasteResult,
)

router = APIRouter()          # /imports, for the signed-in user
inbound_router = APIRouter()  # /inbound, called by the email worker

MAX_EMAIL_BYTES = 2 * 1024 * 1024
OPEN = ("pending", "unreadable")


def _new_token() -> str:
    # Lowercase letters/digits only: email local parts are case-insensitive in practice
    alphabet = "abcdefghjkmnpqrstuvwxyz23456789"
    return "".join(secrets.choice(alphabet) for _ in range(12))


async def _get_address(db: AsyncSession, user: User, create: bool = True) -> Optional[InboundAddress]:
    res = await db.execute(select(InboundAddress).where(InboundAddress.user_id == user.id))
    addr = res.scalar_one_or_none()
    if addr is None and create:
        addr = InboundAddress(user_id=user.id, token=_new_token())
        db.add(addr)
        await db.flush()
    return addr


def _address_out(addr: Optional[InboundAddress]) -> InboundAddressOut:
    enabled = bool(settings.INBOUND_EMAIL_DOMAIN and settings.INBOUND_EMAIL_SECRET)
    confirmation = None
    if addr and addr.confirmation_at:
        confirmation = {"code": addr.confirmation_code, "link": addr.confirmation_link, "received_at": addr.confirmation_at}
    return InboundAddressOut(
        enabled=enabled,
        address=f"{addr.token}@{settings.INBOUND_EMAIL_DOMAIN}" if enabled and addr else None,
        last_received_at=addr.last_received_at if addr else None,
        confirmation=confirmation,
    )


async def _suggest(db: AsyncSession, user_id: int, tx_type: str, key: Optional[str], description: Optional[str]) -> Optional[str]:
    # What did the user pick last time for this merchant? Fall back to keywords.
    if key:
        res = await db.execute(
            select(Transaction.category)
            .join(ImportedTransaction, ImportedTransaction.transaction_id == Transaction.id)
            .where(and_(
                ImportedTransaction.user_id == user_id,
                ImportedTransaction.merchant_key == key,
                ImportedTransaction.type == tx_type,
            ))
            .order_by(desc(ImportedTransaction.id))
            .limit(1)
        )
        previous = res.scalar_one_or_none()
        if previous:
            return previous
    return alerts.keyword_category(tx_type, description)


async def _store(db: AsyncSession, user_id: int, email: alerts.EmailMessage, source: str) -> tuple[Optional[ImportedTransaction], bool]:
    """Returns (item, duplicate). item is None when the email isn't an alert at all."""
    parsed = alerts.parse_alert(email.subject, email.text, email.sender, email.date)
    if parsed is None:
        if not alerts.looks_like_alert(email.subject, email.text):
            return None, False
        key = hashlib.sha256(f"raw|{email.subject}|{email.text[:2000]}".encode()).hexdigest()
        item = ImportedTransaction(
            user_id=user_id, status="unreadable", source=source, subject=email.subject[:300],
            raw_excerpt=email.text[:2000], dedupe_key=key, bank=alerts.detect_bank(email.sender, email.text),
            occurred_at=email.date,
        )
    else:
        key = alerts.dedupe_key(parsed)
        mkey = alerts.merchant_key(parsed.description)
        item = ImportedTransaction(
            user_id=user_id, status="pending", source=source, amount=parsed.amount, type=parsed.type,
            description=parsed.description, bank=parsed.bank, reference=parsed.reference,
            occurred_at=parsed.occurred_at or alerts.wat_now(), merchant_key=mkey,
            suggested_category=await _suggest(db, user_id, parsed.type, mkey, parsed.description),
            subject=email.subject[:300], dedupe_key=key,
        )

    existing = await db.execute(
        select(ImportedTransaction).where(and_(ImportedTransaction.user_id == user_id, ImportedTransaction.dedupe_key == key))
    )
    if (found := existing.scalar_one_or_none()) is not None:
        return found, True
    db.add(item)
    await db.flush()
    await db.refresh(item)
    return item, False


async def _get_owned(db: AsyncSession, id: int, user: User) -> ImportedTransaction:
    res = await db.execute(select(ImportedTransaction).where(and_(ImportedTransaction.id == id, ImportedTransaction.user_id == user.id)))
    item = res.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Imported transaction not found")
    return item


# ── User endpoints ───────────────────────────────────────────────

@router.get("/address", response_model=InboundAddressOut)
async def get_address(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return _address_out(await _get_address(db, current_user))


@router.post("/address/rotate", response_model=InboundAddressOut)
async def rotate_address(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    addr = await _get_address(db, current_user)
    addr.token = _new_token()
    addr.confirmation_code = addr.confirmation_link = addr.confirmation_at = None
    await db.flush()
    return _address_out(addr)


@router.get("/", response_model=List[ImportedSchema])
async def list_imports(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    res = await db.execute(
        select(ImportedTransaction)
        .where(and_(ImportedTransaction.user_id == current_user.id, ImportedTransaction.status.in_(OPEN)))
        .order_by(desc(ImportedTransaction.occurred_at), desc(ImportedTransaction.id))
    )
    return res.scalars().all()


@router.post("/paste", response_model=PasteResult)
async def paste_alert(payload: PasteRequest, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    text = payload.text.strip()
    if "<" in text and ">" in text and "</" in text:
        text = alerts.html_to_text(text)
    lines = text.splitlines()
    email = alerts.EmailMessage(sender="", subject=lines[0][:300] if lines else "", text=text, date=None)
    parsed = alerts.parse_alert(email.subject, email.text)
    if parsed is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Couldn't find an amount and whether it's a debit or credit in that text.",
        )
    item, duplicate = await _store(db, current_user.id, email, source="paste")
    return {"duplicate": duplicate, "item": item}


@router.post("/{id}/approve", response_model=ImportedSchema)
async def approve(id: int, payload: ApproveRequest, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    item = await _get_owned(db, id, current_user)
    if item.status not in OPEN:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This item was already handled")
    tx_type = payload.type or item.type
    amount = payload.amount or item.amount
    if tx_type is None or amount is None:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Enter the amount and type for this alert")

    notes = payload.notes if payload.notes is not None else (item.description or "")[:200]
    tx = Transaction(
        user_id=current_user.id, amount=amount, type=tx_type, category=payload.category.strip(),
        notes=notes.strip() or None, date=to_naive(payload.date or item.occurred_at),
    )
    db.add(tx)
    await db.flush()
    item.status, item.transaction_id, item.type, item.amount = "approved", tx.id, tx_type, amount

    # Teach other waiting items from the same merchant
    if item.merchant_key:
        others = await db.execute(select(ImportedTransaction).where(and_(
            ImportedTransaction.user_id == current_user.id, ImportedTransaction.status == "pending",
            ImportedTransaction.merchant_key == item.merchant_key, ImportedTransaction.type == tx_type,
        )))
        for other in others.scalars():
            other.suggested_category = tx.category
    await db.flush()
    await db.refresh(item)
    return item


@router.post("/approve-suggested")
async def approve_suggested(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(ImportedTransaction).where(and_(
        ImportedTransaction.user_id == current_user.id, ImportedTransaction.status == "pending",
        ImportedTransaction.suggested_category.isnot(None),
    )))
    count = 0
    for item in res.scalars().all():
        tx = Transaction(
            user_id=current_user.id, amount=item.amount, type=item.type, category=item.suggested_category,
            notes=(item.description or "")[:200] or None, date=item.occurred_at or alerts.wat_now(),
        )
        db.add(tx)
        await db.flush()
        item.status, item.transaction_id = "approved", tx.id
        count += 1
    return {"approved": count}


@router.post("/{id}/dismiss", response_model=ImportedSchema)
async def dismiss(id: int, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    item = await _get_owned(db, id, current_user)
    item.status = "dismissed"
    item.raw_excerpt = None  # don't keep alert text we no longer need
    await db.flush()
    await db.refresh(item)
    return item


# ── Inbound email (email worker → API) ───────────────────────────

def _token_from(recipient: str) -> Optional[str]:
    local, _, domain = recipient.strip().lower().partition("@")
    if not local or domain != settings.INBOUND_EMAIL_DOMAIN.lower():
        return None
    return local.split("+")[0]


@inbound_router.post("/email", status_code=status.HTTP_202_ACCEPTED)
async def inbound_email(
    request: Request,
    to: str = Query(..., description="Envelope recipient"),
    x_inbound_secret: str = Header(default=""),
    db: AsyncSession = Depends(get_db),
):
    if not (settings.INBOUND_EMAIL_SECRET and settings.INBOUND_EMAIL_DOMAIN):
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Email import is not configured")
    if not hmac.compare_digest(x_inbound_secret.encode(), settings.INBOUND_EMAIL_SECRET.encode()):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Bad secret")

    raw = await request.body()
    if len(raw) > MAX_EMAIL_BYTES:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="Email too large")

    token = _token_from(to)
    res = await db.execute(select(InboundAddress).where(InboundAddress.token == token)) if token else None
    addr = res.scalar_one_or_none() if res is not None else None
    if addr is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Unknown recipient")

    email = alerts.read_email(raw)
    addr.last_received_at = alerts.wat_now()

    confirmation = alerts.gmail_confirmation(email)
    if confirmation is not None:
        addr.confirmation_code, addr.confirmation_link = confirmation
        addr.confirmation_at = alerts.wat_now()
        return {"status": "gmail_confirmation"}

    item, duplicate = await _store(db, addr.user_id, email, source="email")
    if item is None:
        return {"status": "ignored"}
    return {"status": "duplicate" if duplicate else item.status, "id": item.id}
