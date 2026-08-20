// Import the parish's ChurchDesk email newsletter as one or more news posts.
//
// Two sources, one converter:
//
//   node scripts/import-newsletter.mjs                      # share link from settings/site.json
//   node scripts/import-newsletter.mjs <share-url-or-uuid>  # a specific edition
//   node scripts/import-newsletter.mjs --html <file> [--title "<subject>"]
//
// The share-link mode fetches { title, rendered } from ChurchDesk's public API
// (api2.churchdesk.com/v2/people/messages/<uuid>/share). The --html mode converts a
// newsletter email's own HTML body — the same Unlayer markup — which matters because
// delivered emails carry click-tracking links rather than share links. If the given
// HTML contains SEVERAL editions (a bulk forward), it is split on the recurring
// masthead and each edition becomes its own dated post.
//
// The web post keeps only what an online reader needs: the email chrome (masthead
// logo, date banner, footer, unsubscribe/social) and the standing weekly boilerplate
// (Parish Office details, Safeguarding block, Quick Links) are stripped — the site
// has proper pages for those. ChurchDesk click-tracking links are resolved to their
// real destination, or unwrapped to plain text when dead.
//
// Idempotent three ways: by message uuid (marker comment in each post), by slug
// (one post per edition date), and safe to re-run from any trigger.
import { readFile, writeFile, mkdir, access, readdir, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import * as cheerio from 'cheerio';
import TurndownService from 'turndown';
import sharp from 'sharp';

const NEWS_DIR = 'src/content/news';
const IMG_DIR = 'public/images/news';
const MAX_IMG_WIDTH = 1200;
const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

const months = 'January February March April May June July August September October November December'.split(' ');

// ---------------------------------------------------------------- staleness ----
// With STALENESS_CHECK=1 (scheduled workflow runs), fail loudly if the newest
// imported edition is old — the likeliest cause is a broken trigger chain. A
// workflow failure emails the repository owner; a quiet skip would not.
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
        'Check the AgentMail inbox subscription and the CMS "Newsletter link (latest edition)" setting.'
    );
    process.exit(1);
  }
}

// ------------------------------------------------------------- date parsing ----
// "31st May 2026", "June 7th, 2026", "14/06/2026", and yearless "16th August"
// (year inferred: current, or previous if that lands >1 week in the future).
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
    [day, monName] = /^\d/.test(m[1]) ? [m[1], m[2]] : [m[2], m[1]];
    const now = new Date();
    const mon = months.findIndex((x) => x.toLowerCase().startsWith(monName.toLowerCase().slice(0, 3)));
    if (mon < 0) return null;
    // A yearless date names the edition just sent, so the right year is whichever
    // candidate lands nearest today — "16th August" seen in January is last year's,
    // and "2nd January" seen on 31 December is NEXT year's, not eleven months ago.
    const thisYear = now.getUTCFullYear();
    year = [thisYear - 1, thisYear, thisYear + 1]
      .map((y) => ({ y, gap: Math.abs(Date.UTC(y, mon, Number(day)) - now.getTime()) }))
      .sort((a, b) => a.gap - b.gap)[0].y;
  } else return null;
  const mon = months.findIndex((x) => x.toLowerCase().startsWith(monName.toLowerCase().slice(0, 3)));
  if (mon < 0) return null;
  return new Date(Date.UTC(Number(year), mon, Number(day)));
}

// ------------------------------------------------------------------ images -----
const sanitize = (n) => n.replace(/[^\w.\-]/g, '_').slice(-60);
const fileExists = (f) => access(f).then(() => true, () => false);

