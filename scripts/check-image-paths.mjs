// scripts/check-image-paths.mjs
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

/** Pure: which of `refs` fail `exists`? De-duplicated, order-preserving. */
export function findMissingImages(refs, exists) {
  const seen = new Set();
  const missing = [];
  for (const ref of refs) {
    if (seen.has(ref)) continue;
    seen.add(ref);
    if (!exists(ref)) missing.push(ref);
  }
  return missing;
}

// --- runner (skipped under Vitest) ---
const IMG_RE = /["'(](\/images\/[^"')\s]+\.(?:webp|jpg|jpeg|png|gif|svg))/gi;

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (name === 'node_modules' || name.startsWith('.')) continue;
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(astro|ts|md|mdx|json|css)$/.test(name)) out.push(p);
  }
  return out;
}

function main() {
  const root = resolve(process.cwd());
  const refs = [];
  for (const file of walk(join(root, 'src'))) {
    const txt = readFileSync(file, 'utf8');
    for (const m of txt.matchAll(IMG_RE)) refs.push(m[1]);
  }
  const missing = findMissingImages(refs, (ref) => existsSync(join(root, 'public', ref)));
  if (missing.length) {
    console.error(`Missing image files referenced in src/:\n${missing.map((m) => '  ' + m).join('\n')}`);
    process.exit(1);
  }
  console.log('check:images — all referenced images exist.');
}

// Only run when invoked directly, not when imported by the test.
if (process.argv[1] && process.argv[1].endsWith('check-image-paths.mjs')) main();
