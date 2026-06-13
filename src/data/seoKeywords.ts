/**
 * THE single source of truth for the SEO keyword plan. Everything derives from here:
 *   - the optimisation matrix (/admin/seo) scores each EXISTING page against its keyword,
 *   - the portfolio pages (/admin/seo/[set]) list keywords by set, sorted by priority,
 *   - GSC live ranks join on these keyword strings.
 *
 * Architecture (owner decision 2026-06-13):
 *   - ACTIVITY pages (/activities/<x>) target WORLDWIDE "X on a catamaran" keywords — evergreen,
 *     valid wherever the boat is.  (set: 'global')
 *   - GEO pages (/panama/san-blas/<x>) target the regional keywords — re-pointed as the boat moves.
 *     Most don't exist yet → `build` holds the URL to create.  (set: 'san-blas')
 *   - Strict keyword split: activity = generic term, geo = term + place name (no cannibalisation).
 *
 * Worldwide primaries grounded in Google Autocomplete (2026-06-13); vol/kd are ESTIMATES pending
 * a volume tool (DataForSEO). Edit keywords HERE and nowhere else.
 */
export type Loc = 'en' | 'it' | 'es' | 'fr' | 'sk';
export type SetId = 'san-blas' | 'global';
export interface KwLoc { primary: string; vol?: number; kd?: string; spokes?: string[] }
export interface Keyword {
  id: string;
  set: SetId;
  page?: { collection: 'activities' | 'trips' | 'pages'; slug: string }; // existing page (scored by matrix)
  build?: string; // planned URL — page not built yet (shown in portfolio, not scored)
  loc: { en: KwLoc } & Partial<Record<Loc, KwLoc>>;
}

export const SETS: Record<SetId, { title: string; tagline: string; window: string }> = {
  'san-blas': { title: 'San Blas / Regional (geo)', tagline: 'Everything under /panama/san-blas/ — freediving, yoga, Janzu, meditation, cabin charter. The season’s money; mostly pages to build.', window: 'Active until ~March + evergreen geo' },
  global: { title: 'Worldwide / Long-Term', tagline: '"X on a catamaran" worldwide — yoga / freediving / kite / dive / wellness — + long-term voyage. Rank anywhere, year-round.', window: 'Evergreen' },
};

