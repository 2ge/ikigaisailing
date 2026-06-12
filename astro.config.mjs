// @ts-check
import { defineConfig } from 'astro/config';
import { fileURLToPath } from 'node:url';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

import partytown from '@astrojs/partytown';

const src = fileURLToPath(new URL('./src', import.meta.url));

// https://astro.build/config
export default defineConfig({
  site: 'https://www.ikigaisailing.com',
  output: 'static',
  trailingSlash: 'always',
  // inline the (single) CSS bundle to remove the render-blocking stylesheet request
  build: { inlineStylesheets: 'always' },
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'it', 'es', 'fr', 'sk'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  integrations: [sitemap({
    i18n: {
      defaultLocale: 'en',
      locales: { en: 'en', it: 'it', es: 'es', fr: 'fr', sk: 'sk' },
    },
  }), partytown({ config: { forward: ['dataLayer.push', 'fbq'] } })],
  vite: {
    plugins: [tailwindcss()],
    resolve: { alias: { '~': src } },
    // dev preview is proxied as ikigai.2pu.net via local haproxy
    server: { allowedHosts: ['ikigai.2pu.net'] },
  },
});