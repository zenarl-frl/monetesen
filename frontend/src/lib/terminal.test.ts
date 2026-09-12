import { describe, expect, it } from 'vitest';
import { detectZones } from './zones';
import { journalDate, journalMetrics } from './journal';
import { marketSession, sessionDefinitions, wib } from './sessions';
import { renderCaption } from './signals';
import type { Candle } from '../types/api';
import type { Transaction } from '../types';

describe('Zone detection', () => {
  it('detects confirmed equal-high liquidity and a subsequent sweep', () => {
    const highs = [101, 102, 103, 110, 103, 102, 101, 102, 103, 110.1, 103, 102, 101, 102, 113, 102, 101, 102, 101, 102];
    const candles: Candle[] = highs.map((high, i) => ({ time: 1000 + i * 60, open: 100, close: 100.5, low: 99, high, volume: 100 }));
    const zones = detectZones(candles);
    expect(zones.some(z => z.type === 'Resistance' && z.touches >= 2)).toBe(true);
    expect(zones.some(z => z.type === 'Liquidity sweep')).toBe(true);
    expect(zones.every(z => z.low <= z.high)).toBe(true);
  });
  it('does not produce zones from insufficient history', () => expect(detectZones([])).toEqual([]));
});
describe('Journal risk statistics', () => {
  const trade = (amount: number, day: number, riskAmount?: number): Transaction => ({ id: String(day), name: 'XAU/USD', kind: amount >= 0 ? 'profit' : 'loss', amount, date: `2026-09-${String(day).padStart(2, '0')}T12:00:00Z`, note: '', riskAmount });
  it('computes net drawdown from peaks and excludes unknown risk from average R', () => {
    const result = journalMetrics([trade(100, 1, 50), trade(-150, 2, 50), trade(25, 3)], 1000);
    expect(result.net).toBe(-25); expect(result.maxDrawdown).toBe(150);
    expect(result.maxDrawdownPercent).toBeCloseTo(150 / 1100 * 100);
    expect(result.avgRR).toBe(-.5); expect(result.rrCoverage).toBe(2);
  });
  it('excludes deposits and recognizes breakeven trades and WIB boundaries', () => {
    const result = journalMetrics([{ ...trade(500, 1), kind: 'deposit' }, trade(0, 2)], 1000);
    expect(result.trades).toBe(1); expect(result.net).toBe(0); expect(result.winRate).toBe(0);
    expect(journalDate('2026-09-12T18:30:00Z')).toBe('2026-09-13');
  });
});
describe('Market sessions and DST', () => {
  it('changes London WIB hours with DST', () => {
    const london = sessionDefinitions[2];
    expect(wib(marketSession(london, Date.parse('2026-01-12T10:00:00Z')).open)).toBe('15:00');
    expect(wib(marketSession(london, Date.parse('2026-07-13T10:00:00Z')).open)).toBe('14:00');
  });
  it('closes on local weekends and schedules the next weekday', () => {
    const s = marketSession(sessionDefinitions[2], Date.parse('2026-09-12T10:00:00Z'));
    expect(s.active).toBe(false); expect(s.weekend).toBe(true);
    expect(new Date(s.nextChange).getUTCDay()).toBe(1);
  });
});
it('renders pip distance and both targets in the custom caption', () => {
  const text = renderCaption('{pair} {slPips} {tp1} {tp2} {rr}', { symbol: 'EUR/USD', side: 'Buy', entry: 1.1, stop: 1.099, tp1: 1.103, tp2: 1.105, riskLevel: 'Low', riskPercent: 1, timeframe: '15m' });
  expect(text).toContain('10.0'); expect(text).toContain('3.00'); expect(text).not.toContain('{tp2}');
});
