export type Page = 'overview' | 'markets' | 'portfolio' | 'journal' | 'intelligence' | 'signals';
export type Transaction = {
  riskAmount?: number | null;
  rr?: number;
  source?: 'local' | 'broker';
  brokerId?: string;
  fees?: number;
  id: string;
  name: string;
  kind: 'deposit' | 'withdrawal' | 'profit' | 'loss';
  amount: number;
  date: string;
  note: string;
};
export type Position = {
  id: string;
  symbol: string;
  name: string;
  icon: string;
  side: 'Buy' | 'Sell';
  size: string;
  value: number;
  pnl: number;
  color: string;
};
export type Signal = {
  tp2?: number;
  riskLevel?: 'Low' | 'Medium' | 'High';
  riskPercent?: number;
  id: string;
  symbol: string;
  side: 'Buy' | 'Sell';
  entry: number;
  stop: number;
  target: number;
  date: string;
};
