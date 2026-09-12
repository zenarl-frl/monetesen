import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  workers: 2,
  use: {
    baseURL: 'http://127.0.0.1:4173',
    browserName: 'chromium',
    reducedMotion: 'reduce',
    viewport: { width: 1440, height: 1050 },
  },
  webServer: [{
    command: 'npm start -w backend',
    url: 'http://127.0.0.1:3001/api/health',
    reuseExistingServer: !process.env.CI,
  }, {
    command: 'npm run preview -w frontend -- --port 4173',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
  }],
});
