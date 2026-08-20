// Generate the responsive WebP siblings the components offer via srcset
// (src/lib/images.ts). Idempotent — run it after adding photos, any time.
//
// Unlike optimise-section-images.mjs this works from the *committed* WebPs, not the
// source JPEG library (which lives off-repo), so it only ever downscales — it never
// re-encodes a file at its own size, which would stack generation loss.
//
//   1. Section/hero library (/images/<area>/X.webp):
//        • X-1200.webp for any original ≥1400px wide that lacks one. Without it, a
//          desktop or high-density phone viewing a ~1100px hero slot is forced up to
//          the full 1600px file (250–400KB) — the main LCP cost on interior pages.
//        • regenerate an existing X-800.webp whose real width is under 800 despite the
//          original being wider (an early batch produced a few undersized ones, which
//          made their srcset descriptors lie).
//   2. News heroes (the `hero:` of every src/content/news post):
//        • X-256.webp — the 128px list thumbnail on /news and the homepage, where the
//          full newsletter image (~70–140KB each, ~1.4MB a page) was being served.
//        • X-800.webp for originals over 800px, for the thumbnail's full-width
//          phone layout.
import sharp from 'sharp';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const SECTION_DIRS = [
  'about', 'community', 'families', 'hero', 'hire', 'history', 'life-events', 'music', 'worship',
].map((d) => join('public/images', d));

let written = 0;
async function writeVariant(srcFile, outFile, width, quality) {
  await sharp(srcFile).resize({ width, withoutEnlargement: true }).webp({ quality, effort: 6 }).toFile(outFile);
  written++;
  console.log(`  ${outFile}`);
}

const isOriginal = (f) => f.endsWith('.webp') && !/-\d+\.webp$/.test(f);

for (const dir of SECTION_DIRS) {
  if (!existsSync(dir)) continue;
  for (const file of readdirSync(dir).filter(isOriginal)) {
    const srcFile = join(dir, file);
    const { width } = await sharp(srcFile).metadata();
    if (!width) continue;

    const at = (w) => srcFile.replace(/\.webp$/, `-${w}.webp`);
    if (width >= 1400 && !existsSync(at(1200))) await writeVariant(srcFile, at(1200), 1200, 74);

    if (existsSync(at(800))) {
      const sibling = await sharp(at(800)).metadata();
      const expected = Math.min(800, width);
      if ((sibling.width ?? 0) < expected) await writeVariant(srcFile, at(800), 800, 74);
    }
  }
}

// News heroes, from the posts' own frontmatter — only referenced images get thumbnails.
const heroes = new Set();
for (const post of readdirSync('src/content/news').filter((f) => f.endsWith('.md'))) {
  const m = readFileSync(join('src/content/news', post), 'utf8').match(/^hero:\s*"?(\/images\/news\/[^"\n]+\.webp)"?\s*$/m);
  if (m) heroes.add(m[1]);
}
for (const hero of heroes) {
  const srcFile = join('public', hero.slice(1));
  if (!existsSync(srcFile)) continue;
  const { width } = await sharp(srcFile).metadata();
  const at = (w) => srcFile.replace(/\.webp$/, `-${w}.webp`);
  if (!existsSync(at(256))) await writeVariant(srcFile, at(256), 256, 70);
  if ((width ?? 0) > 800 && !existsSync(at(800))) await writeVariant(srcFile, at(800), 800, 72);
}

console.log(written ? `${written} variant(s) written.` : 'Nothing to do — all variants present.');
