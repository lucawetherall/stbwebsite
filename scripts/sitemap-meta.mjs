/**
 * Per-URL metadata for the sitemap: `lastmod`, `changefreq` and `priority`.
 *
 * Until now every entry in `sitemap-0.xml` was a bare `<loc>`. On a site where ~129 of the 170
 * URLs are archived news posts from 2018–2024 and a handful of pages change weekly, that gives a
 * crawler no way to tell the two apart, so a stale 2018 notice is recrawled as eagerly as What's
 * On. `lastmod` is the field that actually earns its keep here — Google has said for years that
 * it ignores `priority` and `changefreq`, but other crawlers still read them, and they cost
 * nothing to emit honestly.
 *
 * The dates are read straight from the content files rather than from the file system's mtime:
 * a fresh `git clone` in CI stamps every file with the checkout time, which would tell every
 * crawler that all 129 archived posts changed this morning.
 *
 * Lives in `scripts/` (and in plain `.mjs`) because `astro.config.mjs` imports it at config load,
 * before the TypeScript pipeline exists.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const NEWS_DIR = 'src/content/news';
const PAGES_DIR = 'src/content/pages';

/** The value of a top-level frontmatter key, as written. Good enough for `date:`/`updated:`. */
function frontmatterValue(source, key) {
  const block = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!block) return null;
  const line = block[1].match(new RegExp(`^${key}:\\s*(.+)$`, 'm'));
  if (!line) return null;
  return line[1].trim().replace(/^["']|["']$/g, '');
}

/** "2024-03-19" or a full ISO date → "2024-03-19". Anything unparseable is dropped. */
function isoDate(value) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10);
}

function walk(dir) {
  let files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) files = files.concat(walk(full));
    else if (/\.mdx?$/.test(entry.name)) files.push(full);
  }
  return files;
}

function safeWalk(dir) {
  try {
    return statSync(dir).isDirectory() ? walk(dir) : [];
  } catch {
    return [];
  }
}

/**
 * Map of site path → `lastmod`, built from the content collections.
 * News uses `date` (a post is published once); pages use the optional `updated` field.
 */
export function buildLastmodMap() {
  const map = new Map();

  for (const file of safeWalk(NEWS_DIR)) {
    const slug = relative(NEWS_DIR, file).replace(/\.mdx?$/, '').split(sep).join('/');
    const date = isoDate(frontmatterValue(readFileSync(file, 'utf8'), 'date'));
    if (date) map.set(`/news/${slug}/`, date);
  }

  for (const file of safeWalk(PAGES_DIR)) {
    const slug = relative(PAGES_DIR, file).replace(/\.mdx?$/, '').split(sep).join('/');
    const date = isoDate(frontmatterValue(readFileSync(file, 'utf8'), 'updated'));
    if (date) map.set(`/${slug}/`, date);
  }

  // The news index is as fresh as its newest post.
  const newest = [...map.entries()]
    .filter(([path]) => path.startsWith('/news/'))
    .map(([, date]) => date)
    .sort()
    .pop();
  if (newest) map.set('/news/', newest);

  return map;
}

/** Pages that turn over week to week; everything else changes far more slowly. */
const WEEKLY = new Set(['/', '/whats-on/', '/news/', '/worship/special-services/']);

/** Structural importance, expressed as the sitemap's 0–1 priority. */
function priorityFor(path) {
  if (path === '/') return 1.0;
  if (path.startsWith('/news/') && path !== '/news/') return 0.4;
  if (WEEKLY.has(path)) return 0.9;
  if (/^\/(worship|life-events|give|contact-us|music)\/?/.test(path)) return 0.8;
  if (path === '/about-us/visiting/') return 0.8; // the front door for a first-time visitor
  if (path.startsWith('/about-us/whos-who/') && path !== '/about-us/whos-who/') return 0.5;
  return 0.6;
}

function changefreqFor(path) {
  if (WEEKLY.has(path)) return 'weekly';
  if (path.startsWith('/news/')) return 'yearly';
  return 'monthly';
}

/**
 * `serialize` hook for @astrojs/sitemap. Returns the item with metadata attached; `lastmod` is
 * only set where a real date is known, because an invented one is worse than none.
 */
export function makeSerializer() {
  const lastmods = buildLastmodMap();
  return (item) => {
    const path = new URL(item.url).pathname;
    const lastmod = lastmods.get(path);
    return {
      ...item,
      ...(lastmod ? { lastmod } : {}),
      changefreq: changefreqFor(path),
      priority: priorityFor(path),
    };
  };
}
