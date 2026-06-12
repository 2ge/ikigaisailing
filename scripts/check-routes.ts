/**
 * Prebuild route guard. Fails the build (exit 1) — so nothing broken can ship —
 * if the localized-slug registry is misconfigured. Catches the cases that would
 * otherwise silently break URLs:
 *   - a new top-level page or section with no SEGMENTS entry (would fall back to
 *     an un-localized English slug);
 *   - two segments resolving to the same URL within a locale (collision);
 *   - a SEGMENTS entry missing a locale;
 *   - a retired ALIAS that clashes with a live segment, repeats, or points at an
 *     unknown canonical key.
 */
import { readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { SEGMENTS, ALIASES, LOCALES, aliasEntries, type Loc } from '../src/i18n/segments';

const ROOT = join(import.meta.dirname, '..');
const PAGES_EN = join(ROOT, 'src', 'content', 'pages', 'en');

const errors: string[] = [];

// 1. every top-level page (pages/en/*.md, except home) must have a SEGMENTS entry.
//    'blog' is a virtual section index with no content file — assert it too.
const pageSlugs = existsSync(PAGES_EN)
  ? readdirSync(PAGES_EN)
      .filter((f) => f.endsWith('.md'))
      .map((f) => f.replace(/\.md$/, ''))
      .filter((s) => s !== 'home')
  : [];
for (const slug of [...pageSlugs, 'blog']) {
  if (!SEGMENTS[slug]) {
    errors.push(
      `Missing SEGMENTS entry for "${slug}". Add it to src/i18n/segments.ts with a localized slug per locale (en/it/es/fr/sk).`,
    );
  }
}

// 2. every SEGMENTS entry must define all locales.
for (const [canonical, byLoc] of Object.entries(SEGMENTS)) {
  for (const l of LOCALES) {
    if (!byLoc[l]) errors.push(`SEGMENTS["${canonical}"] is missing locale "${l}".`);
  }
}

// 3. localized segments + aliases must be unique within each locale (no URL clash).
for (const l of LOCALES) {
  const used = new Map<string, string>(); // segment → owner description
  for (const [canonical, byLoc] of Object.entries(SEGMENTS)) {
    const seg = byLoc[l as Loc];
    if (!seg) continue;
    if (used.has(seg)) errors.push(`${l}: segment "${seg}" claimed by both ${used.get(seg)} and SEGMENTS["${canonical}"].`);
    else used.set(seg, `SEGMENTS["${canonical}"]`);
  }
  for (const { canonical, locale, segment } of aliasEntries()) {
    if (locale !== l) continue;
    if (used.has(segment))
      errors.push(`${l}: ALIAS "${segment}" (for ${canonical}) clashes with ${used.get(segment)}.`);
    else used.set(segment, `ALIAS for ${canonical}`);
  }
}

// 4. each ALIAS canonical must be a real SEGMENTS key.
for (const canonical of Object.keys(ALIASES)) {
  if (!SEGMENTS[canonical]) errors.push(`ALIASES["${canonical}"] has no matching SEGMENTS entry.`);
}

if (errors.length) {
  console.error('\n✗ Route registry check failed:\n' + errors.map((e) => `  - ${e}`).join('\n') + '\n');
  process.exit(1);
}
console.log(`✓ Route registry OK (${Object.keys(SEGMENTS).length} segments, ${aliasEntries().length} aliases).`);
