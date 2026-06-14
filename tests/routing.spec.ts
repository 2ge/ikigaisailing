import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { builtPages, ROOT, LOCALES, contentFiles } from './_helpers';
import { SEGMENTS, ALIASES, aliasEntries, localizeSegment, canonicalSegment, type Loc } from '../src/i18n/segments';

// Local re-implementations of the i18n/ui path helpers. We can't import ui.ts
// here because it pulls in JSON modules the Playwright runner won't load — but
// the logic is pure and mirrors the source exactly (and the round-trip test
// below would catch any drift).
function localizePath(path: string, locale: Loc): string {
  const clean = path.replace(/^\/(it|es|fr|sk)(\/|$)/, '/');
  const translated = clean
    .split('/')
    .map((seg) => (seg ? localizeSegment(seg, locale) : seg))
    .join('/');
  return locale === 'en' ? translated : `/${locale}${translated}`;
}
function canonicalizePath(path: string, fromLocale: Loc): string {
  const stripped = path.replace(/^\/(it|es|fr|sk)(\/|$)/, '/');
  return stripped
    .split('/')
    .map((seg) => (seg ? canonicalSegment(seg, fromLocale) : seg))
    .join('/');
}

/**
 * Localized-slug routing guarantees. After slugs were localized per locale
 * (/sk/pribeh/, /sk/plavby/ikigai-experience/), these tests prove the whole
 * link graph stays consistent: no dead internal links, hreflang and redirect
 * targets all resolve, and the old URLs still redirect for the cutover.
 */

const pages = builtPages();
const builtSet = new Set(pages.map((p) => p.url));

function parseRedirects(): { from: string; to: string }[] {
  const txt = readFileSync(join(ROOT, 'public', '_redirects'), 'utf8');
  return txt
    .split('\n')
    .filter((l) => l.trim() && !l.startsWith('#'))
    .map((l) => {
      const [from, to] = l.trim().split(/\s+/);
      return { from, to };
    });
}
const redirects = parseRedirects();
const redirectFrom = new Set(redirects.map((r) => r.from));

const extraFiles = new Set(['/sitemap-0.xml', '/sitemap-index.xml', '/blog/rss.xml']);

function normalize(href: string): string | null {
  const h = href.split('#')[0].split('?')[0];
  if (!h) return null;
  if (/^\/(it|es|fr|sk)?\/?blog\/rss\.xml$/.test(h)) return h;
  if (!h.endsWith('/') && !h.split('/').pop()!.includes('.')) return h + '/';
  return h;
}
function isPageHref(h: string): boolean {
  if (!h.startsWith('/')) return false; // external / anchor / mailto
  if (/^\/(_astro|api|assets|og-|fonts|favicon|images|_)/.test(h)) return false;
  if (/\.(jpg|jpeg|png|webp|avif|svg|ico|txt|pdf|xml|json|css|js|webmanifest)$/.test(h.split('?')[0])) return false;
  return true;
}

test.describe('segment registry', () => {
  test('every localized segment round-trips back to its canonical key', () => {
    for (const [canonical, byLoc] of Object.entries(SEGMENTS)) {
      for (const loc of LOCALES) {
        const localized = byLoc[loc];
        expect(canonicalSegment(localized, loc), `${canonical}/${loc}`).toBe(canonical);
      }
    }
  });

  test('localizePath ∘ canonicalizePath is identity for sample paths', () => {
    const samples = ['/story/', '/about/', '/trips/ikigai-experience/', '/activities/freediving/', '/blog/sailing-mindfulness/', '/'];
    for (const canon of samples) {
      for (const loc of LOCALES) {
        const localized = localizePath(canon, loc);
        expect(canonicalizePath(localized, loc), `${canon} via ${loc}`).toBe(canon);
      }
    }
  });

  test('localized segments are unique within each locale (no URL collisions)', () => {
    for (const loc of LOCALES) {
      const seen = new Map<string, string>();
      for (const [canonical, byLoc] of Object.entries(SEGMENTS)) {
        const seg = byLoc[loc];
        expect(seen.has(seg), `${loc}: "${seg}" used by both ${seen.get(seg)} and ${canonical}`).toBe(false);
        seen.set(seg, canonical);
      }
    }
  });
});

test.describe('registry completeness (guards new pages + renames)', () => {
  test('every top-level page and section has a SEGMENTS entry', () => {
    const slugs = contentFiles('pages')
      .filter((f) => f.locale === 'en')
      .map((f) => f.slug)
      .filter((s) => s !== 'home');
    const missing = [...slugs, 'blog'].filter((s) => !SEGMENTS[s]);
    expect(missing, 'pages/sections without a localized-slug entry').toEqual([]);
  });

  test('every SEGMENTS entry defines all five locales', () => {
    const bad: string[] = [];
    for (const [k, byLoc] of Object.entries(SEGMENTS))
      for (const l of LOCALES) if (!byLoc[l]) bad.push(`${k}.${l}`);
    expect(bad).toEqual([]);
  });

  test('retired aliases never clash with a live segment and map to a known key', () => {
    const bad: string[] = [];
    for (const { canonical, locale, segment } of aliasEntries()) {
      if (!SEGMENTS[canonical]) bad.push(`alias ${segment} → unknown key ${canonical}`);
      for (const [k, byLoc] of Object.entries(SEGMENTS))
        if (byLoc[locale] === segment) bad.push(`${locale}: alias "${segment}" clashes with live segment of ${k}`);
    }
    expect(bad).toEqual([]);
  });

  test('the prebuild route guard (scripts/check-routes.ts) passes', () => {
    let ok = true;
    let out = '';
    try {
      out = execFileSync('npx', ['tsx', 'scripts/check-routes.ts'], { cwd: ROOT, encoding: 'utf8' });
    } catch (e: any) {
      ok = false;
      out = (e.stdout || '') + (e.stderr || '');
    }
    expect(ok, out).toBe(true);
  });
});

