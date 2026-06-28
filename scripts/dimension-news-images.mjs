// One-off: stamp intrinsic width/height onto the migrated news <img> tags so the
// browser can reserve space before the image loads (eliminates layout shift / CLS
// on news article pages). The migrated posts embed raw <img> tags with no
// dimensions (see scrape-blog.mjs). Pairs with `img { height: auto }` in base.css
// so the fixed dimensions still scale down responsively.
//
// Safe to re-run: tags that already carry a width attribute are left untouched.
//
//   node scripts/dimension-news-images.mjs
//
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

const NEWS_DIR = 'src/content/news';
const PUBLIC = 'public';

const dimsCache = new Map();
async function dimsFor(srcPath) {
  if (dimsCache.has(srcPath)) return dimsCache.get(srcPath);
  const file = join(PUBLIC, srcPath);
  if (!existsSync(file)) {
    dimsCache.set(srcPath, null);
    return null;
  }
  const { width, height } = await sharp(file).metadata();
  const d = width && height ? { width, height } : null;
  dimsCache.set(srcPath, d);
  return d;
}

const mdFiles = (await readdir(NEWS_DIR)).filter((f) => f.endsWith('.md'));
const imgTag = /<img\b[^>]*>/g;
const srcAttr = /\bsrc="(\/images\/news\/[^"]+)"/;

let tagsStamped = 0;
let filesTouched = 0;
let missing = 0;

for (const md of mdFiles) {
  const path = join(NEWS_DIR, md);
  const text = await readFile(path, 'utf8');
  const tags = text.match(imgTag) ?? [];
  let out = text;
  let changed = false;

  for (const tag of tags) {
    if (/\bwidth=/.test(tag)) continue; // already dimensioned
    const m = tag.match(srcAttr);
    if (!m) continue;
    const dims = await dimsFor(m[1]);
    if (!dims) {
      missing++;
      continue;
    }
    // Insert the attributes just before the closing '>'.
    const stamped = tag.replace(/\s*>$/, ` width="${dims.width}" height="${dims.height}">`);
    out = out.replace(tag, stamped);
    changed = true;
    tagsStamped++;
  }

  if (changed) {
    await writeFile(path, out);
    filesTouched++;
  }
}

console.log(
  `Stamped ${tagsStamped} <img> tag(s) across ${filesTouched} file(s).` +
    (missing ? ` ${missing} skipped (file not found).` : '')
);
