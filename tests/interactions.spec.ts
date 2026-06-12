import { test, expect } from '@playwright/test';

/**
 * Browser interaction tests against the static preview. These cover the
 * behaviours fixed during this project — testimonial-card navigation, the
 * gallery lightbox, mobile horizontal-scroll, the language switcher — so a
 * future edit can't silently break them.
 */

test.describe('testimonials rail (homepage)', () => {
  test('clicking a card — including its text — opens that review', async ({ page }) => {
    await page.goto('/');
    const card = page.locator('.snap-rail figure').first();
    await card.scrollIntoViewIfNeeded();
    // Real pointer click on the quote text. By design the full-card <a> overlays
    // the text, so a pixel click there hits the link — that's the behaviour we
    // want to prove. (A plain .click() on the text node would fail actionability
    // precisely because the link sits on top, which is the point.)
    const box = await card.locator('.testimonial-clamp').boundingBox();
    expect(box).toBeTruthy();
    await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await expect(page).toHaveURL(/\/reviews\/#.+/);
    const id = new URL(page.url()).hash.slice(1);
    await expect(page.locator(`[id="${id}"]`)).toBeVisible();
  });

  test('each card shows a "read full review" affordance', async ({ page }) => {
    await page.goto('/');
    const first = page.locator('.snap-rail figure').first();
    await expect(first).toContainText(/read full review/i);
  });
});

test.describe('gallery lightbox', () => {
  test('clicking a thumbnail opens the PhotoSwipe lightbox', async ({ page }) => {
    await page.goto('/trips/10-days-on-board/', { waitUntil: 'load' });
    const thumb = page.locator('.pswp-gallery a').first();
    await thumb.scrollIntoViewIfNeeded();
    // PhotoSwipe binds its handler on astro:page-load + a dynamic import; give it a beat
    await expect(thumb).toBeVisible();
    await page.waitForTimeout(500);
    await thumb.click();
    const pswp = page.locator('.pswp');
    await expect(pswp).toBeVisible({ timeout: 8000 });
    // a real image is shown inside the lightbox, with working close chrome
    await expect(page.locator('.pswp img.pswp__img').first()).toBeVisible();
    await expect(page.locator('.pswp__button--close')).toBeVisible();
  });
});

test.describe('no horizontal scroll on mobile', () => {
  const urls = ['/', '/about/', '/trips/10-days-on-board/', '/activities/freediving/', '/story/', '/reviews/'];
  for (const url of urls) {
    test(`375px wide: ${url} does not scroll sideways`, async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto(url);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(overflow, `${url} overflows by ${overflow}px`).toBeLessThanOrEqual(1);
    });
  }
});

test.describe('language switcher', () => {
  test('exposes all five locales with flags', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('button[aria-label="Language"]').first()).toBeVisible();
    // flags are rendered for each locale
    expect(await page.locator('.flag').count()).toBeGreaterThanOrEqual(5);
    // the Italian alternate is reachable from the document
    expect(await page.locator('a[href^="/it/"]').count()).toBeGreaterThan(0);
  });

  test('serves Italian content under /it/', async ({ page }) => {
    await page.goto('/it/');
    await expect(page.locator('html')).toHaveAttribute('lang', 'it');
  });
});

test.describe('designed page modules render', () => {
  test('activity page shows the "what to expect" facts grid', async ({ page }) => {
    await page.goto('/activities/freediving/');
    const dts = page.locator('dl dt.coords');
    expect(await dts.count()).toBeGreaterThanOrEqual(3);
  });

  test('story page shows the milestone timeline', async ({ page }) => {
    await page.goto('/story/');
    const items = page.locator('ol li');
    expect(await items.count()).toBeGreaterThanOrEqual(5);
    await expect(page.getByText('2022', { exact: false }).first()).toBeVisible();
  });
});

test.describe('primary navigation', () => {
  test('header links to the main sections resolve (200)', async ({ page, request }) => {
    await page.goto('/');
    for (const path of ['/trips/', '/activities/', '/about/', '/reviews/', '/blog/', '/contact/']) {
      const res = await request.get(path);
      expect(res.status(), `${path}`).toBe(200);
    }
  });
});
