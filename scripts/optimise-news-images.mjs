// One-off optimisation: convert the migrated legacy news PNGs to WebP and
// rewrite the references in the news Markdown bodies. The migrated posts embed
// raw <img src="/images/news/…png"> tags (see scrape-blog.mjs); PNG screenshots
// are large and compress dramatically as WebP with no visible loss at this size.
//
// Safe to re-run: it skips PNGs that have already been converted/removed.
//
//   node scripts/optimise-news-images.mjs
//
import { readdir, readFile, writeFile, unlink, stat } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';

const IMG_DIR = 'public/images/news';
const NEWS_DIR = 'src/content/news';

const pngs = (await readdir(IMG_DIR)).filter((f) => f.toLowerCase().endsWith('.png'));
if (pngs.length === 0) {
  console.log('No PNGs to convert — nothing to do.');
  process.exit(0);
}

let before = 0;
let after = 0;
const renamed = new Map(); // old basename -> new basename

for (const png of pngs) {
  const src = join(IMG_DIR, png);
  const out = join(IMG_DIR, png.replace(/\.png$/i, '.webp'));
  const inBytes = (await stat(src)).size;
  // quality 80 keeps screenshot text crisp while shedding most of the weight.
  await sharp(src).webp({ quality: 80, effort: 6 }).toFile(out);
  const outBytes = (await stat(out)).size;
  await unlink(src);
  before += inBytes;
  after += outBytes;
  renamed.set(png, png.replace(/\.png$/i, '.webp'));
  console.log(`  ${png}  ${(inBytes / 1024).toFixed(0)}KB → ${(outBytes / 1024).toFixed(0)}KB`);
}

// Rewrite references in the news Markdown bodies.
const mdFiles = (await readdir(NEWS_DIR)).filter((f) => f.endsWith('.md'));
let filesTouched = 0;
for (const md of mdFiles) {
  const path = join(NEWS_DIR, md);
  let text = await readFile(path, 'utf8');
  let changed = false;
  for (const [oldName, newName] of renamed) {
    if (text.includes(oldName)) {
      text = text.split(oldName).join(newName);
      changed = true;
    }
  }
  if (changed) {
    await writeFile(path, text);
    filesTouched++;
  }
}

console.log(
  `\nConverted ${pngs.length} PNG → WebP: ${(before / 1024).toFixed(0)}KB → ${(after / 1024).toFixed(0)}KB ` +
    `(saved ${((1 - after / before) * 100).toFixed(0)}%). Rewrote ${filesTouched} Markdown file(s).`
);
