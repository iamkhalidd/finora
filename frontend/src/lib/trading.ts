import type { Direction } from "./types";

export const POPULAR_INSTRUMENTS = ["XAUUSD", "EURUSD", "GBPUSD", "USDJPY", "GBPJPY", "US30", "NAS100", "BTCUSD"];
export const SESSIONS = ["Asian", "London", "New York"] as const;

const METALS: Record<string, number> = { XAUUSD: 100, GOLD: 100, XAGUSD: 5000, SILVER: 5000 };
const FIAT = new Set(["USD", "EUR", "GBP", "JPY", "AUD", "NZD", "CAD", "CHF", "ZAR", "SGD", "HKD", "NOK", "SEK", "DKK", "MXN", "TRY", "PLN", "CNH"]);

/** Mirrors backend app/core/trading.py */
export function normalizePair(pair: string): string {
  let p = pair.toUpperCase().split(".")[0].replace(/[^A-Z0-9]/g, "");
  if (p.length === 7 && p.endsWith("M") && /^[A-Z]{6}$/.test(p.slice(0, 6))) p = p.slice(0, 6);
  return p;
}

/** USD P&L for instruments we can price exactly; null means "enter it from your broker". */
export function estimatePnl(pair: string, direction: Direction, entry: number, exit: number, lots: number): number | null {
  if (!(entry > 0 && exit > 0 && lots > 0)) return null;
  const p = normalizePair(pair);
  const diff = direction === "SELL" ? entry - exit : exit - entry;
  const round = (n: number) => Math.round(n * 100) / 100;
  if (p in METALS) return round(diff * METALS[p] * lots);
  if (p.length === 6 && FIAT.has(p.slice(0, 3)) && FIAT.has(p.slice(3))) {
    if (p.endsWith("USD")) return round(diff * 100000 * lots);
    if (p.startsWith("USD")) return round((diff * 100000 * lots) / exit);
  }
  return null;
}

export function canEstimate(pair: string): boolean {
  return estimatePnl(pair, "BUY", 1, 1.1, 1) !== null;
}

/** Best-guess trading session for "now" (UTC-based). */
export function currentSession(): (typeof SESSIONS)[number] {
  const h = new Date().getUTCHours();
  if (h >= 7 && h < 12) return "London";
  if (h >= 12 && h < 21) return "New York";
  return "Asian";
}

export function plannedRR(entry: number, sl: number | null, tp: number | null): number | null {
  if (!sl || !tp) return null;
  const risk = Math.abs(entry - sl);
  return risk > 0 ? Math.abs(tp - entry) / risk : null;
}
