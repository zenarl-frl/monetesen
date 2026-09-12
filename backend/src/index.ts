import { createApp } from './app.js';
import { loadConfig } from './config.js';

const config = loadConfig();
const app = await createApp(config);
const server = app.listen(config.PORT, config.HOST, () => {
  console.log(`monetasens API: http://${config.HOST}:${config.PORT} (market=${config.MARKET_PROVIDER}, broker=${config.BROKER_PROVIDER})`);
});
for (const signal of ['SIGINT', 'SIGTERM'] as const) process.on(signal, () => server.close(() => process.exit(0)));
