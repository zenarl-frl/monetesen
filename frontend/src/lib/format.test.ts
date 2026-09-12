import { describe, expect, it } from 'vitest';
import { riskReward, dateKey, signedMoney } from './format';

describe('risk/reward validation', () => {
  it('calculates buy and sell setups with the correct directional risk', () => {
    expect(riskReward(100, 95, 115, 'Buy')).toBe(3);
    expect(riskReward(100, 105, 85, 'Sell')).toBe(3);
  });
  it('rejects reversed stops, reversed targets, zero risk and invalid prices', () => {
    expect(riskReward(100, 105, 115, 'Buy')).toBeNull();
    expect(riskReward(100, 105, 115, 'Sell')).toBeNull();
    expect(riskReward(100, 100, 115, 'Buy')).toBeNull();
    expect(riskReward(100, 95, 90, 'Buy')).toBeNull();
    expect(riskReward(100, 105, -10, 'Sell')).toBeNull();
    expect(riskReward(NaN, 95, 115, 'Buy')).toBeNull();
    expect(riskReward(Infinity, 95, 115, 'Buy')).toBeNull();
  });
});
describe('financial display', () => {
  it('preserves negative amounts without duplicate signs', () => {
    expect(signedMoney(-48.2)).toBe('−$48.20');
    expect(signedMoney(245.5)).toBe('+$245.50');
  });
  it('uses local calendar components instead of shifting dates through UTC', () => {
    expect(dateKey(new Date(2026, 8, 1, 0, 1))).toBe('2026-09-01');
  });
});
