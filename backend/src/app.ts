import express, { type ErrorRequestHandler } from 'express';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import type { Config } from './config.js';
import { candlesSchema, eventsSchema, signalSchema, symbolSchema, timeframeSchema } from './contracts.js';
import { demoCandles, demoCandlesRealtime, demoEvents } from './providers/demo.js';
import { bridgeGet } from './providers/bridge.js';
import { Storage } from './services/storage.js';
import { BrokerService, exposure } from './services/broker.js';
import { TelegramService } from './services/telegram.js';

export async function createApp(config: Config, storage = new Storage(config.DATA_FILE)) {
  await storage.init();
  const app = express(); const broker = new BrokerService(config, storage); const telegram = new TelegramService(config, storage);
  const secret = config.SESSION_SECRET || randomBytes(32).toString('hex');
  const sign = (value: string) => createHmac('sha256', secret).update(value).digest('hex');
  const same = (a: string, b: string) => { const left = Buffer.from(a), right = Buffer.from(b); return left.length === right.length && timingSafeEqual(left, right); };
  app.disable('x-powered-by'); app.use(helmet()); app.use(express.json({ limit: '8mb' }));
  app.use('/api', (_req, res, next) => { res.setHeader('Cache-Control', 'no-store'); next(); });
  app.use('/api', rateLimit({ windowMs: 60000, limit: 180, standardHeaders: 'draft-8', legacyHeaders: false }));
  app.get('/api/health', (_req, res) => res.json({ ok: true }));
  app.use('/api', (req, res, next) => {
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
      const origin = req.get('origin');
      if (origin && origin !== config.FRONTEND_ORIGIN && origin !== `${req.protocol}://${req.get('host')}` && origin !== 'http://localhost:4173' && origin !== 'http://127.0.0.1:4173') { res.status(403).json({ error: 'Origin not allowed.' }); return; }
    }
    next();
  });
  app.post('/api/auth/login', rateLimit({ windowMs: 60000, limit: 8 }), (req, res) => {
    const password = z.object({ password: z.string().max(500) }).parse(req.body).password;
    if (config.APP_PASSWORD && !same(sign(password), sign(config.APP_PASSWORD))) { res.status(401).json({ error: 'Password tidak sesuai.' }); return; }
    const expires = String(Date.now() + 12 * 3600000); const token = `${expires}.${sign(expires)}`;
    res.cookie('monetasens_session', token, { httpOnly: true, secure: config.COOKIE_SECURE === 'true', sameSite: 'strict', maxAge: 12 * 3600000, path: '/api' });
    res.json({ authenticated: true });
  });
  app.post('/api/auth/logout', (_req, res) => { res.clearCookie('monetasens_session', { path: '/api' }); res.json({ ok: true }); });
  app.use('/api', (req, res, next) => {
    if (!config.APP_PASSWORD) { next(); return; }
    const token = req.headers.cookie?.split(';').map(s => s.trim()).find(s => s.startsWith('monetasens_session='))?.split('=')[1] || '';
    const [expires, signature] = token.split('.');
    if (!expires || !signature || Number(expires) <= Date.now() || !same(sign(expires), signature)) { res.status(401).json({ error: 'Masuk ke backend workspace terlebih dahulu.', requiresLogin: true }); return; }
    next();
  });
  app.get('/api/status', (_req, res) => res.json({ market: config.MARKET_PROVIDER, calendar: config.CALENDAR_PROVIDER, broker: config.BROKER_PROVIDER, telegramConfigured: !!(config.TELEGRAM_BOT_TOKEN && config.TELEGRAM_CHAT_ID), authenticated: true, passwordProtected: !!config.APP_PASSWORD, maxRiskPercent: config.MAX_RISK_PERCENT, maxMarginPercent: config.MAX_MARGIN_PERCENT }));
  app.get('/api/market/candles', async (req, res) => {
    const symbol = symbolSchema.parse(req.query.symbol || 'XAU/USD'); const timeframe = timeframeSchema.parse(req.query.timeframe || '15m'); const realtime = req.query.realtime === '1';
    const query = new URLSearchParams({ symbol, timeframe });
    let candles;
    if (config.MARKET_PROVIDER === 'demo') {
      if (realtime) { candles = demoCandlesRealtime(symbol, timeframe); }
      else { candles = demoCandles(symbol, timeframe); }
    } else { candles = await bridgeGet(config.MARKET_API_URL, `/market/candles?${query}`, config.MARKET_API_TOKEN, candlesSchema); }
    res.json({ source: config.MARKET_PROVIDER, symbol, timeframe, realtime, asOf: new Date().toISOString(), candles });
  });
  app.get('/api/calendar', async (_req, res) => {
    const events = config.CALENDAR_PROVIDER === 'demo' ? demoEvents() : await bridgeGet(config.CALENDAR_API_URL, '/calendar', config.CALENDAR_API_TOKEN, eventsSchema);
    res.json({ source: config.CALENDAR_PROVIDER, asOf: new Date().toISOString(), events: [...events].sort((a, b) => a.at.localeCompare(b.at)) });
  });
  app.get('/api/broker/snapshot', async (_req, res) => {
    try { const snapshot = await broker.sync(); res.json({ source: config.BROKER_PROVIDER, stale: Date.now() - new Date(snapshot.asOf).getTime() > 60000, snapshot, exposure: exposure(snapshot, config.MAX_RISK_PERCENT, config.MAX_MARGIN_PERCENT) }); }
    catch { const snapshot = storage.read().snapshot; if (!snapshot) { res.status(502).json({ error: 'Broker bridge tidak tersedia. Periksa URL dan token backend.' }); return; } res.json({ source: config.BROKER_PROVIDER, stale: true, error: 'Broker sync gagal. Menampilkan snapshot terakhir.', snapshot, exposure: exposure(snapshot, config.MAX_RISK_PERCENT, config.MAX_MARGIN_PERCENT) }); }
  });
  app.get('/api/signals/history', (_req, res) => res.json({ dispatches: storage.read().dispatches.slice(0, 200) }));
  app.post('/api/signals/dispatch', rateLimit({ windowMs: 60000, limit: 10 }), async (req, res) => {
    const input = signalSchema.parse(req.body);
    if (!config.TELEGRAM_BOT_TOKEN || !config.TELEGRAM_CHAT_ID) { res.status(503).json({ error: 'Isi TELEGRAM_BOT_TOKEN dan TELEGRAM_CHAT_ID di backend/.env.' }); return; }
    const record = await telegram.dispatch(input); res.status(record.status === 'sent' ? 200 : record.status === 'failed' ? 502 : 202).json(record);
  });
  app.use('/api', (_req, res) => res.status(404).json({ error: 'API route not found.' }));
  const errors: ErrorRequestHandler = (error, _req, res, _next) => {
    if (error instanceof z.ZodError) { res.status(400).json({ error: 'Data tidak valid.', details: error.issues.map(i => i.message) }); return; }
    if (error?.type === 'entity.too.large') { res.status(413).json({ error: 'Gambar terlalu besar (maksimum 5 MB).' }); return; }
    if (error instanceof SyntaxError) { res.status(400).json({ error: 'JSON tidak valid.' }); return; }
    // Provider URLs and tokens never appear in responses or logs.
    res.status(502).json({ error: 'Layanan tidak tersedia. Periksa konfigurasi provider backend.' });
  };
  app.use(errors);
  return app;
}
