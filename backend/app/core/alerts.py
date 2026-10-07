"""Read Nigerian bank alert emails into transactions.

Banks word their alerts differently, so this uses labelled fields first
("Amount:", "Narration:", "Transaction Type:") and falls back to the subject
line and common phrases ("has been debited", "Credit Alert"). Anything that
looks like an alert but can't be read is kept as "unreadable" for the user.
"""
import hashlib
import re
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from email import message_from_bytes, policy
from email.utils import parseaddr, parsedate_to_datetime
from html.parser import HTMLParser
from typing import Optional

WAT = timezone(timedelta(hours=1))  # Nigeria has no daylight saving


def wat_now() -> datetime:
    return datetime.now(WAT).replace(tzinfo=None)

BANK_DOMAINS = {
    "gtbank.com": "GTBank", "gtco.com": "GTBank", "accessbankplc.com": "Access Bank",
    "zenithbank.com": "Zenith Bank", "firstbanknigeria.com": "First Bank", "ubagroup.com": "UBA",
    "fcmb.com": "FCMB", "fidelitybank.ng": "Fidelity Bank", "sterling.ng": "Sterling Bank",
    "wemabank.com": "Wema Bank", "alat.ng": "Wema Bank", "stanbicibtc.com": "Stanbic IBTC",
    "unionbankng.com": "Union Bank", "ecobank.com": "Ecobank", "polarisbanklimited.com": "Polaris Bank",
    "providusbank.com": "Providus Bank", "keystonebankng.com": "Keystone Bank", "kudabank.com": "Kuda",
    "kuda.com": "Kuda", "opayweb.com": "OPay", "opay-inc.com": "OPay", "moniepoint.com": "Moniepoint",
    "palmpay.com": "PalmPay", "carbon.ng": "Carbon", "fairmoney.ng": "FairMoney", "vfdtech.ng": "VFD",
}
BANK_NAMES = sorted(set(BANK_DOMAINS.values()) | {"GTCO", "Access", "Zenith", "UBA"}, key=len, reverse=True)

ALERT_HINT = re.compile(r"\b(alert|debit(ed)?|credit(ed)?|transaction|transfer|dr|cr)\b", re.I)
LABELS = {
    "amount": r"(?:transaction\s+)?amount|amt",
    "type": r"(?:transaction|txn)\s+type|type|dr\s*/\s*cr|debit\s*/\s*credit",
    "description": r"description|narration|narrative|remarks?|(?:transaction\s+)?details|memo|purpose",
    "date": r"(?:transaction\s+|value\s+)?date(?:\s*(?:/|&|and)\s*time)?|time",
    "reference": r"(?:transaction\s+)?ref(?:erence)?(?:\s+(?:no|number|id))?\.?|session\s+id|transaction\s+id",
}
LABEL_RE = {k: re.compile(rf"^\s*(?:{v})\s*[:\-|\t]+\s*(.+?)\s*$", re.I) for k, v in LABELS.items()}
MONEY = r"(\d{1,3}(?:,\d{3})+(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)"
CURRENCY_AMOUNT = re.compile(rf"(?:NGN|₦|\bN)\s?{MONEY}", re.I)
BARE_AMOUNT = re.compile(rf"{MONEY}")
BALANCE_LINE = re.compile(r"\b(bal(ance)?|available|ledger|book\s+bal)\b", re.I)
DEBIT_WORDS = re.compile(r"\b(debit|debited|dr|withdrawal|you\s+sent|sent\s+to|transfer\s+to|purchase|payment\s+to|pos)\b", re.I)
CREDIT_WORDS = re.compile(r"\b(credit|credited|cr|deposit|you\s+received|received\s+from|transfer\s+from|inflow)\b", re.I)