export const KEYWORDS: Keyword[] = [
  // ═══════════════ WORLDWIDE activity pages (evergreen) ═══════════════
  { id: 'yoga-ww', set: 'global', page: { collection: 'activities', slug: 'yoga' }, loc: {
    en: { primary: 'yoga sailing retreat', vol: 390, kd: 'Low-Med', spokes: ['catamaran yoga retreat', 'wellness sailing retreat', 'yoga sailing holidays', 'yoga retreat caribbean', 'sailing yoga retreat'] },
    it: { primary: 'ritiro yoga in barca a vela', spokes: ['vacanza yoga in catamarano', 'ritiro benessere in barca'] },
    es: { primary: 'retiro de yoga en velero', spokes: ['vacaciones yoga en catamaran', 'retiro bienestar navegando'] },
    fr: { primary: 'retraite yoga en voilier', spokes: ['vacances yoga en catamaran', 'retraite bien-être en mer'] },
    sk: { primary: 'joga plavba retreat', spokes: ['wellness plavba joga'] },
  } },
  { id: 'freediving-ww', set: 'global', page: { collection: 'activities', slug: 'freediving' }, loc: {
    en: { primary: 'freediving liveaboard', vol: 880, kd: 'Medium', spokes: ['freediving liveaboard caribbean', 'freediving retreat', 'freediving sailing trip', 'learn freediving on a boat', 'apnea liveaboard'] },
    it: { primary: 'crociera freediving', spokes: ['barca a vela e apnea', 'corso apnea in barca'] },
    es: { primary: 'crucero de freediving', spokes: ['velero y apnea', 'curso apnea en barco'] },
    fr: { primary: "croisière apnée", spokes: ['voilier et apnée', "stage apnée en bateau"] },
    sk: { primary: 'freediving plavba', spokes: ['apnea na lodi'] },
  } },
  { id: 'janzu-ww', set: 'global', page: { collection: 'activities', slug: 'janzu' }, loc: {
    en: { primary: 'aquatic bodywork retreat', vol: 110, kd: 'Low', spokes: ['watsu retreat', 'water healing retreat', 'janzu retreat', 'aquatic bodywork training', 'aquatic therapy retreat'] },
    it: { primary: 'ritiro watsu', spokes: ['terapia acquatica ritiro', 'bodywork acquatico'] },
    es: { primary: 'retiro watsu', spokes: ['terapia acuatica retiro', 'bodywork acuatico'] },
    fr: { primary: 'retraite watsu', spokes: ['thérapie aquatique retraite'] },
    sk: { primary: 'watsu retreat', spokes: ['vodna terapia retreat'] },
  } },
  { id: 'meditation-ww', set: 'global', page: { collection: 'activities', slug: 'meditation' }, loc: {
    en: { primary: 'mindfulness sailing retreat', vol: 90, kd: 'Low', spokes: ['breathwork retreat', 'digital detox sailing', 'mindful sailing', 'meditation sailing retreat', 'wellness retreat catamaran'] },
    it: { primary: 'ritiro mindfulness in barca', spokes: ['ritiro respiro e vela', 'digital detox in barca'] },
    es: { primary: 'retiro mindfulness en velero', spokes: ['retiro respiracion navegando', 'desconexion digital velero'] },
    fr: { primary: 'retraite pleine conscience voilier', spokes: ['retraite breathwork bateau'] },
    sk: { primary: 'mindfulness plavba retreat', spokes: ['breathwork na lodi'] },
  } },
  { id: 'kite-ww', set: 'global', page: { collection: 'activities', slug: 'kitesurf' }, loc: {
    en: { primary: 'kite cruise', vol: 210, kd: 'Low-Med', spokes: ['kitesurf catamaran cruise', 'kite cruise caribbean', 'kitesurfing liveaboard', 'kite safari', 'downwind kite cruise'] },
    it: { primary: 'crociera kitesurf', spokes: ['kitesurf in catamarano', 'kite safari caraibi'] },
    es: { primary: 'crucero kitesurf', spokes: ['kitesurf en catamaran', 'kite safari caribe'] },
    fr: { primary: 'croisière kitesurf', spokes: ['kitesurf en catamaran'] },
    sk: { primary: 'kitesurf plavba', spokes: ['kite safari katamaran'] },
  } },
  { id: 'diving-ww', set: 'global', page: { collection: 'activities', slug: 'diving' }, loc: {
    en: { primary: 'scuba diving liveaboard', vol: 1300, kd: 'Medium', spokes: ['scuba liveaboard caribbean', 'dive liveaboard catamaran', 'liveaboard dive boat caribbean', 'reef diving liveaboard', 'diving sailing trip'] },
    it: { primary: 'crociera diving liveaboard', spokes: ['immersioni in catamarano'] },
    es: { primary: 'crucero de buceo liveaboard', spokes: ['buceo en catamaran'] },
    fr: { primary: 'croisière plongée liveaboard', spokes: ['plongée en catamaran'] },
    sk: { primary: 'potapacska plavba katamaran', spokes: ['potapanie z lode'] },
  } },
  { id: 'liveaboard-ww', set: 'global', page: { collection: 'pages', slug: 'liveaboard' }, loc: {
    en: { primary: 'catamaran sailing holiday', vol: 1900, kd: 'Medium', spokes: ['liveaboard sailing experience', 'catamaran holidays caribbean', 'learn to sail catamaran', 'live on a catamaran', 'sailing vacation catamaran'] },
    it: { primary: 'vacanza in catamarano', spokes: ['vivere in catamarano', 'crociera catamarano caraibi'] },
    es: { primary: 'vacaciones en catamaran', spokes: ['vivir en un catamaran', 'crucero catamaran caribe'] },
    fr: { primary: 'vacances en catamaran', spokes: ['vivre sur un catamaran'] },
    sk: { primary: 'dovolenka na katamarane', spokes: ['zivot na katamarane'] },
  } },

  // ═══════════════ Long-term voyage (worldwide, existing trip pages) ═══════════════
  { id: 'crew', set: 'global', page: { collection: 'trips', slug: 'crew-exchange' }, loc: {
    en: { primary: 'world voyage sailing crew', vol: 210, kd: 'Low-Med', spokes: ['sailing around the world crew opportunity', 'join a catamaran sailing world voyage', 'circumnavigation crew opportunities', 'live and sail around the world', 'paid boarding ocean voyage'] },
    it: { primary: 'giro del mondo vela equipaggio' }, es: { primary: 'vuelta al mundo velero tripulacion' },
    fr: { primary: 'tour du monde voilier equipage' }, sk: { primary: 'svetova plavba katamaranom posadka' },
  } },
  { id: 'pacific', set: 'global', page: { collection: 'trips', slug: 'pacific-crossing' }, loc: {
    en: { primary: 'pacific crossing sailing opportunities', vol: 150, kd: 'Low', spokes: ['pacific puddle jump crew catamaran', 'sail across the pacific opportunity', 'sailing passage panama to french polynesia', 'ocean crossing crew catamaran 2027', 'blue water sailing training passage'] },
    it: { primary: 'traversata pacifico imbarco equipaggio', vol: 110, kd: 'Low' }, es: { primary: 'cruce pacifico tripulacion velero', vol: 140, kd: 'Low' },
    fr: { primary: 'traversee pacifique opportunite equipage', vol: 130, kd: 'Low' }, sk: { primary: 'plavba cez tichy ocean posadka', vol: 30, kd: 'Extremely Low (0)' },
  } },
  { id: 'slow-travel', set: 'global', page: { collection: 'trips', slug: 'one-month' }, loc: {
    en: { primary: 'slow travel sailing experiences', vol: 120, kd: 'Low', spokes: ['month long sailing trip', 'live on a catamaran remote work', 'digital nomad sailing experience', 'regenerative travel sailing', 'escape the matrix slow sailing'] },
    it: { primary: 'vivere a bordo catamarano un mese' }, es: { primary: 'vivir en un catamaran un mes' },
    fr: { primary: 'vivre sur un catamaran un mois' }, sk: { primary: 'zit na katamarane mesiac' },
  } },

  // ═══════════════ SAN BLAS — geo cluster under /panama/san-blas/ ═══════════════
  { id: 'sanblas-pillar', set: 'san-blas', build: '/panama/san-blas/', loc: {
    en: { primary: 'san blas catamaran charter', vol: 210, kd: 'Low', spokes: ['san blas catamaran cruise', 'catamaran tours san blas', 'san blas catamaran rental', 'per cabin catamaran san blas', 'san blas sailing trip'] },
    it: { primary: 'catamarano san blas', spokes: ['tour catamarano san blas', 'crociera catamarano san blas'] },
    es: { primary: 'catamaran san blas', spokes: ['tour catamaran san blas', 'crucero catamaran san blas'] },
    fr: { primary: 'catamaran san blas', spokes: ['croisière catamaran san blas'] },
    sk: { primary: 'katamaran san blas', spokes: ['plavba katamaranom san blas'] },
  } },
  { id: 'sanblas-cabin', set: 'san-blas', page: { collection: 'pages', slug: 'season-2025-26' }, loc: {
    en: { primary: 'all inclusive catamaran cabin charter san blas', vol: 240, kd: 'Low-Med', spokes: ['shared catamaran charter san blas', 'book a cabin catamaran san blas', 'san blas catamaran cruise per cabin', 'budget friendly catamaran san blas', '10 days catamaran cruise panama'] },
    it: { primary: 'noleggio cabina catamarano all inclusive san blas', vol: 140, kd: 'Low' }, es: { primary: 'alquiler cabina catamaran todo incluido san blas', vol: 180, kd: 'Low-Med' },
    fr: { primary: 'location cabine catamaran tout inclus san blas', vol: 120, kd: 'Low-Med' }, sk: { primary: 'all inclusive katamaran prenajom kabiny san blas', vol: 40, kd: 'Extremely Low (0)' },
  } },
  { id: 'sanblas-yoga', set: 'san-blas', build: '/panama/san-blas/yoga/', loc: {
    en: { primary: 'yoga retreat san blas panama', vol: 130, kd: 'Low', spokes: ['yoga sailing retreat san blas', 'wellness retreat san blas islands', 'mindful sailing san blas', 'yoga catamaran panama'] },
    it: { primary: 'ritiro yoga vela panama', vol: 90, kd: 'Low' }, es: { primary: 'retiro yoga vela panama', vol: 120, kd: 'Low' },
    fr: { primary: 'retraite yoga voile panama', vol: 110, kd: 'Low' }, sk: { primary: 'yoga a plachtenie retreat panama', vol: 30, kd: 'Extremely Low (0)' },
  } },
  { id: 'sanblas-freediving', set: 'san-blas', build: '/panama/san-blas/freediving/', loc: {
    en: { primary: 'freediving catamaran charter san blas', vol: 90, kd: 'Very Low', spokes: ['freediving san blas panama', 'apnea training catamaran caribbean', 'spearfishing charter san blas', 'sailing and freediving retreat', 'line diving san blas panama'] },
    it: { primary: 'catamarano apnea san blas panama', vol: 50, kd: 'Extremely Low' }, es: { primary: 'catamaran apnea san blas panama', vol: 70, kd: 'Low' },
    fr: { primary: 'catamaran apnee san blas panama', vol: 60, kd: 'Low' }, sk: { primary: 'freediving katamaran san blas panama', vol: 20, kd: 'Extremely Low (0)' },
  } },
  { id: 'sanblas-janzu', set: 'san-blas', build: '/panama/san-blas/janzu/', loc: {
    en: { primary: 'janzu water therapy retreat san blas', vol: 80, kd: 'Extremely Low', spokes: ['janzu therapy panama', 'aquatic bodywork retreat caribbean', 'water healing therapy retreat', 'atma janzu session caribbean'] },
    it: { primary: 'ritiro terapia acqua janzu panama', vol: 40, kd: 'Extremely Low' }, es: { primary: 'retiro terapia acuatica janzu panama', vol: 60, kd: 'Extremely Low' },
    fr: { primary: 'retraite therapie aquatique janzu panama', vol: 50, kd: 'Extremely Low' }, sk: { primary: 'janzu vodna terapia retreat panama', vol: 15, kd: 'Extremely Low (0)' },
  } },
  { id: 'sanblas-meditation', set: 'san-blas', build: '/panama/san-blas/meditation/', loc: {
    en: { primary: 'meditation retreat san blas islands', kd: 'Extremely Low', spokes: ['mindfulness retreat caribbean', 'breathwork meditation sailing panama'] },
    it: { primary: 'ritiro meditazione barca a vela panama' }, es: { primary: 'retiro meditacion islas san blas' },
    fr: { primary: 'meditation retraite san blas' }, sk: { primary: 'meditacny retreat san blas ostrovy' },
  } },
  { id: 'sanblas-ikigai-exp', set: 'san-blas', page: { collection: 'trips', slug: 'ikigai-experience' }, loc: {
    en: { primary: 'yoga freediving catamaran san blas', vol: 110, kd: 'Very Low', spokes: ['san blas yoga freediving retreat', 'mindful catamaran sailing san blas', 'freediving and yoga cruise panama', 'catamaran wellness retreat san blas', 'breathwork and sailing panama'] },
    it: { primary: 'catamarano apnea yoga san blas', vol: 80, kd: 'Extremely Low' }, es: { primary: 'retiro apnea yoga san blas', vol: 90, kd: 'Low' },
    fr: { primary: 'retraite yoga apnee catamaran san blas', vol: 100, kd: 'Extremely Low' }, sk: { primary: 'joga a freediving katamaran san blas', vol: 30, kd: 'Extremely Low (0)' },
  } },
  { id: 'sanblas-trips', set: 'san-blas', page: { collection: 'pages', slug: 'trips' }, loc: {
    en: { primary: 'san blas catamaran cabin charter', spokes: ['catamaran boarding options san blas', 'per cabin catamaran panama'] },
    it: { primary: 'catamarano cabina san blas' }, es: { primary: 'catamaran compartido san blas' },
    fr: { primary: 'catamaran cabine san blas' }, sk: { primary: 'zdielany katamaran san blas' },
  } },
  { id: 'sanblas-10days', set: 'san-blas', page: { collection: 'trips', slug: '10-days-on-board' }, loc: {
    en: { primary: '10 days catamaran cruise panama', spokes: ['10 day sailing trip san blas', 'catamaran week san blas'] },
    it: { primary: 'viaggio 10 giorni catamarano san blas' }, es: { primary: 'viaje catamaran 10 dias panama' },
    fr: { primary: 'voyage voilier 10 jours guna yala' }, sk: { primary: '10 dnova plavba katamaranom panama' },
  } },
];

