import 'dotenv/config';
import { z } from 'zod';

const provider = z.enum(['demo', 'bridge']).default('demo');
const envSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  HOST: z.string().default('127.0.0.1'),
  FRONTEND_ORIGIN: z.string().url().default('http://localhost:5173'),
  DATA_FILE: z.string().default('./data/workspace.json'),
  COOKIE_SECURE: z.enum(['true', 'false']).default('false'),
  APP_PASSWORD: z.string().default(''),
  SESSION_SECRET: z.string().default(''),
  MARKET_PROVIDER: provider, MARKET_API_URL: z.string().default(''), MARKET_API_TOKEN: z.string().default(''),
  CALENDAR_PROVIDER: provider, CALENDAR_API_URL: z.string().default(''), CALENDAR_API_TOKEN: z.string().default(''),
  BROKER_PROVIDER: provider, BROKER_BRIDGE_URL: z.string().default(''), BROKER_BRIDGE_TOKEN: z.string().default(''),
  TELEGRAM_BOT_TOKEN: z.string().default(''), TELEGRAM_CHAT_ID: z.string().default(''),
  MAX_RISK_PERCENT: z.coerce.number().positive().max(100).default(5),
  MAX_MARGIN_PERCENT: z.coerce.number().positive().max(100).default(50),
});
export type Config = z.infer<typeof envSchema>;
export function loadConfig(env: Record<string, string | undefined> = process.env): Config {
  const config = envSchema.parse(env);
  const external = [config.MARKET_PROVIDER, config.CALENDAR_PROVIDER, config.BROKER_PROVIDER].includes('bridge') || !!config.TELEGRAM_BOT_TOKEN;
  if ((external || config.APP_PASSWORD) && (config.APP_PASSWORD.length < 12 || config.SESSION_SECRET.length < 32)) {
    throw new Error('External integrations require APP_PASSWORD (12+ characters) and SESSION_SECRET (32+ characters).');
  }
  for (const [mode, url] of [[config.MARKET_PROVIDER, config.MARKET_API_URL], [config.CALENDAR_PROVIDER, config.CALENDAR_API_URL], [config.BROKER_PROVIDER, config.BROKER_BRIDGE_URL]]) {
    if (mode === 'bridge' && !/^https?:\/\//.test(url)) throw new Error('Bridge providers require an HTTP(S) base URL.');
  }
  return config;
}
