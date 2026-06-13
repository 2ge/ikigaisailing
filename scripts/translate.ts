/**
 * DeepL translation pipeline (Phase 1.5).
 *
 *   npm run translate                  incremental translate EN → es/fr/sk (+ it where missing)
 *   npm run translate -- --check       CI staleness check (exit 1 if translations are stale)
 *   npm run translate -- --push-glossaries   (re)create DeepL glossaries from scripts/glossary.csv
 *   npm run translate -- --force       ignore the 80% usage guard
 *
 * Rules (see CLAUDE.md):
 *  - EN is the source of truth. Human IT files (no `translated: deepl`) are never overwritten.
 *  - Generated files carry `translated: deepl` + `sourceHash`; SK adds `needsReview: true`.
 *  - Never translated: slugs, prices, dates, stripePriceId, image paths, URLs.
 *  - Testimonials: original file keeps its language; `translations` map gets the other locales
 *    (human IT twin bodies are absorbed before DeepL is asked).
 */
import * as deepl from 'deepl-node';
import matter from 'gray-matter';
import { marked } from 'marked';
import TurndownService from 'turndown';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { localizePath } from '../src/i18n/ui';

const ROOT = resolve(import.meta.dirname, '..');
const CONTENT = join(ROOT, 'src', 'content');
const I18N = join(ROOT, 'src', 'i18n');
const GLOSSARY_CSV = join(ROOT, 'scripts', 'glossary.csv');
const GLOSSARY_IDS = join(ROOT, 'scripts', '.glossary-ids.json');

type Loc = 'it' | 'es' | 'fr' | 'sk';
const TARGETS: Loc[] = ['it', 'es', 'fr', 'sk'];
const FORMALITY: Partial<Record<Loc, deepl.Formality>> = {
  it: 'prefer_less',
  es: 'prefer_less',
  fr: 'prefer_less',
  // sk: formality support is limited — default + needsReview for the owner's native pass
};
// frontmatter string fields to translate, per collection
const FM_FIELDS: Record<string, string[]> = {
  pages: ['title', 'description', 'seoTitle', 'metaDescription', 'lead', 'aheadTitle', 'ahead'],
  trips: ['title', 'description', 'seoTitle', 'metaDescription', 'priceNote', 'season'],
  activities: ['title', 'summary', 'seoTitle', 'metaDescription'],
  blog: ['title', 'description'],
};

const CHECK = process.argv.includes('--check');
const FORCE = process.argv.includes('--force');
const PUSH_GLOSSARIES = process.argv.includes('--push-glossaries');

// Read key manually so the script works without dotenv
function envKey(): string {
  if (process.env.DEEPL_API_KEY) return process.env.DEEPL_API_KEY;
  const envFile = join(ROOT, '.env');
  if (existsSync(envFile)) {
    const m = readFileSync(envFile, 'utf8').match(/^DEEPL_API_KEY=(.+)$/m);
    if (m) return m[1].trim();
  }
  throw new Error('DEEPL_API_KEY not found (env or .env)');
}

const td = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced', bulletListMarker: '-' });
td.keep(['iframe']);

const hash = (payload: unknown) =>
  createHash('sha256').update(JSON.stringify(payload)).digest('hex').slice(0, 16);

function payloadOf(collection: string, fm: Record<string, any>, body: string) {
  const fields: Record<string, any> = {};
  for (const f of FM_FIELDS[collection] ?? []) if (fm[f] != null) fields[f] = fm[f];
  if (fm.faq) fields.faq = fm.faq;
  if (fm.facts) fields.facts = fm.facts;
  if (fm.timeline) fields.timeline = fm.timeline;
  if (fm.voyage) fields.voyage = fm.voyage;
  return { fields, body };
}

/**
 * Root-relative internal links get localized: locale prefix + translated section
 * segment (e.g. `/trips/x/` → `/es/imbarchi/x/`). Assets and API routes pass through.
 */
function localizeLinks(md: string, loc: Loc): string {
  return md.replace(/\]\((\/[^)\s]+)\)/g, (full, href: string) => {
    if (/^\/(assets|api|og-|_)/.test(href)) return full;
    return `](${localizePath(href, loc as any)})`;
  });
}

