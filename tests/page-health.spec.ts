import { test, expect } from '@playwright/test';

/**
 * Page-health smoke test — REAL browser, production preview (localhost:4321).
 *
 * Guards the class of bug where a page ships looking broken: a hero/card/gallery
 * image that 404s or fails to decode, or a runtime console error. The static
 * structural specs can't catch a broken IMAGE (the markup is fine, the pixels
 * aren't) — this loads the page, scrolls it to trigger lazy images, and asserts
 * every <img> actually decoded. Runs in CI + the pre-push hook.
 */
const KEY_PAGES = [
  '/',
  '/panama/san-blas/',
  '/panama/san-blas/yoga/',
  '/panama/san-blas/meditation/',
  '/trips/ikigai-experience/',
  '/activities/freediving/',
  '/reviews/',
];

for (const path of KEY_PAGES) {
  test(`page-health: ${path} — no broken images, no console/network errors`, async ({ page }) => {
    const consoleErrors: string[] = [];
    const failed: string[] = [];
    page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
    page.on('response', (r) => {
      if (r.status() >= 400 && r.url().startsWith('http://localhost:4321')) failed.push(`${r.status()} ${r.url()}`);
    });

    await page.goto(path, { waitUntil: 'networkidle' });
    // trigger lazy-loaded images (gallery, below-fold cards) then settle
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForLoadState('networkidle');

    // a broken image is one the browser finished fetching (complete) with zero pixels
    const broken = await page.locator('img').evaluateAll((imgs) =>
      imgs
        .map((i) => i as HTMLImageElement)
        .filter((i) => i.complete && i.naturalWidth === 0)
        .map((i) => i.currentSrc || i.src),
    );

    expect(broken, `broken images on ${path}`).toEqual([]);
    expect(failed, `failed requests on ${path}`).toEqual([]);
    expect(consoleErrors, `console errors on ${path}`).toEqual([]);
  });
}
