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
  page?: { collection: 'activities' | 'trips' | 'pages' | 'landings'; slug: string }; // existing page (scored by matrix)
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
    it: { primary: 'yoga in barca a vela', spokes: ['vacanze yoga in barca a vela', 'ritiro yoga in catamarano', 'yoga e vela'] },
    es: { primary: 'yoga en velero', spokes: ['yoga en catamaran', 'retiro yoga navegando'] },
    fr: { primary: 'yoga voilier', spokes: ['yoga catamaran', 'retraite yoga en mer'] },
    sk: { primary: 'joga na lodi', spokes: ['joga plavba', 'wellness plavba'] },
  } },
  { id: 'freediving-ww', set: 'global', page: { collection: 'activities', slug: 'freediving' }, loc: {
    en: { primary: 'freediving liveaboard', vol: 880, kd: 'Medium', spokes: ['freediving liveaboard caribbean', 'freediving retreat', 'freediving sailing trip', 'learn freediving on a boat', 'apnea liveaboard'] },
    it: { primary: 'corso apnea in barca', spokes: ['vacanza apnea', 'apnea barca a vela', 'crociera apnea'] },
    es: { primary: 'freediving en velero', spokes: ['curso apnea catamaran', 'apnea en barco'] },
    fr: { primary: 'freediving voilier', spokes: ['stage apnée voilier', 'croisière apnée'] },
    sk: { primary: 'freediving kurz', spokes: ['freediving plavba', 'freediving slovensko'] },
  } },
  // Janzu — we ALREADY rank for this niche (GSC: janzu #9.9/344, "janzu near me" #10.4,
  // "what is janzu" #10.4, "janzu water therapy" #20.9, IT "terapia janzu" #11.5). Keep it as
  // the primary and stack adjacent terms as spokes — double down on a winning, low-comp asset.
  { id: 'janzu-ww', set: 'global', page: { collection: 'activities', slug: 'janzu' }, loc: {
    en: { primary: 'janzu water therapy retreat', vol: 390, kd: 'Extremely Low', spokes: ['janzu water therapy', 'what is janzu', 'janzu near me', 'water healing retreat', 'aquatic bodywork retreat', 'watsu retreat'] },
    it: { primary: 'terapia janzu', vol: 70, kd: 'Extremely Low', spokes: ['cos\'è il janzu', 'terapia acquatica watsu', 'guarigione con l\'acqua', 'ritiro janzu'] },
    es: { primary: 'terapia janzu', vol: 90, kd: 'Low', spokes: ['que es janzu', 'terapia acuatica watsu', 'sanacion con agua', 'retiro janzu'] },
    fr: { primary: 'thérapie janzu', kd: 'Extremely Low', spokes: ['qu\'est-ce que le janzu', 'watsu thérapie aquatique', 'guérison par l\'eau'] },
    sk: { primary: 'janzu terapia', kd: 'Extremely Low (0)', spokes: ['watsu terapia', 'watsu slovensko', 'liecenie vodou'] },
  } },
  { id: 'meditation-ww', set: 'global', page: { collection: 'activities', slug: 'meditation' }, loc: {
    en: { primary: 'mindfulness sailing retreat', vol: 90, kd: 'Low', spokes: ['breathwork retreat', 'digital detox sailing', 'mindful sailing', 'meditation sailing retreat', 'wellness retreat catamaran'] },
    it: { primary: 'ritiro benessere in barca a vela', spokes: ['ritiro mindfulness in barca', 'digital detox in barca'] },
    es: { primary: 'retiro bienestar en velero', spokes: ['retiro mindfulness en barco', 'desconexion digital velero'] },
    fr: { primary: 'retraite bien-être en voilier', spokes: ['retraite méditation bateau', 'détox digitale voilier'] },
    sk: { primary: 'meditacny pobyt', vol: 70, kd: 'Low', spokes: ['wellness plavba', 'mindfulness na lodi'] },
  } },
  { id: 'sailing-ww', set: 'global', page: { collection: 'activities', slug: 'sailing-training' }, loc: {
    en: { primary: 'learn to sail on a catamaran', vol: 320, kd: 'Low-Med', spokes: ['catamaran sailing course', 'learn to sail caribbean', 'rya yachtmaster catamaran', 'sailing lessons liveaboard'] },
    it: { primary: 'corso di vela in catamarano', spokes: ['imparare a navigare a vela'] }, es: { primary: 'curso de vela en catamaran', spokes: ['aprender a navegar en velero'] },
    fr: { primary: 'cours de voile en catamaran' }, sk: { primary: 'kurz jachtingu na katamarane' },
  } },
  { id: 'snorkel-ww', set: 'global', page: { collection: 'activities', slug: 'snorkelling' }, loc: {
    en: { primary: 'catamaran snorkelling trip', vol: 260, kd: 'Low', spokes: ['snorkelling from a catamaran', 'sailing and snorkelling holiday', 'liveaboard snorkeling'] },
    it: { primary: 'snorkeling in catamarano' }, es: { primary: 'snorkel en catamaran' },
    fr: { primary: 'snorkeling en catamaran' }, sk: { primary: 'snorkelovanie z katamaranu' },
  } },
  { id: 'fitness-ww', set: 'global', page: { collection: 'activities', slug: 'functional-training' }, loc: {
    en: { primary: 'fitness sailing holiday', vol: 70, kd: 'Low', spokes: ['functional training retreat', 'tabata beach workout', 'wellness fitness catamaran'] },
    it: { primary: 'vacanza fitness in barca a vela' }, es: { primary: 'vacaciones fitness en velero' },
    fr: { primary: 'séjour fitness en voilier' }, sk: { primary: 'fitness plavba' },
  } },
  { id: 'cooking-ww', set: 'global', page: { collection: 'activities', slug: 'cooking-class' }, loc: {
    en: { primary: 'cooking class on a sailboat', vol: 50, kd: 'Extremely Low', spokes: ['catamaran cooking experience', 'fresh fish ceviche sailing'] },
    it: { primary: 'corso di cucina in barca' }, es: { primary: 'clase de cocina en velero' },
    fr: { primary: 'cours de cuisine en voilier' }, sk: { primary: 'varenie na lodi' },
  } },
  { id: 'kite-ww', set: 'global', page: { collection: 'activities', slug: 'kitesurf' }, loc: {
    en: { primary: 'kite cruise', vol: 210, kd: 'Low-Med', spokes: ['kitesurf catamaran cruise', 'kite cruise caribbean', 'kitesurfing liveaboard', 'kite safari', 'downwind kite cruise'] },
    it: { primary: 'crociera kitesurf', spokes: ['crociera kite mar rosso', 'kitesurf in catamarano'] },
    es: { primary: 'crucero kitesurf', spokes: ['kitesurf en catamaran', 'kite safari caribe'] },
    fr: { primary: 'croisière kitesurf catamaran', spokes: ['kitesurf en catamaran', 'kite safari grenadines'] },
    sk: { primary: 'kitesurf plavba', spokes: ['kite tabor', 'kitesurf katamaran'] },
  } },
  { id: 'diving-ww', set: 'global', page: { collection: 'activities', slug: 'diving' }, loc: {
    en: { primary: 'scuba diving liveaboard', vol: 1300, kd: 'Medium', spokes: ['scuba liveaboard caribbean', 'dive liveaboard catamaran', 'liveaboard dive boat caribbean', 'reef diving liveaboard', 'diving sailing trip'] },
    it: { primary: 'crociera sub', vol: 480, kd: 'Medium', spokes: ['crociera subacquea', 'immersioni in catamarano'] },
    es: { primary: 'crucero buceo catamaran', spokes: ['buceo en catamaran', 'crucero buceo caribe'] },
    fr: { primary: 'croisière plongée catamaran', spokes: ['plongée en catamaran'] },
    sk: { primary: 'potapacsky pobyt', spokes: ['potapanie z katamaranu'] },
  } },
  { id: 'liveaboard-ww', set: 'global', page: { collection: 'pages', slug: 'liveaboard' }, loc: {
    en: { primary: 'catamaran sailing holiday', vol: 1900, kd: 'Medium', spokes: ['liveaboard sailing experience', 'catamaran holidays caribbean', 'learn to sail catamaran', 'live on a catamaran', 'sailing vacation catamaran'] },
    it: { primary: 'vacanza in catamarano', vol: 1000, kd: 'Medium', spokes: ['crociera catamarano', 'vivere in catamarano'] },
    es: { primary: 'crucero catamaran', vol: 1300, kd: 'Medium', spokes: ['vacaciones en catamaran', 'vivir en un catamaran'] },
    fr: { primary: 'croisière en catamaran', vol: 1600, kd: 'Medium', spokes: ['croisière catamaran caraïbes', 'vacances en catamaran antilles'] },
    sk: { primary: 'dovolenka na katamarane', spokes: ['plavba katamaranom', 'zivot na katamarane'] },
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
  // The San Blas hub + booking page: /panama/san-blas/ (content = pages/season-2025-26.md,
  // de-routed from /season-2025-26/). Merged the former pillar + cabin clusters — one page,
  // one canonical target, no self-cannibalization.
  { id: 'sanblas-hub', set: 'san-blas', page: { collection: 'pages', slug: 'season-2025-26' }, loc: {
    en: { primary: 'san blas catamaran charter', vol: 240, kd: 'Low', spokes: ['all inclusive catamaran cabin charter san blas', 'san blas catamaran cruise', 'per cabin catamaran san blas', 'catamaran tours san blas', 'san blas catamaran rental', 'book a cabin catamaran san blas', 'san blas sailing trip'] },
    it: { primary: 'catamarano san blas', vol: 140, kd: 'Low', spokes: ['noleggio cabina catamarano all inclusive san blas', 'crociera catamarano san blas'] },
    es: { primary: 'catamaran san blas', vol: 180, kd: 'Low-Med', spokes: ['alquiler cabina catamaran todo incluido san blas', 'crucero catamaran san blas'] },
    fr: { primary: 'catamaran san blas', vol: 120, kd: 'Low-Med', spokes: ['location cabine catamaran tout inclus san blas', 'croisière catamaran san blas'] },
    sk: { primary: 'katamaran san blas', vol: 40, kd: 'Extremely Low (0)', spokes: ['all inclusive katamaran prenajom kabiny san blas', 'plavba katamaranom san blas'] },
  } },
  { id: 'sanblas-yoga', set: 'san-blas', page: { collection: 'landings', slug: 'yoga' }, loc: {
    en: { primary: 'yoga retreat san blas panama', vol: 130, kd: 'Low', spokes: ['yoga sailing retreat san blas', 'wellness retreat san blas islands', 'mindful sailing san blas', 'yoga catamaran panama'] },
    it: { primary: 'ritiro yoga vela panama', vol: 90, kd: 'Low' }, es: { primary: 'retiro yoga vela panama', vol: 120, kd: 'Low' },
    fr: { primary: 'retraite yoga voile panama', vol: 110, kd: 'Low' }, sk: { primary: 'yoga a plachtenie retreat panama', vol: 30, kd: 'Extremely Low (0)' },
  } },
  { id: 'sanblas-freediving', set: 'san-blas', page: { collection: 'landings', slug: 'freediving' }, loc: {
    en: { primary: 'freediving catamaran charter san blas', vol: 90, kd: 'Very Low', spokes: ['freediving san blas panama', 'apnea training catamaran caribbean', 'spearfishing charter san blas', 'sailing and freediving retreat', 'line diving san blas panama'] },
    it: { primary: 'catamarano apnea san blas panama', vol: 50, kd: 'Extremely Low' }, es: { primary: 'catamaran apnea san blas panama', vol: 70, kd: 'Low' },
    fr: { primary: 'catamaran apnee san blas panama', vol: 60, kd: 'Low' }, sk: { primary: 'freediving katamaran san blas panama', vol: 20, kd: 'Extremely Low (0)' },
  } },
  { id: 'sanblas-janzu', set: 'san-blas', page: { collection: 'landings', slug: 'janzu' }, loc: {
    en: { primary: 'janzu water therapy retreat san blas', vol: 80, kd: 'Extremely Low', spokes: ['janzu therapy panama', 'aquatic bodywork retreat caribbean', 'water healing therapy retreat', 'atma janzu session caribbean'] },
    it: { primary: 'ritiro terapia acqua janzu panama', vol: 40, kd: 'Extremely Low' }, es: { primary: 'retiro terapia acuatica janzu panama', vol: 60, kd: 'Extremely Low' },
    fr: { primary: 'retraite therapie aquatique janzu panama', vol: 50, kd: 'Extremely Low' }, sk: { primary: 'janzu vodna terapia retreat panama', vol: 15, kd: 'Extremely Low (0)' },
  } },
  { id: 'sanblas-meditation', set: 'san-blas', page: { collection: 'landings', slug: 'meditation' }, loc: {
    en: { primary: 'meditation retreat san blas islands', kd: 'Extremely Low', spokes: ['mindfulness retreat caribbean', 'breathwork meditation sailing panama'] },
    it: { primary: 'ritiro meditazione barca a vela panama' }, es: { primary: 'retiro meditacion islas san blas' },
    fr: { primary: 'meditation retraite san blas' }, sk: { primary: 'meditacny retreat san blas ostrovy' },
  } },
  { id: 'sanblas-snorkel', set: 'san-blas', page: { collection: 'landings', slug: 'snorkelling' }, loc: {
    en: { primary: 'snorkelling san blas panama', vol: 480, kd: 'Low', spokes: ['snorkeling san blas islands', 'best snorkeling san blas', 'san blas snorkel catamaran'] },
    it: { primary: 'snorkeling san blas panama' }, es: { primary: 'snorkel san blas panama', vol: 590, kd: 'Low' },
    fr: { primary: 'snorkeling san blas panama' }, sk: { primary: 'snorkelovanie san blas' },
  } },
  { id: 'sanblas-sailing', set: 'san-blas', page: { collection: 'landings', slug: 'sailing-training' }, loc: {
    en: { primary: 'learn to sail san blas', vol: 70, kd: 'Low', spokes: ['sailing course panama', 'rya sailing san blas', 'catamaran sailing lessons panama'] },
    it: { primary: 'corso di vela san blas' }, es: { primary: 'curso de vela san blas panama' },
    fr: { primary: 'cours de voile san blas' }, sk: { primary: 'kurz jachtingu san blas' },
  } },
  { id: 'sanblas-fitness', set: 'san-blas', page: { collection: 'landings', slug: 'functional-training' }, loc: {
    en: { primary: 'fitness training san blas', kd: 'Extremely Low', spokes: ['tabata training catamaran panama', 'training camp san blas'] },
    it: { primary: 'allenamento funzionale san blas' }, es: { primary: 'entrenamiento funcional san blas' },
    fr: { primary: 'entraînement fonctionnel san blas' }, sk: { primary: 'funkcny trening san blas' },
  } },
  { id: 'sanblas-cooking', set: 'san-blas', page: { collection: 'landings', slug: 'cooking-class' }, loc: {
    en: { primary: 'cooking class san blas', kd: 'Extremely Low', spokes: ['ceviche cooking class panama', 'catamaran cooking san blas'] },
    it: { primary: 'corso di cucina san blas' }, es: { primary: 'clase de cocina san blas' },
    fr: { primary: 'cours de cuisine san blas' }, sk: { primary: 'kurz varenia san blas' },
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
  p.collection === 'landings' ? `/panama/san-blas/${p.slug}/`
  : p.collection === 'pages' ? (p.slug === 'season-2025-26' ? '/panama/san-blas/' : `/${p.slug}/`)
  : `/${p.collection}/${p.slug}/`;

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
