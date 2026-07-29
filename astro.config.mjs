import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { makeSerializer } from './scripts/sitemap-meta.mjs';

// Note: migrated news images are emitted as raw <img loading="lazy" decoding="async">
// directly in the Markdown (see scripts/scrape-blog.mjs), so no rehype plugin is needed.

// https://astro.build/config
export default defineConfig({
  site: 'https://www.barnabites.org',
  output: 'static',
  // The sitemap lists pages, not feeds — keep calendar.ics and rss.xml out of it, along with
  // /search (a noindex utility page). Each entry carries lastmod/changefreq/priority; see
  // scripts/sitemap-meta.mjs.
  integrations: [
    mdx(),
    sitemap({
      filter: (page) => {
        const path = new URL(page).pathname;
        return !/\.(ics|xml)$/.test(path) && path !== '/search/';
      },
      serialize: makeSerializer(),
    }),
  ],
  build: { format: 'directory' }, // /about-us/ style URLs to match current
});
