/**
 * imgindex — semantic image search over the site's media library.
 *
 *   npx tsx scripts/imgindex/imgindex.ts index ["src/assets/..."]
 *   npx tsx scripts/imgindex/imgindex.ts query "freediving at sunset" [K]
 *   npx tsx scripts/imgindex/imgindex.ts stats
 *
 * Pipeline (no GPU, Gemini API key only): each image → Gemini 2.5 Flash writes a
 * factual caption + tags → gemini-embedding-001 (768-dim) → pgvector. Queries embed
 * the text and cosine-search. Caption-then-embed because the Gemini API key can't do
 * Vertex multimodal embeddings; swap embed() for Vertex multimodalembedding later
 * (same pgvector half) if visual nuance is ever needed.
 *
 * Secrets come from .dev.vars / .env (gitignored): GEMINI_API_KEY, IMGIDX_DATABASE_URL.
 * DB writes go through psql (no node deps). Run from the repo root.
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, extname } from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

const ROOT = process.cwd();
const DIM = 768;
const CONCURRENCY = 5;
const MIME: Record<string, string> = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.avif': 'image/avif' };

function env(key: string): string {
  for (const f of ['.dev.vars', '.env']) {
    try {
      const m = readFileSync(join(ROOT, f), 'utf8').match(new RegExp(`^${key}=(.+)$`, 'm'));
      if (m) return m[1].trim();
    } catch {}
  }
  if (process.env[key]) return process.env[key]!;
  throw new Error(`${key} not found (.dev.vars/.env/env)`);
}
const KEY = env('GEMINI_API_KEY');
const DB = env('IMGIDX_DATABASE_URL');
const G = 'https://generativelanguage.googleapis.com/v1beta/models';

const sql = (q: string): string =>
  execFileSync('psql', [DB, '-tA', '-v', 'ON_ERROR_STOP=1', '-c', q], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const lit = (s: string) => "'" + String(s).replace(/'/g, "''") + "'";

async function withRetry<T>(fn: () => Promise<T>, label: string, tries = 4): Promise<T> {
  let last: any;
  for (let i = 0; i < tries; i++) {
    try { return await fn(); }
    catch (e) { last = e; await new Promise((r) => setTimeout(r, 500 * 2 ** i)); }
  }
  throw new Error(`${label}: ${last?.message ?? last}`);
}

/** Read image bytes, transcoding AVIF→JPEG via ImageMagick if present (Gemini rejects AVIF). */
function imageInline(abs: string): { data: string; mime: string } {
  const ext = extname(abs).toLowerCase();
  if (ext === '.avif') {
    try {
      const jpg = execFileSync('convert', [abs, 'jpeg:-'], { maxBuffer: 64 * 1024 * 1024 });
      return { data: jpg.toString('base64'), mime: 'image/jpeg' };
    } catch { throw new Error('avif (no `convert` to transcode)'); }
  }
  return { data: readFileSync(abs).toString('base64'), mime: MIME[ext] ?? 'image/jpeg' };
}

async function caption(abs: string): Promise<{ caption: string; tags: string[] }> {
  const { data, mime } = imageInline(abs);
  return withRetry(async () => {
    const res = await fetch(`${G}/gemini-2.5-flash:generateContent?key=${KEY}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [
          { text: 'Describe this photo for a sailing/wellness website image search. Factual, concrete: subjects, activity, setting, time of day, water/sky, mood, colours, notable objects. No marketing fluff.' },
          { inline_data: { mime_type: mime, data } },
        ] }],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: { type: 'object', properties: { caption: { type: 'string' }, tags: { type: 'array', items: { type: 'string' } } }, required: ['caption', 'tags'] },
        },
      }),
    });
    if (!res.ok) throw new Error(`flash ${res.status}: ${(await res.text()).slice(0, 160)}`);
    const d: any = await res.json();
    const parsed = JSON.parse(d.candidates[0].content.parts[0].text);
    return { caption: String(parsed.caption || '').trim(), tags: (parsed.tags || []).map((t: any) => String(t).toLowerCase().trim()).filter(Boolean).slice(0, 12) };
  }, `caption ${relative(ROOT, abs)}`);
}

async function embed(text: string, kind: 'doc' | 'query'): Promise<number[]> {
  return withRetry(async () => {
    const res = await fetch(`${G}/gemini-embedding-001:embedContent?key=${KEY}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: { parts: [{ text }] },
        taskType: kind === 'query' ? 'RETRIEVAL_QUERY' : 'RETRIEVAL_DOCUMENT',
        outputDimensionality: DIM,
      }),
    });
    if (!res.ok) throw new Error(`embed ${res.status}: ${(await res.text()).slice(0, 160)}`);
    const d: any = await res.json();
    return d.embedding.values as number[];
  }, 'embed');
}

