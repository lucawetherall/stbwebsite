// Import the parish's ChurchDesk email newsletter as a news post.
//
// The CMS "Newsletter archive link" (settings/site.json → newsletterArchive) points at a
// public ChurchDesk share page, app.churchdesk.com/public/newsletter/<uuid>. Behind it,
// GET api2.churchdesk.com/v2/people/messages/<uuid>/share returns { title, rendered } —
// the edition's title and its full email HTML (an Unlayer template). This script converts
// that into a Markdown post in src/content/news/ so each edition also appears on /news.
//
// Idempotent: the slug is weekly-news-<date> (date parsed from the edition title); if the
// post already exists nothing is written. Safe to run on a schedule AND whenever the CMS
// link changes — whichever happens first imports the edition exactly once.
//
//   node scripts/import-newsletter.mjs             # uuid from settings/site.json
//   node scripts/import-newsletter.mjs <url|uuid>  # import a specific edition
//
// Prints "IMPORTED <slug>" on a new import (the GitHub workflow keys off the git diff).
import { readFile, writeFile, mkdir, access, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import * as cheerio from 'cheerio';
import TurndownService from 'turndown';
import sharp from 'sharp';

const NEWS_DIR = 'src/content/news';
const IMG_DIR = 'public/images/news';
const MAX_IMG_WIDTH = 1200;

const mkdirNews = () => mkdir(NEWS_DIR, { recursive: true });

// With STALENESS_CHECK=1 (set by the scheduled workflow runs), fail loudly if the
// newest imported edition is old — the likeliest cause is that the "Newsletter
// archive link" in the CMS still points at a past edition, so new ones are being
// missed. A workflow failure emails the repository owner; a quiet skip would not.
const STALE_AFTER_DAYS = 14;
async function stalenessCheck() {
  if (process.env.STALENESS_CHECK !== '1') return;
  const dates = (await readdir(NEWS_DIR))
    .map((f) => f.match(/^weekly-news-(\d{4}-\d{2}-\d{2})/)?.[1])
    .filter(Boolean)
    .sort();
  const newest = dates[dates.length - 1];
  if (!newest) return;
  const ageDays = (Date.now() - Date.parse(newest)) / 86400000;
  if (ageDays > STALE_AFTER_DAYS) {
    console.error(
      `STALE: the newest imported Weekly News edition is ${newest} (${Math.round(ageDays)} days ago). ` +
        'If a newer newsletter has been sent, update the "Newsletter archive link" in the CMS ' +
        '(Site settings) to its share link so it can be imported.'
    );
    process.exit(1);
  }
}

// ---- resolve the message uuid ------------------------------------------------
const arg = process.argv[2];
let uuid;
if (arg) {
  const m = arg.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
  if (!m) throw new Error(`Could not find a message uuid in "${arg}"`);
  uuid = m[0];
} else {
  const settings = JSON.parse(await readFile('src/content/settings/site.json', 'utf8'));
  const link = settings.newsletterArchive || '';
  const m = link.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
  if (!m) throw new Error(`newsletterArchive in settings/site.json has no message uuid: "${link}"`);
  uuid = m[0];
}

// ---- fetch the edition -------------------------------------------------------
const res = await fetch(`https://api2.churchdesk.com/v2/people/messages/${uuid}/share`);
if (!res.ok) throw new Error(`ChurchDesk share endpoint returned ${res.status} for ${uuid}`);
const { title: rawTitle, rendered } = await res.json();
if (!rendered) throw new Error('Share endpoint returned no rendered HTML');

// ---- dedupe by message uuid --------------------------------------------------
// Each imported post carries a `<!-- churchdesk-message: <uuid> -->` marker; if any
// existing post already references this uuid the edition has been imported, whatever
// its slug ended up as (the slug date can be a fallback — see below).
await mkdirNews();
for (const f of (await readdir(NEWS_DIR)).filter((f) => f.endsWith('.md'))) {
  if ((await readFile(`${NEWS_DIR}/${f}`, 'utf8')).includes(uuid)) {
    console.log(`Edition "${rawTitle}" is already imported (${NEWS_DIR}/${f}) — nothing to do.`);
    await stalenessCheck();
    process.exit(0);
  }
}

// ---- date + slug from the title ---------------------------------------------
// Titles look like "St Barnabas Church newsletter - 31st May 2026", but tolerate
// "7 June 2026", "June 7th, 2026", abbreviated months and "14/06/2026". If no date
// can be found at all, fall back to today (the newsletter goes out weekly, and the
// uuid marker above prevents any duplicate import) rather than missing an edition.
const months = 'January February March April May June July August September October November December'.split(' ');
function parseDate(s) {
  let day, monName, year;
  let m = s.match(/(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]+),?\s+(\d{4})/);
  if (m) [, day, monName, year] = m;
  else if ((m = s.match(/([A-Za-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})/))) [, monName, day, year] = m;
  else if ((m = s.match(/(\d{1,2})[/.](\d{1,2})[/.](\d{4})/))) {
    return new Date(Date.UTC(Number(m[3]), Number(m[2]) - 1, Number(m[1])));
  } else if (
    (m = s.match(/(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]{3,})/)) ||
    (m = s.match(/([A-Za-z]{3,})\s+(\d{1,2})(?:st|nd|rd|th)?/))
  ) {
    // No year in the title (e.g. "newsletter - 16th August"): assume the current
    // year, or last year if that would put the edition more than a week ahead of
    // today (a late-December edition imported in January).
    [day, monName] = /^\d/.test(m[1]) ? [m[1], m[2]] : [m[2], m[1]];
    const now = new Date();
    year = now.getUTCFullYear();
    const mon = months.findIndex((x) => x.toLowerCase().startsWith(monName.toLowerCase().slice(0, 3)));
    if (mon < 0) return null;
    const candidate = Date.UTC(year, mon, Number(day));
    if (candidate - now.getTime() > 7 * 86400000) year -= 1;
  } else return null;
  const mon = months.findIndex((x) => x.toLowerCase().startsWith(monName.toLowerCase().slice(0, 3)));
  if (mon < 0) return null;
  return new Date(Date.UTC(Number(year), mon, Number(day)));
}
let date = parseDate(rawTitle);
if (!date) {
  console.warn(`Could not parse an edition date from title "${rawTitle}" — using today's date.`);
  date = new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00Z');
}
const isoDate = date.toISOString().slice(0, 10);
let slug = `weekly-news-${isoDate}`;
while (await access(`${NEWS_DIR}/${slug}.md`).then(() => true, () => false)) slug += '-2';
const outPath = `${NEWS_DIR}/${slug}.md`;

