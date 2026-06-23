// One-off: download the parish history photographs and self-host optimised webp copies.
// Source images live on barnabites.org.uk. The script tries the full-resolution original
// (size suffix stripped) first, then falls back to the given path. The old WordPress site
// is fragile (intermittent 500/429), so each fetch is retried.
//
// Every source below was confirmed by VIEWING the fetched image against the chapter caption
// it serves (see scripts/list-history-images.mjs for the discovery + alt/caption text).
import { mkdir } from 'node:fs/promises';
import sharp from 'sharp';

const ORIGIN = 'https://barnabites.org.uk';

const IMAGES = [
  // HERO — /history/apsepaintingcurrent/  "Photo by John Salmon 2005": the completed apse
  // mural in situ (ranks of angels around the Trinity, both archangels, the high altar).
  { name: 'apse-painting', src: '/wp-content/uploads/2015/09/clark-121.jpg' },
  // /history/tinchurch/  "Drawing of the ‘Tin Church’": pencil sketch of the corrugated-iron
  // mission church (labelled "Corrugated Iron") with a floor plan.
  { name: 'tin-church', src: '/wp-content/uploads/2015/09/mapsandplans-4.jpg' },
  // /history/photographs/ — early B&W exterior of the brick church before the war memorial.
  { name: 'church-1916', src: '/wp-content/uploads/2015/09/barnabasbeforewarmemorial.jpg' },
  // /history/odds/  "West window": the west rose window in silhouette (radiating tracery,
  // dark stone against the light) — by John Salmon.
  { name: 'rose-window', src: '/wp-content/uploads/2015/09/shearman-12-191x178.jpg' },
  // /history/apse-painting/  "Clark working on the painting": James Clark in a tweed suit,
  // palette in hand, brush to the canvas among the painted figures.
  { name: 'clark-at-work', src: '/wp-content/uploads/2015/09/clark-111-137x178.jpg' },
  // /history/stained-glass/ — sanctuary lancet of SS Barnabas & Paul (Clayton & Bell, 1916),
  // two standing saints with predella scenes below.
  { name: 'sanctuary-window', src: '/wp-content/uploads/2015/09/IMG_9492-Window-SS-Barnabas-Paul-Resurrection-Feed-my-sheep4.jpg' },
  // /history/lady-chapel/  "The Lady Chapel Triptych": the 1996 three-panel painting —
  // Christ enthroned on the globe, Mary and Barnabas on the wings, haloes in gold.
  { name: 'lady-chapel-triptych', src: '/wp-content/uploads/2015/09/ladychapel-10-211x178.jpg' },
  // /history/organ2011/ — the organ in the west gallery beneath the rose window (David Park).
  { name: 'organ', src: '/wp-content/uploads/2015/09/MG_1315-250x167.jpg' },
];

const stripSize = (p) => p.replace(/-\d+x\d+(?=\.[a-z]+$)/i, '');

async function fetchOnce(url) {
  for (let i = 0; i < 6; i++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (history-migration)' } });
      if (res.ok) return Buffer.from(await res.arrayBuffer());
      console.log(`  ${res.status} ${url} (attempt ${i + 1})`);
    } catch (e) {
      console.log(`  error ${url}: ${e.message} (attempt ${i + 1})`);
    }
    await new Promise((r) => setTimeout(r, 700 * (i + 1)));
  }
  return null;
}

async function grab(path) {
  // Prefer the full-resolution original (size suffix stripped), then the sized path.
  for (const candidate of [...new Set([stripSize(path), path])]) {
    const buf = await fetchOnce(ORIGIN + candidate);
    if (buf) {
      console.log(`  fetched: ${candidate}`);
      return buf;
    }
  }
  throw new Error(`could not fetch ${path}`);
}

await mkdir('public/images/history', { recursive: true });
for (const img of IMAGES) {
  try {
    console.log(`\nFetching ${img.name}...`);
    const buf = await grab(img.src);
    await sharp(buf)
      .resize({ width: 1600, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(`public/images/history/${img.name}.webp`);
    console.log('ok  ', img.name);
  } catch (e) {
    console.log('FAIL', img.name, e.message);
  }
}
