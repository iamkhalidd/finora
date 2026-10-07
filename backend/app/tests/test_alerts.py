"""Alert samples below are synthetic, modelled on common Nigerian bank layouts.
Replace/extend with real (redacted) alerts as they come in."""
from datetime import datetime
from email.message import EmailMessage as MimeMessage
import pytest
from app.core import alerts
from app.core.config import settings

API = "/api/v1"


def mime(sender, subject, html=None, text=None, date="Tue, 06 Oct 2026 13:32:10 +0000"):
    m = MimeMessage()
    m["From"], m["To"], m["Subject"], m["Date"] = sender, "x@in.test", subject, date
    if text:
        m.set_content(text)
    if html:
        if text:
            m.add_alternative(html, subtype="html")
        else:
            m.set_content(html, subtype="html")
    return m.as_bytes()


GTBANK_HTML = """<html><head><style>td{color:red}</style></head><body>
<p>Dear Customer,</p><p>Guaranty Trust Bank electronic notification service (GeNS).</p>
<table>
<tr><td>Account Number</td><td>:</td><td>01******89</td></tr>
<tr><td>Transaction Location</td><td>:</td><td>205</td></tr>
<tr><td>Description</td><td>:</td><td>TRF/BOLT TECHNOLOGY/LAGOS</td></tr>
<tr><td>Amount</td><td>:</td><td>NGN 4,500.00</td></tr>
<tr><td>Value Date</td><td>:</td><td>06-Oct-2026</td></tr>
<tr><td>Remarks</td><td>:</td><td>Ride to Lekki</td></tr>
<tr><td>Time of Transaction</td><td>:</td><td>2:31:45 PM</td></tr>
<tr><td>Available Balance</td><td>:</td><td>NGN 120,450.25</td></tr>
</table></body></html>"""

ACCESS_TEXT = """Access Bank Transaction Alert
Transaction Type: Credit
Amount: NGN350,000.00
Account: 069****123
Narration: OCT SALARY - ACME LTD
Date: 01/10/2026 09:15
Reference: 000013261001091500123456789
Available Balance: NGN470,450.25
"""

KUDA_TEXT = """Hi Ada,
You just sent ₦8,000.00 to MTN NIGERIA (Airtime) from your Kuda account.
Date & Time: 05 Oct 2026 07:45
Transaction ID: KUDA-8f2a91c3
Your new balance is ₦112,450.25.
"""

OPAY_HTML = """<div>Transaction Successful</div><div>Your account has been debited</div>
<table><tr><td>Amount</td><td>₦12,000.00</td></tr>
<tr><td>Transaction Type</td><td>Transfer</td></tr>
<tr><td>Recipient</td><td>CHOWDECK TECHNOLOGIES</td></tr>
<tr><td>Narration</td><td>Chowdeck order 1182</td></tr>
<tr><td>Transaction Date</td><td>Oct 4, 2026 08:10 PM</td></tr>
<tr><td>Session ID</td><td>100004261004201023456789012</td></tr></table>"""


def parse(raw):
    e = alerts.read_email(raw)
    return alerts.parse_alert(e.subject, e.text, e.sender, e.date)


def test_gtbank_html_table_with_balance_ignored():
    a = parse(mime("GeNS@gtbank.com", "GeNS Transaction Alert [Debit: NGN4,500.00]", html=GTBANK_HTML))
    assert (a.amount, a.type, a.bank) == (4500.0, "expense", "GTBank")
    assert a.description == "TRF/BOLT TECHNOLOGY/LAGOS"
    assert a.occurred_at == datetime(2026, 10, 6)
    assert alerts.keyword_category(a.type, a.description) == "Transport"


def test_access_plain_text_credit():
    a = parse(mime("alerts@accessbankplc.com", "Credit Alert", text=ACCESS_TEXT))
    assert (a.amount, a.type, a.bank) == (350000.0, "income", "Access Bank")
    assert a.occurred_at == datetime(2026, 10, 1, 9, 15)
    assert a.reference.startswith("0000132610")
    assert alerts.keyword_category(a.type, a.description) == "Salary"


def test_kuda_sentence_style_without_labels_for_amount():
    a = parse(mime("help@kudabank.com", "You sent money", text=KUDA_TEXT))
    assert (a.amount, a.type, a.bank) == (8000.0, "expense", "Kuda")
    assert a.description == "MTN NIGERIA"
    assert alerts.keyword_category(a.type, a.description) == "Airtime & Data"
    assert a.occurred_at == datetime(2026, 10, 5, 7, 45)


def test_sentence_credit_counterparty():
    a = alerts.parse_alert("You received money", "You received ₦85,000.00 from ADEBAYO FREELANCE CLIENT.")
    assert (a.amount, a.type, a.description) == (85000.0, "income", "ADEBAYO FREELANCE CLIENT")


def test_opay_debit_from_body_and_ampm_date():
    a = parse(mime("no-reply@opay-inc.com", "Transaction notification", html=OPAY_HTML))
    assert (a.amount, a.type, a.bank) == (12000.0, "expense", "OPay")
    assert a.occurred_at == datetime(2026, 10, 4, 20, 10)
    assert alerts.keyword_category(a.type, a.description) == "Food & Groceries"


def test_falls_back_to_email_date_in_lagos_time():
    a = parse(mime("alerts@zenithbank.com", "Debit Alert: NGN50.00", text="Stamp duty charge NGN50.00 debited."))
    assert a.amount == 50 and a.type == "expense"
    assert a.occurred_at == datetime(2026, 10, 6, 14, 32, 10)  # 13:32 UTC -> 14:32 WAT
    assert alerts.keyword_category("expense", "Stamp duty charge") == "Bank Charges"


