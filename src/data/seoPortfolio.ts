/**
 * Full multilingual keyword portfolio, split into the two strategic sets from the owner's
 * Drive PDF "Multilingual Direct-Booking SEO Strategy":
 *   - 'san-blas' = San Blas / regional focus (freediving, yoga, Janzu, cabin charter)
 *   - 'global'   = world-voyage / long-term focus (pacific crossing, slow travel, crew, kite)
 * Each set lists, per locale, the primary targets (+ est. volume/KD) and their 5 supporting
 * spokes (blog/article keywords). Rendered at /admin/seo/[set]. Owner decision 2026-06-13:
 * kitesurf + scuba live ONLY in the global set, never San Blas (Guna Yala rules).
 */
export type Loc = 'en' | 'it' | 'es' | 'fr' | 'sk';
export interface Cluster { primary: string; vol?: number; kd?: string; spokes: string[] }
export interface LocaleBlock { locale: Loc; label: string; clusters: Cluster[] }
export interface PortfolioSet { id: 'san-blas' | 'global'; title: string; tagline: string; window: string; locales: LocaleBlock[] }

const L: Record<Loc, string> = { en: 'English', it: 'Italiano', es: 'Español', fr: 'Français', sk: 'Slovenčina' };

export const PORTFOLIO: PortfolioSet[] = [
  {
    id: 'san-blas',
    title: 'San Blas / Regional',
    tagline: 'Freediving · yoga · Janzu · meditation · per-cabin charter. No kitesurf / scuba (Guna Yala rules).',
    window: 'Active until ~March (San Blas season)',
    locales: [
      { locale: 'en', label: L.en, clusters: [
        { primary: 'all inclusive catamaran cabin charter san blas', vol: 240, kd: 'Low-Med', spokes: ['shared catamaran charter san blas', 'book a cabin catamaran san blas', 'san blas catamaran cruise per cabin', 'budget friendly catamaran san blas', '10 days catamaran cruise panama'] },
        { primary: 'yoga sailing retreat panama', vol: 130, kd: 'Low', spokes: ['wellness sailing retreat caribbean', 'catamaran yoga cruise', 'mindful sailing san blas', 'meditation retreat san blas islands', 'yoga wellness yacht panama'] },
        { primary: 'yoga freediving catamaran san blas', vol: 110, kd: 'Very Low', spokes: ['san blas yoga freediving retreat', 'mindful catamaran sailing san blas', 'freediving and yoga cruise panama', 'catamaran wellness retreat san blas', 'breathwork and sailing panama'] },
        { primary: 'freediving catamaran charter san blas', vol: 90, kd: 'Very Low', spokes: ['freediving san blas panama', 'apnea training catamaran caribbean', 'spearfishing charter san blas', 'sailing and freediving retreat', 'line diving san blas panama'] },
        { primary: 'janzu water therapy retreat', vol: 80, kd: 'Extremely Low', spokes: ['janzu therapy panama', 'aquatic bodywork training retreat', 'water healing therapy retreat', 'atma janzu session caribbean', 'regenerative water therapy catamaran'] },
      ] },
      { locale: 'it', label: L.it, clusters: [
        { primary: 'noleggio cabina catamarano all inclusive san blas', vol: 140, kd: 'Low', spokes: ['imbarco alla cabina catamarano san blas', 'catamarano condiviso san blas', 'crociera catamarano panama all inclusive', 'viaggio 10 giorni catamarano san blas', 'vacanza barca a vela san blas cabina'] },
        { primary: 'ritiro yoga vela panama', vol: 90, kd: 'Low', spokes: ['vacanza yoga catamarano caraibi', 'ritiro meditazione barca a vela', 'benessere in catamarano san blas', 'yoga e vela isole san blas', 'mindfulness vela caraibi'] },
        { primary: 'catamarano apnea yoga san blas', vol: 80, kd: 'Extremely Low', spokes: ['ritiro apnea e yoga san blas', 'crociera benessere catamarano panama', 'vacanza vela yoga apnea', 'catamarano benessere isole san blas', 'respirazione e yoga in barca'] },
        { primary: 'catamarano apnea san blas panama', vol: 50, kd: 'Extremely Low', spokes: ['corso apnea caraibi catamarano', 'freediving san blas panama', 'pesca in apnea san blas', 'stage apnea barca a vela', 'respirazione consapevole e apnea mare'] },
        { primary: 'ritiro terapia acqua janzu', vol: 40, kd: 'Extremely Low', spokes: ['terapia janzu panama', 'corso bodywork acquatico ritiro', 'massaggio in acqua janzu caraibi', 'ritiro rigenerazione sistema nervoso mare', 'sessioni atma janzu in catamarano'] },
      ] },
      { locale: 'es', label: L.es, clusters: [
        { primary: 'alquiler cabina catamaran todo incluido san blas', vol: 180, kd: 'Low-Med', spokes: ['catamaran compartido san blas', 'reservar cabina catamaran san blas', 'crucero catamaran san blas camarote', 'catamaran economico san blas', 'viaje catamaran 10 dias panama'] },
        { primary: 'retiro yoga vela panama', vol: 120, kd: 'Low', spokes: ['retiro vela bienestar caribe', 'crucero yoga catamaran', 'navegacion consciente san blas', 'retiro meditacion islas san blas', 'yoga wellness barco panama'] },
        { primary: 'retiro apnea yoga san blas', vol: 90, kd: 'Low', spokes: ['vacaciones yoga apnea catamaran', 'crucero bienestar catamaran panama', 'yoga y respiracion islas san blas', 'catamaran wellness san blas', 'meditacion y vela guna yala'] },
        { primary: 'catamaran apnea san blas panama', vol: 70, kd: 'Low', spokes: ['curso apnea catamaran caribe', 'freediving san blas panama', 'pesca submarina san blas', 'retiro vela y apnea', 'entrenamiento apnea catamaran panama'] },
        { primary: 'retiro terapia acuatica janzu', vol: 60, kd: 'Extremely Low', spokes: ['terapia janzu panama', 'curso bodywork acuatico retiro', 'retiro sanacion por agua caribe', 'sesion atma janzu catamaran', 'relajacion acuatica profunda janzu'] },
      ] },
      { locale: 'fr', label: L.fr, clusters: [
        { primary: 'location cabine catamaran tout inclus san blas', vol: 120, kd: 'Low-Med', spokes: ['embarquement a la cabine san blas', 'catamaran partage san blas', 'croisiere catamaran panama cabine', 'catamaran pas cher san blas', 'voyage voilier 10 jours guna yala'] },
        { primary: 'retraite yoga voile panama', vol: 110, kd: 'Low', spokes: ['retraite bien etre voile caraibes', 'croisiere yoga catamaran', 'voile consciente san blas', 'meditation retraite san blas', 'yoga bien etre bateau panama'] },
        { primary: 'retraite yoga apnee catamaran san blas', vol: 100, kd: 'Extremely Low', spokes: ['croisiere bien etre catamaran panama', 'stage apnee et yoga voilier', 'vacances yoga apnee san blas', 'catamaran de developpement personnel caraibes', 'respiration consciente voile san blas'] },
        { primary: 'catamaran apnee san blas panama', vol: 60, kd: 'Low', spokes: ['stage apnee catamaran caraibes', 'freediving san blas panama', 'chasse sous marine san blas', 'retraite apnee et yoga voilier', 'entrainement apnee caraibes catamaran'] },
        { primary: 'retraite therapie aquatique janzu', vol: 50, kd: 'Extremely Low', spokes: ['therapie janzu panama', 'formation janzu developpement personnel', "retraite de guerison par l'eau caraibes", 'session atma janzu catamaran', 'relaxation aquatique profonde janzu'] },
      ] },
      { locale: 'sk', label: L.sk, clusters: [
        { primary: 'all inclusive katamaran prenajom kabiny san blas', vol: 40, kd: 'Extremely Low (0)', spokes: ['zdielany katamaran san blas', 'rezervacia kabiny katamaran san blas', 'plavba katamaranom san blas kajuta', 'lacny katamaran san blas', '10 dnova plavba katamaranom panama'] },
        { primary: 'joga a freediving katamaran san blas', vol: 30, kd: 'Extremely Low (0)', spokes: ['plavba katamaranom joga a freediving', 'wellness dovolenka katamaran san blas', 'kurz freedivingu a jogy na lodi', 'vedomy retreat na katamarane panama', 'dychacie cvicenia a plachtenie karibik'] },
        { primary: 'yoga a plachtenie retreat panama', vol: 30, kd: 'Extremely Low (0)', spokes: ['wellness plavba karibik retreat', 'katamaran yoga plavba', 'vedome plachtenie san blas', 'meditacny retreat san blas ostrovy', 'yoga wellness lod panama'] },
        { primary: 'freediving katamaran san blas panama', vol: 20, kd: 'Extremely Low (0)', spokes: ['freediving san blas panama', 'kurz apnea katamaran karibik', 'spearfishing san blas panama', 'plavba a freediving retreat', 'trening apnea katamaran panama'] },
        { primary: 'janzu vodna terapia retreat', vol: 15, kd: 'Extremely Low (0)', spokes: ['janzu terapia panama', 'vodny bodywork kurz retreat', 'liecenie vodou terapia retreat', 'atma janzu terapia karibik', 'regeneracna janzu terapia katamaran'] },
      ] },
    ],
  },
  {
    id: 'global',
    title: 'World Voyage / Long-Term',
    tagline: 'Pacific crossing · slow travel · world-voyage crew · Janzu training · kitesurf safari.',
    window: 'Post-Panama transition & ongoing',
    locales: [
      { locale: 'en', label: L.en, clusters: [
        { primary: 'world voyage sailing crew', vol: 210, kd: 'Low-Med', spokes: ['sailing around the world crew opportunity', 'join a catamaran sailing world voyage', 'circumnavigation crew opportunities', 'live and sail around the world', 'paid boarding ocean voyage'] },
        { primary: 'pacific crossing sailing opportunities', vol: 150, kd: 'Low', spokes: ['pacific puddle jump crew catamaran', 'sail across the pacific opportunity', 'sailing passage panama to french polynesia', 'ocean crossing crew catamaran 2027', 'blue water sailing training passage'] },
        { primary: 'slow travel sailing experiences', vol: 120, kd: 'Low', spokes: ['month long sailing trip', 'live on a catamaran remote work', 'digital nomad sailing experience', 'regenerative travel sailing', 'escape the matrix slow sailing'] },
        { primary: 'aquatic bodywork janzu training retreat', vol: 90, kd: 'Low', spokes: ['aquatic relaxation therapy certification', 'janzu level 1 training retreat', 'water massage therapy course', 'oceanic bodywork retreat', 'janzu aquatic therapy certification'] },
        { primary: 'global catamaran kitesurfing safari', vol: 80, kd: 'Low', spokes: ['kite cruise around the world', 'french polynesia kiteboarding yacht charter', 'kite and sail world trip', 'off the grid kitesurfing cruise', 'remote island kitesurfing catamaran'] },
      ] },
      { locale: 'it', label: L.it, clusters: [
        { primary: 'traversata pacifico imbarco equipaggio', vol: 110, kd: 'Low', spokes: ['pacific puddle jump equipaggio', 'traversata pacifico barca a vela 2027', 'imbarco per traversata oceanica pacifico', 'da panama alla polinesia francese vela', 'corso navigazione altura pacifico'] },
        { primary: 'giro del mondo kitesurf catamarano', vol: 70, kd: 'Low', spokes: ['crociera kitesurf polinesia francese', 'safari kitesurf catamarano', 'imbarco kitesurf oceano pacifico', 'vela e kitesurf giro del mondo', 'vacanza kitesurf catamarano 2027'] },
      ] },
      { locale: 'es', label: L.es, clusters: [
        { primary: 'cruce pacifico tripulacion velero', vol: 140, kd: 'Low', spokes: ['puddle jump pacifico tripulante', 'travesia pacifico velero 2027', 'embarque velero cruce pacifico', 'panama a polinesia francesa velero', 'curso navegacion altura travesia'] },
        { primary: 'vuelta al mundo kitesurf catamaran', vol: 90, kd: 'Low', spokes: ['safari kitesurf catamaran pacifico', 'embarque kitesurf vuelta al mundo', 'crucero kite polinesia francesa', 'navegacion y kitesurf indonesia', 'kite safari barco oceano pacifico'] },
      ] },
      { locale: 'fr', label: L.fr, clusters: [
        { primary: 'traversee pacifique opportunite equipage', vol: 130, kd: 'Low', spokes: ['puddle jump pacifique equipier', 'traversee pacifique en voilier 2027', 'embarquement voile traversee pacifique', 'panama a polynesie francaise voilier', 'formation voile hauturiere pacifique'] },
        { primary: 'tour du monde kitesurf catamaran', vol: 80, kd: 'Low', spokes: ['safari kitesurf catamaran pacifique', 'embarquement kitesurf tour du monde', 'croisiere kite polynesie francaise', 'voilier kitesurf indonesie', 'kite safari bateau tichy ocean'] },
      ] },
      { locale: 'sk', label: L.sk, clusters: [
        { primary: 'plavba cez tichy ocean posadka', vol: 30, kd: 'Extremely Low (0)', spokes: ['puddle jump pacific katamaran', 'preplavba ticheho oceanu plachetnica', 'plavba panama francuzska polynezia', 'posadka katamaran ocean crossing', 'trening offshore plavby ocean crossing'] },
        { primary: 'svetova plavba katamaranom kitesurf', vol: 20, kd: 'Extremely Low (0)', spokes: ['kitesurf plavba okolo sveta', 'francuzska polynezia kitesurfing katamaran', 'kite safari na lodi tichy ocean', 'exoticka kiteboarding plavba', 'kitesurfing na jachte tichomorie'] },
      ] },
    ],
  },
];

export const setById = (id: string) => PORTFOLIO.find((s) => s.id === id);

/**
 * Importance score = monthly volume × winnability (easier keyword → score it higher).
 * The classic low-hanging-fruit prioritisation: high traffic + low difficulty first.
 */
const KD_WEIGHT: Record<string, number> = { 'extremely low': 1, 'very low': 0.9, low: 0.72, 'low-med': 0.55, med: 0.4 };
export function winnability(kd = ''): number {
  const k = kd.toLowerCase().replace(/\s*\(0\)\s*/, '').trim();
  return KD_WEIGHT[k] ?? 0.6;
}
export const priority = (c: Cluster): number => Math.round((c.vol ?? 0) * winnability(c.kd));

/** Flatten a set's primary keywords across locales, tagged + scored, sorted by priority desc. */
export function rankedClusters(set: PortfolioSet) {
  return set.locales
    .flatMap((b) => b.clusters.map((c) => ({ ...c, locale: b.locale, label: b.label, score: priority(c) })))
    .sort((a, b) => b.score - a.score);
}
