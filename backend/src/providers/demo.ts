import type { Candle, EconomicEvent, Snapshot } from '../contracts.js';

const intervals: Record<string, number> = { '1m': 60, '5m': 300, '15m': 900, '1H': 3600, '4H': 14400, '1D': 86400 };
const prices: Record<string, number> = { 'XAU/USD': 2741.35, 'EUR/USD': 1.0842, 'BTC/USD': 67432.1, 'BBCA.JK': 10450 };
export function demoCandles(symbol: string, timeframe: string, now = Date.now()): Candle[] {
  const step = intervals[timeframe]; const base = prices[symbol];
  const end = Math.floor(now / 1000 / step) * step;
  const closeAt = (t: number) => base * (1 + Math.sin(t / step * .19) * .009 + Math.sin(t / step * .043) * .017 + Math.sin(t / step * 1.73) * .002);
  return Array.from({ length: 240 }, (_, i) => {
    const time = end - (239 - i) * step;
    const open = closeAt(time - step), close = closeAt(time);
    const wick = base * (.0006 + Math.abs(Math.sin(time / step * 2.1)) * .0012);
    return { time, open, close, high: Math.max(open, close) + wick, low: Math.min(open, close) - wick, volume: Math.round(100 + Math.abs(Math.sin(time / step)) * 1800) };
  });
}
export function demoEvents(now = Date.now()): EconomicEvent[] {
  // Demo release times are fixed for the UTC day; polling never resets a countdown.
  const day = new Date(now); day.setUTCHours(0, 0, 0, 0);
  return Array.from({ length: 3 }, (_, d) => [
    { title: 'US Consumer Price Index (CPI)', impact: 'High' as const, hour: 12.5, forecast: '2.6%', previous: '2.9%' },
    { title: 'US Producer Price Index (PPI)', impact: 'High' as const, hour: 13, forecast: '0.2%', previous: '0.1%' },
    { title: 'US Nonfarm Payrolls (NFP)', impact: 'High' as const, hour: 14, forecast: '180K', previous: '142K' },
    { title: 'Initial Jobless Claims', impact: 'Medium' as const, hour: 14.5, forecast: '230K', previous: '227K' },
  ].map((e, i) => ({ id: `demo-${day.toISOString().slice(0, 10)}-${d}-${i}`, title: e.title, currency: 'USD', country: 'US', impact: e.impact, at: new Date(day.getTime() + d * 86400000 + e.hour * 3600000).toISOString(), forecast: e.forecast, previous: e.previous, actual: null }))).flat();
}
export function demoSnapshot(now = Date.now()): Snapshot {
  const date = new Date(now); date.setUTCHours(10, 0, 0, 0);
  const trades = [245.5, -48.2, 128.8, 189.2, -65].map((pnl, i) => ({ id: `demo-deal-${date.toISOString().slice(0, 10)}-${i}`, symbol: i % 2 ? 'EUR/USD' : 'XAU/USD', side: 'Buy' as const, closedAt: new Date(date.getTime() - (i + 1) * 86400000).toISOString(), pnl, fees: 2, riskAmount: 75, entry: i % 2 ? 1.081 : 2700, exit: i % 2 ? 1.08 : 2735 }));
  const net = trades.reduce((s, t) => s + t.pnl - t.fees, 0);
  return { accountId: 'demo-mt5-001', broker: 'MT5 Bridge Simulator', currency: 'USD', balance: 10000 + net, equity: 10000 + net + 126.5, margin: 320, freeMargin: 10000 + net + 126.5 - 320, floatingPnl: 126.5, asOf: new Date(now).toISOString(), positions: [{ id: 'demo-open-001', symbol: 'XAU/USD', side: 'Buy', quantity: .1, entry: 2728.7, price: 2741.35, pnl: 126.5, margin: 320, riskAmount: 87, stopLoss: 2720 }], trades };
}