DATE_FORMATS = [
    "%d-%b-%Y %H:%M:%S", "%d-%b-%Y %H:%M", "%d-%b-%Y %I:%M %p", "%d-%b-%Y", "%d-%b-%y %H:%M", "%d-%b-%y",
    "%d/%m/%Y %H:%M:%S", "%d/%m/%Y %H:%M", "%d/%m/%Y %I:%M:%S %p", "%d/%m/%Y %I:%M %p", "%d/%m/%Y",
    "%d-%m-%Y %H:%M:%S", "%d-%m-%Y %H:%M", "%d-%m-%Y",
    "%Y-%m-%d %H:%M:%S", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%d %H:%M", "%Y-%m-%d",
    "%d %b %Y %H:%M:%S", "%d %b %Y %H:%M", "%d %b %Y %I:%M %p", "%d %b %Y", "%d %B %Y %H:%M", "%d %B %Y",
    "%b %d, %Y %I:%M %p", "%b %d, %Y %H:%M", "%b %d, %Y", "%B %d, %Y %I:%M %p", "%B %d, %Y",
    "%a, %d %b %Y %H:%M:%S", "%A, %d %B %Y %H:%M",
]

NOISE = {"trf", "transfer", "to", "from", "frm", "nip", "pos", "web", "purchase", "via", "ref", "for",
         "the", "of", "mob", "mobile", "app", "fip", "nibss", "ussd", "txn", "payment", "debit", "credit", "ng", "lagos"}

KEYWORD_CATEGORIES = [
    (r"stamp\s*duty|sms\s*(alert|charge|fee)|vat\b|maintenance\s*fee|transfer\s*fee|commission|charges?\b|card\s*fee", "Bank Charges"),
    (r"\b(bolt|uber|indrive|rida|lagride|taxify|gokada|brt|cowry\s*card)\b", "Transport"),
    (r"\b(mtn|airtel|glo|9mobile|etisalat|airtime|data\s*(bundle|plan|sub)|recharge|vtu)\b", "Airtime & Data"),
    (r"\b(dstv|gotv|multichoice|startimes|netflix|showmax|spotify|apple\.com|youtube|prime\s*video)\b", "Subscriptions"),
    (r"\b(ikeja\s*electric|ekedc|eko\s*electric|aedc|ibedc|phed|kedco|eedc|jed|bedc|prepaid|electricity|nepa|disco)\b", "Electricity"),
    (r"\b(total(energies)?|mobil|conoil|oando|ardova|mrs|nnpc|filling\s*station|fuel|petrol|diesel)\b", "Fuel & Generator"),
    (r"\b(shoprite|spar|justrite|market\s*square|chicken\s*republic|kfc|domino|dominos|chowdeck|glovo|jumia\s*food|foodco|mr\s*biggs|kilimanjaro|restaurant|eatery|supermarket)\b", "Food & Groceries"),
    (r"\b(piggyvest|piggybank|cowrywise|risevest|bamboo|trove|ajo|esusu|savings)\b", "Savings & Ajo"),
    (r"\b(hospital|clinic|pharmacy|pharm|medplus|hmo|lab(oratory)?)\b", "Health"),
    (r"\b(school|tuition|fees?\s*payment|university|college|waec|jamb)\b", "School Fees"),
    (r"\b(tithe|offering|church|mosque|zakat|donation)\b", "Tithe & Giving"),
    (r"\b(jumia|konga|temu|aliexpress|amazon|slot|pointek)\b", "Shopping"),
    (r"\b(rent|landlord|service\s*charge|estate\s*dues)\b", "Rent & Housing"),
]
INCOME_KEYWORDS = [(r"\b(salary|payroll|wages)\b", "Salary"), (r"\b(refund|reversal|reversed)\b", "Refund")]


@dataclass
class EmailMessage:
    sender: str
    subject: str
    text: str
    date: Optional[datetime]  # local (WAT) naive


@dataclass
class ParsedAlert:
    amount: float
    type: str
    description: Optional[str]
    bank: Optional[str]
    reference: Optional[str]
    occurred_at: Optional[datetime]


