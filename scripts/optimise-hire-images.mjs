// scripts/optimise-hire-images.mjs
import sharp from 'sharp';
import { mkdirSync, existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const SRC = '/Users/lucawetherall/Documents/st barnabas picture';
const OUT = 'public/images/hire';
mkdirSync(OUT, { recursive: true });
mkdirSync('public/images/uploads', { recursive: true });
if (!existsSync('public/images/uploads/.gitkeep')) writeFileSync('public/images/uploads/.gitkeep', '');

// dest (kebab) → source path. Prefer rooms / architecture / equipment (safeguarding).
const MAP = {
  'church-candlelit': `${SRC}/church shots/full church candlelit landscape atmospheric.jpg`,
  'radio3-broadcast': `${SRC}/2026 recordings and concerts/Radio3  imperial college broadcast recording.jpeg`,
  'recording-setup': `${SRC}/2026 recordings and concerts/recording set up in church.jpg`,
  'organ-recital': `${SRC}/2026 recordings and concerts/organ recital recording.jpeg`,
  'concert-choir-organ': `${SRC}/2026 choir/music choir and organ.jpg`,
  'church-interior': `${SRC}/2026 exterior and interior shots/interior.jpeg`,
  'hall-large': `${SRC}/2026 halls and lettings/Large hall 1.jpeg`,
  'hall-small': `${SRC}/2026 halls and lettings/small hall 1.jpeg`,
  'hall-kitchen': `${SRC}/2026 halls and lettings/kitchen.jpeg`,
  'halls-lobby': `${SRC}/2026 halls and lettings/halls lobby.jpeg`,
};

for (const [dest, src] of Object.entries(MAP)) {
  if (!existsSync(src)) { console.warn(`SKIP (missing source): ${src}`); continue; }
  await sharp(src).rotate().resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 78 }).toFile(join(OUT, `${dest}.webp`));
  await sharp(src).rotate().resize({ width: 800, withoutEnlargement: true }).webp({ quality: 74 }).toFile(join(OUT, `${dest}-800.webp`));
  console.log(`✓ ${dest}`);
}

// Film posters from YouTube thumbnails.
const FILMS = { 'film-alma-consort': 'x6XVNkIXqlU', 'film-continuum': 'tvX1nPE_fKc', 'film-merton': 'UIaTngP-l-4' };
for (const [dest, id] of Object.entries(FILMS)) {
  let buf = null;
  for (const q of ['maxresdefault', 'hqdefault']) {
    try {
      const res = await fetch(`https://i.ytimg.com/vi/${id}/${q}.jpg`);
      if (res.ok) { buf = Buffer.from(await res.arrayBuffer()); break; }
    } catch { /* try next */ }
  }
  if (!buf) { console.warn(`SKIP poster (no network?): ${dest}`); continue; }
  await sharp(buf).resize({ width: 1280, withoutEnlargement: true }).webp({ quality: 78 }).toFile(join(OUT, `${dest}.webp`));
  console.log(`✓ ${dest} (poster)`);
}
console.log('Done. Review the images before committing.');
