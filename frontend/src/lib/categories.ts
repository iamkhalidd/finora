import type { TxType } from "./types";

export interface Category {
  name: string;
  icon: string;
  hint?: string;
}

export const EXPENSE_CATEGORIES: Category[] = [
  { name: "Food & Groceries", icon: "restaurant", hint: "Market, chops, restaurants" },
  { name: "Transport", icon: "directions_car", hint: "Bolt, Uber, bus, keke" },
  { name: "Fuel & Generator", icon: "local_gas_station", hint: "Petrol, diesel, gen repairs" },
  { name: "Electricity", icon: "bolt", hint: "Prepaid units, NEPA bill" },
  { name: "Airtime & Data", icon: "smartphone" },
  { name: "Rent & Housing", icon: "home", hint: "Rent, service charge, repairs" },
  { name: "Family Support", icon: "family_restroom", hint: "Sending money home" },
  { name: "Tithe & Giving", icon: "volunteer_activism", hint: "Tithe, offering, zakat, charity" },
  { name: "School Fees", icon: "school" },
  { name: "Health", icon: "medical_services", hint: "Hospital, drugs, HMO" },
  { name: "Subscriptions", icon: "live_tv", hint: "DStv, GOtv, Netflix, Spotify" },
  { name: "Shopping", icon: "shopping_bag", hint: "Clothes, gadgets, home items" },
  { name: "Events & Owambe", icon: "celebration", hint: "Aso-ebi, gifts, parties" },
  { name: "Savings & Ajo", icon: "savings", hint: "PiggyVest, Cowrywise, ajo, esusu" },
  { name: "Bank Charges", icon: "account_balance", hint: "Transfer fees, SMS, stamp duty" },
  { name: "Others", icon: "more_horiz" },
];

export const INCOME_CATEGORIES: Category[] = [
  { name: "Salary", icon: "payments" },
  { name: "Business", icon: "storefront" },
  { name: "Freelance", icon: "work" },
  { name: "Trading Profit", icon: "candlestick_chart", hint: "Withdrawals from your broker" },
  { name: "Gift", icon: "redeem" },
  { name: "Refund", icon: "currency_exchange" },
  { name: "Other Income", icon: "add_card" },
];

// Categories used by earlier versions of the app, so old entries keep an icon.
const LEGACY: Record<string, string> = {
  "Food & Dining": "restaurant",
  "Investments": "trending_up",
  "Travel": "flight",
  "Savings": "savings",
};

const BY_NAME = new Map(
  [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES].map((c) => [c.name, c])
);

export function categoryIcon(name: string): string {
  return BY_NAME.get(name)?.icon ?? LEGACY[name] ?? "category";
}

export function categoriesFor(type: TxType): Category[] {
  return type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
}

// Sender domains for the Gmail forwarding filter (mirrors BANK_DOMAINS in backend/app/core/alerts.py)
export const BANK_SENDER_DOMAINS = [
  "gtbank.com", "gtco.com", "accessbankplc.com", "zenithbank.com", "firstbanknigeria.com", "ubagroup.com",
  "fcmb.com", "fidelitybank.ng", "sterling.ng", "wemabank.com", "alat.ng", "stanbicibtc.com", "unionbankng.com",
  "ecobank.com", "polarisbanklimited.com", "providusbank.com", "keystonebankng.com", "kudabank.com", "kuda.com",
  "opayweb.com", "opay-inc.com", "moniepoint.com", "palmpay.com", "carbon.ng", "fairmoney.ng", "vfdtech.ng",
];