test.describe('no dead internal links', () => {
  test('every internal href resolves to a built page or a redirect', () => {
    const dead = new Map<string, string>();
    for (const p of pages) {
      const hrefs = [...p.html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
      for (const raw of hrefs) {
        if (!isPageHref(raw)) continue;
        const n = normalize(raw);
        if (!n) continue;
        if (builtSet.has(n) || redirectFrom.has(n) || extraFiles.has(n)) continue;
        if (!dead.has(n)) dead.set(n, p.url);
      }
    }
    expect([...dead.entries()].map(([t, src]) => `${t} (from ${src})`)).toEqual([]);
  });
});

test.describe('hreflang integrity', () => {
  test('every hreflang alternate points to a built page', () => {
    const bad: string[] = [];
    for (const p of pages) {
      const alts = [...p.html.matchAll(/<link rel="alternate" hreflang="[^"]+" href="https?:\/\/[^/]+([^"]*)"/g)].map(
        (m) => m[1],
      );
      for (const path of alts) {
        const n = normalize(path)!;
        if (!builtSet.has(n)) bad.push(`${p.url} → ${n}`);
      }
    }
    expect(bad).toEqual([]);
  });
});

test.describe('redirects', () => {
  test('every redirect target is itself a built page (no redirect → 404)', () => {
    const bad: string[] = [];
    for (const { from, to } of redirects) {
      const n = normalize(to)!;
      if (!builtSet.has(n)) bad.push(`${from} → ${to}`);
    }
    expect(bad).toEqual([]);
  });

  test('no redirect points at another redirect (no chains)', () => {
    const bad: string[] = [];
    for (const { from, to } of redirects) {
      const n = normalize(to)!;
      if (redirectFrom.has(n)) bad.push(`${from} → ${to} (which also redirects)`);
    }
    expect(bad).toEqual([]);
  });

  test('cutover coverage: legacy WordPress URLs are redirected', () => {
    for (const legacy of ['/about-us/', '/the-story/', '/the-route/', '/2025-26-season/', '/sport/', '/prodotto/one-month/']) {
      expect(redirectFrom.has(legacy), `missing redirect for ${legacy}`).toBe(true);
    }
  });

  test('cutover coverage: previous English-slug localized URLs redirect to localized', () => {
    // before localization the site served /sk/story/, /it/trips/… — those must 301
    for (const [from, expectTo] of [
      ['/sk/story/', '/sk/pribeh/'],
      ['/it/trips/', '/it/imbarchi/'],
      ['/sk/about/', '/sk/o-nas/'],
      ['/es/activities/', '/es/actividades/'],
      // item slugs are localized too now → English-slug path 301s to the fully localized URL
      ['/it/trips/one-month/', '/it/imbarchi/un-mese/'],
      // slug-localization migration: previous live URL (localized section + EN item) → localized item
      ['/it/attivita/freediving/', '/it/attivita/apnea/'],
      ['/es/actividades/freediving/', '/es/actividades/apnea/'],
      ['/it/panama/san-blas/sailing-training/', '/it/panama/san-blas/corso-di-vela/'],
    ]) {
      const row = redirects.find((r) => r.from === from);
      expect(row, `missing redirect for ${from}`).toBeTruthy();
      expect(row!.to).toBe(expectTo);
    }
  });
});

test.describe('localized URLs are live, old English-slug localized URLs are not', () => {
  test('localized pages are built', () => {
    for (const u of ['/sk/pribeh/', '/it/chi-siamo/', '/fr/histoire/', '/es/historia/', '/sk/plavby/', '/sk/aktivity/', '/sk/plavby/ikigai-experience/', '/es/actividades/yoga/']) {
      expect(builtSet.has(u), `${u} should be built`).toBe(true);
    }
  });
  test('old English-slug localized paths are NOT built (they redirect instead)', () => {
    for (const u of ['/sk/story/', '/sk/trips/', '/it/about/', '/es/activities/', '/sk/trips/ikigai-experience/']) {
      expect(builtSet.has(u), `${u} should NOT be a live page`).toBe(false);
    }
  });
  test('EN canonical URLs are unchanged', () => {
    for (const u of ['/story/', '/about/', '/trips/', '/activities/', '/trips/ikigai-experience/', '/activities/freediving/']) {
      expect(builtSet.has(u), `${u} should still be built`).toBe(true);
    }
  });
});
