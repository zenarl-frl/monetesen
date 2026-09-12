import { z } from 'zod';

export const symbolSchema = z.enum(['XAU/USD', 'EUR/USD', 'BTC/USD', 'BBCA.JK']);
export const timeframeSchema = z.enum(['1m', '5m', '15m', '1H', '4H', '1D']);
export const candleSchema = z.object({
  time: z.number().int().positive(), open: z.number().positive(), high: z.number().positive(),
  low: z.number().positive(), close: z.number().positive(), volume: z.number().nonnegative(),
}).refine(c => c.high >= Math.max(c.open, c.close) && c.low <= Math.min(c.open, c.close) && c.low <= c.high, 'Invalid OHLC range');
export const candlesSchema = z.array(candleSchema).min(10).max(2000).refine(c => c.every((v, i) => !i || v.time > c[i - 1].time), 'Candles must be unique, ascending');
export const eventSchema = z.object({
  id: z.string().min(1), title: z.string().min(1), currency: z.string().min(3), country: z.string(),
  impact: z.enum(['High', 'Medium', 'Low']), at: z.string().datetime(),
  forecast: z.string().nullable(), previous: z.string().nullable(), actual: z.string().nullable(),
});
export const eventsSchema = z.array(eventSchema).max(1000);
export const positionSchema = z.object({
  id: z.string().min(1), symbol: z.string().min(1), side: z.enum(['Buy', 'Sell']),
  quantity: z.number().positive(), entry: z.number().positive(), price: z.number().positive(),
  pnl: z.number().finite(), margin: z.number().nonnegative(), riskAmount: z.number().nonnegative().nullable(),
  stopLoss: z.number().positive().nullable(),
});
export const tradeSchema = z.object({
  id: z.string().min(1), symbol: z.string().min(1), side: z.enum(['Buy', 'Sell']),
  closedAt: z.string().datetime(), pnl: z.number().finite(), fees: z.number().nonnegative(),
  riskAmount: z.number().positive().nullable(), entry: z.number().positive(), exit: z.number().positive(),
});
export const snapshotSchema = z.object({
  accountId: z.string().min(1), broker: z.string(), currency: z.literal('USD'),
  balance: z.number().finite(), equity: z.number().finite(), margin: z.number().nonnegative(),
  freeMargin: z.number().finite(), floatingPnl: z.number().finite(), asOf: z.string().datetime(),
  positions: z.array(positionSchema).max(1000), trades: z.array(tradeSchema).max(50000),
});
export const signalSchema = z.object({
  requestId: z.string().uuid(), symbol: symbolSchema, side: z.enum(['Buy', 'Sell']),
  entry: z.number().positive(), stop: z.number().positive(), tp1: z.number().positive(), tp2: z.number().positive(),
  riskLevel: z.enum(['Low', 'Medium', 'High']), riskPercent: z.number().positive().max(100),
  caption: z.string().trim().min(1).max(3500),
  image: z.string().max(7_000_000).regex(/^data:image\/png;base64,[A-Za-z0-9+/]+=*$/).optional(),
}).superRefine((s, ctx) => {
  const valid = s.side === 'Buy' ? s.stop < s.entry && s.entry < s.tp1 && s.tp1 <= s.tp2 : s.tp2 <= s.tp1 && s.tp1 < s.entry && s.entry < s.stop;
  if (!valid) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Invalid stop / target direction.' });
});
export type Candle = z.infer<typeof candleSchema>;
export type EconomicEvent = z.infer<typeof eventSchema>;
export type Snapshot = z.infer<typeof snapshotSchema>;
export type DispatchInput = z.infer<typeof signalSchema>;
export type DispatchRecord = { id: string; symbol: string; status: 'pending' | 'sent' | 'failed' | 'unknown' | 'partial'; at: string; messageIds: number[]; error?: string };
