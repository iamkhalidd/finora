import { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from "axios";
import { toLocalISO } from "@/lib/format";
import { estimatePnl, normalizePair } from "@/lib/trading";
import type { Budget, ImportedTransaction, Trade, Transaction } from "@/lib/types";
import { DEMO_DATA } from "./mode";
import { seedDemo, type DemoState, type StoredImport } from "./seed";

// An in-browser stand-in for the FastAPI backend. Behaviour mirrors
// backend/app/api/v1/endpoints/*; keep the two in step when endpoints change.

let state: DemoState | null = null;

function load(): DemoState {
  if (state) return state;
  try {
    const saved = localStorage.getItem(DEMO_DATA);
    if (saved) return (state = JSON.parse(saved));
  } catch {
    // Corrupt or blocked storage: start over
  }
  state = seedDemo();
  save();
  return state;
}

function save() {
  try {
    localStorage.setItem(DEMO_DATA, JSON.stringify(state));
  } catch {
    // Storage blocked: the demo still works for this page view
  }
}

/** Forget the in-memory copy so the next request re-reads (or re-seeds) storage. */
export function resetDemoCache() {
  state = null;
}

class HttpError extends Error {
  constructor(public status: number, public detail: string) {
    super(detail);
  }
}

const notFound = (what: string) => new HttpError(404, `${what} not found`);
const byDateDesc = <T extends { date: string; id: number }>(a: T, b: T) => b.date.localeCompare(a.date) || b.id - a.id;
const round2 = (n: number) => Math.round(n * 100) / 100;
const clean = (s: unknown) => (typeof s === "string" ? s.trim() : "") || null;
const currentMonth = () => toLocalISO(new Date()).slice(0, 7);
const toDate = (v: unknown) => (typeof v === "string" && v ? v.slice(0, 19) : toLocalISO(new Date()));

// ── Transactions ───────────────────────────────────────────────

function spentByCategory(s: DemoState, month: string) {
  const out: Record<string, number> = {};
  for (const t of s.transactions) {
    if (t.type === "expense" && t.date.startsWith(month)) out[t.category] = (out[t.category] ?? 0) + t.amount;
  }
  return out;
}

function summary(s: DemoState, month: string) {
  const inMonth = s.transactions.filter((t) => t.date.startsWith(month));
  const total_income = inMonth.filter((t) => t.type === "income").reduce((a, t) => a + t.amount, 0);
  const total_expenses = inMonth.filter((t) => t.type === "expense").reduce((a, t) => a + t.amount, 0);
  const categories = Object.entries(spentByCategory(s, month))
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value, percentage: total_expenses ? round2((value / total_expenses) * 100) : 0 }));
  return { month, total_income, total_expenses, net: total_income - total_expenses, categories };
}

// ── Trades ─────────────────────────────────────────────────────

function resolvePnl(t: Trade, explicit: unknown): number {
  if (t.exit_price == null) return 0;
  if (typeof explicit === "number") return round2(explicit);
  const estimate = estimatePnl(t.pair, t.direction, t.entry_price, t.exit_price, t.lot_size);
  if (estimate === null) throw new HttpError(422, `Can't auto-calculate P&L for ${t.pair}. Enter the profit/loss from your broker.`);
  return estimate;
}

function plannedRR(t: Trade) {
  if (!t.stop_loss || !t.take_profit) return null;
  const risk = Math.abs(t.entry_price - t.stop_loss);
  return risk > 0 ? Math.abs(t.take_profit - t.entry_price) / risk : null;
}

function tradeStats(s: DemoState) {
  const closed = s.trades.filter((t) => t.exit_price != null);
  const wins = closed.filter((t) => t.p_l > 0).map((t) => t.p_l);
  const losses = closed.filter((t) => t.p_l < 0).map((t) => t.p_l);
  const rr = closed.map(plannedRR).filter((r): r is number => r !== null);
  const grossLoss = Math.abs(losses.reduce((a, b) => a + b, 0));
  return {
    total_trades: closed.length,
    open_trades: s.trades.length - closed.length,
    wins: wins.length,
    losses: losses.length,
    win_rate: closed.length ? Math.round((wins.length / closed.length) * 1000) / 10 : 0,
    total_p_l: round2(closed.reduce((a, t) => a + t.p_l, 0)),
    profit_factor: grossLoss ? round2(wins.reduce((a, b) => a + b, 0) / grossLoss) : null,
    avg_rr: rr.length ? round2(rr.reduce((a, b) => a + b, 0) / rr.length) : null,
    best_trade: closed.length ? Math.max(...closed.map((t) => t.p_l)) : null,
    worst_trade: closed.length ? Math.min(...closed.map((t) => t.p_l)) : null,
  };
}

