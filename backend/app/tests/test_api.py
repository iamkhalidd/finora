import pytest
from app.core.trading import estimate_pnl_usd, normalize_pair

API = "/api/v1"


async def test_read_root(client):
    response = await client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Welcome to the Finora API server!"}


async def test_login_is_case_insensitive_and_needs_no_name(auth_client, client):
    res = await client.post(f"{API}/auth/login", json={"email": "ada@example.com", "password": "secret123"})
    assert res.status_code == 200
    assert res.json()["user"]["email"] == "ada@example.com"

    res = await client.post(f"{API}/auth/login", json={"email": "ada@example.com", "password": "wrong"})
    assert res.status_code == 400


async def test_profile_update_and_password_change(auth_client):
    res = await auth_client.put(f"{API}/users/me", json={"name": "Ada Obi"})
    assert res.json()["name"] == "Ada Obi"

    res = await auth_client.post(f"{API}/users/me/password", json={"current_password": "nope", "new_password": "newpass1"})
    assert res.status_code == 400
    res = await auth_client.post(f"{API}/users/me/password", json={"current_password": "secret123", "new_password": "newpass1"})
    assert res.status_code == 200


async def test_transaction_validation(auth_client):
    bad = [
        {"amount": 0, "type": "expense", "category": "Food"},
        {"amount": 100, "type": "spend", "category": "Food"},
        {"amount": 100, "type": "expense", "category": ""},
    ]
    for payload in bad:
        res = await auth_client.post(f"{API}/transactions/", json=payload)
        assert res.status_code == 422, payload


async def test_monthly_summary_and_filtering(auth_client):
    txs = [
        {"amount": 500000, "type": "income", "category": "Salary", "date": "2026-10-01T09:00:00"},
        {"amount": 20000, "type": "expense", "category": "Transport", "date": "2026-10-31T23:30:00"},
        {"amount": 30000, "type": "expense", "category": "Food & Groceries", "date": "2026-10-15T12:00:00"},
        {"amount": 99999, "type": "expense", "category": "Transport", "date": "2026-09-30T12:00:00"},
    ]
    for t in txs:
        assert (await auth_client.post(f"{API}/transactions/", json=t)).status_code == 200

    res = await auth_client.get(f"{API}/transactions/summary", params={"month": "2026-10"})
    s = res.json()
    assert s["total_income"] == 500000
    assert s["total_expenses"] == 50000
    assert s["net"] == 450000
    assert [c["name"] for c in s["categories"]] == ["Food & Groceries", "Transport"]

    # Last day of month is included, previous month excluded
    res = await auth_client.get(f"{API}/transactions/", params={"month": "2026-10", "type": "expense"})
    assert sorted(t["amount"] for t in res.json()) == [20000, 30000]

    assert (await auth_client.get(f"{API}/transactions/summary", params={"month": "2026-13"})).status_code == 422


async def test_transaction_edit_and_delete(auth_client):
    tx = (await auth_client.post(f"{API}/transactions/", json={"amount": 1000, "type": "expense", "category": "Airtime & Data", "notes": "MTN"})).json()
    res = await auth_client.put(f"{API}/transactions/{tx['id']}", json={"amount": 1500, "notes": ""})
    assert res.json()["amount"] == 1500
    assert res.json()["notes"] is None
    assert (await auth_client.delete(f"{API}/transactions/{tx['id']}")).status_code == 200
    assert (await auth_client.get(f"{API}/transactions/{tx['id']}")).status_code == 404


async def test_budget_spent_is_per_month(auth_client):
    await auth_client.post(f"{API}/transactions/", json={"amount": 15000, "type": "expense", "category": "Transport", "date": "2026-10-03T08:00:00"})
    await auth_client.post(f"{API}/transactions/", json={"amount": 40000, "type": "expense", "category": "Transport", "date": "2026-09-03T08:00:00"})

    res = await auth_client.post(f"{API}/budgets/", params={"month": "2026-10"}, json={"category": "Transport", "limit": 50000})
    assert res.status_code == 200
    assert res.json()["spent"] == 15000
    assert (await auth_client.post(f"{API}/budgets/", json={"category": "Transport", "limit": 1})).status_code == 400

    sept = (await auth_client.get(f"{API}/budgets/", params={"month": "2026-09"})).json()
    assert sept[0]["spent"] == 40000

    res = await auth_client.put(f"{API}/budgets/{sept[0]['id']}", params={"month": "2026-10"}, json={"limit": 60000})
    assert res.json() == {"id": sept[0]["id"], "category": "Transport", "limit": 60000, "spent": 15000}


