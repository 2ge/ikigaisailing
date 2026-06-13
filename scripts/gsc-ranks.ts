/**
 * gsc-ranks — pull live Google Search Console data for ikigaisailing.com and write a
 * committable snapshot (src/data/gsc-ranks.json) that /admin/seo reads for the "rank" column.
 *
 *   npx tsx scripts/gsc-ranks.ts        # last 28 days
 *
 * Auth: service-account key at .secrets/gsc-service-account.json (gitignored). The output JSON
 * holds only query → position/impressions/clicks (no secrets), so it's safe to commit and CI
 * builds read it without needing the key. Re-run to refresh (manually or via cron on the box).
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import crypto from 'node:crypto';

const ROOT = process.cwd();
const KEY = join(ROOT, '.secrets/gsc-service-account.json');
const PROPERTY = 'https://www.ikigaisailing.com/';
const OUT = join(ROOT, 'src/data/gsc-ranks.json');

if (!existsSync(KEY)) { console.error('missing .secrets/gsc-service-account.json'); process.exit(1); }
const sa = JSON.parse(readFileSync(KEY, 'utf8'));

const b64 = (o: unknown) => Buffer.from(typeof o === 'string' ? o : JSON.stringify(o)).toString('base64url');
async function token(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const claim = { iss: sa.client_email, scope: 'https://www.googleapis.com/auth/webmasters.readonly', aud: sa.token_uri, iat: now, exp: now + 3600 };
  const u = `${b64({ alg: 'RS256', typ: 'JWT' })}.${b64(claim)}`;
  const jwt = `${u}.${crypto.sign('RSA-SHA256', Buffer.from(u), sa.private_key).toString('base64url')}`;
  const r = await fetch(sa.token_uri, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt }) });
  const d: any = await r.json();
  if (!d.access_token) throw new Error('auth failed: ' + JSON.stringify(d));
  return d.access_token;
}

const day = (offset: number) => new Date(Date.now() - offset * 86400000).toISOString().slice(0, 10);

async function main() {
  const at = await token();
  const startDate = day(30), endDate = day(2); // GSC data lags ~2 days
  const rows: any[] = [];
  for (let startRow = 0; ; startRow += 5000) {
    const res = await fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(PROPERTY)}/searchAnalytics/query`, {
      method: 'POST', headers: { Authorization: `Bearer ${at}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ startDate, endDate, dimensions: ['query'], rowLimit: 5000, startRow }),
    });
    const d: any = await res.json();
    if (!d.rows?.length) break;
    rows.push(...d.rows);
    if (d.rows.length < 5000) break;
  }
  const queries = rows.map((r) => ({
    query: r.keys[0],
    position: Math.round(r.position * 10) / 10,
    impressions: r.impressions,
    clicks: r.clicks,
  })).sort((a, b) => b.impressions - a.impressions);

  const snapshot = { generatedAt: day(0), property: PROPERTY, range: { startDate, endDate }, count: queries.length, queries };
  writeFileSync(OUT, JSON.stringify(snapshot, null, 1));
  console.log(`✓ ${queries.length} queries → src/data/gsc-ranks.json (${startDate}…${endDate})`);
  const striking = queries.filter((q) => q.position >= 4 && q.position <= 20).slice(0, 10);
  console.log(`striking distance (pos 4–20), top by impressions:`);
  striking.forEach((q) => console.log(`  ${q.position.toFixed(1).padStart(5)}  imp ${String(q.impressions).padStart(4)}  ${q.query}`));
}
main().catch((e) => { console.error(e.message); process.exit(1); });
