/**
 * The living SEO strategy plan, rendered at /admin/seo/plan. Single source — update the
 * `status` of each step here as we execute and the page reflects it. status:
 *   'done' = shipped · 'now' = in progress / next up · 'todo' = planned
 */
export type Status = 'done' | 'now' | 'todo';
export interface Step { title: string; status: Status; note?: string }
export interface Phase { id: string; title: string; goal: string; steps: Step[] }

export const PLAN_UPDATED = '2026-06-13';

export const STRATEGY =
  'Hub-and-spoke topic clusters, driven by two engines at once: HARVEST what we already rank for (GSC tells us), and BUILD hubs + spoke articles for the commercial keywords we have zero presence on. Extremely-Low-difficulty keywords need only a mention inside a relevant post — not their own page.';

export const PHASES: Phase[] = [
  {
    id: 'p0', title: 'Phase 0 — Foundation', goal: 'Tools + on-page basics so every later gain is measurable.',
    steps: [
      { title: 'Admin SEO suite: matrix, keyword portfolio, priority sort', status: 'done', note: 'PR #40–45' },
      { title: 'Single source of truth for keywords (seoKeywords.ts)', status: 'done', note: 'PR #45' },
      { title: 'Live GSC rank tracker wired into /admin/seo', status: 'done', note: 'PR #46 · npm run gsc:ranks' },
      { title: 'EN titles + meta on the 13 money pages', status: 'done', note: 'PR #34' },
      { title: 'Localise IT/ES/FR/SK keywords into titles/meta + weave into H1/first-para/body', status: 'now', note: 'biggest immediate matrix jump' },
      { title: 'Reposition kitesurf + scuba to world-voyage (off San Blas)', status: 'todo', note: 'Guna Yala rule' },
    ],
  },
  {
    id: 'p1', title: 'Phase 1 — Harvest striking distance', goal: 'Squeeze rankings we ALREADY have (pos 4–20) → top 3. Fastest ROI.',
    steps: [
      { title: 'janzu (#9.9, 344 impr) → strengthen page + internal-link to /activities/janzu/', status: 'todo', note: 'best single asset; commercial overlap' },
      { title: 'diving reflex / mammalian reflex (#7.6, 189 impr) → expand + link to freediving', status: 'todo' },
      { title: 'onde del mare / tipi di onde marine cluster (IT, #1.5–9.5) → expand, link to season/sailing', status: 'todo' },
    ],
  },
  {
    id: 'p2', title: 'Phase 2 — Build commercial clusters', goal: 'Hub page + spoke articles per cluster, worked top-down by Priority (P1→P3).',
    steps: [
      { title: 'P1 cabin-charter (240/mo): strong hub + 3–5 spokes', status: 'todo' },
      { title: 'P1/P2 hubs + spokes: world-voyage crew (210), pacific crossing (150), yoga retreat (130)', status: 'todo' },
      { title: 'Extremely-Low keywords: fold several into ONE broader article (a mention is enough)', status: 'todo', note: 'your rule — cheap wins' },
    ],
  },
  {
    id: 'p3', title: 'Phase 3 — Geo pages & pillars', goal: 'Region hubs + geo activity pages (near-term money); activity pages go worldwide/evergreen.',
    steps: [
      { title: '/panama/san-blas/ pillar → "san blas catamaran charter", links to geo activity pages + offers', status: 'done' },
      { title: 'Geo activity pages /panama/san-blas/<activity> → regional keywords', status: 'done', note: 'yoga/freediving/janzu/meditation all built (sharp voice)' },
      { title: 'Re-map seoKeywords.ts: activity pages → WORLDWIDE keywords (autocomplete-mined); geo clusters → /panama/san-blas/<x>', status: 'done', note: 'volumes are estimates pending DataForSEO' },
      { title: 'BUILD the /panama/san-blas/<x> geo pages', status: 'done', note: 'pillar + yoga + freediving + janzu + meditation — all 5 live' },
      { title: '/world-voyage/ pillar for the long-term voyage keywords', status: 'todo' },
    ],
  },
  {
    id: 'p4', title: 'Phase 4 — Cadence & monthly loop', goal: 'Sustainable publishing + measure-and-iterate.',
    steps: [
      { title: 'Publish 2–3 spoke articles/week — EN first → npm run translate (5 locales)', status: 'todo', note: '~65 spokes ≈ 2–3 months' },
      { title: 'Weekly: refresh gsc:ranks → strengthen anything that hits pos 5–15', status: 'todo' },
      { title: 'Monthly: GSC striking-distance review (panel already built)', status: 'todo' },
    ],
  },
];

export const SPRINT: string[] = [
  'Phase 0 — finish-optimise the 13 pages (localised keywords) — biggest matrix jump',
  'Harvest janzu + diving-reflex (edit 2 existing pages + internal links) — fastest ranking win',
  'Build /san-blas/ pillar + its first 5 cabin-charter spokes (P1)',
  'Re-pull GSC after ~2 weeks, measure movement, iterate',
];

export const DECISIONS: { q: string; status: Status; answer?: string }[] = [
  { q: 'Page architecture: evergreen ACTIVITY pages target worldwide keywords; GEO pages target regional keywords; re-pointed as the boat moves.', status: 'done', answer: 'DECIDED (owner 2026-06-13): geo URL = /panama/san-blas/<activity> — ALL San Blas pages/offers live under /panama/san-blas/. Activity pages (/activities/<x>) = worldwide "X on a catamaran" terms. Global set = worldwide activity keywords + long-term voyage keywords (not only "sail around the world").' },
  { q: 'Keyword research source for worldwide-activity volumes (catamaran yoga/freediving/…)?', status: 'now', answer: 'No NEW paid access required — owner already has SEMrush (NoxTools) + Google Ads (Keyword Planner, free). Run those on Claude\'s seed list → paste back. OR DataForSEO (~$50) if owner wants Claude to pull + refresh + rank automatically.' },
  { q: 'Publishing pace — how many articles/week should Claude write?', status: 'todo' },
  { q: 'Language priority — EN-first then all 5, or push IT/SK harder?', status: 'todo' },
  { q: 'Spoke depth — many short 600–800w posts vs fewer 1,200–1,500w deep guides?', status: 'todo' },
  { q: 'Merge Priority + GSC into one "do-this-next" ranked worklist on /admin/seo?', status: 'todo' },
];
