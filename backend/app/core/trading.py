import re
from typing import Optional

# Contract sizes for instruments we can price exactly on a USD account.
METALS = {"XAUUSD": 100.0, "GOLD": 100.0, "XAGUSD": 5000.0, "SILVER": 5000.0}
STANDARD_LOT = 100_000.0


def normalize_pair(pair: str) -> str:
    # "eur/usd", "XAUUSD.m", "GBPUSDm" -> "EURUSD", "XAUUSD", "GBPUSD"
    p = re.sub(r"[^A-Z0-9]", "", pair.upper().split(".")[0])
    if len(p) == 7 and p.endswith("M") and p[:6].isalpha():
        p = p[:6]
    return p


def estimate_pnl_usd(pair: str, direction: str, entry: float, exit: float, lots: float) -> Optional[float]:
    """Estimate P&L in USD for a closed trade, or None when we can't do it exactly.

    Exact for gold/silver, XXX/USD pairs and USD/XXX pairs. Crosses (GBPJPY,
    EURGBP...), indices and synthetics depend on broker contract specs or a
    third conversion rate, so the user should enter the broker's figure.
    """
    p = normalize_pair(pair)
    diff = exit - entry
    if direction.upper() == "SELL":
        diff = -diff

    if p in METALS:
        return round(diff * METALS[p] * lots, 2)
    if len(p) == 6 and p.isalpha():
        if p.endswith("USD"):
            return round(diff * STANDARD_LOT * lots, 2)
        if p.startswith("USD") and exit > 0:
            # Profit is in the quote currency; convert at the exit price.
            return round(diff * STANDARD_LOT * lots / exit, 2)
    return None
