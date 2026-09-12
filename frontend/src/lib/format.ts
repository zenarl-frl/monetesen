export function money(value: number, digits = 2) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}
export function signedMoney(value: number) {
  return `${value >= 0 ? '+' : '−'}${money(Math.abs(value))}`;
}
export function price(value: number) {
  return money(value, value < 2 ? 4 : 2);
}
export function riskReward(entry: number, stop: number, target: number, side: 'Buy' | 'Sell') {
  if (![entry, stop, target].every((n) => Number.isFinite(n) && n > 0)) return null;
  const risk = side === 'Buy' ? entry - stop : stop - entry;
  const reward = side === 'Buy' ? target - entry : entry - target;
  return risk > 0 && reward > 0 ? reward / risk : null;
}
export function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
