export type Source = 'demo' | 'bridge';
export type Timeframe = '1m' | '5m' | '15m' | '1H' | '4H' | '1D';
export type RiskLevel = 'Low' | 'Medium' | 'High';
export type Candle = { time: number; open: number; high: number; low: number; close: number; volume: number };
export type CandleFeed = { source: Source; symbol: string; timeframe: Timeframe; asOf: string; candles: Candle[] };
export type EconomicEvent = { id: string; title: string; currency: string; country: string; impact: RiskLevel; at: string; forecast: string | null; previous: string | null; actual: string | null };
export type CalendarFeed = { source: Source; asOf: string; events: EconomicEvent[] };
export type BrokerTrade = { id: string; symbol: string; side: 'Buy' | 'Sell'; closedAt: string; pnl: number; fees: number; riskAmount: number | null; entry: number; exit: number };
export type BrokerPosition = { id: string; symbol: string; side: 'Buy' | 'Sell'; quantity: number; entry: number; price: number; pnl: number; margin: number; riskAmount: number | null; stopLoss: number | null };
export type BrokerFeed = {
  source: Source; stale: boolean; error?: string;
  snapshot: { accountId: string; broker: string; currency: 'USD'; balance: number; equity: number; margin: number; freeMargin: number; floatingPnl: number; asOf: string; positions: BrokerPosition[]; trades: BrokerTrade[] };
  exposure: { riskPercent: number | null; marginPercent: number | null; unknownRisk: boolean; marginLevel: number | null; alerts: string[] };
};
export type BackendStatus = { market: Source; calendar: Source; broker: Source; telegramConfigured: boolean; authenticated: boolean; passwordProtected: boolean; maxRiskPercent: number; maxMarginPercent: number };
export type SignalDraft = { symbol: string; side: 'Buy' | 'Sell'; entry: number; stop: number; tp1: number; tp2: number; riskLevel: RiskLevel; riskPercent: number; timeframe: Timeframe; image?: string; capturedAt?: string; source?: Source };
export type DispatchRecord = { id: string; symbol: string; status: 'pending' | 'sent' | 'failed' | 'partial' | 'unknown'; at: string; messageIds: number[]; error?: string };
