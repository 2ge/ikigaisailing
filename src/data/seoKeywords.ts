/**
 * THE single source of truth for the SEO keyword plan. Everything derives from here:
 *   - the optimisation matrix (/admin/seo) scores each page against its keyword,
 *   - the portfolio pages (/admin/seo/[set]) list keywords by set, sorted by priority,
 *   - (future) live rank tracking joins on these keyword strings.
 *
 * Each entry is one keyword CLUSTER: a strategic concept, in which strategy `set` it sits,
 * the `page` it targets (optional — some clusters have no dedicated landing page yet), and
 * per-locale { primary keyword, est. monthly volume, difficulty, supporting spokes }.
 * Edit keywords HERE and nowhere else. Source: owner's Drive PDF + docs/SEO-STRATEGY.md.
 * Owner decision 2026-06-13: kitesurf + scuba are GLOBAL-only (Guna Yala rules).
 */
export type Loc = 'en' | 'it' | 'es' | 'fr' | 'sk';
export type SetId = 'san-blas' | 'global';
export interface KwLoc { primary: string; vol?: number; kd?: string; spokes?: string[] }
export interface Keyword {
  id: string;
  set: SetId;
  page?: { collection: 'activities' | 'trips' | 'pages'; slug: string };
  loc: { en: KwLoc } & Partial<Record<Loc, KwLoc>>;
}

export const SETS: Record<SetId, { title: string; tagline: string; window: string }> = {
  'san-blas': { title: 'San Blas / Regional', tagline: 'Freediving · yoga · Janzu · meditation · per-cabin charter. No kitesurf / scuba (Guna Yala rules).', window: 'Active until ~March (San Blas season)' },
  global: { title: 'World Voyage / Long-Term', tagline: 'Pacific crossing · slow travel · world-voyage crew · Janzu training · kitesurf safari.', window: 'Post-Panama transition & ongoing' },
};

