import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { loadConfig } from '../src/config.js';
import { Storage } from '../src/services/storage.js';
import { TelegramService } from '../src/services/telegram.js';
import { BrokerService, exposure } from '../src/services/broker.js';
import { demoSnapshot } from '../src/providers/demo.js';
import { signalSchema } from '../src/contracts.js';

const config = () => loadConfig({});
beforeEach(() => vi.restoreAllMocks());
afterEach(() => vi.unstubAllGlobals());
describe('API contracts and sessions', () => {
  it('returns ordered OHLC, calendar data and idempotent broker history', async () => {
    const app = await createApp(config(), new Storage(null));
    const candles = await request(app).get('/api/market/candles?symbol=XAU%2FUSD&timeframe=15m').expect(200);
    expect(candles.body.candles).toHaveLength(240);
    expect(candles.body.candles[1].time - candles.body.candles[0].time).toBe(900);
    expect(candles.body.source).toBe('demo');
    await request(app).get('/api/market/candles?symbol=INVALID').expect(400);
    const events = await request(app).get('/api/calendar').expect(200);
    expect(events.body.events.some((e: { title: string }) => e.title.includes('CPI'))).toBe(true);
    const a = await request(app).get('/api/broker/snapshot').expect(200);
    const b = await request(app).get('/api/broker/snapshot').expect(200);
    expect(a.body.snapshot.trades).toEqual(b.body.snapshot.trades);
    expect(new Set(b.body.snapshot.trades.map((t: { id: string }) => t.id)).size).toBe(5);
  });
  it('protects integrations using an HttpOnly session without returning secrets', async () => {
    const c = { ...config(), APP_PASSWORD: 'secret-workspace-password', SESSION_SECRET: 'a'.repeat(40) };
    const app = await createApp(c, new Storage(null)); const agent = request.agent(app);
    await agent.get('/api/status').expect(401);
    await agent.post('/api/auth/login').send({ password: 'wrong' }).expect(401);
    const login = await agent.post('/api/auth/login').send({ password: c.APP_PASSWORD }).expect(200);
    expect(login.headers['set-cookie'][0]).toContain('HttpOnly');
    expect(login.headers['set-cookie'][0]).toContain('SameSite=Strict');
    const status = await agent.get('/api/status').expect(200);
    expect(JSON.stringify(status.body)).not.toContain(c.APP_PASSWORD);
    await agent.post('/api/auth/logout').send({}).expect(200);
    await agent.get('/api/status').expect(401);
    await request(app).post('/api/auth/login').set('Origin', 'https://unrelated.example').send({ password: c.APP_PASSWORD }).expect(403);
  });
  it('rejects invalid directional setups before invoking Telegram', async () => {
    const app = await createApp(config(), new Storage(null));
    await request(app).post('/api/signals/dispatch').send({ ...setup(), stop: 110 }).expect(400);
    await request(app).post('/api/signals/dispatch').send(setup()).expect(503);
  });
  it('requires authentication when configuring external credentials', () => {
    expect(() => loadConfig({ TELEGRAM_BOT_TOKEN: 'example' })).toThrow('APP_PASSWORD');
  });
});
function setup() { return signalSchema.parse({ requestId: 'f7e7a4ad-6d77-4b89-90f6-52eea22a77a9', symbol: 'XAU/USD', side: 'Buy', entry: 100, stop: 95, tp1: 115, tp2: 120, riskLevel: 'Low', riskPercent: 1, caption: 'monetasens test setup' }); }
describe('Telegram delivery', () => {
  it('sends a PNG with sendPhoto exactly once for concurrent duplicate requests', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true, result: { message_id: 123 } })));
    vi.stubGlobal('fetch', fetch);
    const service = new TelegramService({ ...config(), TELEGRAM_BOT_TOKEN: 'test-token', TELEGRAM_CHAT_ID: 'channel' }, new Storage(null));
    const input = { ...setup(), image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aWQAAAABJRU5ErkJggg==' };
    const results = await Promise.all([service.dispatch(input), service.dispatch(input)]);
    expect(fetch).toHaveBeenCalledTimes(1); expect(fetch.mock.calls[0][0]).toContain('/sendPhoto');
    expect(results.some(r => r.status === 'sent')).toBe(true);
    const repeated = await service.dispatch(input); expect(repeated.messageIds).toEqual([123]);
  });
  it('sends message-only captions and preserves unknown outcomes without duplicate delivery', async () => {
    const fetch = vi.fn().mockRejectedValue(new Error('timeout')); vi.stubGlobal('fetch', fetch);
    const service = new TelegramService({ ...config(), TELEGRAM_BOT_TOKEN: 'test-token', TELEGRAM_CHAT_ID: 'channel' }, new Storage(null));
    const first = await service.dispatch(setup()); expect(first.status).toBe('unknown');
    await service.dispatch(setup()); expect(fetch).toHaveBeenCalledTimes(1); expect(fetch.mock.calls[0][0]).toContain('/sendMessage');
  });
  it('records partial delivery when the photo succeeds but the long caption fails', async () => {
    const fetch = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({ ok: true, result: { message_id: 1 } }))).mockResolvedValueOnce(new Response(JSON.stringify({ ok: false }), { status: 400 })); vi.stubGlobal('fetch', fetch);
    const service = new TelegramService({ ...config(), TELEGRAM_BOT_TOKEN: 'test-token', TELEGRAM_CHAT_ID: 'channel' }, new Storage(null));
    const result = await service.dispatch({ ...setup(), caption: 'a'.repeat(1100), image: 'data:image/png;base64,iVBORw0KGgo=' });
    expect(result.status).toBe('partial'); expect(result.messageIds).toEqual([1]);
  });
});
describe('Broker exposure and corrections', () => {
  it('warns for missing stops, excessive exposure and excessive margin', () => {
    const snapshot = demoSnapshot(); snapshot.equity = 1000; snapshot.margin = 700; snapshot.positions[0].riskAmount = 200;
    expect(exposure(snapshot, 5, 50).alerts).toHaveLength(2);
    snapshot.positions[0].riskAmount = null; expect(exposure(snapshot, 5, 50).unknownRisk).toBe(true);
    snapshot.equity = 0; expect(exposure(snapshot, 5, 50).riskPercent).toBeNull();
  });
  it('replaces corrected deals and keeps history instead of duplicating on sync', async () => {
    const store = new Storage(null), initial = demoSnapshot();
    await store.update(s => { s.snapshot = initial; });
    const incoming = { ...initial, trades: [{ ...initial.trades[0], pnl: 999 }] };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(incoming))));
    const service = new BrokerService({ ...config(), BROKER_PROVIDER: 'bridge', BROKER_BRIDGE_URL: 'https://bridge.example' }, store);
    const snapshot = await service.sync(); expect(snapshot.trades).toHaveLength(5); expect(snapshot.trades.find(t => t.id === incoming.trades[0].id)?.pnl).toBe(999);
  });
});
