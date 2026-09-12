import type { Transaction } from '../types';
export function journalDate(date: string) { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(date)); }
export function isTrade(t: Transaction) { return t.kind === 'profit' || t.kind === 'loss'; }
export function journalMetrics(transactions: Transaction[], startingEquity: number) {
  const trades = transactions.filter(isTrade).sort((a, b) => a.date.localeCompare(b.date));
  const wins = trades.filter(t => t.amount > 0), losses = trades.filter(t => t.amount < 0);
  const net = trades.reduce((sum, t) => sum + t.amount, 0);
  const rewardRatios = trades.flatMap(t => t.riskAmount && t.riskAmount > 0 ? [t.amount / t.riskAmount] : t.rr !== undefined && Number.isFinite(t.rr) ? [t.rr] : []);
  let equity = startingEquity, peak = startingEquity, maxDrawdown = 0, maxDrawdownPercent = 0;
  for (const t of trades) { equity += t.amount; peak = Math.max(peak, equity); const decline = peak - equity; maxDrawdown = Math.max(maxDrawdown, decline); if (peak > 0) maxDrawdownPercent = Math.max(maxDrawdownPercent, decline / peak * 100); }
  return { net, winRate: trades.length ? wins.length / trades.length * 100 : 0, avgRR: rewardRatios.length ? rewardRatios.reduce((a, b) => a + b, 0) / rewardRatios.length : null, rrCoverage: rewardRatios.length, maxDrawdown, maxDrawdownPercent, trades: trades.length, wins: wins.length, losses: losses.length, percent: startingEquity > 0 ? net / startingEquity * 100 : null };
}