async function main() {
  const translator = new deepl.Translator(envKey());

  // ---- usage guard ----
  const usage = await translator.getUsage();
  const ch = usage.character;
  if (ch) {
    const pct = ch.limit ? (100 * ch.count) / ch.limit : 0;
    console.log(`DeepL usage: ${ch.count.toLocaleString()} / ${ch.limit?.toLocaleString() ?? '∞'} chars (${pct.toFixed(1)}%)`);
    if (pct > 80 && !FORCE && !CHECK) {
      console.error('ABORT: above 80% of DeepL quota. Re-run with --force to override.');
      process.exit(1);
    }
  }

  // ---- glossaries ----
  let glossaryIds: Partial<Record<Loc, string>> = {};
  if (existsSync(GLOSSARY_IDS)) glossaryIds = JSON.parse(readFileSync(GLOSSARY_IDS, 'utf8'));
  if (PUSH_GLOSSARIES || (!CHECK && Object.keys(glossaryIds).length === 0)) {
    const rows = readFileSync(GLOSSARY_CSV, 'utf8').trim().split('\n').slice(1)
      .map((l) => l.split(','));
    for (const loc of TARGETS) {
      const col = { it: 1, es: 2, fr: 3, sk: 4 }[loc];
      const entries: Record<string, string> = {};
      for (const r of rows) {
        const term = r[0]?.trim();
        if (!term) continue;
        entries[term] = r[col]?.trim() || term; // empty target = keep term verbatim
      }
      try {
        // replace existing glossary of the same name
        for (const g of await translator.listGlossaries()) {
          if (g.name === `ikigai-en-${loc}`) await translator.deleteGlossary(g.glossaryId);
        }
        const g = await translator.createGlossary(`ikigai-en-${loc}`, 'en', loc,
          new deepl.GlossaryEntries({ entries }));
        glossaryIds[loc] = g.glossaryId;
        console.log(`glossary en→${loc}: ${g.glossaryId}`);
      } catch (e: any) {
        console.warn(`glossary en→${loc} unsupported/failed (${e.message}) — continuing without`);
        delete glossaryIds[loc];
      }
    }
    writeFileSync(GLOSSARY_IDS, JSON.stringify(glossaryIds, null, 2));
    if (PUSH_GLOSSARIES) return;
  }

  let translatedChars = 0;
  const tText = async (texts: string[], loc: Loc, html = false): Promise<string[]> => {
    if (texts.length === 0) return [];
    translatedChars += texts.join('').length;
    const res = await translator.translateText(texts, 'en', loc as deepl.TargetLanguageCode, {
      formality: FORMALITY[loc],
      glossary: glossaryIds[loc],
      ...(html ? { tagHandling: 'html' as const } : {}),
    });
    return (Array.isArray(res) ? res : [res]).map((r) => r.text);
  };
  const tBody = async (md: string, loc: Loc): Promise<string> => {
    if (!md.trim()) return md;
    const html = await marked.parse(md);
    const [out] = await tText([html], loc, true);
    return localizeLinks(td.turndown(out), loc);
  };

  // Source-aware body translation (testimonials can originate in EN *or* IT).
  // DeepL requires a regional variant when English is the TARGET.
  const DEEPL_TARGET: Record<string, string> = { en: 'en-US', it: 'it', es: 'es', fr: 'fr', sk: 'sk' };
  const tBodyFrom = async (md: string, srcLoc: string, tgtLoc: Loc): Promise<string> => {
    if (!md.trim()) return md;
    const html = await marked.parse(md);
    const res = await translator.translateText(
      [html],
      srcLoc as deepl.SourceLanguageCode,
      DEEPL_TARGET[tgtLoc] as deepl.TargetLanguageCode,
      { formality: FORMALITY[tgtLoc], tagHandling: 'html' as const },
    );
    const out = (Array.isArray(res) ? res[0] : res).text;
    return localizeLinks(td.turndown(out), tgtLoc);
  };

  const stale: string[] = [];
  let written = 0;

  // ---- content collections ----
  for (const collection of Object.keys(FM_FIELDS)) {
    const enDir = join(CONTENT, collection, 'en');
    if (!existsSync(enDir)) continue;
    for (const file of readdirSync(enDir).filter((f) => f.endsWith('.md'))) {
      const src = matter(readFileSync(join(enDir, file), 'utf8'));
      const h = hash(payloadOf(collection, src.data, src.content));

      for (const loc of TARGETS) {
        const targetPath = join(CONTENT, collection, loc, file);
        if (existsSync(targetPath)) {
          const tgt = matter(readFileSync(targetPath, 'utf8'));
          if (loc === 'it' && tgt.data.translated !== 'deepl') continue; // human IT — sacred
          if (tgt.data.sourceHash === h) continue; // up to date
        }
        stale.push(`${collection}/${loc}/${file}`);
        if (CHECK) continue;

        // translate frontmatter fields
        const fields = (FM_FIELDS[collection] ?? []).filter((f) => src.data[f] != null);
        const values = await tText(fields.map((f) => String(src.data[f])), loc);
        const fm: Record<string, any> = { ...src.data, locale: loc };
        fields.forEach((f, i) => (fm[f] = values[i]));
        if (src.data.faq?.length) {
          const qa = await tText(src.data.faq.flatMap((x: any) => [x.q, x.a]), loc);
          fm.faq = src.data.faq.map((_: any, i: number) => ({ q: qa[2 * i], a: qa[2 * i + 1] }));
        }
        if (src.data.facts?.length) {
          const lv = await tText(src.data.facts.flatMap((x: any) => [x.label, x.value]), loc);
          fm.facts = src.data.facts.map((_: any, i: number) => ({ label: lv[2 * i], value: lv[2 * i + 1] }));
        }
        if (src.data.timeline?.length) {
          const tl = await tText(src.data.timeline.flatMap((x: any) => [x.year, x.text]), loc);
          fm.timeline = src.data.timeline.map((_: any, i: number) => ({ year: tl[2 * i], text: tl[2 * i + 1] }));
        }
        if (src.data.voyage?.length) {
          const flat: string[] = [];
          for (const y of src.data.voyage) {
            flat.push(y.title);
            for (const l of y.legs) flat.push(l.when, l.place, l.note);
          }
          const out = await tText(flat, loc);
          let i = 0;
          fm.voyage = src.data.voyage.map((y: any) => ({
            year: y.year,
            title: out[i++],
            legs: y.legs.map((l: any) => ({
              when: out[i++],
              place: out[i++],
              note: out[i++],
              ...(l.now ? { now: true } : {}),
            })),
          }));
        }
        delete fm.oldUrls; // old URLs only exist for en/it live pages
        fm.translated = 'deepl';
        fm.sourceHash = h;
        if (loc === 'sk') fm.needsReview = true;

        const body = await tBody(src.content, loc);
        writeFileSync(targetPath, matter.stringify('\n' + body.trim() + '\n', fm));
        written++;
        console.log(`✓ ${collection}/${loc}/${file}`);
      }
    }
  }

  // ---- testimonials: fill `translations` map on the original file ----
  const tDir = join(CONTENT, 'testimonials');
  for (const origLoc of ['en', 'it'] as const) {
    const dir = join(tDir, origLoc);
    if (!existsSync(dir)) continue;
    for (const file of readdirSync(dir).filter((f) => f.endsWith('.md'))) {
      const src = matter(readFileSync(join(dir, file), 'utf8'));
      if (src.data.translated === 'deepl') continue; // generated twin, skip
      const h = hash(src.content);
      const have = src.data.translations ?? {};
      const wanted = (['en', 'it', 'es', 'fr', 'sk'] as const).filter((l) => l !== origLoc);
      const missing = wanted.filter((l) => !have[l]);
      if (src.data.sourceHash === h && missing.length === 0) continue;
      if (missing.length) stale.push(`testimonials/${origLoc}/${file} (+${missing.join(',')})`);
      if (CHECK) continue;

      for (const l of missing) {
        // A human-authored twin in the target locale wins over machine translation;
        // otherwise DeepL-translate the source review. Works for any origin locale
        // (EN- and IT-origin reviews alike), so no review is left perpetually stale.
        const twin = join(tDir, l, file);
        if (existsSync(twin)) {
          const twinData = matter(readFileSync(twin, 'utf8'));
          if (twinData.data.translated !== 'deepl') {
            have[l] = twinData.content.trim();
            continue;
          }
        }
        have[l] = await tBodyFrom(src.content.trim(), src.data.locale ?? origLoc, l as Loc);
      }
      const fm = { ...src.data, translations: have, sourceHash: h };
      writeFileSync(join(dir, file), matter.stringify('\n' + src.content.trim() + '\n', fm));
      written++;
      console.log(`✓ testimonials/${origLoc}/${file} translations: ${Object.keys(have).join(',')}`);
    }
  }

  // ---- UI strings ----
  const en: Record<string, string> = JSON.parse(readFileSync(join(I18N, 'strings.en.json'), 'utf8'));
  for (const loc of TARGETS) {
    const p = join(I18N, `strings.${loc}.json`);
    const cur: Record<string, string> = existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : {};
    const missing = Object.keys(en).filter((k) => !(k in cur));
    if (missing.length) stale.push(`i18n/strings.${loc}.json (${missing.length} keys)`);
    if (CHECK || missing.length === 0) continue;
    const vals = await tText(missing.map((k) => en[k]), loc);
    missing.forEach((k, i) => (cur[k] = vals[i]));
    writeFileSync(p, JSON.stringify(cur, null, 2) + '\n');
    console.log(`✓ strings.${loc}.json +${missing.length} keys`);
  }

  // ---- report ----
  if (CHECK) {
    if (stale.length) {
      console.error(`STALE (${stale.length}):\n  ` + stale.slice(0, 40).join('\n  '));
      process.exit(1);
    }
    console.log('translations up to date ✓');
    return;
  }
  const after = await translator.getUsage();
  console.log(`\nwritten: ${written} files | sent this run: ~${translatedChars.toLocaleString()} chars`);
  if (after.character)
    console.log(`DeepL total: ${after.character.count.toLocaleString()} / ${after.character.limit?.toLocaleString() ?? '∞'}`);

  // SK review list
  const skNeeds: string[] = [];
  for (const collection of [...Object.keys(FM_FIELDS)]) {
    const d = join(CONTENT, collection, 'sk');
    if (!existsSync(d)) continue;
    for (const f of readdirSync(d)) {
      const fm = matter(readFileSync(join(d, f), 'utf8')).data;
      if (fm.needsReview) skNeeds.push(`${collection}/sk/${f}`);
    }
  }
  if (skNeeds.length) console.log(`\nSK files needing native review: ${skNeeds.length} (see scripts/sk-review-notes.md)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
