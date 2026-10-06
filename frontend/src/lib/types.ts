export type TxType = "income" | "expense";

export interface User {
  id: number;
  name: string;
  email: string;
}

export interface Transaction {
  id: number;
  amount: number;
  type: TxType;
  category: string;
  notes: string | null;
  date: string;
}

export interface CategoryTotal {
  name: string;
  value: number;
  percentage: number;
}

export interface Summary {
  month: string;
  total_income: number;
  total_expenses: number;
  net: number;
  categories: CategoryTotal[];
}

export interface Budget {
  id: number;
  category: string;
  limit: number;
  spent: number;
}

export type Direction = "BUY" | "SELL";

export interface Trade {
  id: number;
  pair: string;
  direction: Direction;
  entry_price: number;
  exit_price: number | null;
  lot_size: number;
  stop_loss: number | null;
  take_profit: number | null;
  session: string;
  strategy: string | null;
  notes: string | null;
  p_l: number;
  date: string;
}

export interface TradeStats {
  total_trades: number;
  open_trades: number;
  wins: number;
  losses: number;
  win_rate: number;
  total_p_l: number;
  profit_factor: number | null;
  avg_rr: number | null;
  best_trade: number | null;
  worst_trade: number | null;
}

export interface GroupStat {
  name: string;
  p_l: number;
  trades: number;
  wins: number;
  win_rate: number;
}

export interface TradeAnalytics {
  period: string;
  total_p_l: number;
  cumulative_p_l: { date: string; value: number }[];
  by_session: GroupStat[];
  by_strategy: GroupStat[];
  by_pair: GroupStat[];
}
