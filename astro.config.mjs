// @ts-check
import { defineConfig } from 'astro/config';
import { fileURLToPath } from 'node:url';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

const src = fileURLToPath(new URL('./src', import.meta.url));

// https://astro.build/config
export default defineConfig({
  site: 'https://www.ikigaisailing.com',
  output: 'static',
  trailingSlash: 'always',
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'it', 'es', 'fr', 'sk'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  integrations: [
    sitemap({
      i18n: {
        defaultLocale: 'en',
        locales: { en: 'en', it: 'it', es: 'es', fr: 'fr', sk: 'sk' },
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
    resolve: { alias: { '~': src } },
    // dev preview is proxied as ikigai.2pu.net via local haproxy
    server: { allowedHosts: ['ikigai.2pu.net'] },
  },
});