class _TextExtractor(HTMLParser):
    BLOCK = {"p", "div", "br", "tr", "li", "h1", "h2", "h3", "h4", "table", "section"}

    def __init__(self):
        super().__init__()
        self.parts: list[str] = []
        self._skip = 0

    def handle_starttag(self, tag, attrs):
        if tag in ("style", "script", "head"):
            self._skip += 1
        elif tag in self.BLOCK:
            self.parts.append("\n")
        elif tag in ("td", "th"):
            self.parts.append("\t")

    def handle_endtag(self, tag):
        if tag in ("style", "script", "head"):
            self._skip = max(0, self._skip - 1)
        elif tag in self.BLOCK:
            self.parts.append("\n")

    def handle_data(self, data):
        if not self._skip:
            self.parts.append(data)


def html_to_text(html: str) -> str:
    parser = _TextExtractor()
    parser.feed(html)
    text = "".join(parser.parts).replace("\xa0", " ")
    lines = [re.sub(r"[ \t]*\t[ \t]*", "\t", ln).strip(" \t") for ln in text.splitlines()]
    return "\n".join(ln for ln in lines if ln)


def _to_wat_naive(dt: datetime) -> datetime:
    return dt.astimezone(WAT).replace(tzinfo=None) if dt.tzinfo else dt


def read_email(raw: bytes) -> EmailMessage:
    msg = message_from_bytes(raw, policy=policy.default)
    plain = msg.get_body(preferencelist=("plain",))
    html = msg.get_body(preferencelist=("html",))
    text = ""
    if html is not None:
        text = html_to_text(html.get_content())  # HTML keeps table cells apart better
    if not text.strip() and plain is not None:
        text = plain.get_content()
    date = None
    if msg["Date"]:
        try:
            date = _to_wat_naive(parsedate_to_datetime(str(msg["Date"])))
        except (TypeError, ValueError):
            pass
    return EmailMessage(
        sender=parseaddr(str(msg.get("From", "")))[1].lower(),
        subject=str(msg.get("Subject", "")).strip(),
        text=text,
        date=date,
    )


def gmail_confirmation(email: EmailMessage) -> Optional[tuple[Optional[str], Optional[str]]]:
    """Gmail emails a new forwarding address to confirm it. Returns (code, link)."""
    if email.sender != "forwarding-noreply@google.com":
        return None
    code = re.search(r"\(#(\d+)\)", email.subject) or re.search(r"[Cc]onfirmation code:\s*(\d+)", email.text)
    link = re.search(r"https://mail(?:-settings)?\.google\.com/\S+", email.text)
    return (code.group(1) if code else None, link.group(0).rstrip(").,") if link else None)


def _money(s: str) -> Optional[float]:
    try:
        value = float(s.replace(",", ""))
    except ValueError:
        return None
    return value if value > 0 else None


def parse_date(value: str) -> Optional[datetime]:
    value = re.sub(r"(\d)(st|nd|rd|th)\b", r"\1", value)
    value = re.sub(r"\s+at\s+|\s*\|\s*|,\s*(?=\d{1,2}:)", " ", value, flags=re.I).strip()
    words = value.split()
    for n in range(min(len(words), 6), 0, -1):
        candidate = " ".join(words[:n]).rstrip(",")
        for fmt in DATE_FORMATS:
            try:
                return datetime.strptime(candidate, fmt)
            except ValueError:
                continue
    return None


def detect_bank(sender: str, text: str) -> Optional[str]:
    domain = sender.rsplit("@", 1)[-1]
    for d, name in BANK_DOMAINS.items():
        if domain == d or domain.endswith("." + d):
            return name
    # Manually forwarded mail: look for the original sender
    for addr in re.findall(r"[\w.+-]+@([\w-]+(?:\.[\w-]+)+)", text[:3000]):
        for d, name in BANK_DOMAINS.items():
            if addr.lower() == d or addr.lower().endswith("." + d):
                return name
    for name in BANK_NAMES:
        if re.search(rf"\b{re.escape(name)}\b", text[:3000], re.I):
            return {"GTCO": "GTBank", "Access": "Access Bank", "Zenith": "Zenith Bank"}.get(name, name)
    return None


