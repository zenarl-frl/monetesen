import { test, expect } from '@playwright/test';

test('desktop workspace persists funds and realizes a position without changing total equity', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.locator('.balance-value')).toContainText('$13,553.00');
  await page.getByRole('button', { name: 'Add funds', exact: true }).click();
  await page.getByLabel('Amount (USD)').fill('250');
  await page.getByRole('button', { name: 'Save transaction' }).click();
  await expect(page.locator('.balance-value')).toContainText('$13,803.00');
  await page.reload();
  await expect(page.locator('.balance-value')).toContainText('$13,803.00');
  await page.locator('.sidebar').getByRole('button', { name: 'Portfolio', exact: true }).click();
  await page.getByRole('button', { name: 'Tutup posisi XAU/USD' }).click();
  await page.getByRole('button', { name: 'Confirm close position' }).click();
  await expect(page.getByRole('heading', { name: 'Open positions (2)' })).toBeVisible();
  await expect(page.locator('.portfolio-summary .large-number')).toHaveText('$13,803.00');
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Open positions (2)' })).toBeVisible();
  await page.screenshot({ path: 'test-results/portfolio-desktop.png', fullPage: true });
});

test('mobile pages fit the viewport and signals validate direction', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await page.screenshot({ path: 'test-results/overview-mobile.png', fullPage: true });
  for (const label of [
    'Markets',
    'Portfolio',
    'Trading journal',
    'Macro intelligence',
    'Signal studio',
  ]) {
    await page.locator('.mobile-nav').getByRole('button', { name: label, exact: true }).click();
    await expect(page.locator('h1')).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
  }
  await page.getByLabel('Stop loss').fill('3000');
  await page.getByRole('button', { name: 'Save demo signal' }).click();
  await expect(page.getByRole('alert')).toContainText('stop loss < entry < target');
  await page.getByLabel('Stop loss').fill('2700');
  await page.getByRole('button', { name: 'Save demo signal' }).click();
  await expect(page.getByRole('heading', { name: 'Signal history (1)' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Signal history (1)' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('journal filters days and reflection input', async ({ page }) => {
  await page.goto('/#journal');
  await page.getByRole('button', { name: '2026-09-12, 1 trades' }).click();
  await expect(page.locator('.transaction-row')).toHaveCount(4);
  await page.getByLabel('Reflection').fill('Wait for confirmation before entering.');
});

test('PWA includes icons and can reload offline after initial caching', async ({
  page,
  context,
}) => {
  await page.goto('/');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  const manifest = await (await page.request.get('/manifest.webmanifest')).json();
  expect(manifest.short_name).toBe('monetasens');
  for (const icon of manifest.icons) expect((await page.request.get(icon.src)).ok()).toBe(true);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Welcome back, Alex.' })).toBeVisible();
  await expect(page.getByText('Offline mode')).toBeVisible();
  await page.locator('.sidebar').getByRole('button', { name: 'Markets', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Market perspective.' })).toBeVisible();
});

test('overview screenshot and small mobile viewport', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: 'test-results/overview-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 360, height: 800 });
  await expect(page.locator('.mobile-nav')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});
