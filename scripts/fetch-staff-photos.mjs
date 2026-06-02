// One-time: download the Who's Who portraits from the live site and self-host
// optimised copies (mirrors scripts/fetch-images.mjs). For each person we try a
// few ChurchDesk size segments and keep the largest the server actually returns,
// then cap to 600px wide webp for a crisp portrait without bloating the page.
import { mkdir } from 'node:fs/promises';
import sharp from 'sharp';

const ORIGIN = 'https://www.barnabites.org';

// hash + filename identify the upload; `slug` is the local file we save as.
const PEOPLE = [
  { slug: 'sarah-howard-jones', hash: 'DgL1jD80', file: 'SHJ2__msi___jpeg.webp' },
  { slug: 'valerie-aitken', hash: 'gAooyJmu', file: 'Valerie__msi___jpg.webp' },
  { slug: 'jenny-krige', hash: 'jUgec6TC', file: 'thumbnail_img_5456_1__msi___jpg.webp' },
  { slug: 'felicity-mather', hash: 'HYzX0Krt', file: 'stb_.felicity.mather__msi___png.webp' },
  { slug: 'luca-wetherall', hash: 'qfDaOrCs', file: 'Lucaheadshot1__msi___jpg.webp' },
  { slug: 'nick-barnes', hash: 'HlgIaXUS', file: 'thumbnail_img_1664_1__msi___jpg.webp' },
];

// Largest first. ChurchDesk caps at the original (it does not upscale), so the
// biggest real width returned is the genuine source resolution.
const SIZES = ['1200x0_1200x0', '768x0_768x0', '600x0_600x0', '320x0_320x0', '96x0_96x0'];

async function grab(url) {
  const res = await fetch(url);
  if (!res.ok) return null;
  return Buffer.from(await res.arrayBuffer());
}

await mkdir('public/images/staff', { recursive: true });

for (const p of PEOPLE) {
  let best = null;
  let bestW = 0;
  let bestSize = null;
  for (const size of SIZES) {
    const buf = await grab(`${ORIGIN}/uploads/${p.hash}/${size}/${p.file}`);
    if (!buf) continue;
    const meta = await sharp(buf).metadata();
    if ((meta.width ?? 0) > bestW) {
      best = buf;
      bestW = meta.width ?? 0;
      bestSize = size;
    }
  }
  if (!best) {
    console.error('FAILED', p.slug);
    continue;
  }
  await sharp(best)
    .resize({ width: 600, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(`public/images/staff/${p.slug}.webp`);
  const out = await sharp(`public/images/staff/${p.slug}.webp`).metadata();
  console.log(`${p.slug.padEnd(20)} src ${String(bestW).padStart(4)}px via ${bestSize}  →  saved ${out.width}x${out.height}`);
}
