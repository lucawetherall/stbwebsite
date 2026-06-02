// One-time blog migration: scrape the ChurchDesk /b/blog-* posts into the `news`
// content collection (Markdown + frontmatter), download in-body images, and emit a
// 301 redirect map. Run once, then commit the output.
//
//   node scripts/scrape-blog.mjs
//
// Selectors confirmed against a live post:
//   title    .cd-event-blog-title
//   date     .cd-blog-author-date  ("Published by NAME on Weekday, D Month YYYY HH:MM")
//   category .cd-blog-category-style ("# News")
//   body     .cd-blog-description
import { writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import * as cheerio from 'cheerio';
import TurndownService from 'turndown';

const ORIGIN = 'https://www.barnabites.org';
const td = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced', bulletListMarker: '-' });
td.remove(['script', 'style', 'noscript']);
// Emit images as raw HTML with lazy-loading/async-decoding (keeps perf without a
// build-time rehype plugin). Empty alts are filled with the post title in the loop below.
td.addRule('lazyImg', {
  filter: 'img',
  replacement: (_content, node) => {
    const src = node.getAttribute('src') || '';
    if (!src) return '';
    const alt = (node.getAttribute('alt') || '').replace(/"/g, '&quot;');
    return `<img src="${src}" alt="${alt}" loading="lazy" decoding="async">`;
  },
});

const months = 'January February March April May June July August September October November December'.split(' ');
function parseDate(s) {
  // "...on Tuesday, 15 November 2022 21:47"  ->  Date(2022, 10, 15)
  const m = s.match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
  if (!m) return null;
  const mon = months.findIndex((x) => x.toLowerCase() === m[2].toLowerCase());
  if (mon < 0) return null;
  return new Date(Date.UTC(Number(m[3]), mon, Number(m[1])));
}
const iso = (d) => d.toISOString().slice(0, 10);
const sanitize = (n) => n.replace(/[^\w.\-]/g, '_').slice(-80);

await mkdir('src/content/news', { recursive: true });
await mkdir('public/images/news', { recursive: true });

// 1) collect blog URLs from the sitemap
const sm = await (await fetch(`${ORIGIN}/sitemap.xml`)).text();
const urls = [...sm.matchAll(/<loc>([^<]+\/b\/blog-[^<]+)<\/loc>/g)].map((m) => m[1]);
console.log(`found ${urls.length} blog posts`);

const redirects = [];
const usedSlugs = new Set();
let ok = 0,
  noDate = 0,
  failed = 0;

for (const url of urls) {
  try {
    const html = await (await fetch(url)).text();
    const $ = cheerio.load(html);

    const title = ($('.cd-event-blog-title').first().text() || $('title').text()).trim().replace(/\s+/g, ' ');
    const authorDate = $('.cd-blog-author-date').first().text().replace(/\s+/g, ' ').trim();
    const date = parseDate(authorDate);
    if (!date) noDate++;
    const authorM = authorDate.match(/Published by\s+(.+?)\s+on\s/i);
    const author = authorM ? authorM[1].trim() : undefined;
    let category = $('.cd-blog-category-style').first().text().replace(/^[#\s]+/, '').trim() || undefined;
    if (category && /^news$/i.test(category)) category = 'News';

    const $body = $('.cd-blog-description').first();
    // drop any heading that just repeats the title (ChurchDesk wraps it in an <h5>)
    $body.find('h1, h2, h3, h4, h5, h6').each((_, el) => {
      if ($(el).text().trim().replace(/\s+/g, ' ') === title) $(el).remove();
    });
    $body.find('.blogShare, .rssicon, [class*="suggestion"]').remove();
    // strip a leading <strong>/<p> that only repeats the title
    const firstStrong = $body.children().first();
    if (firstStrong.length && firstStrong.text().trim().replace(/\s+/g, ' ') === title) firstStrong.remove();

    // download in-body images, rewrite src -> local
    for (const img of $body.find('img').toArray()) {
      const src = $(img).attr('src') || $(img).attr('data-src');
      if (!src) continue;
      const abs = new URL(src, ORIGIN).href;
      const base = sanitize(abs.split('/').pop().split('?')[0]) || 'image';
      const name = createHash('md5').update(abs).digest('hex').slice(0, 8) + '-' + base;
      try {
        const r = await fetch(abs);
        if (r.ok) {
          await writeFile(`public/images/news/${name}`, Buffer.from(await r.arrayBuffer()));
          $(img).attr('src', `/images/news/${name}`);
          $(img).removeAttr('srcset');
          $(img).removeAttr('data-src');
          if (!($(img).attr('alt') || '').trim()) $(img).attr('alt', title);
        }
      } catch {}
    }

    let md = td.turndown($body.html() || '').replace(/\n{3,}/g, '\n\n').trim();

    const legacy = new URL(url).pathname.replace(/^\//, ''); // b/blog-<id>-<slug>
    const idMatch = legacy.match(/^b\/blog-(\d+)/);
    let slug = legacy.replace(/^b\/blog-\d+-?/, '') || (idMatch ? `post-${idMatch[1]}` : legacy.replace(/^b\//, ''));
    slug = slug.replace(/[^a-z0-9-]/gi, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').toLowerCase();
    while (usedSlugs.has(slug)) slug += (idMatch ? `-${idMatch[1]}` : '-x');
    usedSlugs.add(slug);

    const fm = [
      '---',
      `title: ${JSON.stringify(title)}`,
      `date: ${date ? iso(date) : '2018-01-01'}`,
      category ? `category: ${JSON.stringify(category)}` : null,
      author ? `author: ${JSON.stringify(author)}` : null,
      `legacySlug: ${JSON.stringify(legacy)}`,
      '---',
      '',
      '',
    ].filter((x) => x !== null).join('\n');

    await writeFile(`src/content/news/${slug}.md`, fm + md + '\n');
    redirects.push(`/${legacy}  /news/${slug}/  301`);
    ok++;
    if (ok % 20 === 0) console.log(`  ...${ok}/${urls.length}`);
  } catch (e) {
    failed++;
    console.warn('FAILED', url, e.message);
  }
}

await writeFile('public/_redirects.blog', redirects.join('\n') + '\n');
console.log(`\nmigrated ${ok} posts (${noDate} without a parseable date, ${failed} failed)`);
console.log('wrote public/_redirects.blog');