def test_marketing_email_is_not_an_alert():
    e = alerts.read_email(mime("news@gtbank.com", "Win big this Detty December!", text="Shop and win prizes. Terms apply."))
    assert alerts.parse_alert(e.subject, e.text, e.sender) is None
    assert not alerts.looks_like_alert(e.subject, e.text)


def test_gmail_forwarding_confirmation():
    raw = mime("Gmail Team <forwarding-noreply@google.com>", "(#123456789) Gmail Forwarding Confirmation - Receive Mail from ada@gmail.com",
               text="ada@gmail.com has requested to automatically forward mail...\nConfirmation code: 123456789\nhttps://mail-settings.google.com/mail/vf-%5BABC%5D-xyz\n")
    assert alerts.gmail_confirmation(alerts.read_email(raw)) == ("123456789", "https://mail-settings.google.com/mail/vf-%5BABC%5D-xyz")


def test_merchant_key_ignores_noise():
    assert alerts.merchant_key("TRF/BOLT TECHNOLOGY/LAGOS") == "bolt technology"
    assert alerts.merchant_key("NIP TRF TO BOLT TECHNOLOGY OU REF 1234") == "bolt technology ou"


# ── API flow ─────────────────────────────────────────────────────

@pytest.fixture
def inbound(monkeypatch):
    monkeypatch.setattr(settings, "INBOUND_EMAIL_DOMAIN", "in.test")
    monkeypatch.setattr(settings, "INBOUND_EMAIL_SECRET", "s3cret")


async def test_inbound_email_flow(auth_client, client, inbound):
    addr = (await auth_client.get(f"{API}/imports/address")).json()
    assert addr["enabled"] and addr["address"].endswith("@in.test")
    to = addr["address"]
    send = lambda raw, secret="s3cret", rcpt=to: client.post(
        f"{API}/inbound/email", params={"to": rcpt}, content=raw, headers={"X-Inbound-Secret": secret, "Content-Type": "message/rfc822"})

    gt = mime("GeNS@gtbank.com", "GeNS Transaction Alert [Debit: NGN4,500.00]", html=GTBANK_HTML)
    assert (await send(gt, secret="wrong")).status_code == 401
    assert (await send(gt, rcpt="nobody@in.test")).status_code == 404
    r = await send(gt)
    assert r.status_code == 202 and r.json()["status"] == "pending"
    assert (await send(gt)).json()["status"] == "duplicate"  # same alert forwarded twice
    assert (await send(mime("news@gtbank.com", "Promo", text="Nothing to see"))).json()["status"] == "ignored"
    assert (await send(mime("alerts@zenithbank.com", "Transaction Alert", text="A transaction occurred on your account. Debit alert."))).json()["status"] == "unreadable"

    confirm = mime("forwarding-noreply@google.com", "(#555) Gmail Forwarding Confirmation", text="code https://mail-settings.google.com/mail/vf-abc")
    assert (await send(confirm)).json()["status"] == "gmail_confirmation"
    addr = (await auth_client.get(f"{API}/imports/address")).json()
    assert addr["confirmation"]["code"] == "555"

    items = (await auth_client.get(f"{API}/imports/")).json()
    assert [i["status"] for i in items].count("pending") == 1
    pending = next(i for i in items if i["status"] == "pending")
    assert pending["suggested_category"] == "Transport"
    unreadable = next(i for i in items if i["status"] == "unreadable")
    assert "Debit alert" in unreadable["raw_excerpt"]

    # Approve -> becomes a real transaction in the month summary
    r = await auth_client.post(f"{API}/imports/{pending['id']}/approve", json={"category": "Transport"})
    assert r.json()["status"] == "approved"
    summary = (await auth_client.get(f"{API}/transactions/summary", params={"month": "2026-10"})).json()
    assert summary["total_expenses"] == 4500
    assert (await auth_client.post(f"{API}/imports/{pending['id']}/approve", json={"category": "Transport"})).status_code == 400

    # Next Bolt ride is suggested from history; approve-suggested handles it
    second = GTBANK_HTML.replace("4,500.00", "3,200.00").replace("06-Oct-2026", "07-Oct-2026")
    await send(mime("GeNS@gtbank.com", "GeNS Transaction Alert [Debit: NGN3,200.00]", html=second))
    assert (await auth_client.post(f"{API}/imports/approve-suggested")).json() == {"approved": 1}

    await auth_client.post(f"{API}/imports/{unreadable['id']}/dismiss")
    assert (await auth_client.get(f"{API}/imports/")).json() == []

    # Rotating the address kills the old one
    new = (await auth_client.post(f"{API}/imports/address/rotate")).json()["address"]
    assert new != to and (await send(gt)).status_code == 404


async def test_paste_alert(auth_client):
    r = await auth_client.post(f"{API}/imports/paste", json={"text": ACCESS_TEXT})
    assert r.status_code == 200 and r.json()["item"]["amount"] == 350000
    assert (await auth_client.post(f"{API}/imports/paste", json={"text": ACCESS_TEXT})).json()["duplicate"] is True
    bad = await auth_client.post(f"{API}/imports/paste", json={"text": "hello there, how are you doing today"})
    assert bad.status_code == 422


async def test_inbound_disabled_without_config(client):
    r = await client.post(f"{API}/inbound/email", params={"to": "a@b.c"}, content=b"x")
    assert r.status_code == 503