// Named by a hash of the source URL alone — deliberately NO edition-date prefix. The same
// picture recurs week after week (a poster, the giving banner), and a per-edition name
// gave the identical bytes a fresh URL every Friday: the repo accumulated exact duplicates
// and returning readers re-downloaded a file they already had, defeating the year-long
// image cache. One URL per source image fixes both; an already-localised image is reused.
// Returns { path, width, height } so the caller can stamp dimensions on the <img> (no
// layout shift as the reader scrolls a long newsletter).
async function localiseImage(src, created) {
  const abs = new URL(src, 'https://edge.churchdesk.com').href;
  const base = sanitize(abs.split('/').pop().split('?')[0] || 'image').replace(/\.(png|jpe?g|gif|webp)$/i, '');
  const name = `newsletter-${createHash('md5').update(abs).digest('hex').slice(0, 8)}-${base}.webp`;
  const file = `${IMG_DIR}/${name}`;
  if (await fileExists(file)) {
    const meta = await sharp(file).metadata();
    return { path: `/images/news/${name}`, width: meta.width, height: meta.height };
  }
  const r = await fetch(abs);
  if (!r.ok) throw new Error(`image fetch ${r.status}`);
  const buf = Buffer.from(await r.arrayBuffer());
  const info = await sharp(buf)
    .resize({ width: MAX_IMG_WIDTH, withoutEnlargement: true })
    .webp({ quality: 72, effort: 6 })
    .toFile(file);
  created.push(file);
  return { path: `/images/news/${name}`, width: info.width, height: info.height };
}

// The -256/-800 siblings src/lib/images.ts offers the news list (128px thumbnail slot),
// so a fresh post's hero behaves like the prepared archive's. Idempotent.
async function heroSiblings(path, created) {
  const file = `public${path}`;
  const { width = 0 } = await sharp(file).metadata();
  for (const [w, q] of [[256, 70], [800, 72]]) {
    if (w !== 256 && width <= w) continue;
    const out = file.replace(/\.webp$/, `-${w}.webp`);
    if (await fileExists(out)) continue;
    await sharp(file).resize({ width: w, withoutEnlargement: true }).webp({ quality: q, effort: 6 }).toFile(out);
    created.push(out);
  }
}

// ------------------------------------------------------------------ links ------
// Email links are wrapped in short.churchdesk.net click trackers, and forwarded
// copies of those often 404. Resolve each to its destination; dead or unresolvable
// trackers are unwrapped to plain text so no tracking link ever reaches the site.
const trackerCache = new Map();
async function resolveTracker(url) {
  if (trackerCache.has(url)) return trackerCache.get(url);
  let dest = null;
  try {
    const r = await fetch(url, { redirect: 'follow' });
    r.body?.cancel();
    if (r.ok && !/short\.churchdesk\.net/i.test(r.url)) dest = r.url;
  } catch {}
  trackerCache.set(url, dest);
  return dest;
}

