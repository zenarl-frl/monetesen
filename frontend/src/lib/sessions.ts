export const sessionDefinitions = [
  { city: 'Sydney', zone: 'Australia/Sydney', open: 8, close: 17 },
  { city: 'Tokyo', zone: 'Asia/Tokyo', open: 9, close: 18 },
  { city: 'London', zone: 'Europe/London', open: 8, close: 17 },
  { city: 'New York', zone: 'America/New_York', open: 8, close: 17 },
];
function parts(date: Date, zone: string) {
  return Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', weekday: 'short', hourCycle: 'h23' }).formatToParts(date).map(p => [p.type, p.value]));
}
function wallToUtc(year: number, month: number, day: number, hour: number, zone: string) {
  const desired = Date.UTC(year, month - 1, day, hour);
  let guess = desired;
  for (let i = 0; i < 3; i++) { const p = parts(new Date(guess), zone); const wall = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second); guess += desired - wall; }
  return guess;
}
export function marketSession(session: typeof sessionDefinitions[number], now: number) {
  const p = parts(new Date(now), session.zone);
  const weekend = p.weekday === 'Sat' || p.weekday === 'Sun';
  const open = wallToUtc(+p.year, +p.month, +p.day, session.open, session.zone);
  const close = wallToUtc(+p.year, +p.month, +p.day, session.close, session.zone);
  const active = !weekend && now >= open && now < close;
  let nextOpen = open;
  if (now >= open || weekend) {
    for (let offset = 1; offset <= 3; offset++) {
      const day = new Date(Date.UTC(+p.year, +p.month - 1, +p.day + offset));
      if (day.getUTCDay() !== 0 && day.getUTCDay() !== 6) { nextOpen = wallToUtc(day.getUTCFullYear(), day.getUTCMonth() + 1, day.getUTCDate(), session.open, session.zone); break; }
    }
  }
  return { ...session, active, weekend, open, close, nextChange: active ? close : nextOpen };
}
export function wib(date: number | string, seconds = false) { return new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', ...(seconds ? { second: '2-digit' } : {}), hourCycle: 'h23' }).format(new Date(date)); }
export function countdown(ms: number) { if (ms <= 0) return 'Released'; const seconds = Math.floor(ms / 1000); const h = Math.floor(seconds / 3600); return `${String(h).padStart(2, '0')}:${String(Math.floor(seconds % 3600 / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`; }
