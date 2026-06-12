import { test, expect } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { contentFiles, LOCALES, COLLECTIONS, ROOT } from './_helpers';

/**
 * Pure-filesystem invariants over src/content. These guard against the exact
 * regressions fixed in the 2026-06 content sweep: re-introduced WordPress
 * migration artifacts, language leakage, broken frontmatter, stale translations.
 * No browser needed — fast, runs on every push.
 */

const all = contentFiles();
const md = all.filter((f) => f.collection !== 'testimonials' || true); // include all

test.describe('no migration artifacts survive in content', () => {
  const banned: [string, RegExp][] = [
    // legit uses of the domain remain: info@ikigaisailing.com (contact email),
    // the brand-name mention, the Trustpilot review URL. Artifacts are WP
    // uploads and markdown links whose HREF still points at the old site.
    ['wordpress upload hotlink', /ikigaisailing\.com\/wp-content/],
    ['markdown link to old-site path', /\]\(\s*https?:\/\/(www\.)?ikigaisailing\.com\//],
    ['wordpress emoji image', /s\.w\.org/],
    ['broken image-link [!](…)', /\[!\]\(/],
    ['empty-text link [](…)', /\]\(\s*\)|\[\]\(/],
    ['literal bullet character', /•/],
    ['gray-avatar placeholder', /user[13]\.webp/],
  ];

  for (const [label, re] of banned) {
    test(`no ${label}`, () => {
      const hits = all.filter((f) => re.test(f.body) || re.test(JSON.stringify(f.data)));
      expect(hits.map((f) => f.rel), `found "${label}" in these files`).toEqual([]);
    });
  }
});

test.describe('heading hygiene', () => {
  test('no bold-wrapped ATX headings (## **x**)', () => {
    const hits = all.filter((f) => /^#{1,6} +\*\*/m.test(f.body));
    expect(hits.map((f) => f.rel)).toEqual([]);
  });

  test('no stray body H1 (# …) — the hero supplies the only H1', () => {
    const hits = all.filter((f) => f.collection !== 'testimonials' && /^# /m.test(f.body));
    expect(hits.map((f) => f.rel)).toEqual([]);
  });

  test('no foreign-language headings leak into the EN section', () => {
    const foreign = /^#{1,6} +(Cosa|Perch[ée]|Qu[ée]|Pourquoi|Comment|Č[oi]|Pre[čc]o|Ako|Descrizione|Descripci[óo]n|Warum)\b/m;
    const hits = all.filter((f) => f.locale === 'en' && foreign.test(f.body));
    expect(hits.map((f) => f.rel)).toEqual([]);
  });
});

test.describe('frontmatter contract', () => {
  test('locale field matches the directory it lives in', () => {
    const bad = all
      .filter((f) => f.collection !== 'testimonials')
      .filter((f) => f.data.locale !== f.locale);
    expect(bad.map((f) => `${f.rel} (locale=${f.data.locale})`)).toEqual([]);
  });

  test('every page/trip/activity/blog has a title and a summary/description', () => {
    const bad = all
      .filter((f) => ['pages', 'trips', 'activities', 'blog'].includes(f.collection))
      .filter((f) => !f.data.title || !(f.data.description || f.data.summary));
    expect(bad.map((f) => f.rel)).toEqual([]);
  });

  test('no empty `gallery:` key (parses to null and breaks the build)', () => {
    // gray-matter turns an empty `gallery:` into null; a real gallery is an array
    const bad = all.filter((f) => 'gallery' in f.data && f.data.gallery === null);
    expect(bad.map((f) => f.rel)).toEqual([]);
  });

  test('EN frontmatter description/summary is not left in Italian', () => {
    const italianTell = /\b(vivere|giorni a bordo|cos['’]è|perché|della nave|nostra|vacanza ikigai)\b/i;
    const bad = all
      .filter((f) => f.locale === 'en')
      .filter((f) => italianTell.test(String(f.data.description ?? '')) || italianTell.test(String(f.data.summary ?? '')));
    expect(bad.map((f) => f.rel)).toEqual([]);
  });
});

test.describe('locale + translation coverage', () => {
  // group content slugs per collection and assert every non-testimonial slug
  // exists in all 5 locales (slugs are identical across locales by design).
  for (const collection of ['pages', 'trips', 'activities', 'blog'] as const) {
    test(`${collection}: every slug exists in all 5 locales`, () => {
      const byLocale: Record<string, Set<string>> = {};
      for (const f of all.filter((f) => f.collection === collection)) {
        (byLocale[f.locale] ??= new Set()).add(f.slug);
      }
      const enSlugs = [...(byLocale.en ?? [])];
      const missing: string[] = [];
      for (const loc of LOCALES) {
        for (const slug of enSlugs) {
          if (!byLocale[loc]?.has(slug)) missing.push(`${collection}/${loc}/${slug}`);
        }
      }
      expect(missing).toEqual([]);
    });
  }

  test('generated (es/fr/sk) files carry translated:deepl + sourceHash', () => {
    const gen = all.filter(
      (f) => ['es', 'fr', 'sk'].includes(f.locale) && ['pages', 'trips', 'activities', 'blog'].includes(f.collection),
    );
    const bad = gen.filter((f) => f.data.translated !== 'deepl' || !f.data.sourceHash);
    expect(bad.map((f) => f.rel)).toEqual([]);
  });
});

test.describe('translations are not stale', () => {
  test('`npm run translate -- --check` reports nothing stale', () => {
    // The pipeline exits non-zero (and prints the stale list) if any es/fr/sk
    // file's sourceHash no longer matches its EN source payload.
    let ok = true;
    let out = '';
    try {
      out = execFileSync('npm', ['run', '--silent', 'translate', '--', '--check'], {
        cwd: ROOT,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      });
    } catch (e: any) {
      ok = false;
      out = (e.stdout || '') + (e.stderr || '');
    }
    expect(ok, `stale translations:\n${out}`).toBe(true);
  });
});
