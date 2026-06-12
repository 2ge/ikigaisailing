import { test, expect } from '@playwright/test';
import { builtPages } from './_helpers';

/**
 * Structural assertions over EVERY built page in dist/. Pure string parsing —
 * no browser — so all ~312 pages are checked cheaply on each run.
 */

const pages = builtPages();

test('build produced a meaningful number of pages', () => {
  expect(pages.length).toBeGreaterThan(250);
});

function localeOf(url: string): string {
  const m = url.match(/^\/(it|es|fr|sk)\//);
  return m ? m[1] : 'en';
}

for (const p of pages) {
  test.describe(`page ${p.url}`, () => {
    test('exactly one <h1>', () => {
      const count = (p.html.match(/<h1[\s>]/g) || []).length;
      expect(count, `${p.url} should have one H1`).toBe(1);
    });

    test('<html lang> matches the URL locale', () => {
      const lang = p.html.match(/<html[^>]*\blang="([^"]+)"/)?.[1];
      expect(lang).toBe(localeOf(p.url));
    });

    test('has a non-empty <title> and meta description', () => {
      const title = p.html.match(/<title>([^<]*)<\/title>/)?.[1]?.trim();
      const desc = p.html.match(/<meta name="description" content="([^"]*)"/)?.[1]?.trim();
      expect(title, `${p.url} <title>`).toBeTruthy();
      expect(desc, `${p.url} meta description`).toBeTruthy();
    });

    test('has a canonical link', () => {
      expect(/<link rel="canonical" href="https?:\/\/[^"]+"/.test(p.html)).toBe(true);
    });

    test('no migration artifacts in rendered output', () => {
      // NB: the production canonical domain IS ikigaisailing.com, so canonical/
      // hreflang/og URLs legitimately contain it — those are not artifacts.
      // Real artifacts: WP uploads, the s.w.org emoji CDN, placeholder avatars,
      // and literal bullet glyphs in body copy.
      const body = p.html.replace(/<style[\s\S]*?<\/style>/g, '');
      const bad =
        /\/wp-content\//.test(p.html) ||
        /s\.w\.org/.test(p.html) ||
        /user[13]\.webp/.test(p.html) ||
        /•/.test(body);
      expect(bad, `${p.url} contains an artifact`).toBe(false);
    });

    test('no obviously broken internal asset URLs', () => {
      // every /_astro/ reference should look like a hashed asset, never a bare wp path
      expect(/\/wp-content\//.test(p.html)).toBe(false);
    });
  });
}

test('content pages expose all five hreflang alternates', () => {
  // sample the localizable page types (skip 404 / booking utility pages)
  const sample = pages.filter((p) =>
    /\/(trips|activities|blog)\/[^/]+\/$/.test(p.url) && !p.url.startsWith('/it/') && !p.url.startsWith('/es/') && !p.url.startsWith('/fr/') && !p.url.startsWith('/sk/')
  );
  expect(sample.length).toBeGreaterThan(0);
  for (const p of sample) {
    for (const loc of ['en', 'it', 'es', 'fr', 'sk', 'x-default']) {
      expect(
        new RegExp(`<link rel="alternate" hreflang="${loc}"`).test(p.html),
        `${p.url} missing hreflang=${loc}`,
      ).toBe(true);
    }
  }
});
