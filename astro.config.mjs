// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';

// https://docs.astro.build/en/reference/configuration-reference/
export default defineConfig({
  site: 'https://www.stiletdekor.hu',
  // Everything is rendered on the Worker by default; static pages opt in with
  // `export const prerender = true`.
  output: 'server',
  adapter: cloudflare({
    // Optimise local images at build time (sharp, in Node); serve them as-is at runtime.
    // Avoids the default Cloudflare Images binding (IMAGES), which is a billable product.
    imageService: 'compile',
  }),
  integrations: [react()],
  // No server-side sessions: the cart lives on the client and orders are re-priced on the server.
  // Leaving sessions on would make the adapter auto-provision a SESSION KV namespace.
  session: false,
  i18n: {
    defaultLocale: 'hu',
    locales: ['hu'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  security: {
    // Reject cross-site form POST/PUT/PATCH/DELETE on on-demand rendered routes.
    checkOrigin: true,
  },
});
