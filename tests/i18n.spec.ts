import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, LOCALES, builtPages } from './_helpers';

/**
 * i18n contract: the UI string tables must stay in lock-step across all five
 * locales (CLAUDE.md: "UI strings exist for all 5 locales"), and localized
 * pages must actually be served in their language.
 */

function strings(locale: string): Record<string, string> {
  return JSON.parse(readFileSync(join(ROOT, `src/i18n/strings.${locale}.json`), 'utf8'));
}

const en = strings('en');
const enKeys = Object.keys(en).sort();

for (const loc of LOCALES.filter((l) => l !== 'en')) {
  test.describe(`UI strings: ${loc}`, () => {
    const t = strings(loc);
    const keys = Object.keys(t).sort();

    test('has exactly the same keys as EN (no missing/extra)', () => {
      const missing = enKeys.filter((k) => !(k in t));
      const extra = keys.filter((k) => !(k in en));
      expect({ missing, extra }).toEqual({ missing: [], extra: [] });
    });

    test('no value is left empty', () => {
      const empty = keys.filter((k) => !String(t[k]).trim());
      expect(empty).toEqual([]);
    });

    test('no value is an accidental copy of the EN string for translatable labels', () => {
      // ignore brand/term keys that are intentionally identical across locales
      const intentionallyShared = /site\.name|coords|whatsapp|@|生き甲斐/;
      const copied = enKeys.filter(
        (k) => t[k] === en[k] && en[k].length > 6 && !intentionallyShared.test(k) && !intentionallyShared.test(en[k]),
      );
      // a handful of cognates may legitimately match; keep the bar loose but non-trivial
      expect(copied.length, `too many ${loc} strings identical to EN: ${copied.slice(0, 8)}`).toBeLessThan(12);
    });
  });
}

test.describe('label sets that appear together must stay distinct', () => {
  // Groups of keys rendered side-by-side in the same component. Within a locale
  // each must translate to a DIFFERENT word, or the UI shows duplicates
  // (e.g. SK once rendered both "vocation" and "profession" as "Povolanie").
  const GROUPS: Record<string, string[]> = {
    'Ikigai petals': ['ikigai.passion', 'ikigai.mission', 'ikigai.profession', 'ikigai.vocation'],
    'Ikigai circles': ['ikigai.love', 'ikigai.good', 'ikigai.needs', 'ikigai.paid'],
  };
  for (const loc of LOCALES) {
    const t = strings(loc);
    for (const [name, keys] of Object.entries(GROUPS)) {
      test(`${loc}: ${name} are all distinct`, () => {
        const values = keys.map((k) => t[k]?.trim().toLowerCase());
        const dupes = values.filter((v, i) => values.indexOf(v) !== i);
        expect(dupes, `${loc} ${name} has duplicate label(s): ${dupes}`).toEqual([]);
      });
    }
  }
});

test.describe('localized pages are served in their language', () => {
  const pages = builtPages();
  for (const loc of LOCALES.filter((l) => l !== 'en')) {
    test(`/${loc}/ home is lang=${loc} and prefixes internal links`, () => {
      const home = pages.find((p) => p.url === `/${loc}/`)!;
      expect(home, `/${loc}/ built`).toBeTruthy();
      expect(home.html).toMatch(new RegExp(`<html[^>]*lang="${loc}"`));
      // internal nav links carry the locale prefix (with localized segments)
      expect(home.html).toMatch(new RegExp(`href="/${loc}/[a-z0-9-]+/"`));
    });
  }
});