export const KEYWORDS: Keyword[] = [
  // ───────────────────────── San Blas ─────────────────────────
  { id: 'cabin-charter', set: 'san-blas', page: { collection: 'pages', slug: 'season-2025-26' }, loc: {
    en: { primary: 'all inclusive catamaran cabin charter san blas', vol: 240, kd: 'Low-Med', spokes: ['shared catamaran charter san blas', 'book a cabin catamaran san blas', 'san blas catamaran cruise per cabin', 'budget friendly catamaran san blas', '10 days catamaran cruise panama'] },
    it: { primary: 'noleggio cabina catamarano all inclusive san blas', vol: 140, kd: 'Low', spokes: ['imbarco alla cabina catamarano san blas', 'catamarano condiviso san blas', 'crociera catamarano panama all inclusive', 'viaggio 10 giorni catamarano san blas', 'vacanza barca a vela san blas cabina'] },
    es: { primary: 'alquiler cabina catamaran todo incluido san blas', vol: 180, kd: 'Low-Med', spokes: ['catamaran compartido san blas', 'reservar cabina catamaran san blas', 'crucero catamaran san blas camarote', 'catamaran economico san blas', 'viaje catamaran 10 dias panama'] },
    fr: { primary: 'location cabine catamaran tout inclus san blas', vol: 120, kd: 'Low-Med', spokes: ['embarquement a la cabine san blas', 'catamaran partage san blas', 'croisiere catamaran panama cabine', 'catamaran pas cher san blas', 'voyage voilier 10 jours guna yala'] },
    sk: { primary: 'all inclusive katamaran prenajom kabiny san blas', vol: 40, kd: 'Extremely Low (0)', spokes: ['zdielany katamaran san blas', 'rezervacia kabiny katamaran san blas', 'plavba katamaranom san blas kajuta', 'lacny katamaran san blas', '10 dnova plavba katamaranom panama'] },
  } },
  { id: 'yoga', set: 'san-blas', page: { collection: 'activities', slug: 'yoga' }, loc: {
    en: { primary: 'yoga sailing retreat panama', vol: 130, kd: 'Low', spokes: ['wellness sailing retreat caribbean', 'catamaran yoga cruise', 'mindful sailing san blas', 'yoga wellness yacht panama'] },
    it: { primary: 'ritiro yoga vela panama', vol: 90, kd: 'Low', spokes: ['vacanza yoga catamarano caraibi', 'benessere in catamarano san blas', 'yoga e vela isole san blas', 'mindfulness vela caraibi'] },
    es: { primary: 'retiro yoga vela panama', vol: 120, kd: 'Low', spokes: ['retiro vela bienestar caribe', 'crucero yoga catamaran', 'navegacion consciente san blas', 'yoga wellness barco panama'] },
    fr: { primary: 'retraite yoga voile panama', vol: 110, kd: 'Low', spokes: ['retraite bien etre voile caraibes', 'croisiere yoga catamaran', 'voile consciente san blas', 'yoga bien etre bateau panama'] },
    sk: { primary: 'yoga a plachtenie retreat panama', vol: 30, kd: 'Extremely Low (0)', spokes: ['wellness plavba karibik retreat', 'katamaran yoga plavba', 'vedome plachtenie san blas', 'yoga wellness lod panama'] },
  } },
  { id: 'yoga-freediving', set: 'san-blas', page: { collection: 'trips', slug: 'ikigai-experience' }, loc: {
    en: { primary: 'yoga freediving catamaran san blas', vol: 110, kd: 'Very Low', spokes: ['san blas yoga freediving retreat', 'mindful catamaran sailing san blas', 'freediving and yoga cruise panama', 'catamaran wellness retreat san blas', 'breathwork and sailing panama'] },
    it: { primary: 'catamarano apnea yoga san blas', vol: 80, kd: 'Extremely Low', spokes: ['ritiro apnea e yoga san blas', 'crociera benessere catamarano panama', 'vacanza vela yoga apnea', 'catamarano benessere isole san blas', 'respirazione e yoga in barca'] },
    es: { primary: 'retiro apnea yoga san blas', vol: 90, kd: 'Low', spokes: ['vacaciones yoga apnea catamaran', 'crucero bienestar catamaran panama', 'yoga y respiracion islas san blas', 'catamaran wellness san blas', 'meditacion y vela guna yala'] },
    fr: { primary: 'retraite yoga apnee catamaran san blas', vol: 100, kd: 'Extremely Low', spokes: ['croisiere bien etre catamaran panama', 'stage apnee et yoga voilier', 'vacances yoga apnee san blas', 'catamaran de developpement personnel caraibes', 'respiration consciente voile san blas'] },
    sk: { primary: 'joga a freediving katamaran san blas', vol: 30, kd: 'Extremely Low (0)', spokes: ['plavba katamaranom joga a freediving', 'wellness dovolenka katamaran san blas', 'kurz freedivingu a jogy na lodi', 'vedomy retreat na katamarane panama', 'dychacie cvicenia a plachtenie karibik'] },
  } },
  { id: 'freediving', set: 'san-blas', page: { collection: 'activities', slug: 'freediving' }, loc: {
    en: { primary: 'freediving catamaran charter san blas', vol: 90, kd: 'Very Low', spokes: ['freediving san blas panama', 'apnea training catamaran caribbean', 'spearfishing charter san blas', 'sailing and freediving retreat', 'line diving san blas panama'] },
    it: { primary: 'catamarano apnea san blas panama', vol: 50, kd: 'Extremely Low', spokes: ['corso apnea caraibi catamarano', 'freediving san blas panama', 'pesca in apnea san blas', 'stage apnea barca a vela', 'respirazione consapevole e apnea mare'] },
    es: { primary: 'catamaran apnea san blas panama', vol: 70, kd: 'Low', spokes: ['curso apnea catamaran caribe', 'freediving san blas panama', 'pesca submarina san blas', 'retiro vela y apnea', 'entrenamiento apnea catamaran panama'] },
    fr: { primary: 'catamaran apnee san blas panama', vol: 60, kd: 'Low', spokes: ['stage apnee catamaran caraibes', 'freediving san blas panama', 'chasse sous marine san blas', 'retraite apnee et yoga voilier', 'entrainement apnee caraibes catamaran'] },
    sk: { primary: 'freediving katamaran san blas panama', vol: 20, kd: 'Extremely Low (0)', spokes: ['freediving san blas panama', 'kurz apnea katamaran karibik', 'spearfishing san blas panama', 'plavba a freediving retreat', 'trening apnea katamaran panama'] },
  } },
  { id: 'janzu', set: 'san-blas', page: { collection: 'activities', slug: 'janzu' }, loc: {
    en: { primary: 'janzu water therapy retreat', vol: 80, kd: 'Extremely Low', spokes: ['janzu therapy panama', 'aquatic bodywork training retreat', 'water healing therapy retreat', 'atma janzu session caribbean', 'regenerative water therapy catamaran'] },
    it: { primary: 'ritiro terapia acqua janzu', vol: 40, kd: 'Extremely Low', spokes: ['terapia janzu panama', 'corso bodywork acquatico ritiro', 'massaggio in acqua janzu caraibi', 'ritiro rigenerazione sistema nervoso mare', 'sessioni atma janzu in catamarano'] },
    es: { primary: 'retiro terapia acuatica janzu', vol: 60, kd: 'Extremely Low', spokes: ['terapia janzu panama', 'curso bodywork acuatico retiro', 'retiro sanacion por agua caribe', 'sesion atma janzu catamaran', 'relajacion acuatica profunda janzu'] },
    fr: { primary: 'retraite therapie aquatique janzu', vol: 50, kd: 'Extremely Low', spokes: ['therapie janzu panama', 'formation janzu developpement personnel', "retraite de guerison par l'eau caraibes", 'session atma janzu catamaran', 'relaxation aquatique profonde janzu'] },
    sk: { primary: 'janzu vodna terapia retreat', vol: 15, kd: 'Extremely Low (0)', spokes: ['janzu terapia panama', 'vodny bodywork kurz retreat', 'liecenie vodou terapia retreat', 'atma janzu terapia karibik', 'regeneracna janzu terapia katamaran'] },
  } },
  { id: 'meditation', set: 'san-blas', page: { collection: 'activities', slug: 'meditation' }, loc: {
    en: { primary: 'meditation retreat san blas islands', spokes: ['mindfulness retreat caribbean', 'silent retreat catamaran', 'breathwork meditation sailing'] },
    it: { primary: 'ritiro meditazione barca a vela', spokes: ['ritiro mindfulness caraibi', 'meditazione e vela san blas'] },
    es: { primary: 'retiro meditacion islas san blas', spokes: ['retiro mindfulness caribe', 'meditacion y vela san blas'] },
    fr: { primary: 'meditation retraite san blas', spokes: ['retraite mindfulness caraibes', 'meditation et voile san blas'] },
    sk: { primary: 'meditacny retreat san blas ostrovy', spokes: ['mindfulness retreat karibik'] },
  } },
  { id: 'trips-index', set: 'san-blas', page: { collection: 'pages', slug: 'trips' }, loc: {
    en: { primary: 'san blas catamaran cabin charter', spokes: ['catamaran boarding options san blas', 'per cabin catamaran panama'] },
    it: { primary: 'catamarano cabina san blas', spokes: ['formule imbarco catamarano san blas'] },
    es: { primary: 'catamaran compartido san blas', spokes: ['opciones embarque catamaran san blas'] },
    fr: { primary: 'catamaran cabine san blas', spokes: ["formules d'embarquement catamaran san blas"] },
    sk: { primary: 'zdielany katamaran san blas', spokes: ['moznosti plavby katamaran san blas'] },
  } },
  { id: '10-days', set: 'san-blas', page: { collection: 'trips', slug: '10-days-on-board' }, loc: {
    en: { primary: '10 days catamaran cruise panama', spokes: ['10 day sailing trip san blas', 'catamaran week san blas'] },
    it: { primary: 'viaggio 10 giorni catamarano san blas', spokes: ['crociera 10 giorni san blas'] },
    es: { primary: 'viaje catamaran 10 dias panama', spokes: ['crucero 10 dias san blas'] },
    fr: { primary: 'voyage voilier 10 jours guna yala', spokes: ['croisiere 10 jours san blas'] },
    sk: { primary: '10 dnova plavba katamaranom panama', spokes: ['10 dnova plavba san blas'] },
  } },

  // ───────────────────────── Global / Long-Term ─────────────────────────
  { id: 'crew', set: 'global', page: { collection: 'trips', slug: 'crew-exchange' }, loc: {
    en: { primary: 'world voyage sailing crew', vol: 210, kd: 'Low-Med', spokes: ['sailing around the world crew opportunity', 'join a catamaran sailing world voyage', 'circumnavigation crew opportunities', 'live and sail around the world', 'paid boarding ocean voyage'] },
    it: { primary: 'giro del mondo vela equipaggio', spokes: ['imbarco giro del mondo catamarano', 'equipaggio circumnavigazione'] },
    es: { primary: 'vuelta al mundo velero tripulacion', spokes: ['embarque vuelta al mundo catamaran', 'tripulacion circunnavegacion'] },
    fr: { primary: 'tour du monde voilier equipage', spokes: ['embarquement tour du monde catamaran', 'equipier circumnavigation'] },
    sk: { primary: 'svetova plavba katamaranom posadka', spokes: ['plavba okolo sveta posadka'] },
  } },
  { id: 'pacific', set: 'global', page: { collection: 'trips', slug: 'pacific-crossing' }, loc: {
    en: { primary: 'pacific crossing sailing opportunities', vol: 150, kd: 'Low', spokes: ['pacific puddle jump crew catamaran', 'sail across the pacific opportunity', 'sailing passage panama to french polynesia', 'ocean crossing crew catamaran 2027', 'blue water sailing training passage'] },
    it: { primary: 'traversata pacifico imbarco equipaggio', vol: 110, kd: 'Low', spokes: ['pacific puddle jump equipaggio', 'traversata pacifico barca a vela 2027', 'imbarco per traversata oceanica pacifico', 'da panama alla polinesia francese vela', 'corso navigazione altura pacifico'] },
    es: { primary: 'cruce pacifico tripulacion velero', vol: 140, kd: 'Low', spokes: ['puddle jump pacifico tripulante', 'travesia pacifico velero 2027', 'embarque velero cruce pacifico', 'panama a polinesia francesa velero', 'curso navegacion altura travesia'] },
    fr: { primary: 'traversee pacifique opportunite equipage', vol: 130, kd: 'Low', spokes: ['puddle jump pacifique equipier', 'traversee pacifique en voilier 2027', 'embarquement voile traversee pacifique', 'panama a polynesie francaise voilier', 'formation voile hauturiere pacifique'] },
    sk: { primary: 'plavba cez tichy ocean posadka', vol: 30, kd: 'Extremely Low (0)', spokes: ['puddle jump pacific katamaran', 'preplavba ticheho oceanu plachetnica', 'plavba panama francuzska polynezia', 'posadka katamaran ocean crossing', 'trening offshore plavby ocean crossing'] },
  } },
  { id: 'slow-travel', set: 'global', page: { collection: 'trips', slug: 'one-month' }, loc: {
    en: { primary: 'slow travel sailing experiences', vol: 120, kd: 'Low', spokes: ['month long sailing trip', 'live on a catamaran remote work', 'digital nomad sailing experience', 'regenerative travel sailing', 'escape the matrix slow sailing'] },
    it: { primary: 'vivere a bordo catamarano un mese', spokes: ['vacanza un mese in barca a vela', 'nomade digitale catamarano'] },
    es: { primary: 'vivir en un catamaran un mes', spokes: ['vacaciones un mes en velero', 'nomada digital catamaran'] },
    fr: { primary: 'vivre sur un catamaran un mois', spokes: ['vacances un mois en voilier', 'nomade digital catamaran'] },
    sk: { primary: 'zit na katamarane mesiac', spokes: ['mesiac na plachetnici', 'digitalny nomad katamaran'] },
  } },
  { id: 'janzu-training', set: 'global', loc: {
    en: { primary: 'aquatic bodywork janzu training retreat', vol: 90, kd: 'Low', spokes: ['aquatic relaxation therapy certification', 'janzu level 1 training retreat', 'water massage therapy course', 'oceanic bodywork retreat', 'janzu aquatic therapy certification'] },
  } },
  { id: 'kite', set: 'global', page: { collection: 'activities', slug: 'kitesurf' }, loc: {
    en: { primary: 'global catamaran kitesurfing safari', vol: 80, kd: 'Low', spokes: ['kite cruise around the world', 'french polynesia kiteboarding yacht charter', 'kite and sail world trip', 'off the grid kitesurfing cruise', 'remote island kitesurfing catamaran'] },
    it: { primary: 'giro del mondo kitesurf catamarano', vol: 70, kd: 'Low', spokes: ['crociera kitesurf polinesia francese', 'safari kitesurf catamarano', 'imbarco kitesurf oceano pacifico', 'vela e kitesurf giro del mondo', 'vacanza kitesurf catamarano 2027'] },
    es: { primary: 'vuelta al mundo kitesurf catamaran', vol: 90, kd: 'Low', spokes: ['safari kitesurf catamaran pacifico', 'embarque kitesurf vuelta al mundo', 'crucero kite polinesia francesa', 'navegacion y kitesurf indonesia', 'kite safari barco oceano pacifico'] },
    fr: { primary: 'tour du monde kitesurf catamaran', vol: 80, kd: 'Low', spokes: ['safari kitesurf catamaran pacifique', 'embarquement kitesurf tour du monde', 'croisiere kite polynesie francaise', 'voilier kitesurf indonesie', 'kite safari bateau tichy ocean'] },
    sk: { primary: 'svetova plavba katamaranom kitesurf', vol: 20, kd: 'Extremely Low (0)', spokes: ['kitesurf plavba okolo sveta', 'francuzska polynezia kitesurfing katamaran', 'kite safari na lodi tichy ocean', 'exoticka kiteboarding plavba', 'kitesurfing na jachte tichomorie'] },
  } },
  { id: 'diving', set: 'global', page: { collection: 'activities', slug: 'diving' }, loc: {
    en: { primary: 'scuba diving sailing catamaran expedition', spokes: ['liveaboard scuba diving catamaran', 'remote reef diving sailing'] },
    it: { primary: 'immersioni subacquee catamarano a vela', spokes: ['diving catamarano crociera'] },
    es: { primary: 'buceo en catamaran de vela', spokes: ['crucero buceo catamaran'] },
    fr: { primary: 'plongée sous-marine catamaran voilier', spokes: ['croisiere plongee catamaran'] },
    sk: { primary: 'potapanie z plachetnice katamaran', spokes: ['potapacska plavba katamaran'] },
  } },
];

