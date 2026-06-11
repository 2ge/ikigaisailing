/** Site navigation structure — single source for Header + Footer. */
import type { UIKey } from './ui';

export interface NavItem {
  key: UIKey;
  path: string;
  children?: NavItem[];
}

export const mainNav: NavItem[] = [
  {
    key: 'nav.about',
    path: '/about/',
    children: [
      { key: 'nav.aboutUs', path: '/about/' },
      { key: 'nav.ikigai', path: '/ikigai/' },
      { key: 'nav.story', path: '/story/' },
      { key: 'nav.route', path: '/route/' },
      { key: 'nav.benefits', path: '/benefits/' },
      { key: 'nav.reviews', path: '/reviews/' },
      { key: 'nav.faq', path: '/faq/' },
    ],
  },
  { key: 'nav.boat', path: '/catana-47/' },
  {
    key: 'nav.trips',
    path: '/trips/',
    children: [
      { key: 'nav.season', path: '/season-2025-26/' },
      { key: 'nav.trips', path: '/trips/' },
      { key: 'nav.liveaboard', path: '/liveaboard/' },
    ],
  },
  { key: 'nav.activities', path: '/activities/' },
  { key: 'nav.blog', path: '/blog/' },
];

export const footerNav: Record<'footer.about' | 'footer.onboard' | 'footer.connect', NavItem[]> = {
  'footer.about': [
    { key: 'nav.aboutUs', path: '/about/' },
    { key: 'nav.ikigai', path: '/ikigai/' },
    { key: 'nav.story', path: '/story/' },
    { key: 'nav.route', path: '/route/' },
    { key: 'nav.reviews', path: '/reviews/' },
  ],
  'footer.onboard': [
    { key: 'nav.season', path: '/season-2025-26/' },
    { key: 'nav.trips', path: '/trips/' },
    { key: 'nav.activities', path: '/activities/' },
    { key: 'nav.liveaboard', path: '/liveaboard/' },
    { key: 'nav.boat', path: '/catana-47/' },
    { key: 'nav.faq', path: '/faq/' },
  ],
  'footer.connect': [
    { key: 'nav.contact', path: '/contact/' },
    { key: 'nav.blog', path: '/blog/' },
  ],
};

export const WHATSAPP_URL = 'https://wa.me/393313292629';
export const SOCIALS = {
  facebook: 'https://www.facebook.com/ikigaisailing',
  instagram: 'https://www.instagram.com/ikigaisailing_asd/',
  youtube: 'https://www.youtube.com/@ikigaisailing',
};
