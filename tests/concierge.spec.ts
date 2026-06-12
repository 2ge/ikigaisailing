import { test, expect } from '@playwright/test';

/**
 * Concierge widget tests. The /api/concierge SSE response is mocked so the test
 * is deterministic (no live LLM). A separate live smoke check lives in
 * scripts (curl the deployed endpoint) — see README.
 *
 * Run against the static preview: `npm run preview` then `npm run test`.
 */

function sse(chunks: string[]): string {
  const lines = chunks.map((t) => `data: ${JSON.stringify({ type: 'delta', text: t })}\n\n`);
  lines.push(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
  return lines.join('');
}

test('widget opens, streams a reply, renders price + WhatsApp link', async ({ page }) => {
  await page.route('**/api/concierge', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'text/event-stream',
      body: sse([
        'For our ',
        '[10 days on board](https://www.ikigaisailing.com/trips/10-days-on-board/)',
        ' the member contribution is €3000. ',
        '[message us on WhatsApp](https://wa.me/393313292629?text=hi)',
      ]),
    });
  });

  await page.goto('/');
  await page.getByRole('button', { name: /ask the crew/i }).click();
  const input = page.locator('#ikigai-concierge [data-input]');
  await expect(input).toBeVisible();
  await input.fill('How much is 10 days?');
  await input.press('Enter');

  const log = page.locator('#ikigai-concierge [data-log]');
  await expect(log).toContainText('€3000');
  await expect(log.locator('a[href*="wa.me/393313292629"]')).toBeVisible();
  await expect(log.locator('a[href*="/trips/10-days-on-board/"]')).toBeVisible();
});

test('availability question surfaces the WhatsApp handoff', async ({ page }) => {
  await page.route('**/api/concierge', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'text/event-stream',
      body: sse([
        "We don't list live availability — ",
        '[message us on WhatsApp](https://wa.me/393313292629?text=Is%20February%20available)',
      ]),
    });
  });
  await page.goto('/');
  await page.getByRole('button', { name: /ask the crew/i }).click();
  const input = page.locator('#ikigai-concierge [data-input]');
  await input.fill('Is February available?');
  await input.press('Enter');
  await expect(page.locator('#ikigai-concierge a[href*="wa.me/393313292629"]')).toBeVisible();
});

test('widget ships 0 KB until first interaction', async ({ page }) => {
  const conciergeChunks: string[] = [];
  page.on('request', (r) => {
    if (/concierge-widget/.test(r.url())) conciergeChunks.push(r.url());
  });
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  expect(conciergeChunks, 'widget JS must not load before click').toHaveLength(0);
  await page.getByRole('button', { name: /ask the crew/i }).click();
  await expect(page.locator('#ikigai-concierge [data-input]')).toBeVisible();
});