// ─── derived helpers (consumers must read from these, never duplicate keywords) ───
export const pathOf = (p: NonNullable<Keyword['page']>) =>
  p.collection === 'pages' ? `/${p.slug}/` : `/${p.collection}/${p.slug}/`;

/** Page → per-locale primary keyword. Drives the optimisation matrix + page scoring. */
export const SEO_TARGETS = KEYWORDS.filter((k) => k.page).map((k) => ({
  path: pathOf(k.page!),
  collection: k.page!.collection,
  slug: k.page!.slug,
  set: k.set,
  kw: Object.fromEntries(Object.entries(k.loc).map(([l, v]) => [l, v!.primary])) as Record<Loc, string>,
}));

const KD_WEIGHT: Record<string, number> = { 'extremely low': 1, 'very low': 0.9, low: 0.72, 'low-med': 0.55, med: 0.4 };
export function winnability(kd = ''): number {
  return KD_WEIGHT[kd.toLowerCase().replace(/\s*\(0\)\s*/, '').trim()] ?? 0.6;
}
export const priority = (v: KwLoc): number => Math.round((v.vol ?? 0) * winnability(v.kd));

/** A set's keywords flattened across locales, scored, sorted by priority desc. */
export function rankedClusters(setId: SetId) {
  return KEYWORDS.filter((k) => k.set === setId)
    .flatMap((k) => Object.entries(k.loc).map(([locale, v]) => ({ id: k.id, locale: locale as Loc, ...v!, score: priority(v!) })))
    .sort((a, b) => b.score - a.score);
}