def _type_from(text: str) -> Optional[str]:
    debit, credit = DEBIT_WORDS.search(text), CREDIT_WORDS.search(text)
    if debit and not credit:
        return "expense"
    if credit and not debit:
        return "income"
    if debit and credit:  # whichever is mentioned first, e.g. "Debit alert ... credited to John"
        return "expense" if debit.start() < credit.start() else "income"
    return None


COUNTERPARTY = re.compile(
    r"(?:NGN|₦)\s?[\d,.]+\s+(?:to|from)\s+([A-Za-z0-9&.'\- ]{3,60}?)\s*(?:\(|\bfrom\b|\bon\b|\bvia\b|\binto\b|[.,]|$)",
    re.I,
)


def _counterparty(lines: list[str]) -> Optional[str]:
    """Sentence-style alerts: "You sent ₦8,000.00 to MTN NIGERIA (Airtime) from your account"."""
    for ln in lines:
        m = COUNTERPARTY.search(ln)
        if m and not BALANCE_LINE.search(ln):
            return m.group(1).strip()
    return None


def parse_alert(subject: str, text: str, sender: str = "", fallback_date: Optional[datetime] = None) -> Optional[ParsedAlert]:
    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    fields: dict[str, str] = {}
    for ln in lines:
        for key, rx in LABEL_RE.items():
            if key in fields:
                continue
            m = rx.match(ln)
            if m and not (key == "amount" and BALANCE_LINE.search(ln)):
                fields[key] = m.group(1)
                break

    amount = None
    if "amount" in fields:
        m = CURRENCY_AMOUNT.search(fields["amount"]) or BARE_AMOUNT.search(fields["amount"])
        amount = _money(m.group(1)) if m else None
    if amount is None:
        for source in [subject, *lines]:
            if BALANCE_LINE.search(source):
                continue
            m = CURRENCY_AMOUNT.search(source)
            if m and (amount := _money(m.group(1))):
                break

    tx_type = _type_from(fields["type"]) if "type" in fields else None
    tx_type = tx_type or _type_from(subject)
    if tx_type is None:
        body = "\n".join(ln for ln in lines if not BALANCE_LINE.search(ln))
        tx_type = _type_from(body)

    if amount is None or tx_type is None:
        return None

    description = fields.get("description") or _counterparty(lines)
    if description:
        description = re.sub(r"\s+", " ", description)[:300]

    occurred = parse_date(fields["date"]) if "date" in fields else None
    reference = fields.get("reference")
    if reference:
        reference = re.split(r"\s{2,}|\t", reference)[0][:100]

    return ParsedAlert(
        amount=amount,
        type=tx_type,
        description=description,
        bank=detect_bank(sender, f"{subject}\n{text}"),
        reference=reference,
        occurred_at=occurred or fallback_date,
    )


def looks_like_alert(subject: str, text: str) -> bool:
    return bool(ALERT_HINT.search(subject)) or len(ALERT_HINT.findall(text[:2000])) >= 2


def merchant_key(description: Optional[str]) -> Optional[str]:
    if not description:
        return None
    words = [w for w in re.sub(r"[^a-z ]", " ", description.lower()).split() if w not in NOISE and len(w) > 1]
    return " ".join(words[:4]) or None


def keyword_category(tx_type: str, description: Optional[str]) -> Optional[str]:
    text = description or ""
    rules = INCOME_KEYWORDS if tx_type == "income" else KEYWORD_CATEGORIES
    for pattern, category in rules:
        if re.search(pattern, text, re.I):
            return category
    return None


def dedupe_key(alert: ParsedAlert) -> str:
    if alert.reference and len(alert.reference) >= 6:
        basis = f"ref|{alert.bank}|{alert.reference}"
    else:
        when = alert.occurred_at.strftime("%Y%m%d%H%M") if alert.occurred_at else ""
        basis = f"{alert.amount:.2f}|{alert.type}|{when}|{alert.description or ''}"
    return hashlib.sha256(basis.encode()).hexdigest()[:64]
