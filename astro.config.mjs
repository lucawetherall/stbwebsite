import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

// Note: migrated news images are emitted as raw <img loading="lazy" decoding="async">
// directly in the Markdown (see scripts/scrape-blog.mjs), so no rehype plugin is needed.

// https://astro.build/config
export default defineConfig({
  site: 'https://www.barnabites.org',
  output: 'static',
  integrations: [mdx(), sitemap()],
  build: { format: 'directory' }, // /about-us/ style URLs to match current
});
