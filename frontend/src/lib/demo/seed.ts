import type { Budget, ImportedTransaction, Trade, Transaction, User } from "@/lib/types";
import { toLocalISO } from "@/lib/format";

/** Like the API type, but the store also keeps items the user already handled. */
export type StoredImport = Omit<ImportedTransaction, "status"> & { status: ImportedTransaction["status"] | "approved" | "dismissed" };

export interface DemoState {
  user: User;
  transactions: Transaction[];
  budgets: Omit<Budget, "spent">[];
  trades: Trade[];
  imports: StoredImport[];
  nextId: number;
}

// Small deterministic generator so every visitor sees the same believable month
function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

const at = (d: Date, day: number, hour: number) => {
  const x = new Date(d.getFullYear(), d.getMonth(), day, hour, Math.floor(day * 7) % 60);
  return toLocalISO(x);
};

// [category, note, min, max, times per month]
const MONTHLY: [string, string, number, number, number][] = [
  ["Food & Groceries", "Shoprite Lekki", 14000, 32000, 3],
  ["Food & Groceries", "Chicken Republic", 4500, 9000, 4],
  ["Food & Groceries", "Mile 12 market", 18000, 30000, 2],
  ["Transport", "Bolt ride", 2800, 7500, 12],
  ["Transport", "Uber to the island", 6000, 11000, 3],
  ["Airtime & Data", "MTN data bundle", 5000, 5000, 2],
  ["Fuel & Generator", "Petrol for the gen", 12000, 18000, 2],
  ["Subscriptions", "DStv Compact", 15700, 15700, 1],
  ["Subscriptions", "Spotify", 1300, 1300, 1],
  ["Shopping", "Jumia order", 9000, 26000, 1],
  ["Family Support", "Sent to Mum", 30000, 30000, 1],
  ["Tithe & Giving", "Sunday offering", 5000, 10000, 2],
  ["Bank Charges", "Transfer fees", 300, 600, 3],
];

export function seedDemo(now = new Date()): DemoState {
  const rand = rng(20261023);
  const pick = (min: number, max: number) => Math.round((min + rand() * (max - min)) / 50) * 50;
  let id = 1;
  const transactions: Transaction[] = [];
  const add = (t: Omit<Transaction, "id">) => transactions.push({ id: id++, ...t });

  for (let back = 2; back >= 0; back--) {
    const month = new Date(now.getFullYear(), now.getMonth() - back, 1);
    const lastDay = back === 0 ? now.getDate() : new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    // Salary lands on the 25th; in the current month it shows up by today so the overview isn't empty
    add({ amount: 420000, type: "income", category: "Salary", notes: "Paystack Ltd", date: at(month, Math.min(25, lastDay), 9) });
    if (back !== 1) add({ amount: 60000, type: "income", category: "Freelance", notes: "Logo design for a client", date: at(month, Math.min(12, lastDay), 15) });
    if (back === 2) add({ amount: 250000, type: "expense", category: "Rent & Housing", notes: "Quarterly rent share", date: at(month, 2, 11) });
    for (const [category, notes, min, max, times] of MONTHLY) {
      for (let i = 0; i < times; i++) {
        const day = 1 + Math.floor(rand() * daysInMonth);
        if (day > lastDay) continue;
        add({ amount: pick(min, max), type: "expense", category, notes, date: at(month, day, 8 + Math.floor(rand() * 12)) });
      }
    }
  }

  const trades: Trade[] = [];
  const PAIRS: [string, number, number][] = [["XAUUSD", 2390, 0.2], ["EURUSD", 1.085, 0.5], ["GBPJPY", 193.4, 0.1], ["US30", 42150, 0.3]];
  const SESSIONS = ["London", "New York", "Asian"];
  const STRATEGIES = ["Breakout", "Trend pullback", "Range fade", null];
  const OUTCOMES = [214, -90, 132.5, 48, -26.4, 310, -75, 88, 165, -42, 56, -110, 220, 74, -38, 129];
  for (let i = 0; i < OUTCOMES.length + 2; i++) {
    const [pair, price, lots] = PAIRS[i % PAIRS.length];
    const date = new Date(now.getTime() - (85 - i * 5) * 86400000);
    const open = i >= OUTCOMES.length;
    const buy = rand() > 0.45;
    const step = price * 0.0015;
    trades.push({
      id: id++, pair, direction: buy ? "BUY" : "SELL",
      entry_price: +price.toFixed(price < 10 ? 4 : 1),
      exit_price: open ? null : +(price + (buy ? 1 : -1) * Math.sign(OUTCOMES[i]) * step).toFixed(price < 10 ? 4 : 1),
      lot_size: lots,
      stop_loss: +(price - (buy ? 1 : -1) * step).toFixed(price < 10 ? 4 : 1),
      take_profit: +(price + (buy ? 2 : -2) * step).toFixed(price < 10 ? 4 : 1),
      session: SESSIONS[i % 3], strategy: STRATEGIES[i % 4],
      notes: i === 0 ? "Waited for the retest of the Asian high. Followed the plan." : i === 1 ? "Entered early before confirmation. Should have waited." : null,
      p_l: open ? 0 : OUTCOMES[i],
      date: toLocalISO(date),
    });
  }

  const ago = (h: number) => toLocalISO(new Date(now.getTime() - h * 3600000));
  const alert = (o: Partial<ImportedTransaction>): ImportedTransaction => ({
    id: id++, status: "pending", source: "email", amount: null, type: null, description: null, bank: null,
    reference: null, occurred_at: null, suggested_category: null, subject: null, raw_excerpt: null, created_at: ago(1), ...o,
  });
  const imports = [
    alert({ amount: 4500, type: "expense", description: "TRF/BOLT TECHNOLOGY OU", bank: "GTBank", occurred_at: ago(3), suggested_category: "Transport", subject: "GeNS Transaction Alert [Debit]" }),
    alert({ amount: 12350, type: "expense", description: "POS/SPAR LEKKI PHASE 1", bank: "Kuda", occurred_at: ago(20), suggested_category: "Food & Groceries", subject: "Debit Alert" }),
    alert({ amount: 50000, type: "income", description: "NIP/TOLU ADEYEMI/REFUND FOR CONCERT TICKET", bank: "Access Bank", occurred_at: ago(30), subject: "Credit Alert" }),
  ];

  return {
    user: { id: 1, name: "Ada Okafor", email: "ada@finora.example" },
    transactions,
    budgets: [
      { id: id++, category: "Food & Groceries", limit: 150000 },
      { id: id++, category: "Transport", limit: 70000 },
      { id: id++, category: "Airtime & Data", limit: 12000 },
      { id: id++, category: "Subscriptions", limit: 15000 },
      { id: id++, category: "Shopping", limit: 40000 },
    ],
    trades,
    imports,
    nextId: id,
  };
}