const PERIOD_DAYS: Record<string, number> = { week: 7, month: 30, "3m": 90, year: 365 };

function analytics(s: DemoState, period: string) {
  const since = PERIOD_DAYS[period] ? toLocalISO(new Date(Date.now() - PERIOD_DAYS[period] * 86400000)) : "";
  const trades = s.trades
    .filter((t) => t.exit_price != null && t.date >= since)
    .sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id);
  let running = 0;
  const cumulative_p_l = trades.map((t) => ({ date: t.date.slice(0, 10), value: round2((running += t.p_l)) }));
  const group = (key: (t: Trade) => string) => {
    const buckets = new Map<string, { name: string; p_l: number; trades: number; wins: number }>();
    for (const t of trades) {
      const name = key(t);
      const b = buckets.get(name) ?? { name, p_l: 0, trades: 0, wins: 0 };
      b.p_l += t.p_l;
      b.trades += 1;
      b.wins += t.p_l > 0 ? 1 : 0;
      buckets.set(name, b);
    }
    return [...buckets.values()]
      .map((b) => ({ ...b, p_l: round2(b.p_l), win_rate: Math.round((b.wins / b.trades) * 1000) / 10 }))
      .sort((a, b) => b.p_l - a.p_l);
  };
  return {
    period,
    total_p_l: round2(running),
    cumulative_p_l,
    by_session: group((t) => t.session || "Unknown"),
    by_strategy: group((t) => t.strategy || "Untagged"),
    by_pair: group((t) => t.pair),
  };
}

// ── Bank alerts ────────────────────────────────────────────────

const KEYWORDS: [RegExp, string][] = [
  [/bolt|uber|taxify|indrive|brt|keke/i, "Transport"],
  [/shoprite|spar|chicken republic|kfc|domino|market|eatery/i, "Food & Groceries"],
  [/mtn|airtel|glo|9mobile|data|airtime/i, "Airtime & Data"],
  [/dstv|gotv|netflix|spotify|showmax/i, "Subscriptions"],
  [/total|mobil|conoil|filling|petrol|fuel/i, "Fuel & Generator"],
  [/ikedc|ekedc|electric|prepaid/i, "Electricity"],
  [/salary|payroll/i, "Salary"],
];
const BANKS = ["GTBank", "Kuda", "Access", "OPay", "Zenith", "UBA", "First Bank", "Moniepoint", "PalmPay", "Wema"];

function parseAlert(text: string): Partial<ImportedTransaction> | null {
  const amount = text.match(/(?:NGN|₦|\bN)\s?([\d,]+(?:\.\d{1,2})?)/i);
  const type = /\bcredit|\bcr\b/i.test(text) ? "income" : /\bdebit|\bdr\b/i.test(text) ? "expense" : null;
  if (!amount || !type) return null;
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const narration = text.match(/(?:narration|description|desc|remarks?)\s*[:\-]\s*(.+)/i)?.[1]?.trim();
  const description = (narration ?? lines[0] ?? "").slice(0, 200);
  const suggested = KEYWORDS.find(([re, cat]) => re.test(description) && (cat === "Salary") === (type === "income"))?.[1] ?? null;
  return {
    amount: Number(amount[1].replace(/,/g, "")),
    type,
    description,
    bank: BANKS.find((b) => text.toLowerCase().includes(b.toLowerCase())) ?? null,
    suggested_category: suggested,
    subject: lines[0]?.slice(0, 300) ?? null,
  };
}

// ── Router ─────────────────────────────────────────────────────

type Body = Record<string, unknown>;

