/**
 * Per-page SEO target keywords (the durable, locale-specific keyword store).
 * Source: "Multilingual Direct-Booking SEO Strategy" (owner's Drive PDF) + docs/SEO-STRATEGY.md.
 * Drives /admin/seo (the optimisation matrix) and the /admin/stats live score.
 *
 * Owner decision 2026-06-13: kitesurf + scuba are NOT marketed for San Blas (Guna Yala
 * rules) — their targets are world-voyage / other-destination. San Blas pages lead with
 * freediving, yoga, Janzu, meditation.
 *
 * `path` is the canonical (EN) route; the matrix localises it per locale. Keep keys in sync
 * with content slugs. en is required; missing locales fall back to en.
 */
export type Loc = 'en' | 'it' | 'es' | 'fr' | 'sk';
export interface SeoTarget {
  path: string;
  collection: 'activities' | 'trips' | 'pages';
  slug: string;
  kw: Partial<Record<Loc, string>> & { en: string };
}

export const SEO_TARGETS: SeoTarget[] = [
  // ── San Blas focus ──────────────────────────────────────────────
  { path: '/activities/freediving/', collection: 'activities', slug: 'freediving', kw: {
    en: 'freediving catamaran charter san blas', it: 'catamarano apnea san blas panama',
    es: 'catamaran apnea san blas panama', fr: 'catamaran apnée san blas panama', sk: 'freediving katamarán san blas panama' } },
  { path: '/activities/yoga/', collection: 'activities', slug: 'yoga', kw: {
    en: 'yoga sailing retreat panama', it: 'ritiro yoga vela panama',
    es: 'retiro yoga vela panama', fr: 'retraite yoga voile panama', sk: 'yoga a plachtenie retreat panama' } },
  { path: '/activities/janzu/', collection: 'activities', slug: 'janzu', kw: {
    en: 'janzu water therapy retreat', it: 'ritiro terapia acqua janzu',
    es: 'retiro terapia acuatica janzu', fr: 'retraite therapie aquatique janzu', sk: 'janzu vodna terapia retreat' } },
  { path: '/activities/meditation/', collection: 'activities', slug: 'meditation', kw: {
    en: 'meditation retreat san blas islands', it: 'ritiro meditazione barca a vela',
    es: 'retiro meditacion islas san blas', fr: 'meditation retraite san blas', sk: 'meditacny retreat san blas ostrovy' } },
  { path: '/season-2025-26/', collection: 'pages', slug: 'season-2025-26', kw: {
    en: 'all inclusive catamaran cabin charter san blas', it: 'noleggio cabina catamarano all inclusive san blas',
    es: 'alquiler cabina catamaran todo incluido san blas', fr: 'location cabine catamaran tout inclus san blas', sk: 'all inclusive katamaran prenajom kabiny san blas' } },
  { path: '/trips/', collection: 'pages', slug: 'trips', kw: {
    en: 'san blas catamaran cabin charter', it: 'catamarano cabina san blas',
    es: 'catamaran compartido san blas', fr: 'catamaran cabine san blas', sk: 'zdielany katamaran san blas' } },
  { path: '/trips/10-days-on-board/', collection: 'trips', slug: '10-days-on-board', kw: {
    en: '10 days catamaran cruise panama', it: 'viaggio 10 giorni catamarano san blas',
    es: 'viaje catamaran 10 dias panama', fr: 'voyage voilier 10 jours guna yala', sk: '10 dnova plavba katamaranom panama' } },
  { path: '/trips/ikigai-experience/', collection: 'trips', slug: 'ikigai-experience', kw: {
    en: 'yoga freediving catamaran san blas', it: 'catamarano apnea yoga san blas',
    es: 'retiro apnea yoga san blas', fr: 'retraite yoga apnée catamaran san blas', sk: 'joga a freediving katamaran san blas' } },

  // ── World voyage / long-term (incl. kitesurf + scuba) ───────────
  { path: '/trips/pacific-crossing/', collection: 'trips', slug: 'pacific-crossing', kw: {
    en: 'pacific crossing sailing opportunities', it: 'traversata pacifico imbarco equipaggio',
    es: 'cruce pacifico tripulacion velero', fr: 'traversee pacifique opportunite equipage', sk: 'plavba cez tichy ocean posadka' } },
  { path: '/trips/one-month/', collection: 'trips', slug: 'one-month', kw: {
    en: 'slow travel sailing experiences', it: 'vivere a bordo catamarano un mese',
    es: 'vivir en un catamaran un mes', fr: 'vivre sur un catamaran un mois', sk: 'zit na katamarane mesiac' } },
  { path: '/trips/crew-exchange/', collection: 'trips', slug: 'crew-exchange', kw: {
    en: 'world voyage sailing crew', it: 'giro del mondo vela equipaggio',
    es: 'vuelta al mundo velero tripulacion', fr: 'tour du monde voilier equipage', sk: 'svetova plavba katamaranom posadka' } },
  { path: '/activities/kitesurf/', collection: 'activities', slug: 'kitesurf', kw: {
    en: 'global catamaran kitesurfing safari', it: 'giro del mondo kitesurf catamarano',
    es: 'vuelta al mundo kitesurf catamaran', fr: 'tour du monde kitesurf catamaran', sk: 'svetova plavba katamaranom kitesurf' } },
  { path: '/activities/diving/', collection: 'activities', slug: 'diving', kw: {
    en: 'scuba diving sailing catamaran expedition', it: 'immersioni subacquee catamarano a vela',
    es: 'buceo en catamaran de vela', fr: 'plongée sous-marine catamaran voilier', sk: 'potapanie z plachetnice katamaran' } },
];
