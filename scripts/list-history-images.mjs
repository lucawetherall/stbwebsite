// One-off discovery: print every <img> on the relevant history archive pages with its
// src AND alt text (plus any nearby caption), so we can choose the right source for each
// target image (then strip any -WxH size suffix to fetch the original).
//
// The old WordPress site is fragile (intermittent 500/429) — so each page is retried.
const ORIGIN = 'https://barnabites.org.uk';
const PAGES = [
  '/history/tinchurch/',
  '/history/apse-painting/',
  '/history/apsepaintingcurrent/',
  '/history/stained-glass/',
  '/history/lady-chapel/',
  '/history/odds/',
  '/history/organ2011/',
  '/history/construction/',
  '/history/photographs/',
];

const decode = (s) =>
  (s || '')
    .replace(/&#8217;|&#x2019;/g, '’')
    .replace(/&#8216;|&#x2018;/g, '‘')
    .replace(/&#8220;/g, '“')
    .replace(/&#8221;/g, '”')
    .replace(/&#8211;/g, '–')
    .replace(/&#8212;/g, '—')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const attr = (tag, name) => {
  const m = tag.match(new RegExp(`${name}\\s*=\\s*["']([^"']*)["']`, 'i'));
  return m ? m[1] : '';
};

async function fetchWithRetry(url, tries = 5) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (history-migration)' } });
      if (res.ok) return await res.text();
      console.log(`  (attempt ${i + 1}: HTTP ${res.status})`);
    } catch (e) {
      console.log(`  (attempt ${i + 1}: ${e.message})`);
    }
    await new Promise((r) => setTimeout(r, 800 * (i + 1)));
  }
  throw new Error('all retries failed');
}

for (const page of PAGES) {
  console.log(`\n# ${page}`);
  let html;
  try {
    html = await fetchWithRetry(ORIGIN + page);
  } catch (e) {
    console.log(`  ERROR ${e.message}`);
    continue;
  }

  const imgs = [...html.matchAll(/<img[^>]*>/gi)].map((m) => m[0]);
  const seen = new Set();
  for (const tag of imgs) {
    const src = attr(tag, 'src');
    if (!src || seen.has(src)) continue;
    seen.add(src);
    const alt = decode(attr(tag, 'alt'));
    const title = decode(attr(tag, 'title'));

    // Try to find a caption near this image: a wp-caption block or a following <p>/figcaption.
    let caption = '';
    const idx = html.indexOf(tag);
    if (idx >= 0) {
      const after = html.slice(idx, idx + 600);
      const capM =
        after.match(/wp-caption-text[^>]*>([\s\S]*?)<\/(?:p|span|figcaption|div)>/i) ||
        after.match(/<figcaption[^>]*>([\s\S]*?)<\/figcaption>/i);
      if (capM) caption = decode(capM[1]);
    }

    console.log(`  src: ${src}`);
    if (alt) console.log(`    alt: ${alt}`);
    if (title) console.log(`    title: ${title}`);
    if (caption) console.log(`    caption: ${caption}`);
  }
}