function route(method: string, path: string, params: Record<string, string>, body: Body): unknown {
  const s = load();
  const seg = path.replace(/^\/+|\/+$/g, "").split("/");
  const id = Number(seg[1]);
  const newId = () => s.nextId++;

  // Auth and profile
  if (seg[0] === "auth") return { detail: "ok" };
  if (seg[0] === "users") {
    if (method === "get") return s.user;
    if (method === "put") return (s.user = { ...s.user, name: clean(body.name) ?? s.user.name });
    return { detail: "Password updated" };
  }

  if (seg[0] === "transactions") {
    if (seg[1] === "summary") return summary(s, params.month || currentMonth());
    if (!seg[1]) {
      if (method === "post") {
        const tx: Transaction = { id: newId(), amount: Number(body.amount), type: body.type as Transaction["type"], category: String(body.category).trim(), notes: clean(body.notes), date: toDate(body.date) };
        s.transactions.push(tx);
        return tx;
      }
      let list = [...s.transactions].sort(byDateDesc);
      if (params.month) list = list.filter((t) => t.date.startsWith(params.month));
      if (params.type) list = list.filter((t) => t.type === params.type);
      return params.limit ? list.slice(0, Number(params.limit)) : list;
    }
    const tx = s.transactions.find((t) => t.id === id);
    if (!tx) throw notFound("Transaction");
    if (method === "get") return tx;
    if (method === "delete") {
      s.transactions = s.transactions.filter((t) => t.id !== id);
      return { detail: "Transaction deleted successfully" };
    }
    Object.assign(tx, {
      ...(body.amount != null && { amount: Number(body.amount) }),
      ...(body.type != null && { type: body.type }),
      ...(body.category != null && { category: String(body.category).trim() }),
      ...("notes" in body && { notes: clean(body.notes) }),
      ...(body.date != null && { date: toDate(body.date) }),
    });
    return tx;
  }

  if (seg[0] === "budgets") {
    const month = params.month || currentMonth();
    const withSpent = (b: Omit<Budget, "spent">): Budget => ({ ...b, spent: spentByCategory(s, month)[b.category] ?? 0 });
    if (!seg[1]) {
      if (method === "post") {
        if (s.budgets.some((b) => b.category === body.category)) throw new HttpError(400, "You already have a budget for this category");
        const b = { id: newId(), category: String(body.category), limit: Number(body.limit) };
        s.budgets.push(b);
        return withSpent(b);
      }
      return [...s.budgets].sort((a, b) => a.category.localeCompare(b.category)).map(withSpent);
    }
    const b = s.budgets.find((x) => x.id === id);
    if (!b) throw notFound("Budget");
    if (method === "delete") {
      s.budgets = s.budgets.filter((x) => x.id !== id);
      return { detail: "Budget deleted successfully" };
    }
    b.limit = Number(body.limit);
    return withSpent(b);
  }

  if (seg[0] === "trades") {
    if (seg[1] === "stats") return tradeStats(s);
    if (seg[1] === "analytics") return analytics(s, params.period || "3m");
    if (!seg[1]) {
      if (method === "post") {
        const t: Trade = {
          id: newId(), pair: normalizePair(String(body.pair)) || String(body.pair).toUpperCase(),
          direction: body.direction as Trade["direction"], entry_price: Number(body.entry_price),
          exit_price: body.exit_price == null ? null : Number(body.exit_price), lot_size: Number(body.lot_size),
          stop_loss: body.stop_loss == null ? null : Number(body.stop_loss), take_profit: body.take_profit == null ? null : Number(body.take_profit),
          session: String(body.session ?? ""), strategy: clean(body.strategy), notes: clean(body.notes), p_l: 0, date: toDate(body.date),
        };
        t.p_l = resolvePnl(t, body.p_l);
        s.trades.push(t);
        return t;
      }
      let list = [...s.trades].sort(byDateDesc);
      if (params.status === "open") list = list.filter((t) => t.exit_price == null);
      if (params.status === "closed") list = list.filter((t) => t.exit_price != null);
      return list;
    }
    const t = s.trades.find((x) => x.id === id);
    if (!t) throw notFound("Trade");
    if (method === "get") return t;
    if (method === "delete") {
      s.trades = s.trades.filter((x) => x.id !== id);
      return { detail: "Trade deleted successfully" };
    }
    const { p_l: explicit, ...changes } = body;
    const nullable = new Set(["exit_price", "stop_loss", "take_profit", "strategy", "notes"]);
    for (const [field, value] of Object.entries(changes)) {
      if (value === undefined || (value === null && !nullable.has(field))) continue;
      const v = field === "pair" ? normalizePair(String(value)) || String(value).toUpperCase()
        : field === "strategy" || field === "notes" ? clean(value)
        : field === "date" ? toDate(value) : value;
      (t as unknown as Record<string, unknown>)[field] = v;
    }
    const priceChanged = ["pair", "direction", "entry_price", "exit_price", "lot_size"].some((f) => f in changes);
    if (explicit != null || priceChanged) t.p_l = resolvePnl(t, explicit);
    return t;
  }

  if (seg[0] === "imports") {
    const open = (i: StoredImport): i is ImportedTransaction => i.status === "pending" || i.status === "unreadable";
    if (seg[1] === "address") {
      return { enabled: true, address: "ada.k7m2demo@finora.example", last_received_at: toLocalISO(new Date(Date.now() - 3 * 3600000)), confirmation: null };
    }
    if (seg[1] === "paste") {
      const parsed = parseAlert(String(body.text ?? ""));
      if (!parsed) throw new HttpError(422, "Couldn't find an amount and whether it's a debit or credit in that text.");
      const now = toLocalISO(new Date());
      const item: ImportedTransaction = {
        id: newId(), status: "pending", source: "paste", reference: null, raw_excerpt: null,
        occurred_at: now, created_at: now, amount: null, type: null, description: null, bank: null, suggested_category: null, subject: null,
        ...parsed,
      };
      s.imports.unshift(item);
      return { duplicate: false, item };
    }
    const approveItem = (item: StoredImport, b: Body) => {
      const tx: Transaction = {
        id: newId(), amount: Number(b.amount ?? item.amount), type: (b.type ?? item.type) as Transaction["type"],
        category: String(b.category ?? item.suggested_category).trim(),
        notes: clean(b.notes !== undefined && b.notes !== null ? b.notes : item.description?.slice(0, 200)),
        date: toDate(b.date ?? item.occurred_at),
      };
      s.transactions.push(tx);
      item.status = "approved";
      return item;
    };
    if (seg[1] === "approve-suggested") {
      const ready = s.imports.filter((i) => i.status === "pending" && i.suggested_category);
      ready.forEach((i) => approveItem(i, {}));
      return { approved: ready.length };
    }
    if (!seg[1]) return s.imports.filter(open).sort((a, b) => (b.occurred_at ?? "").localeCompare(a.occurred_at ?? ""));
    const item = s.imports.find((i) => i.id === id);
    if (!item) throw notFound("Imported transaction");
    if (seg[2] === "dismiss") {
      item.status = "dismissed";
      return item;
    }
    if (!open(item)) throw new HttpError(400, "This item was already handled");
    return approveItem(item, body);
  }

  throw new HttpError(404, "Not found");
}

export async function demoAdapter(config: InternalAxiosRequestConfig): Promise<AxiosResponse> {
  const method = (config.method ?? "get").toLowerCase();
  const path = (config.url ?? "").split("?")[0];
  const params = Object.fromEntries(
    Object.entries((config.params ?? {}) as Record<string, unknown>)
      .filter(([, v]) => v !== undefined && v !== null)
      .map(([k, v]) => [k, String(v)])
  );
  const body: Body = typeof config.data === "string" && config.data ? JSON.parse(config.data) : (config.data ?? {});

  // A short pause so loading states look like the real app, not a flash
  await new Promise((r) => setTimeout(r, 120));
  try {
    const data = route(method, path, params, body);
    if (method !== "get") save();
    return { data, status: 200, statusText: "OK", headers: {}, config };
  } catch (err) {
    const status = err instanceof HttpError ? err.status : 500;
    const detail = err instanceof HttpError ? err.detail : "Something went wrong in the demo.";
    const response = { data: { detail }, status, statusText: "Error", headers: {}, config } as AxiosResponse;
    throw new AxiosError(detail, String(status), config, null, response);
  }
}
