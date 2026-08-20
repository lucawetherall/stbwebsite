// Fold byte-identical newsletter images onto one file each. Idempotent.
//
// Until August 2026 the newsletter importer named every image with its edition date,
// so a picture recurring week after week (a poster, the giving banner) was committed
// again — identical bytes under a fresh URL — and returning readers re-downloaded a
// file they already had. The importer now names by source-URL hash alone; this script
// cleans up the archive the old scheme left behind:
//
//   1. group public/images/news originals (not -NNN siblings) by content hash;
//   2. keep the first of each group (stable choice: lexicographic), rewrite every
//      reference in src/content/news/*.md to it, delete the rest;
//   3. delete the orphaned -NNN siblings of removed files.
//
// Purely mechanical — src/hero paths only, no post wording is touched. Run
// generate-image-variants.mjs afterwards so kept heroes have their thumbnails.
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const IMG_DIR = 'public/images/news';
const NEWS_DIR = 'src/content/news';

const originals = readdirSync(IMG_DIR).filter((f) => !/-\d+\.(webp|jpe?g|png)$/i.test(f));
const byHash = new Map();
for (const file of originals) {
  const hash = createHash('sha256').update(readFileSync(join(IMG_DIR, file))).digest('hex');
  const group = byHash.get(hash);
  if (group) group.push(file);
  else byHash.set(hash, [file]);
}

const rename = new Map(); // duplicate name → canonical name
for (const group of byHash.values()) {
  if (group.length < 2) continue;
  const [keep, ...drop] = group.sort();
  for (const d of drop) rename.set(d, keep);
}

if (rename.size === 0) {
  console.log('No byte-identical duplicates — nothing to do.');
  process.exit(0);
}

let rewrites = 0;
for (const post of readdirSync(NEWS_DIR).filter((f) => f.endsWith('.md'))) {
  const path = join(NEWS_DIR, post);
  const before = readFileSync(path, 'utf8');
  let after = before;
  for (const [dup, keep] of rename) {
    after = after.split(`/images/news/${dup}`).join(`/images/news/${keep}`);
  }
  if (after !== before) {
    writeFileSync(path, after);
    rewrites++;
    console.log(`  rewrote ${post}`);
  }
}

let removed = 0;
let freed = 0;
const all = readdirSync(IMG_DIR);
for (const dup of rename.keys()) {
  const stem = dup.replace(/\.(webp|jpe?g|png)$/i, '');
  for (const file of all) {
    if (file === dup || file.match(new RegExp(`^${stem.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-\\d+\\.webp$`))) {
      freed += readFileSync(join(IMG_DIR, file)).length;
      rmSync(join(IMG_DIR, file));
      removed++;
      console.log(`  removed ${file}`);
    }
  }
}

console.log(
  `${rename.size} duplicate image(s) folded, ${rewrites} post(s) rewritten, ` +
    `${removed} file(s) removed (${(freed / 1024 / 1024).toFixed(1)}MB).`
);
