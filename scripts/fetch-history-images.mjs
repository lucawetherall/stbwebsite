// One-off: download the parish history photographs and self-host optimised webp copies.
// Source images live on barnabites.org.uk. The script tries the full-resolution original
// (size suffix stripped) first, then falls back to the given path.
import { mkdir } from 'node:fs/promises';
import sharp from 'sharp';

const ORIGIN = 'https://barnabites.org.uk';

const IMAGES = [
  // From /history/apse-painting/ — large panorama of the apse painting (hero image on History page)
  { name: 'apse-painting', src: '/wp-content/uploads/2015/09/clark-91.jpg' },
  // From /history/tinchurch/ — the corrugated-iron church drawing
  { name: 'tin-church', src: '/wp-content/uploads/2015/09/mapsandplans-6.jpg' },
  // From /history/photographs/ — early exterior photograph before war memorial
  { name: 'church-1916', src: '/wp-content/uploads/2015/09/barnabasbeforewarmemorial-250x152.jpg' },
  // From /history/shearmanchurches/ — exterior of St Barnabas showing west front with rose window
  { name: 'rose-window', src: '/wp-content/uploads/2015/09/barnabasext1-250x173.jpg' },
  // From /history/apse-painting/ — James Clark at work on the apse painting
  { name: 'clark-at-work', src: '/wp-content/uploads/2015/09/clark-101-131x178.jpg' },
  // From /history/stained-glass/ — sanctuary stained glass window (wider of the two main shots)
  { name: 'sanctuary-window', src: '/wp-content/uploads/2015/09/stainedglass-2-250x167.jpg' },
  // From /history/lady-chapel/ — the 1996 triptych (landscape photo)
  { name: 'lady-chapel-triptych', src: '/wp-content/uploads/2015/09/ladychapel-7-250x175.jpg' },
  // From /history/organ2011/ — the organ photograph
  { name: 'organ', src: '/wp-content/uploads/2015/09/MG_1315-250x167.jpg' },
];

const stripSize = (p) => p.replace(/-\d+x\d+(?=\.[a-z]+$)/i, '');

async function grab(path) {
  for (const candidate of [stripSize(path), path]) {
    try {
      const res = await fetch(ORIGIN + candidate);
      if (res.ok) {
        console.log(`  fetched: ${candidate}`);
        return Buffer.from(await res.arrayBuffer());
      }
      console.log(`  ${res.status} ${candidate}`);
    } catch (e) {
      console.log(`  error ${candidate}: ${e.message}`);
    }
  }
  throw new Error(`could not fetch ${path}`);
}

await mkdir('public/images/history', { recursive: true });
for (const img of IMAGES) {
  try {
    console.log(`\nFetching ${img.name}...`);
    const buf = await grab(img.src);
    await sharp(buf).resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 78 }).toFile(`public/images/history/${img.name}.webp`);
    console.log('ok  ', img.name);
  } catch (e) {
    console.log('FAIL', img.name, e.message);
  }
}
