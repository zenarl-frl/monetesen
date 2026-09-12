import type { Candle, RiskLevel } from '../types/api';
export type Zone = { id: string; type: 'Support' | 'Resistance' | 'Demand' | 'Supply' | 'Liquidity pool' | 'Liquidity sweep'; low: number; high: number; start: number; touches: number; risk: RiskLevel; bullish: boolean };
export function averageTrueRange(candles: Candle[], period = 14): number {
  const ranges = candles.slice(1).map((c, i) => Math.max(c.high - c.low, Math.abs(c.high - candles[i].close), Math.abs(c.low - candles[i].close)));
  const tail = ranges.slice(-period); return tail.length ? tail.reduce((s, n) => s + n, 0) / tail.length : 0;
}
export function detectZones(candles: Candle[]): Zone[] {
  if (candles.length < 12) return [];
  const atr = averageTrueRange(candles); if (!atr) return [];
  const tolerance = atr * .3; const zones: Zone[] = [];
  const pivots: { price: number; index: number; high: boolean }[] = [];
  for (let i = 3; i < candles.length - 3; i++) {
    const neighbors = candles.slice(i - 3, i + 4).filter((_, j) => j !== 3);
    if (neighbors.every(c => candles[i].high > c.high)) pivots.push({ price: candles[i].high, index: i, high: true });
    if (neighbors.every(c => candles[i].low < c.low)) pivots.push({ price: candles[i].low, index: i, high: false });
  }
  const used = new Set<number>();
  pivots.forEach((pivot, index) => {
    if (used.has(index)) return;
    const group = pivots.filter((p, j) => { const matches = !used.has(j) && p.high === pivot.high && Math.abs(p.price - pivot.price) <= tolerance; if (matches) used.add(j); return matches; });
    const level = group.reduce((s, p) => s + p.price, 0) / group.length;
    const lastPivot = group[group.length - 1];
    const risk: RiskLevel = group.length >= 3 ? 'Low' : group.length >= 2 ? 'Medium' : 'High';
    zones.push({ id: `pivot-${index}`, type: pivot.high ? 'Resistance' : 'Support', low: level - tolerance / 2, high: level + tolerance / 2, start: candles[pivot.index].time, touches: group.length, risk, bullish: !pivot.high });
    if (group.length >= 2) {
      const swept = candles.slice(lastPivot.index + 4).some(c => pivot.high ? c.high > level + tolerance && c.close < level : c.low < level - tolerance && c.close > level);
      zones.push({ id: `liquidity-${index}`, type: swept ? 'Liquidity sweep' : 'Liquidity pool', low: level - tolerance / 4, high: level + tolerance / 4, start: candles[pivot.index].time, touches: group.length, risk, bullish: !pivot.high });
    }
  });
  for (let i = 1; i < candles.length - 1; i++) {
    const base = candles[i - 1], impulse = candles[i];
    if (Math.abs(impulse.close - impulse.open) < atr * 1.2 || Math.abs(base.close - base.open) > atr * .75) continue;
    const bullish = impulse.close > impulse.open;
    if (bullish ? impulse.close <= base.high : impulse.close >= base.low) continue;
    const low = bullish ? base.low : Math.min(base.open, base.close), high = bullish ? Math.max(base.open, base.close) : base.high;
    const after = candles.slice(i + 1);
    if (after.some(c => bullish ? c.close < low : c.close > high)) continue;
    const touches = after.filter(c => c.low <= high && c.high >= low).length;
    zones.push({ id: `block-${i}`, type: bullish ? 'Demand' : 'Supply', low, high, start: base.time, touches, risk: touches === 0 ? 'Low' : touches < 3 ? 'Medium' : 'High', bullish });
  }
  return zones.sort((a, b) => b.start - a.start).slice(0, 36);
}
export function pipSize(symbol: string) { return symbol === 'EUR/USD' ? .0001 : symbol === 'XAU/USD' ? .1 : 1; }