// British-style display date for the post title: "31 May 2026".
const displayDate = `${date.getUTCDate()} ${months[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
const title = `Weekly News — ${displayDate}`;

// ---- strip email chrome ------------------------------------------------------
const $ = cheerio.load(rendered);
const rows = $('.u-row-container').toArray();

let hero;
let heroAlt;
for (const row of rows) {
  const $row = $(row);
  const text = $row.text().replace(/\s+/g, ' ').trim();
  const imgs = $row.find('img').toArray();
  const srcs = imgs.map((i) => $(i).attr('src') || '');

  // Footer: social icons + unsubscribe.
  if (/unsubscribe/i.test(text) || srcs.some((s) => s.includes('unlayer.com/social'))) {
    $row.remove();
    continue;
  }
  // Masthead logo.
  if (!text && srcs.some((s) => /st\.barnabas\.logo/i.test(s))) {
    $row.remove();
    continue;
  }
  // Date banner ("31 May 2026 · Your weekly newsletter from St Barnabas Ealing") —
  // the date and standing strapline live in the post's frontmatter instead.
  if (/your weekly newsletter from st barnabas/i.test(text) && text.length < 120) {
    $row.remove();
    continue;
  }
  // First image-only row before any prose is the edition's cover image → hero.
  if (!hero && !text && srcs.length === 1 && srcs[0]) {
    hero = srcs[0];
    heroAlt = ($(imgs[0]).attr('alt') || '').trim() || undefined;
    $row.remove();
  }
}

// ---- download + optimise images ---------------------------------------------
await mkdir(IMG_DIR, { recursive: true });
const sanitize = (n) => n.replace(/[^\w.\-]/g, '_').slice(-60);

async function localise(src) {
  const abs = new URL(src, 'https://edge.churchdesk.com').href;
  const base = sanitize(abs.split('/').pop().split('?')[0] || 'image').replace(/\.(png|jpe?g|gif|webp)$/i, '');
  const name = `newsletter-${isoDate}-${createHash('md5').update(abs).digest('hex').slice(0, 8)}-${base}.webp`;
  const r = await fetch(abs);
  if (!r.ok) throw new Error(`image fetch ${r.status}`);
  const buf = Buffer.from(await r.arrayBuffer());
  await sharp(buf)
    .resize({ width: MAX_IMG_WIDTH, withoutEnlargement: true })
    .webp({ quality: 80, effort: 6 })
    .toFile(`${IMG_DIR}/${name}`);
  return `/images/news/${name}`;
}

if (hero) {
  try {
    hero = await localise(hero);
  } catch (e) {
    console.warn(`hero image failed (${e.message}) — post will have no hero`);
    hero = undefined;
  }
}

for (const img of $('.u-row-container img').toArray()) {
  const src = $(img).attr('src');
  if (!src) { $(img).remove(); continue; }
  try {
    $(img).attr('src', await localise(src));
    $(img).removeAttr('srcset');
    if (!($(img).attr('alt') || '').trim()) $(img).attr('alt', title);
  } catch (e) {
    console.warn(`dropping image ${src.slice(0, 80)} (${e.message})`);
    $(img).remove();
  }
}

// ---- email HTML → Markdown ---------------------------------------------------
const td = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced', bulletListMarker: '-' });
td.remove(['script', 'style', 'noscript', 'title']);
// Same convention as the migrated legacy posts (scrape-blog.mjs): images as raw
// lazy-loading <img> tags, which Markdown passes through untouched.
td.addRule('lazyImg', {
  filter: 'img',
  replacement: (_c, node) => {
    const src = node.getAttribute('src') || '';
    if (!src) return '';
    const alt = (node.getAttribute('alt') || '').replace(/"/g, '&quot;');
    return `<img src="${src}" alt="${alt}" loading="lazy" decoding="async">`;
  },
});

// Repair the email's malformed contact links (e.g. href="https://name@domain" or a
// bare "name:domain") — if the link text is an email address, link it as mailto.
for (const a of $('.u-row-container a').toArray()) {
  const text = $(a).text().trim();
  const href = $(a).attr('href') || '';
  if (/^[\w.+-]+@[\w.-]+\.\w+$/.test(text) && !href.startsWith('mailto:')) {
    $(a).attr('href', `mailto:${text}`);
  }
}

const body = $('.u-row-container')
  .toArray()
  .map((row) => td.turndown($(row).html() || ''))
  .filter((md) => md.trim())
  .join('\n\n')
  .replace(/^#{1,6}\s*$/gm, '') // empty headings the email editor leaves behind
  .replace(/^# /gm, '## ') // the post title is the page's only h1
  .replace(/\n{3,}/g, '\n\n')
  .trim();

if (body.length < 200) throw new Error(`Converted body is suspiciously short (${body.length} chars) — refusing to publish it.`);

// First real paragraph → meta description.
let description = body
  .split('\n')
  .map((l) => l.replace(/[#*_>\[\]!]|\(.*?\)|<[^>]+>/g, '').trim())
  .filter((l) => l.length > 40)[0];
if (description && description.length > 160) {
  description = description.slice(0, 160).replace(/\s+\S*$/, '') + '…';
}

// ---- write the post ----------------------------------------------------------
const fm = [
  '---',
  `title: ${JSON.stringify(title)}`,
  `date: ${isoDate}`,
  'category: "Weekly News"',
  'author: "St Barnabas Church"',
  description ? `description: ${JSON.stringify(description)}` : null,
  hero ? `hero: ${JSON.stringify(hero)}` : null,
  hero ? `heroAlt: ${JSON.stringify(heroAlt || title)}` : null,
  '---',
  '',
  '',
].filter((x) => x !== null).join('\n');

await writeFile(outPath, fm + `<!-- churchdesk-message: ${uuid} -->\n\n` + body + '\n');
console.log(`IMPORTED ${slug}`);
await stalenessCheck();