// ─── derived helpers — consumers read from these, never duplicate keywords ───
export const pathOf = (p: NonNullable<Keyword['page']>) =>
  p.collection === 'pages' ? `/${p.slug}/` : `/${p.collection}/${p.slug}/`;

/** Page → per-locale primary keyword. Drives the matrix + page scoring (existing pages only). */
export const SEO_TARGETS = KEYWORDS.filter((k) => k.page).map((k) => ({
  path: pathOf(k.page!),
  collection: k.page!.collection,
  slug: k.page!.slug,
  set: k.set,
  kw: Object.fromEntries(Object.entries(k.loc).map(([l, v]) => [l, v!.primary])) as Record<Loc, string>,
}));

const KD_WEIGHT: Record<string, number> = { 'extremely low': 1, 'very low': 0.9, low: 0.72, 'low-med': 0.55, medium: 0.4, med: 0.4 };
export function winnability(kd = ''): number {
  return KD_WEIGHT[kd.toLowerCase().replace(/\s*\(0\)\s*/, '').trim()] ?? 0.6;
}
export const priority = (v: KwLoc): number => Math.round((v.vol ?? 0) * winnability(v.kd));

/** A set's keywords flattened across locales, scored, sorted by priority desc. */
export function rankedClusters(setId: SetId) {
  return KEYWORDS.filter((k) => k.set === setId)
    .flatMap((k) => Object.entries(k.loc).map(([locale, v]) => ({ id: k.id, locale: locale as Loc, build: k.build, ...v!, score: priority(v!) })))
    .sort((a, b) => b.score - a.score);
}
