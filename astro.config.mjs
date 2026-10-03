// @ts-check
import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';

// Hybrid: pages are prerendered static by default; routes that opt out with
// `export const prerender = false` (our /api/books proxy) run as a Netlify
// serverless function, so the ReadTrack API key stays server-side and never
// ships to the browser.
// https://astro.build/config
export default defineConfig({
  output: 'hybrid',
  adapter: netlify(),
});
