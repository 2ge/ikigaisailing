/**
 * npm run concierge:report — list questions the concierge handed off to WhatsApp.
 * These are exactly the gaps to fill: new FAQ items, knowledge entries, blog posts.
 * Feeds the Phase 8.4 monthly SEO loop.
 *
 * Reads the escalation log from Cloudflare KV via the API (needs CF token with
 * Workers KV read, or the global key). Pass a date prefix to scope:
 *   npm run concierge:report            (last 30 days)
 *   npm run concierge:report 2026-06    (a month)
 */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '..');
const KV_NAMESPACE_ID = '546c18890a5d4e6a92fecf660a801fb4'; // ikigai-concierge

function env(name: string): string | undefined {
  if (process.env[name]) return process.env[name];
  const f = join(ROOT, '.env');
  if (existsSync(f)) {
    const m = readFileSync(f, 'utf8').match(new RegExp(`^${name}=(.+)$`, 'm'));
    if (m) return m[1].trim();
  }
  return undefined;
}

async function main() {
  const acct = env('CLOUDFLARE_ACCOUNT_ID');
  // KV listing/reading needs a token with Workers KV Storage:Read. Prefer a
  // dedicated token; fall back to the account global key if present in env.
  const token = env('CLOUDFLARE_KV_TOKEN') || env('CLOUDFLARE_API_TOKEN');
  if (!acct || !token) {
    console.error('Need CLOUDFLARE_ACCOUNT_ID and a CLOUDFLARE_KV_TOKEN (Workers KV read) in .env');
    process.exit(1);
  }
  const prefixArg = process.argv[2];
  const base = `https://api.cloudflare.com/client/v4/accounts/${acct}/storage/kv/namespaces/${KV_NAMESPACE_ID}`;
  const auth = { Authorization: `Bearer ${token}` };

  const keys: string[] = [];
  let cursor = '';
  do {
    const url = `${base}/keys?prefix=esc:${prefixArg ?? ''}${cursor ? `&cursor=${cursor}` : ''}`;
    const r: any = await fetch(url, { headers: auth }).then((x) => x.json());
    if (!r.success) {
      console.error('KV list failed:', JSON.stringify(r.errors));
      process.exit(1);
    }
    keys.push(...r.result.map((k: any) => k.name));
    cursor = r.result_info?.cursor ?? '';
  } while (cursor);

  if (keys.length === 0) {
    console.log('No hand-offs logged yet.');
    return;
  }

  const rows = await Promise.all(
    keys.map(async (k) => {
      const v: any = await fetch(`${base}/values/${encodeURIComponent(k)}`, { headers: auth }).then((x) => x.json());
      return v;
    }),
  );
  rows.sort((a, b) => (a.at > b.at ? -1 : 1));

  console.log(`\n${rows.length} unanswered question(s) handed off to WhatsApp:\n`);
  for (const r of rows) {
    console.log(`  [${(r.at ?? '').slice(0, 10)}] (${r.locale}) ${r.q}`);
  }
  console.log('\n→ Turn recurring ones into FAQ items, knowledge entries, or blog posts.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