def test_pnl_estimates():
    assert normalize_pair("xau/usd") == "XAUUSD"
    assert normalize_pair("GBPUSDm") == "GBPUSD"
    assert normalize_pair("EURUSD.pro") == "EURUSD"
    assert estimate_pnl_usd("XAUUSD", "BUY", 2400, 2410, 0.1) == 100.0
    assert estimate_pnl_usd("EURUSD", "SELL", 1.1000, 1.0950, 1) == 500.0
    # 100 pips on USDJPY at 1 lot is ~$662, not $10
    assert estimate_pnl_usd("USDJPY", "BUY", 150.00, 151.00, 1) == pytest.approx(662.25, abs=0.01)
    assert estimate_pnl_usd("GBPJPY", "BUY", 190, 191, 1) is None
    assert estimate_pnl_usd("US30", "BUY", 40000, 40100, 1) is None
    assert estimate_pnl_usd("BTCUSD", "BUY", 60000, 61000, 1) is None


async def test_trade_lifecycle_and_stats(auth_client):
    open_trade = (await auth_client.post(f"{API}/trades/", json={
        "pair": "xauusd", "direction": "BUY", "entry_price": 2400, "lot_size": 0.1,
        "stop_loss": 2390, "take_profit": 2420, "session": "London",
    })).json()
    assert open_trade["pair"] == "XAUUSD"
    assert open_trade["p_l"] == 0

    # Cross pair without a broker P&L is rejected; with one it's accepted
    gj = {"pair": "GBPJPY", "direction": "SELL", "entry_price": 191, "exit_price": 190, "lot_size": 1, "session": "Asian"}
    assert (await auth_client.post(f"{API}/trades/", json=gj)).status_code == 422
    loss = (await auth_client.post(f"{API}/trades/", json={**gj, "p_l": -120.5, "strategy": "Breakout"})).json()
    assert loss["p_l"] == -120.5

    # Notes-only edit keeps the broker P&L
    res = await auth_client.put(f"{API}/trades/{loss['id']}", json={"notes": "Moved SL too early"})
    assert res.status_code == 200 and res.json()["p_l"] == -120.5

    # Close the gold trade
    closed = (await auth_client.put(f"{API}/trades/{open_trade['id']}", json={"exit_price": 2420})).json()
    assert closed["p_l"] == 200.0

    open_list = (await auth_client.get(f"{API}/trades/", params={"status": "open"})).json()
    assert open_list == []

    stats = (await auth_client.get(f"{API}/trades/stats")).json()
    assert stats["total_trades"] == 2
    assert stats["win_rate"] == 50.0
    assert stats["total_p_l"] == 79.5
    assert stats["profit_factor"] == pytest.approx(1.66, abs=0.01)
    assert stats["avg_rr"] == 2.0

    analytics = (await auth_client.get(f"{API}/trades/analytics", params={"period": "all"})).json()
    assert analytics["cumulative_p_l"][-1]["value"] == 79.5
    assert {s["name"] for s in analytics["by_strategy"]} == {"Untagged", "Breakout"}


async def test_users_cannot_see_each_others_data(auth_client, client):
    tx = (await auth_client.post(f"{API}/transactions/", json={"amount": 1, "type": "expense", "category": "Others"})).json()
    other = await client.post(f"{API}/auth/register", json={"name": "Bola", "email": "bola@example.com", "password": "secret123"})
    headers = {"Authorization": f"Bearer {other.json()['access_token']}"}
    assert (await client.get(f"{API}/transactions/{tx['id']}", headers=headers)).status_code == 404
    assert (await client.delete(f"{API}/transactions/{tx['id']}", headers=headers)).status_code == 404
