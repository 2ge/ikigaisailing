/**
 * On-page SEO scoring (0–100) for a page against its target keyword. Used at build
 * time by /admin/seo (the matrix) and mirrored in the /admin/stats live inspector.
 * Token-coverage based so it rewards the keyword across title/meta/H1/body WITHOUT
 * demanding the full phrase in the (deliberately editorial) H1. Weights sum to 100.
 */
export interface SeoMetrics { title: string; meta: string; h1: string; body: string; }
export interface SeoCheck { label: string; got: number; weight: number; ok: boolean; tip: string; }
export interface SeoResult { score: number; checks: SeoCheck[] }

const STOP = new Set(['a', 'an', 'the', 'in', 'on', 'of', 'and', 'to', 'for', 'with', 'at', 'by', 'or']);
const tok = (s: string): string[] =>
  (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').match(/[a-z0-9]+/g) || [];
const coverage = (text: string, kw: string[]): number => {
  if (!kw.length) return 0;
  const set = new Set(tok(text));
  return kw.filter((k) => set.has(k)).length / kw.length;
};

export function scoreSeo(m: SeoMetrics, keyword: string): SeoResult {
  const kw = tok(keyword).filter((w) => !STOP.has(w));
  const phrase = keyword.toLowerCase().trim();
  const tl = (m.title || '').length, ml = (m.meta || '').length;
  const words = (m.body || '').trim().split(/\s+/).filter(Boolean).length;
  const tCov = (m.title || '').toLowerCase().includes(phrase) ? 1 : coverage(m.title, kw);
  const mCov = (m.meta || '').toLowerCase().includes(phrase) ? 1 : coverage(m.meta, kw);
  const hCov = coverage(m.h1, kw), bCov = coverage(m.body, kw);

  const checks: SeoCheck[] = [
    { label: 'keyword in title', weight: 25, got: Math.round(tCov * 25), ok: tCov >= 0.6, tip: 'work the full phrase into the <title>/seoTitle' },
    { label: 'keyword in meta', weight: 20, got: Math.round(mCov * 20), ok: mCov >= 0.6, tip: 'include the phrase in the meta description' },
    { label: 'keyword in H1', weight: 15, got: Math.round(hCov * 15), ok: hCov >= 0.5, tip: 'echo the main keyword noun in the H1' },
    { label: 'keyword in body', weight: 15, got: Math.round(bCov * 15), ok: bCov >= 0.6, tip: 'use the phrase in the opening paragraph' },
    { label: 'title 15–60 chars', weight: 10, got: tl >= 15 && tl <= 60 ? 10 : tl > 0 && tl <= 65 ? 6 : 0, ok: tl >= 15 && tl <= 60, tip: `title is ${tl} ch` },
    { label: 'meta 120–160 chars', weight: 10, got: ml >= 120 && ml <= 160 ? 10 : ml > 0 ? 5 : 0, ok: ml >= 120 && ml <= 160, tip: `meta is ${ml} ch` },
    { label: 'body ≥ 300 words', weight: 5, got: words >= 300 ? 5 : words >= 120 ? 3 : 0, ok: words >= 300, tip: `body has ${words} words` },
  ];
  return { score: checks.reduce((s, c) => s + c.got, 0), checks };
}