// ---------------------------------------------------------------- markdown -----
const td = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced', bulletListMarker: '-' });
td.remove(['script', 'style', 'noscript', 'title']);
td.addRule('lazyImg', {
  filter: 'img',
  replacement: (_c, node) => {
    const src = node.getAttribute('src') || '';
    if (!src) return '';
    const alt = (node.getAttribute('alt') || '').replace(/"/g, '&quot;');
    const w = node.getAttribute('width');
    const h = node.getAttribute('height');
    const size = w && h ? ` width="${w}" height="${h}"` : '';
    return `<img src="${src}" alt="${alt}"${size} loading="lazy" decoding="async">`;
  },
});

// ---------------------------------------------------------------- converter ----
// rowsHtml: the edition's .u-row-container blocks, in order.
async function convertEdition({ rowsHtml, title: rawTitle, uuid, newsFiles }) {
  const $ = cheerio.load(`<div id="root">${rowsHtml.join('\n')}</div>`);
  const rows = $('#root > .u-row-container').toArray();

  // -- derive the edition date: title first, then the date banner row.
  let date = rawTitle ? parseDate(rawTitle) : null;
  let bannerText = '';
  for (const row of rows) {
    const text = $(row).text().replace(/\s+/g, ' ').trim();
    if (/your weekly newsletter from st barnabas/i.test(text) && text.length < 140) {
      bannerText = text;
      break;
    }
  }
  if (!date && bannerText) date = parseDate(bannerText);
  if (!date) {
    console.warn(`  no edition date in title or banner — using today.`);
    date = new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00Z');
  }
  const isoDate = date.toISOString().slice(0, 10);
  const displayDate = `${date.getUTCDate()} ${months[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
  const title = `Weekly News — ${displayDate}`;
  const slug = `weekly-news-${isoDate}`;
  const outPath = `${NEWS_DIR}/${slug}.md`;

  // -- dedupe: by uuid marker anywhere, then by slug (one post per edition date).
  if (uuid) {
    for (const [f, content] of newsFiles) {
      if (content.includes(uuid)) {
        console.log(`  ${title}: already imported (${f}) — skipping.`);
        return null;
      }
    }
  }
  if (await access(outPath).then(() => true, () => false)) {
    console.log(`  ${title}: a post for ${isoDate} already exists — skipping.`);
    return null;
  }

  // -- strip email chrome + standing boilerplate.
  let hero, heroAlt;
  let tailReached = false;
  for (const row of rows) {
    const $row = $(row);
    const text = $row.text().replace(/\s+/g, ' ').trim();
    const srcs = $row.find('img').toArray().map((i) => $(i).attr('src') || '');

    // Everything from the first standing-boilerplate block onward is email
    // furniture: Parish Office contact details, the Safeguarding block, Quick
    // Links, social icons, unsubscribe. The site has proper pages for all of it.
    if (!tailReached && /^(PARISH OFFICE|Quick Links|SAFEGUARDING)\b/i.test(text)) tailReached = true;
    if (
      tailReached ||
      /unsubscribe/i.test(text) ||
      /view (this email )?in (your )?browser/i.test(text) ||
      srcs.some((s) => s.includes('unlayer.com/social'))
    ) {
      $row.remove();
      continue;
    }
    if (!text && srcs.some((s) => /st\.barnabas\.logo/i.test(s))) {
      $row.remove();
      continue;
    }
    if (/your weekly newsletter from st barnabas/i.test(text) && text.length < 140) {
      $row.remove();
      continue;
    }
    if (!hero && !text && srcs.length === 1 && srcs[0]) {
      hero = srcs[0];
      heroAlt = ($($row.find('img')[0]).attr('alt') || '').trim() || undefined;
      $row.remove();
    }
  }

  // -- de-track links; repair malformed contact links.
  for (const a of $('a').toArray()) {
    const href = $(a).attr('href') || '';
    const text = $(a).text().trim();
    if (/^[\w.+-]+@[\w.-]+\.\w+$/.test(text) && !href.startsWith('mailto:')) {
      $(a).attr('href', `mailto:${text}`);
      continue;
    }
    if (/short\.churchdesk\.net/i.test(href)) {
      const dest = await resolveTracker(href);
      if (dest) $(a).attr('href', dest);
      else $(a).replaceWith($(a).contents());
    }
  }

  // -- images: download + optimise. Files written this run are tracked so the
  // refuse-to-publish path below can remove them again — otherwise a refusal would
  // leave orphan images for the workflow to commit beside no post.
  const created = [];
  if (hero) {
    try {
      const localised = await localiseImage(hero, created);
      hero = localised.path;
      await heroSiblings(hero, created);
    } catch (e) {
      console.warn(`  hero image failed (${e.message}) — post will have no hero`);
      hero = undefined;
    }
  }
  for (const img of $('img').toArray()) {
    const src = $(img).attr('src');
    if (!src) { $(img).remove(); continue; }
    try {
      const localised = await localiseImage(src, created);
      $(img).attr('src', localised.path);
      $(img).removeAttr('srcset');
      if (localised.width && localised.height) {
        $(img).attr('width', String(localised.width));
        $(img).attr('height', String(localised.height));
      }
      if (!($(img).attr('alt') || '').trim()) $(img).attr('alt', title);
    } catch (e) {
      console.warn(`  dropping image ${src.slice(0, 70)} (${e.message})`);
      $(img).remove();
    }
  }

  // -- to Markdown.
  let body = $('#root > .u-row-container')
    .toArray()
    .map((row) => td.turndown($(row).html() || ''))
    .filter((md) => md.trim())
    .join('\n\n')
    .replace(/^#{1,6}\s*$/gm, '') // empty headings the email editor leaves behind
    .replace(/^# /gm, '## ') // the post title is the page's only h1
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  // The standing tail (Parish Office contact block, Safeguarding block, Quick
  // Links) shares a row with real content, so it can survive the row-level strip;
  // cut the Markdown at the first boilerplate heading instead. Line-start match
  // only — prose merely mentioning safeguarding is untouched.
  const cut = body.search(/^(?:#{1,6}\s*)?(?:\*\*)?\s*(PARISH OFFICE|SAFEGUARDING|QUICK LINKS)/im);
  if (cut > 200) body = body.slice(0, cut).trim();
  if (body.length < 200) {
    console.warn(`  ${title}: converted body suspiciously short (${body.length} chars) — refusing to publish.`);
    await Promise.all(created.map((f) => rm(f, { force: true })));
    return null;
  }

  let description = body
    .split('\n')
    .map((l) => l.replace(/[#*_>\[\]!]|\(.*?\)|<[^>]+>/g, '').trim())
    .filter((l) => l.length > 40)[0];
  if (description && description.length > 160) {
    description = description.slice(0, 160).replace(/\s+\S*$/, '') + '…';
  }

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

  const marker = `<!-- churchdesk-message: ${uuid || 'email-' + createHash('md5').update(title + isoDate).digest('hex').slice(0, 12)} -->`;
  await writeFile(outPath, fm + marker + '\n\n' + body + '\n');
  console.log(`IMPORTED ${slug}`);
  return slug;
}

// Split a document's u-row-containers into editions on the recurring masthead
// logo. A single-edition document yields one segment.
function splitEditions(html) {
  const $ = cheerio.load(html);
  const rows = $('.u-row-container').toArray();
  if (!rows.length) return [];
  const starts = [];
  rows.forEach((row, i) => {
    const srcs = $(row).find('img').toArray().map((im) => $(im).attr('src') || '');
    if (srcs.some((s) => /st\.barnabas\.logo/i.test(s))) starts.push(i);
  });
  if (starts.length <= 1) return [rows.map((r) => $.html(r))];
  if (starts[0] !== 0) starts.unshift(0);
  return starts.map((s, j) => rows.slice(s, starts[j + 1] ?? rows.length).map((r) => $.html(r)));
}

// -------------------------------------------------------------------- main -----
await mkdir(NEWS_DIR, { recursive: true });
await mkdir(IMG_DIR, { recursive: true });
const newsFiles = await Promise.all(
  (await readdir(NEWS_DIR))
    .filter((f) => f.endsWith('.md'))
    .map(async (f) => [f, await readFile(`${NEWS_DIR}/${f}`, 'utf8')])
);

const args = process.argv.slice(2);
let imported = 0;

if (args[0] === '--html') {
  const html = await readFile(args[1], 'utf8');
  const titleIdx = args.indexOf('--title');
  const title = titleIdx > -1 ? args[titleIdx + 1] : undefined;
  const editions = splitEditions(html);
  if (!editions.length) {
    console.warn('No newsletter rows (.u-row-container) found in the HTML — nothing to import.');
  } else {
    console.log(`Found ${editions.length} edition(s) in the HTML.`);
    for (const rowsHtml of editions) {
      // Per-segment banner dates take precedence inside convertEdition; the
      // supplied title only helps a single-edition email.
      if ((await convertEdition({ rowsHtml, title: editions.length === 1 ? title : undefined, newsFiles })) !== null)
        imported++;
    }
  }
} else {
  let uuid;
  if (args[0]) {
    const m = args[0].match(UUID_RE);
    if (!m) throw new Error(`Could not find a message uuid in "${args[0]}"`);
    uuid = m[0];
  } else {
    const settings = JSON.parse(await readFile('src/content/settings/site.json', 'utf8'));
    const m = (settings.newsletterArchive || '').match(UUID_RE);
    if (!m) throw new Error(`newsletterArchive in settings/site.json has no message uuid`);
    uuid = m[0];
  }
  const res = await fetch(`https://api2.churchdesk.com/v2/people/messages/${uuid}/share`);
  if (!res.ok) throw new Error(`ChurchDesk share endpoint returned ${res.status} for ${uuid}`);
  const { title, rendered } = await res.json();
  if (!rendered) throw new Error('Share endpoint returned no rendered HTML');
  const [rowsHtml = []] = splitEditions(rendered);
  if ((await convertEdition({ rowsHtml, title, uuid, newsFiles })) !== null) imported++;
}

if (!imported) console.log('Nothing new imported.');
await stalenessCheck();
