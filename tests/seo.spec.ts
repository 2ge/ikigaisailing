import { test, expect } from '@playwright/test';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { builtPages, jsonLd, ldTypes, DIST, contentFiles } from './_helpers';

const pages = builtPages();
const byUrl = (u: string) => pages.find((p) => p.url === u)!;

test.describe('structured data (JSON-LD)', () => {
  test('every page has valid (parseable) JSON-LD', () => {
    const broken: string[] = [];
    for (const p of pages) {
      for (const block of jsonLd(p.html)) {
        if (block.__parseError) broken.push(`${p.url}: ${block.__parseError}`);
      }
    }
    expect(broken).toEqual([]);
  });

  test('trip pages emit TouristTrip + Offer + Breadcrumb', () => {
    const trip = byUrl('/trips/10-days-on-board/');
    const types = [...ldTypes(jsonLd(trip.html))];
    expect(types).toEqual(expect.arrayContaining(['TouristTrip', 'Offer', 'BreadcrumbList']));
  });

  test('blog posts emit Article + Breadcrumb', () => {
    const post = pages.find((p) => /^\/blog\/[^/]+\/$/.test(p.url))!;
    const types = [...ldTypes(jsonLd(post.html))];
    expect(types.some((t) => /Article/.test(t)), `blog ${post.url} types: ${types}`).toBe(true);
    expect(types).toContain('BreadcrumbList');
  });

  test('mechanism: any content defining faq[] surfaces FAQPage JSON-LD', () => {
    // Wherever an FAQ exists in frontmatter, it must render as FAQPage.
    const faqContent = contentFiles().filter(
      (f) => f.locale === 'en' && Array.isArray(f.data.faq) && f.data.faq.length > 0,
    );
    for (const f of faqContent) {
      const url = f.collection === 'trips' ? `/trips/${f.slug}/` : `/${f.slug}/`;
      const page = byUrl(url);
      if (!page) continue;
      const types = [...ldTypes(jsonLd(page.html))];
      expect(types, `${url} should expose FAQPage`).toContain('FAQPage');
    }
  });

  // GEO rule #4 mandates an FAQ on every trip page + the season page. The
  // content for these FAQs has not been authored yet — tracked here so the
  // requirement is visible and this turns green the moment the FAQs land.
  test.fixme('GEO rule #4: every trip + season page ships an FAQ (content TODO)', () => {
    const trips = contentFiles('trips').filter((f) => f.locale === 'en');
    const missing = trips.filter((f) => !Array.isArray(f.data.faq) || f.data.faq.length === 0);
    expect(missing.map((f) => f.rel)).toEqual([]);
  });
});

test.describe('crawl surface', () => {
  test('sitemap exists and lists many URLs', () => {
    const sm = join(DIST, 'sitemap-0.xml');
    expect(existsSync(sm)).toBe(true);
    const locs = (readFileSync(sm, 'utf8').match(/<loc>/g) || []).length;
    expect(locs).toBeGreaterThan(250);
  });

  test('llms.txt exists and references the brand', () => {
    const f = join(DIST, 'llms.txt');
    expect(existsSync(f)).toBe(true);
    expect(readFileSync(f, 'utf8')).toMatch(/Ikigai/i);
  });

  test('robots.txt exists', () => {
    expect(existsSync(join(DIST, 'robots.txt'))).toBe(true);
  });

  test('_redirects maps legacy WordPress URLs to the new structure', () => {
    const r = readFileSync(join(DIST, '_redirects'), 'utf8');
    for (const [from, to] of [
      ['/about-us/', '/about/'],
      ['/the-story/', '/story/'],
      // season page merged into the San Blas hub — every old season URL must land there
      ['/2025-26-season/', '/panama/san-blas/'],
      ['/season-2025-26/', '/panama/san-blas/'],
      ['/it/stagione-2025-26/', '/it/panama/san-blas/'],
      ['/retreat/', '/panama/san-blas/'],
      ['/prodotto/one-month/', '/trips/one-month/'],
    ]) {
      expect(r, `redirect ${from} → ${to}`).toContain(`${from}  ${to}`);
    }
  });
});

test.describe('GEO content rules', () => {
  test('trip + season pages start with a direct-answer lead before any H2', () => {
    // GEO rule 1: a 40–60 word summary before storytelling. Proxy: the first
    // paragraph of body text appears before the first <h2>.
    const targets = pages.filter((p) => /^\/(trips)\/[^/]+\/$/.test(p.url));
    for (const p of targets) {
      const main = p.html.split(/<h2[\s>]/)[0];
      const text = main.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      expect(text.length, `${p.url} should lead with prose before the first H2`).toBeGreaterThan(120);
    }
  });

  test('WhatsApp number is the canonical one everywhere it appears', () => {
    const wrong: string[] = [];
    for (const p of pages) {
      const nums = [...p.html.matchAll(/wa\.me\/(\d+)/g)].map((m) => m[1]);
      for (const n of nums) if (n !== '393313292629') wrong.push(`${p.url}: wa.me/${n}`);
    }
    expect(wrong).toEqual([]);
  });
});
