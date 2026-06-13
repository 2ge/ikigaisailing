import type { Locale } from '../i18n/ui';

/**
 * Bookable add-ons shown in the cart ("Add extras"). Prices are EUR.
 * `placeholder: true` = the price is a guess the owner must confirm before
 * going live (rendered with an "indicative" note). The server-side catalog in
 * functions/api/checkout.ts mirrors these amounts and is what actually charges.
 */
export type Addon = {
  id: string;
  price: number;
  placeholder?: boolean;
  name: Record<Locale, string>;
  desc: Record<Locale, string>;
};

export const ADDONS: Addon[] = [
  {
    id: 'transfer',
    price: 150,
    name: {
      en: 'Transfer Panama City ↔ boat (return)',
      it: 'Transfer Panama City ↔ barca (a/r)',
      es: 'Traslado Ciudad de Panamá ↔ barco (ida y vuelta)',
      fr: 'Transfert Panama City ↔ bateau (aller-retour)',
      sk: 'Transfer Panama City ↔ loď (tam a späť)',
    },
    desc: {
      en: 'Round-trip ground transfer between Panama City and the boat in San Blas.',
      it: 'Transfer di andata e ritorno tra Panama City e la barca a San Blas.',
      es: 'Traslado terrestre de ida y vuelta entre Ciudad de Panamá y el barco en San Blas.',
      fr: 'Transfert terrestre aller-retour entre Panama City et le bateau à San Blas.',
      sk: 'Pozemný transfer tam a späť medzi Panama City a loďou v San Blas.',
    },
  },
  {
    id: 'freediving',
    price: 90,
    placeholder: true,
    name: {
      en: 'Freediving discovery course',
      it: 'Corso introduttivo di apnea',
      es: 'Curso de iniciación a la apnea',
      fr: "Cours d'initiation à l'apnée",
      sk: 'Úvodný kurz freedivingu',
    },
    desc: {
      en: 'A guided first taste of freediving with our certified instructor.',
      it: 'Un primo assaggio guidato dell’apnea con il nostro istruttore certificato.',
      es: 'Una primera toma de contacto guiada con la apnea con nuestro instructor certificado.',
      fr: 'Une première approche guidée de l’apnée avec notre instructeur certifié.',
      sk: 'Prvá ochutnávka freedivingu s naším certifikovaným inštruktorom.',
    },
  },
  {
    id: 'aida1',
    price: 290,
    placeholder: true,
    name: {
      en: 'AIDA 1 freediving certification',
      it: 'Certificazione di apnea AIDA 1',
      es: 'Certificación de apnea AIDA 1',
      fr: 'Certification d’apnée AIDA 1',
      sk: 'Certifikácia freedivingu AIDA 1',
    },
    desc: {
      en: 'Entry-level AIDA freediving certification.',
      it: 'Certificazione di apnea AIDA di livello base.',
      es: 'Certificación de apnea AIDA de nivel inicial.',
      fr: 'Certification d’apnée AIDA de niveau débutant.',
      sk: 'Základná certifikácia freedivingu AIDA.',
    },
  },
  {
    id: 'aida2',
    price: 390,
    placeholder: true,
    name: {
      en: 'AIDA 2 freediving certification',
      it: 'Certificazione di apnea AIDA 2',
      es: 'Certificación de apnea AIDA 2',
      fr: 'Certification d’apnée AIDA 2',
      sk: 'Certifikácia freedivingu AIDA 2',
    },
    desc: {
      en: 'Full beginner AIDA 2 freediving certification.',
      it: 'Certificazione di apnea AIDA 2 completa per principianti.',
      es: 'Certificación de apnea AIDA 2 completa para principiantes.',
      fr: 'Certification d’apnée AIDA 2 complète pour débutants.',
      sk: 'Kompletná začiatočnícka certifikácia freedivingu AIDA 2.',
    },
  },
];
