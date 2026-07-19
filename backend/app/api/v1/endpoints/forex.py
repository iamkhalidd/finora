import random
from fastapi import APIRouter, Query, Depends
from typing import List, Optional
from app.api.v1.deps import get_current_user
from app.models.user import User

router = APIRouter()

# Currency prices mock database to avoid relying purely on third-party availability
BASE_PRICES = {
    "XAUUSD": 1982.40,
    "EURUSD": 1.0850,
    "GBPJPY": 182.10,
    "AUDUSD": 0.6520,
    "USDJPY": 149.20,
    "GBPUSD": 1.2240
}

@router.get("/prices")
async def get_forex_prices(
    pairs: str = Query("XAUUSD,EURUSD,GBPJPY"),
    current_user: User = Depends(get_current_user)
):
    requested = [p.strip().upper() for p in pairs.split(",") if p.strip()]
    results = {}
    for pair in requested:
        base_price = BASE_PRICES.get(pair, 1.0)
        # Add slight fluctuation
        fluctuation = base_price * random.uniform(-0.001, 0.001)
        price = round(base_price + fluctuation, 4 if "JPY" not in pair and "XAU" not in pair else 2)
        change = round(random.uniform(-0.5, 0.5), 2)
        results[pair] = {
            "pair": pair,
            "price": price,
            "change": change,
            "high": round(price * 1.002, 4 if "JPY" not in pair and "XAU" not in pair else 2),
            "low": round(price * 0.998, 4 if "JPY" not in pair and "XAU" not in pair else 2)
        }
    return results
