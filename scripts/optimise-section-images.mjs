// Optimise the parish photo library for the site's section pages.
// Same convention as optimise-hire-images.mjs: each source JPEG → a ~1600w WebP
// (quality 78) plus a ~800w sibling (quality 74) for srcset. Idempotent.
//
// Publishing note: producing a file here does NOT publish it — a photo only goes
// live once a page references it. People-photos stay subject to the parish's
// photo-consent sign-off before that page is merged (spec §13).
import sharp from 'sharp';
import { mkdirSync, existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

// Encode to WebP under `targetKB`: step quality down from `startQ`, and if the
// quality floor still can't fit the budget, step the width down too. Keeps detail
// where the photo already fits; only a few high-frequency outdoor shots need more.
async function encodeUnder(src, maxWidth, targetKB, startQ = 74, minQ = 50) {
  const widths = [maxWidth, Math.round(maxWidth * 0.85), Math.round(maxWidth * 0.72)];
  let last;
  for (const width of widths) {
    for (let q = startQ; q >= minQ; q -= 6) {
      last = await sharp(src).rotate().resize({ width, withoutEnlargement: true }).webp({ quality: q }).toBuffer();
      if (last.length <= targetKB * 1024) return last;
    }
  }
  return last;
}

const SRC = '/Users/lucawetherall/Documents/st barnabas picture';

// area → { destName: sourcePath }
const AREAS = {
  worship: {
    'liturgy-procession': `${SRC}/2026 worship/liturgy procession.jpg`,
    'candlelit-mass': `${SRC}/church shots/full church candlelit landscape.jpg`,
    'sung-compline': `${SRC}/2026 worship/Sung Compline.jpeg`,
    'easter-eve': `${SRC}/2026 worship/Easter Eve 2026 lighting candle fire.jpeg`,
    'carols': `${SRC}/2026 worship/carols with church choir in cassocks.jpg`,
    'remembrance': `${SRC}/2026 worship/War Memorial Remembrance.jpg`,
    'liturgy-altar': `${SRC}/2026 worship/liturgy altar.jpg`,
  },
  'life-events': {
    'wedding-1': `${SRC}/2026 weddings etc/wedding 1.jpeg`,
    'wedding-2': `${SRC}/2026 weddings etc/wedding 2.jpeg`,
    'baptism': `${SRC}/2026 worship/baptism water.jpeg`,
  },
  community: {
    'summer-fayre-garden': `${SRC}/2026 community/Summer Fayre garden.jpg`,
    'frost-fair': `${SRC}/2026 community/Frost Fair view.jpg`,
    'fayre': `${SRC}/2026 community/fayre.jpeg`,
    'pantry': `${SRC}/2026 community/Pantry 1.jpg`,
    'quiz': `${SRC}/2026 community/Quiz 4.JPG`,
    'walk-of-witness': `${SRC}/2026 community/Good Friday walk of witness.jpeg`,
    'pets': `${SRC}/2026 community/pets 4.jpg`,
    'memory-cafe': `${SRC}/2026 community/Valerie drinks.jpeg`,
  },
  about: {
    'exterior-summer': `${SRC}/2026 exterior and interior shots/St B exterior summer.jpg`,
    'exterior-spring': `${SRC}/2026 exterior and interior shots/Exterior Spring.jpg`,
    'interior': `${SRC}/2026 exterior and interior shots/interior.jpeg`,
    'lady-chapel': `${SRC}/2026 exterior and interior shots/Lady Chapel.jpg`,
    'portal': `${SRC}/2026 exterior and interior shots/portal harvest.jpeg`,
    'reredos': `${SRC}/2026 exterior and interior shots/Reredos.jpg`,
  },
  music: {
    'choir-organ': `${SRC}/2026 choir/music choir and organ.jpg`,
    'choir-procession': `${SRC}/2026 choir/Choir procession 5.jpg`,
    'choir-loft': `${SRC}/2026 choir/choir loft.jpg`,
    'organ-recital': `${SRC}/2026 recordings and concerts/organ recital recording.jpeg`,
  },
  families: {
    'noisy-mass': `${SRC}/2026 youth/noisy mass.jpg`,
    'christmas-crafts': `${SRC}/2026 youth/walls of Bethlehem Christmas crafts.jpg`,
  },
};

let ok = 0, skipped = 0;
for (const [area, map] of Object.entries(AREAS)) {
  const out = join('public/images', area);
  mkdirSync(out, { recursive: true });
  for (const [dest, src] of Object.entries(map)) {
    if (!existsSync(src)) { console.warn(`SKIP (missing source): ${src}`); skipped++; continue; }
    writeFileSync(join(out, `${dest}.webp`), await encodeUnder(src, 1500, 290));
    writeFileSync(join(out, `${dest}-800.webp`), await encodeUnder(src, 800, 85));
    console.log(`✓ ${area}/${dest}`);
    ok++;
  }
}
console.log(`\nDone. ${ok} images (×2 widths), ${skipped} skipped. Review before committing.`);
