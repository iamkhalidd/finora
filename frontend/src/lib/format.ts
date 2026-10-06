import { isAxiosError } from "axios";

const whole = new Intl.NumberFormat("en-NG", { maximumFractionDigits: 0 });
const twoDp = new Intl.NumberFormat("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function compactNumber(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1e9) return `${+(n / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `${+(n / 1e6).toFixed(1)}M`;
  if (abs >= 1e4) return `${+(n / 1e3).toFixed(0)}k`;
  return whole.format(n);
}

/** ₦12,500 — kobo only shown when the amount actually has kobo. */
export function naira(n: number, opts: { sign?: boolean; compact?: boolean } = {}): string {
  const abs = Math.abs(n);
  const body = opts.compact
    ? compactNumber(abs)
    : Number.isInteger(Math.round(abs * 100) / 100) ? whole.format(abs) : twoDp.format(abs);
  const sign = n < 0 ? "-" : opts.sign && n > 0 ? "+" : "";
  return `${sign}₦${body}`;
}

/** $1,234.50 for trading P&L (broker accounts are in USD). */
export function usd(n: number, opts: { sign?: boolean } = {}): string {
  const sign = n < 0 ? "-" : opts.sign && n > 0 ? "+" : "";
  return `${sign}$${twoDp.format(Math.abs(n))}`;
}

// ── Dates ─────────────────────────────────────────────────────
// The API stores the user's local wall-clock time without a timezone, so we
// send and parse naive "YYYY-MM-DDTHH:mm:ss" strings.

const pad = (n: number) => String(n).padStart(2, "0");

export function toLocalISO(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export function todayInput(): string {
  return toLocalISO(new Date()).slice(0, 10);
}

/** Combine a date input value with the current time so same-day entries keep their order. */
export function dateInputToISO(value: string): string {
  if (value === todayInput()) return toLocalISO(new Date());
  return `${value}T12:00:00`;
}

export function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short" });
}

export function dayHeading(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(Date.now() - 86400000);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-NG", { weekday: "short", day: "numeric", month: "short" });
}

export function currentMonth(): string {
  return todayInput().slice(0, 7);
}

export function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

export function monthLabel(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-NG", { month: "long", year: "numeric" });
}

/** Days remaining in the month including today (only meaningful for the current month). */
export function daysLeftInMonth(): number {
  const now = new Date();
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return last - now.getDate() + 1;
}

export function errorMessage(err: unknown, fallback = "Something went wrong. Please try again."): string {
  if (isAxiosError(err)) {
    if (!err.response) return "Can't reach the server. Check your internet connection.";
    const detail = err.response.data?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail) && detail[0]?.msg) return String(detail[0].msg).replace(/^Value error, /, "");
  }
  return fallback;
}