function walkImages(dir: string): string[] {
  const out: string[] = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...walkImages(p));
    else if (MIME[extname(e.name).toLowerCase()]) out.push(p);
  }
  return out;
}

async function pool<T>(items: T[], n: number, fn: (x: T, i: number) => Promise<void>) {
  let i = 0;
  await Promise.all(Array.from({ length: n }, async () => { while (i < items.length) { const k = i++; await fn(items[k], k); } }));
}

async function cmdIndex(base: string) {
  const dir = join(ROOT, base);
  if (!existsSync(dir)) throw new Error(`no such dir: ${base}`);
  const files = walkImages(dir);
  const seen = new Map<string, string>();
  for (const row of sql('SELECT path || E\'\\t\' || sha FROM image_index').trim().split('\n').filter(Boolean)) {
    const [p, s] = row.split('\t'); seen.set(p, s);
  }
  let done = 0, skipped = 0, failed = 0;
  console.log(`indexing ${files.length} images from ${base} (${seen.size} already indexed)`);
  await pool(files, CONCURRENCY, async (abs) => {
    const rel = relative(ROOT, abs);
    const sha = createHash('sha256').update(readFileSync(abs)).digest('hex').slice(0, 16);
    if (seen.get(rel) === sha) { skipped++; return; }
    try {
      const { caption: cap, tags } = await caption(abs);
      const vec = await embed(cap + (tags.length ? ' · ' + tags.join(', ') : ''), 'doc');
      const tagArr = tags.length ? 'ARRAY[' + tags.map(lit).join(',') + ']::text[]' : "'{}'::text[]";
      sql(`INSERT INTO image_index (path, source, caption, tags, sha, embedding)
           VALUES (${lit(rel)}, 'assets', ${lit(cap)}, ${tagArr}, ${lit(sha)}, '[${vec.join(',')}]'::vector)
           ON CONFLICT (path) DO UPDATE SET caption=EXCLUDED.caption, tags=EXCLUDED.tags, sha=EXCLUDED.sha, embedding=EXCLUDED.embedding, updated_at=now()`);
      done++;
      if (done % 20 === 0) console.log(`  …${done} embedded, ${skipped} skipped`);
    } catch (e: any) { failed++; console.warn(`  ✗ ${rel}: ${e.message}`); }
  });
  console.log(`done: ${done} embedded, ${skipped} unchanged, ${failed} failed`);
}

async function cmdQuery(q: string, k = 8) {
  const vec = await embed(q, 'query');
  const rows = sql(`SELECT round((1-(embedding <=> '[${vec.join(',')}]'::vector))::numeric, 3) || E'\\t' || path || E'\\t' || left(coalesce(caption,''), 90)
                    FROM image_index WHERE embedding IS NOT NULL ORDER BY embedding <=> '[${vec.join(',')}]'::vector LIMIT ${k}`).trim();
  console.log(`\nquery: "${q}"\n`);
  if (!rows) { console.log('(no results — index is empty)'); return; }
  for (const r of rows.split('\n')) { const [score, path, cap] = r.split('\t'); console.log(`  ${score}  ${path}\n         ${cap}…`); }
}

function cmdStats() {
  const [n, withEmb] = sql('SELECT count(*) || E\'\\t\' || count(embedding) FROM image_index').trim().split('\t');
  console.log(`indexed rows: ${n} · with embedding: ${withEmb}`);
}

const [cmd, ...rest] = process.argv.slice(2);
(async () => {
  if (cmd === 'index') await cmdIndex(rest[0] || 'src/assets');
  else if (cmd === 'query') {
    const lastIsK = rest.length > 1 && /^\d+$/.test(rest.at(-1)!);
    await cmdQuery((lastIsK ? rest.slice(0, -1) : rest).join(' '), lastIsK ? Number(rest.at(-1)) : 8);
  }
  else if (cmd === 'stats') cmdStats();
  else { console.log('usage: imgindex.ts index [dir] | query "text" [K] | stats'); process.exit(1); }
})().catch((e) => { console.error(e.message); process.exit(1); });
