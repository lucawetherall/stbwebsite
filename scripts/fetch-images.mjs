// One-time: download the parish's own liturgy photography + affiliation marks
// from the live site and self-host optimised copies (per brief §12).
// Generates a 1280px responsive variant per hero and a 1200x630 OG image.
import { mkdir } from 'node:fs/promises';
import sharp from 'sharp';

const ORIGIN = 'https://www.barnabites.org';

const HEROES = [
  { src: '/uploads/0q9rhTuW/767x0_2560x0/Liturgythurible__msi___jpg.webp', name: 'thurible' },
  { src: '/uploads/mtiGyHv1/767x0_2560x0/liturgyprocession__msi___jpg.webp', name: 'procession' },
  { src: '/uploads/BeFU34EY/767x0_2560x0/liturgyaltar__msi___jpg.webp', name: 'altar' },
  { src: '/uploads/f18mcSd4/767x0_2560x0/localworship__msi___jpg.webp', name: 'worship' },
];
const MARKS = [
  { src: '/uploads/Q5ehiMQW/166x0_166x0/Inclusivechurchnewlogo__msi___png.webp', name: 'inclusive-church' },
  { src: '/uploads/JLT9WJum/241x0_241x0/CofE__msi___png.webp', name: 'cofe' },
];
const MISC = [
  { src: '/uploads/yODUMDnm/768x0_640x0/gardenbush__msi___jpeg.webp', name: 'garden' },
];

async function grab(path) {
  const res = await fetch(ORIGIN + path);
  if (!res.ok) throw new Error(`${res.status} ${path}`);
  return Buffer.from(await res.arrayBuffer());
}

await mkdir('public/images/hero', { recursive: true });
await mkdir('public/images/marks', { recursive: true });

for (const h of HEROES) {
  const buf = await grab(h.src);
  // 1920w large (capped from the 2560 source for LCP) + a 1280 responsive variant
  await sharp(buf).resize({ width: 1920, withoutEnlargement: true }).webp({ quality: 74 }).toFile(`public/images/hero/${h.name}.webp`);
  await sharp(buf).resize({ width: 1280 }).webp({ quality: 72 }).toFile(`public/images/hero/${h.name}-1280.webp`);
  console.log('hero', h.name);
}

for (const m of MARKS) {
  const buf = await grab(m.src);
  await sharp(buf).webp({ quality: 90 }).toFile(`public/images/marks/${m.name}.webp`);
  console.log('mark', m.name);
}

for (const m of MISC) {
  const buf = await grab(m.src);
  await sharp(buf).webp({ quality: 80 }).toFile(`public/images/${m.name}.webp`);
  console.log('misc', m.name);
}

// Default OG / social share image (1200x630, cover crop) from the thurible photo.
const thurible = await grab(HEROES[0].src);
await sharp(thurible)
  .resize({ width: 1200, height: 630, fit: 'cover', position: 'attention' })
  .jpeg({ quality: 82 })
  .toFile('public/images/og-default.jpg');
console.log('og-default.jpg');
