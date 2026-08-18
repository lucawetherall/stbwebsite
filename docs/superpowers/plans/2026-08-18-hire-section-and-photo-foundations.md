# Hire Section & Photo Foundations — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a proper top-level **Hire** section (Recordings / Concerts / Halls, with the old Venue Hire page moved under it), plus the reusable photo/video foundations (`Figure`, `YouTubeFacade`, an image-prep script and a broken-image build guard) that the wider photography rollout will reuse.

**Architecture:** Follows the site's established "settings JSON → typed `data/*.ts` wrapper (with a build guard) → dedicated `.astro` route" pattern (as used by the History page). All imagery stays as self-hosted public-path WebP (no `astro:assets`), optimised ahead of commit with `sharp`. Videos use a privacy-first click-to-load facade (`youtube-nocookie.com`, no third-party JS, no network until the visitor clicks). Editable content (rates, films, prose, galleries) lives in one CMS-managed `settings/hire.json`, dual-written to `public/admin/config.yml`.

**Tech Stack:** Astro 6 (static), TypeScript strict, plain CSS with design tokens, `sharp` (pre-commit image prep), Vitest (pure-logic unit tests), Sveltia CMS (`config.yml`).

**Testing note (important for this codebase):** there is **no component-render test harness** — the only unit tests are Vitest tests of pure `src/lib` logic. So we TDD the pure logic (`youtube.ts`, `assertHireSettings`, the image-path guard) with Vitest, and verify components/routes with `npx astro check` (0 errors), `npm run build` (0 errors, page count rises), and a browser preview pass. Do **not** invent a component test framework.

**Reference — source photo library:** `/Users/lucawetherall/Documents/st barnabas picture/` (folders `2026 recordings and concerts`, `2026 halls and lettings`, `church shots`, `2026 exterior and interior shots`).

**⚑ Safeguarding gate:** the Hire pages lean on rooms/architecture/equipment shots, which carry no consent issue. Do **not** publish images of identifiable people (especially children) until the parish confirms consent (spec §13). Choose crowd-free / architectural frames where a listed source photo contains recognisable faces.

---

## File Structure

**Create:**
- `src/lib/youtube.ts` — parse a YouTube URL → id / nocookie embed URL (pure, tested).
- `src/lib/youtube.test.ts` — Vitest tests for the above.
- `src/components/Figure.astro` — the house photo figure (contained, square, borderless, serif caption + credit, `srcset`).
- `src/components/YouTubeFacade.astro` — privacy-first click-to-load video.
- `scripts/optimise-hire-images.mjs` — sharp prep: source JPEGs → `public/images/hire/*.webp` (two widths + thumbs) + film posters.
- `scripts/check-image-paths.mjs` — build guard: every `/images/...` referenced in content/settings exists on disk.
- `scripts/check-image-paths.test.mjs` — Vitest test for its pure core.
- `src/content/settings/hire.json` — all editable Hire content (prose, rates, films, galleries).
- `src/data/hire.ts` — typed wrapper + `assertHireSettings` guard (mirrors `data/history.ts`).
- `src/data/hire.test.ts` — Vitest test for the guard.
- `src/pages/hire/index.astro` — Hire hub.
- `src/pages/hire/recordings.astro` — recordings (films + rate card + `VideoObject` JSON-LD).
- `src/pages/hire/concerts.astro` — concerts.
- `src/pages/hire/halls.astro` — halls (migrated Venue Hire content).

**Modify:**
- `src/data/nav.ts` — add the `Hire` tree; drop the footer `Venue hire` link.
- `public/admin/config.yml` — add the `hire` file-collection (dual-write of `hire.json`).
- `public/_redirects` — `/venue-hire` and `/venues` → `/hire/halls`.
- `package.json` — add `check:images` script; call it from the build guard step.

**Delete:**
- `src/pages/venue-hire.astro` — content moves to `src/pages/hire/halls.astro`.

---

## Task 1: YouTube URL helper (pure, TDD)

**Files:**
- Create: `src/lib/youtube.ts`
- Test: `src/lib/youtube.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/youtube.test.ts
import { describe, it, expect } from 'vitest';
import { youtubeId, youtubeEmbedUrl } from './youtube';

describe('youtubeId', () => {
  it('parses a standard watch URL', () => {
    expect(youtubeId('https://www.youtube.com/watch?v=x6XVNkIXqlU')).toBe('x6XVNkIXqlU');
  });
  it('parses a youtu.be short URL', () => {
    expect(youtubeId('https://youtu.be/tvX1nPE_fKc')).toBe('tvX1nPE_fKc');
  });
  it('throws on a non-YouTube URL', () => {
    expect(() => youtubeId('https://example.com/video')).toThrow();
  });
});

describe('youtubeEmbedUrl', () => {
  it('builds a privacy (nocookie) embed URL', () => {
    expect(youtubeEmbedUrl('https://www.youtube.com/watch?v=UIaTngP-l-4')).toBe(
      'https://www.youtube-nocookie.com/embed/UIaTngP-l-4'
    );
  });
});
```

- [ ] **Step 2: Run the test, verify it fails**

Run: `npx vitest run src/lib/youtube.test.ts`
Expected: FAIL — cannot resolve `./youtube`.

- [ ] **Step 3: Implement**

```ts
// src/lib/youtube.ts
// Accepts watch?v=, youtu.be/, /embed/ and /shorts/ forms; returns the 11-char id.
const ID_RE = /(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{11})/;

export function youtubeId(url: string): string {
  const match = ID_RE.exec(url);
  if (!match) throw new Error(`Not a recognised YouTube URL: ${url}`);
  return match[1];
}

/** Privacy-preserving embed URL — youtube-nocookie sets no cookies until playback. */
export function youtubeEmbedUrl(url: string): string {
  return `https://www.youtube-nocookie.com/embed/${youtubeId(url)}`;
}
```

- [ ] **Step 4: Run the test, verify it passes**

Run: `npx vitest run src/lib/youtube.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/youtube.ts src/lib/youtube.test.ts
git commit -m "feat: add YouTube URL → nocookie-embed helper (tested)"
```

---

## Task 2: `YouTubeFacade` component (privacy-first click-to-load)

**Files:**
- Create: `src/components/YouTubeFacade.astro`

- [ ] **Step 1: Create the component**

```astro
---
// src/components/YouTubeFacade.astro
import { youtubeEmbedUrl } from '../lib/youtube';

interface Props {
  url: string;        // any YouTube watch/short URL
  title: string;      // film title (announced to screen readers)
  poster: string;     // self-hosted poster image, /images/…
  posterAlt: string;
  credit?: string;    // e.g. "Alma Consort"
}
const { url, title, poster, posterAlt, credit } = Astro.props;
const embed = youtubeEmbedUrl(url) + '?autoplay=1&rel=0';
---
<figure class="yt">
  <button
    class="yt__btn"
    type="button"
    data-embed={embed}
    data-title={title}
    aria-label={`Play video: ${title}`}
  >
    <img class="yt__poster" src={poster} alt={posterAlt} loading="lazy" decoding="async" width="1280" height="720" />
    <span class="yt__play" aria-hidden="true"></span>
  </button>
  <figcaption class="yt__cap">
    <span class="yt__title">{title}</span>{credit && <span class="yt__credit"> — {credit}</span>}
  </figcaption>
</figure>

<script>
  document.querySelectorAll<HTMLButtonElement>('.yt__btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const embed = btn.dataset.embed!;
      const title = btn.dataset.title ?? 'Video';
      const iframe = document.createElement('iframe');
      iframe.src = embed;
      iframe.title = title;
      iframe.loading = 'lazy';
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
      iframe.setAttribute('allowfullscreen', '');
      iframe.className = 'yt__frame';
      btn.replaceWith(iframe);
      iframe.focus();
    });
  });
</script>

<style>
  .yt { margin: 0; }
  .yt__btn {
    display: block; width: 100%; padding: 0; border: none; cursor: pointer;
    position: relative; background: var(--paper-2); aspect-ratio: 16 / 9; overflow: hidden;
  }
  .yt__poster { width: 100%; height: 100%; object-fit: cover; display: block; }
  .yt__play {
    position: absolute; inset: 0; margin: auto; width: 4.2rem; height: 4.2rem;
    background: rgba(12, 9, 5, .55); border: 2px solid var(--white); border-radius: 50%;
  }
  .yt__play::after {
    content: ''; position: absolute; inset: 0; margin: auto;
    width: 0; height: 0; border-left: 1.2rem solid var(--white);
    border-top: .8rem solid transparent; border-bottom: .8rem solid transparent; transform: translateX(15%);
  }
  .yt__btn:hover .yt__play { background: var(--burgundy); }
  .yt__btn:focus-visible { outline: 2px solid var(--burgundy); outline-offset: 3px; }
  .yt__frame { width: 100%; aspect-ratio: 16 / 9; border: 0; display: block; }
  .yt__cap { margin-top: .5rem; font-family: var(--font-display); font-style: italic; color: var(--ink-soft); font-size: 1rem; }
  .yt__credit { color: var(--burgundy); font-style: normal; }
  @media (prefers-reduced-motion: reduce) { .yt__poster { transition: none; } }
</style>
```

- [ ] **Step 2: Type-check**

Run: `npx astro check`
Expected: 0 errors (component compiles; `youtubeEmbedUrl` import resolves).

- [ ] **Step 3: Commit**

```bash
git add src/components/YouTubeFacade.astro
git commit -m "feat: add privacy-first YouTube facade component"
```

---

## Task 3: `Figure` component (the house photo style)

**Files:**
- Create: `src/components/Figure.astro`

Design: contained image, **square corners, no border**, `object-fit: cover` in an aspect box (CLS-safe), italic-serif caption + optional credit. Two-width `srcset` from the naming convention `name.webp` (≈1600w) + `name-800.webp` (≈800w).

- [ ] **Step 1: Create the component**

```astro
---
// src/components/Figure.astro
interface Props {
  src: string;         // /images/… (the ~1600w WebP)
  alt: string;
  caption?: string;
  credit?: string;
  aspect?: string;     // CSS aspect-ratio for the frame, default "3 / 2"
  sizes?: string;
  eager?: boolean;     // set true for a page's lead image only
  class?: string;
}
const { src, alt, caption, credit, aspect = '3 / 2', sizes = '(max-width: 760px) 100vw, 720px', eager = false, class: klass } = Astro.props;
// Responsive sibling produced by the prep script: foo.webp → foo-800.webp
const src800 = src.replace(/\.webp$/, '-800.webp');
const srcset = `${src800} 800w, ${src} 1600w`;
---
<figure class:list={['figure', klass]}>
  <img
    src={src}
    srcset={srcset}
    sizes={sizes}
    alt={alt}
    style={`--figure-aspect:${aspect};`}
    loading={eager ? 'eager' : 'lazy'}
    decoding="async"
    fetchpriority={eager ? 'high' : undefined}
  />
  {caption && (
    <figcaption class="figure__cap">{caption}{credit && <span class="figure__credit"> · {credit}</span>}</figcaption>
  )}
</figure>

<style>
  .figure { margin: 0; }
  .figure img {
    width: 100%;
    aspect-ratio: var(--figure-aspect, 3 / 2);
    object-fit: cover;
    background: var(--paper-2);
    display: block;
  }
  .figure__cap {
    margin-top: .6rem;
    font-family: var(--font-display);
    font-style: italic;
    color: var(--ink-soft);
    font-size: 1.05rem;
    line-height: 1.4;
  }
  .figure__credit { font-style: normal; font-size: .82em; letter-spacing: .02em; color: var(--burgundy); }
</style>
```

- [ ] **Step 2: Type-check**

Run: `npx astro check`
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/Figure.astro
git commit -m "feat: add house-style Figure component (srcset, serif caption)"
```

---

## Task 4: Broken-image build guard (pure core, TDD)

**Files:**
- Create: `scripts/check-image-paths.mjs`, `scripts/check-image-paths.test.mjs`
- Modify: `package.json`

- [ ] **Step 1: Write the failing test**

```js
// scripts/check-image-paths.test.mjs
import { describe, it, expect } from 'vitest';
import { findMissingImages } from './check-image-paths.mjs';

describe('findMissingImages', () => {
  it('returns paths that do not exist', () => {
    const refs = ['/images/a.webp', '/images/b.webp'];
    const exists = (p) => p.endsWith('a.webp'); // only a exists
    expect(findMissingImages(refs, exists)).toEqual(['/images/b.webp']);
  });
  it('returns empty when all exist', () => {
    expect(findMissingImages(['/images/a.webp'], () => true)).toEqual([]);
  });
  it('de-duplicates references', () => {
    expect(findMissingImages(['/images/x.webp', '/images/x.webp'], () => false)).toEqual(['/images/x.webp']);
  });
});
```

- [ ] **Step 2: Run it, verify it fails**

Run: `npx vitest run scripts/check-image-paths.test.mjs`
Expected: FAIL — cannot resolve module.

- [ ] **Step 3: Implement**

```js
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
```

- [ ] **Step 4: Run it, verify it passes**

Run: `npx vitest run scripts/check-image-paths.test.mjs`
Expected: PASS (3 tests).

- [ ] **Step 5: Wire into package.json**

Add to `"scripts"`:
```json
"check:images": "node scripts/check-image-paths.mjs"
```

- [ ] **Step 6: Run the guard against the current tree**

Run: `npm run check:images`
Expected: `check:images — all referenced images exist.` (exit 0). If it fails, a referenced image is missing — fix before continuing.

- [ ] **Step 7: Commit**

```bash
git add scripts/check-image-paths.mjs scripts/check-image-paths.test.mjs package.json
git commit -m "feat: add build guard for missing image references (tested)"
```

---

## Task 5: Image-prep script + optimise the Hire photos

**Files:**
- Create: `scripts/optimise-hire-images.mjs`
- Produces: `public/images/hire/*.webp`, and `public/images/uploads/.gitkeep`

The script maps explicit **source → dest** pairs (source filenames have spaces/mixed case), emits each as `dest.webp` (≈1600w, quality 78) and `dest-800.webp` (≈800w, quality 74), plus gallery thumbs are covered by the same two-width output. It also downloads each film's YouTube poster (maxres→hq fallback) to `film-*.webp`.

- [ ] **Step 1: Create the script**

```js
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
```

- [ ] **Step 2: Run it**

Run: `node scripts/optimise-hire-images.mjs`
Expected: a `✓` line per image; files appear in `public/images/hire/`. If a poster is skipped for lack of network, note it — Task 6 falls back to a library photo poster for that film.

- [ ] **Step 3: Sanity-check sizes**

Run: `ls -lah public/images/hire | sort -k5 -h | tail`
Expected: every `.webp` well under 300 KB.

- [ ] **Step 4: Commit**

```bash
git add public/images/hire public/images/uploads/.gitkeep scripts/optimise-hire-images.mjs
git commit -m "chore: optimise Hire-section photos and film posters to WebP"
```

---

## Task 6: `settings/hire.json` (editable content)

**Files:**
- Create: `src/content/settings/hire.json`

Prose is drafted in the house voice (reverent, plain, UK English) and is fully editable in the CMS. If any `film-*.webp` poster was skipped in Task 5, set that film's `poster` to `/images/hire/concert-choir-organ.webp`.

- [ ] **Step 1: Create the file**

```json
{
  "hub": {
    "kicker": "Hire our space",
    "title": "Hire",
    "intro": "An exceptional space for recordings, concerts and events — with fine acoustics, a concert organ and a grand piano.",
    "description": "Hire St Barnabas, Ealing — the church for recordings and concerts, and two flexible halls for events and parties. Fine acoustics, a concert organ, a grand piano and convenient transport links.",
    "hero": { "image": "/images/hire/church-candlelit.webp", "alt": "The nave of St Barnabas lit by candlelight" },
    "body": [
      "The church itself is a valued place for recordings, rehearsals, filming and concerts, with fine acoustics, a concert-standard organ and a grand piano. Our two halls are flexible spaces for events and parties.",
      "Whatever you are planning, you are welcome to arrange a visit to see the space."
    ]
  },
  "recordings": {
    "kicker": "Hire our space",
    "title": "The church for recordings",
    "intro": "A warm, generous acoustic that ensembles and record labels return to.",
    "description": "Hire St Barnabas, Ealing for recording — a fine acoustic, a concert organ and a grand piano, used by professional choirs, orchestras and record labels.",
    "hero": { "image": "/images/hire/recording-setup.webp", "alt": "A recording session set up in the church" },
    "body": [
      "St Barnabas offers a warm, generous acoustic well suited to choral and instrumental recording, alongside a concert-standard organ and a grand piano. Professional ensembles and record labels record here regularly.",
      "Local ensembles are welcome at reduced rates. Organ and piano tuning can be arranged for an additional cost."
    ],
    "films": [
      { "youtubeUrl": "https://www.youtube.com/watch?v=x6XVNkIXqlU", "title": "Abide With Me (arr. Moses Hogan)", "ensemble": "Alma Consort", "poster": "/images/hire/film-alma-consort.webp", "posterAlt": "Alma Consort singing in the church" },
      { "youtubeUrl": "https://www.youtube.com/watch?v=tvX1nPE_fKc", "title": "Bring us, O Lord God — William Harris", "ensemble": "Continuum", "poster": "/images/hire/film-continuum.webp", "posterAlt": "The Continuum choir recording in the church" },
      { "youtubeUrl": "https://www.youtube.com/watch?v=UIaTngP-l-4", "title": "John Ireland: Greater Love", "ensemble": "Choir of Merton College & Britten Sinfonia (Delphian Records)", "poster": "/images/hire/film-merton.webp", "posterAlt": "Choir and orchestra recording in the church" }
    ],
    "gallery": [
      { "src": "/images/hire/radio3-broadcast.webp", "alt": "A live broadcast being recorded in the church" },
      { "src": "/images/hire/organ-recital.webp", "alt": "An organ recital being recorded" },
      { "src": "/images/hire/recording-setup.webp", "alt": "Microphones and cabling set up across the nave" }
    ]
  },
  "concerts": {
    "kicker": "Hire our space",
    "title": "The church for concerts",
    "intro": "A beautiful, resonant setting for choral and instrumental concerts.",
    "description": "Hire St Barnabas, Ealing for concerts — a resonant acoustic, a concert organ, a grand piano and a candlelit setting, with good sightlines and convenient transport.",
    "hero": { "image": "/images/hire/concert-choir-organ.webp", "alt": "Choir and organ in the church" },
    "body": [
      "St Barnabas is a beautiful and resonant setting for concerts, with a concert-standard organ, a grand piano and a candlelit atmosphere that audiences remember.",
      "To discuss dates, capacity and staging, please get in touch."
    ],
    "capacity": "",
    "gallery": [
      { "src": "/images/hire/church-candlelit.webp", "alt": "The church lit by candlelight" },
      { "src": "/images/hire/church-interior.webp", "alt": "The interior of St Barnabas looking towards the sanctuary" }
    ]
  },
  "halls": {
    "kicker": "Hire our space",
    "title": "Church halls",
    "intro": "Two flexible halls for events, parties and community gatherings.",
    "description": "Hire the church halls at St Barnabas, Ealing — flexible spaces for events and parties with a kitchen, disabled access, staging, a PA system and a projector.",
    "hero": { "image": "/images/hire/hall-large.webp", "alt": "The Large Hall at St Barnabas" },
    "body": [
      "Our two halls are flexible spaces for events and parties, equipped with a kitchen, disabled access, baby-changing, chairs, tables, a piano, staging, a PA system and a projector."
    ],
    "rates": [
      { "space": "Large Hall", "size": "56′ × 30′", "capacity": "180 standing · 150 theatre · 130 seated", "day": "£57 / hr", "eve": "£68 / hr" },
      { "space": "Small Hall", "size": "19′ × 30′", "capacity": "50 standing · 40 theatre · 24 seated", "day": "£40 / hr", "eve": "£47.50 / hr" },
      { "space": "Both Halls", "size": "—", "capacity": "Combined", "day": "£93 / hr", "eve": "£108 / hr" }
    ],
    "ratesNote": "Wedding receptions: £1,619 (9am–11pm). Availability: Monday–Saturday 8am–11pm, Sundays 1–6pm.",
    "gallery": [
      { "src": "/images/hire/hall-large.webp", "alt": "The Large Hall" },
      { "src": "/images/hire/hall-small.webp", "alt": "The Small Hall" },
      { "src": "/images/hire/hall-kitchen.webp", "alt": "The hall kitchen" },
      { "src": "/images/hire/halls-lobby.webp", "alt": "The halls lobby" }
    ]
  },
  "churchHireRates": [
    { "item": "Core hire of church", "rate": "£85 / hour" },
    { "item": "Use of the organ", "rate": "£102 / session" },
    { "item": "Use of concert grand piano", "rate": "£59 / session" },
    { "item": "Use of organ and concert grand piano", "rate": "£117.50 / session" },
    { "item": "Use of staging", "rate": "£54 / session" },
    { "item": "Choir Vestry or Gallery", "rate": "£27 / session" },
    { "item": "Both Choir Vestry and Gallery", "rate": "£43 / session" }
  ],
  "churchHireNote": "Organ and piano tuning can be arranged for an additional cost. Local ensembles are welcome at reduced rates."
}
```

- [ ] **Step 2: Commit**

```bash
git add src/content/settings/hire.json
git commit -m "feat: add editable Hire settings (prose, rates, films, galleries)"
```

---

## Task 7: `data/hire.ts` typed wrapper + guard (TDD)

**Files:**
- Create: `src/data/hire.ts`, `src/data/hire.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/data/hire.test.ts
import { describe, it, expect } from 'vitest';
import { assertHireSettings } from './hire';

const valid = {
  hub: { title: 'Hire' }, recordings: { title: 'R' }, concerts: { title: 'C' },
  halls: { title: 'H' }, churchHireRates: [{ item: 'Core', rate: '£85' }],
} as any;

describe('assertHireSettings', () => {
  it('passes a well-formed object', () => {
    expect(() => assertHireSettings(valid)).not.toThrow();
  });
  it('throws when a page title is empty', () => {
    expect(() => assertHireSettings({ ...valid, halls: { title: '' } })).toThrow(/halls\.title/);
  });
  it('throws when the church-hire rate card is empty', () => {
    expect(() => assertHireSettings({ ...valid, churchHireRates: [] })).toThrow(/churchHireRates/);
  });
});
```

- [ ] **Step 2: Run it, verify it fails**

Run: `npx vitest run src/data/hire.test.ts`
Expected: FAIL — cannot resolve `./hire`.

- [ ] **Step 3: Implement** (mirrors `src/data/history.ts`)

```ts
// src/data/hire.ts
import data from '../content/settings/hire.json';

export interface HireImage { image: string; alt: string; }
export interface GalleryImage { src: string; alt: string; }
export interface HireFilm { youtubeUrl: string; title: string; ensemble: string; poster: string; posterAlt: string; }
export interface HallRate { space: string; size: string; capacity: string; day: string; eve: string; }
export interface RateLine { item: string; rate: string; }

export interface HirePageBase { kicker: string; title: string; intro: string; description: string; hero: HireImage; body: string[]; }
export interface HireRecordings extends HirePageBase { films: HireFilm[]; gallery: GalleryImage[]; }
export interface HireConcerts extends HirePageBase { capacity: string; gallery: GalleryImage[]; }
export interface HireHalls extends HirePageBase { rates: HallRate[]; ratesNote: string; gallery: GalleryImage[]; }

export interface HireSettings {
  hub: HirePageBase;
  recordings: HireRecordings;
  concerts: HireConcerts;
  halls: HireHalls;
  churchHireRates: RateLine[];
  churchHireNote: string;
}

/** Throws (failing the build) if the editor has emptied a field a Hire page depends on. */
export function assertHireSettings(h: HireSettings): void {
  const required: Array<[string, unknown]> = [
    ['hub.title', h.hub?.title],
    ['recordings.title', h.recordings?.title],
    ['concerts.title', h.concerts?.title],
    ['halls.title', h.halls?.title],
    ['churchHireRates', h.churchHireRates?.length],
  ];
  const missing = required.filter(([, v]) => !v || String(v).trim() === '').map(([k]) => k);
  if (missing.length) {
    throw new Error(
      `hire.json is missing required field(s): ${missing.join(', ')}. ` +
        'Refusing to build with a broken Hire section.'
    );
  }
}

assertHireSettings(data as HireSettings);

export const hire: HireSettings = data as HireSettings;
```

- [ ] **Step 4: Run it, verify it passes**

Run: `npx vitest run src/data/hire.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/data/hire.ts src/data/hire.test.ts
git commit -m "feat: add typed Hire settings wrapper with build guard (tested)"
```

---

## Task 8: CMS dual-write — add the `hire` collection to `config.yml`

**Files:**
- Modify: `public/admin/config.yml`

Add this `files` collection immediately **after** the `history_page` collection (around line 260), mirroring its shape so an editor manages all Hire content in one screen. Media lands in `/images/hire`.

- [ ] **Step 1: Insert the collection**

```yaml
  - name: hire
    label: 🎟️ Hire section (rates, films, photos)
    description: Everything on the Hire pages — the church for recordings/concerts and the halls.
    files:
      - name: hire
        label: Hire pages
        file: src/content/settings/hire.json
        media_folder: /public/images/hire
        public_folder: /images/hire
        fields:
          - name: hub
            label: Hire — landing page
            widget: object
            fields:
              - { name: kicker, label: Kicker, widget: string }
              - { name: title, label: Title, widget: string }
              - { name: intro, label: Intro line, widget: text }
              - { name: description, label: Summary (for search engines), widget: text }
              - name: hero
                label: Hero photograph
                widget: object
                fields:
                  - { name: image, label: Image, widget: image, hint: 'Wide landscape photo, ~1600px.' }
                  - { name: alt, label: Image description (for screen readers), widget: string }
              - { name: body, label: Paragraphs, widget: list, field: { name: p, label: Paragraph, widget: text } }
          - name: recordings
            label: The church for recordings
            widget: object
            fields:
              - { name: kicker, label: Kicker, widget: string }
              - { name: title, label: Title, widget: string }
              - { name: intro, label: Intro line, widget: text }
              - { name: description, label: Summary (for search engines), widget: text }
              - name: hero
                label: Hero photograph
                widget: object
                fields:
                  - { name: image, label: Image, widget: image }
                  - { name: alt, label: Image description, widget: string }
              - { name: body, label: Paragraphs, widget: list, field: { name: p, label: Paragraph, widget: text } }
              - name: films
                label: Featured films
                widget: list
                summary: '{{fields.title}} — {{fields.ensemble}}'
                fields:
                  - { name: youtubeUrl, label: YouTube link, widget: string, hint: 'Paste the normal watch?v= link.' }
                  - { name: title, label: Title, widget: string }
                  - { name: ensemble, label: Ensemble / credit, widget: string }
                  - { name: poster, label: Poster image, widget: image }
                  - { name: posterAlt, label: Poster description, widget: string }
              - name: gallery
                label: Photo gallery
                widget: list
                fields:
                  - { name: src, label: Image, widget: image }
                  - { name: alt, label: Image description, widget: string }
          - name: concerts
            label: The church for concerts
            widget: object
            fields:
              - { name: kicker, label: Kicker, widget: string }
              - { name: title, label: Title, widget: string }
              - { name: intro, label: Intro line, widget: text }
              - { name: description, label: Summary (for search engines), widget: text }
              - name: hero
                label: Hero photograph
                widget: object
                fields:
                  - { name: image, label: Image, widget: image }
                  - { name: alt, label: Image description, widget: string }
              - { name: body, label: Paragraphs, widget: list, field: { name: p, label: Paragraph, widget: text } }
              - { name: capacity, label: Concert capacity (leave blank until confirmed), widget: string, required: false }
              - name: gallery
                label: Photo gallery
                widget: list
                fields:
                  - { name: src, label: Image, widget: image }
                  - { name: alt, label: Image description, widget: string }
          - name: halls
            label: Church halls
            widget: object
            fields:
              - { name: kicker, label: Kicker, widget: string }
              - { name: title, label: Title, widget: string }
              - { name: intro, label: Intro line, widget: text }
              - { name: description, label: Summary (for search engines), widget: text }
              - name: hero
                label: Hero photograph
                widget: object
                fields:
                  - { name: image, label: Image, widget: image }
                  - { name: alt, label: Image description, widget: string }
              - { name: body, label: Paragraphs, widget: list, field: { name: p, label: Paragraph, widget: text } }
              - name: rates
                label: Hall rates
                widget: list
                summary: '{{fields.space}}'
                fields:
                  - { name: space, label: Space, widget: string }
                  - { name: size, label: Size, widget: string }
                  - { name: capacity, label: Capacity, widget: string }
                  - { name: day, label: Daytime rate, widget: string }
                  - { name: eve, label: Evening rate, widget: string }
              - { name: ratesNote, label: Note under the table, widget: text }
              - name: gallery
                label: Photo gallery
                widget: list
                fields:
                  - { name: src, label: Image, widget: image }
                  - { name: alt, label: Image description, widget: string }
          - name: churchHireRates
            label: Church-hire rate card (recordings & concerts)
            widget: list
            summary: '{{fields.item}} — {{fields.rate}}'
            fields:
              - { name: item, label: Item, widget: string }
              - { name: rate, label: Rate, widget: string }
          - { name: churchHireNote, label: Note under the rate card, widget: text }
```

- [ ] **Step 2: Verify the YAML parses**

Run: `node -e "import('js-yaml').then(y=>y.load(require('fs').readFileSync('public/admin/config.yml','utf8'))).then(()=>console.log('config.yml OK'))"`
(If `js-yaml` is not installed, instead confirm the build in Task 14 passes — Sveltia parses it at runtime; a YAML error would be visible in `/admin`.)
Expected: `config.yml OK`.

- [ ] **Step 3: Commit**

```bash
git add public/admin/config.yml
git commit -m "feat: dual-write Hire settings into the CMS config"
```

---

## Task 9: Hire hub route (`/hire`)

**Files:**
- Create: `src/pages/hire/index.astro`

- [ ] **Step 1: Create the route**

```astro
---
import Base from '../../layouts/Base.astro';
import PageHeader from '../../components/PageHeader.astro';
import Figure from '../../components/Figure.astro';
import { hire } from '../../data/hire';
const { hub } = hire;
const cards = [
  { href: '/hire/recordings', title: hire.recordings.title, blurb: hire.recordings.intro },
  { href: '/hire/concerts', title: hire.concerts.title, blurb: hire.concerts.intro },
  { href: '/hire/halls', title: hire.halls.title, blurb: hire.halls.intro },
];
---
<Base title="Hire our space in Ealing" breadcrumbTitle="Hire" description={hub.description} image={hub.hero.image}>
  <PageHeader kicker={hub.kicker} title={hub.title} intro={hub.intro} />
  <div class="wrap page-body">
    <Figure src={hub.hero.image} alt={hub.hero.alt} eager aspect="16 / 9" />
    <div class="prose">{hub.body.map((p) => <p>{p}</p>)}</div>
    <nav class="hire-cards" aria-label="What you can hire">
      {cards.map((c) => (
        <a class="hire-card" href={c.href}>
          <h2 class="hire-card__title">{c.title}</h2>
          <p class="hire-card__blurb">{c.blurb}</p>
          <span class="hire-card__go label">Find out more &rarr;</span>
        </a>
      ))}
    </nav>
  </div>
</Base>

<style>
  .page-body { padding-top: 1.5rem; padding-bottom: clamp(3rem, 7vw, 6rem); }
  .prose { margin-top: 1.6rem; }
  .hire-cards { margin-top: 2.6rem; display: grid; gap: 1rem; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); }
  .hire-card { display: block; padding: 1.4rem 1.5rem; border: 1px solid var(--line); text-decoration: none; color: inherit; }
  .hire-card:hover { border-color: var(--burgundy); }
  .hire-card__title { font-size: 1.5rem; margin-bottom: .4rem; }
  .hire-card__blurb { color: var(--ink-soft); }
  .hire-card__go { display: inline-block; margin-top: 1rem; color: var(--burgundy); }
</style>
```

- [ ] **Step 2: Type-check**

Run: `npx astro check`
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/hire/index.astro
git commit -m "feat: add Hire hub page"
```

---

## Task 10: Recordings route (`/hire/recordings`) — films, rate card, JSON-LD

**Files:**
- Create: `src/pages/hire/recordings.astro`

- [ ] **Step 1: Create the route**

```astro
---
import Base from '../../layouts/Base.astro';
import PageHeader from '../../components/PageHeader.astro';
import Figure from '../../components/Figure.astro';
import Gallery from '../../components/Gallery.astro';
import YouTubeFacade from '../../components/YouTubeFacade.astro';
import { hire } from '../../data/hire';
import { youtubeId } from '../../lib/youtube';
import { site } from '../../data/site';

const r = hire.recordings;
const videoLd = r.films.map((f) => ({
  '@context': 'https://schema.org',
  '@type': 'VideoObject',
  name: f.title,
  description: `${f.title} — recorded at St Barnabas, Ealing by ${f.ensemble}.`,
  thumbnailUrl: `${site.url}${f.poster}`,
  contentUrl: f.youtubeUrl,
  embedUrl: `https://www.youtube-nocookie.com/embed/${youtubeId(f.youtubeUrl)}`,
}));
---
<Base title="Hire the church for recordings — Ealing" breadcrumbTitle="Recordings" description={r.description} image={r.hero.image}>
  <PageHeader kicker={r.kicker} title={r.title} intro={r.intro} />
  <div class="wrap page-body">
    <Figure src={r.hero.image} alt={r.hero.alt} eager aspect="16 / 9" />
    <div class="prose">{r.body.map((p) => <p>{p}</p>)}</div>

    <section class="hire-section">
      <h2 class="label hire-section__label">Recorded here</h2>
      <div class="films">
        {r.films.map((f) => (
          <YouTubeFacade url={f.youtubeUrl} title={f.title} poster={f.poster} posterAlt={f.posterAlt} credit={f.ensemble} />
        ))}
      </div>
    </section>

    <section class="hire-section">
      <h2 class="label hire-section__label">Recording &amp; concert hire rates</h2>
      <div class="rate-table-wrap">
        <table class="rate-table">
          <thead><tr><th scope="col">Item</th><th scope="col">Rate</th></tr></thead>
          <tbody>
            {hire.churchHireRates.map((row) => (<tr><th scope="row">{row.item}</th><td>{row.rate}</td></tr>))}
          </tbody>
        </table>
      </div>
      <p class="venue-note">{hire.churchHireNote} See also the <a class="content-link" href="/music/st-barnabas-organ">St Barnabas organ</a>.</p>
    </section>

    <section class="hire-section">
      <h2 class="label hire-section__label">The space</h2>
      <Gallery images={r.gallery} />
    </section>

    <section class="hire-section">
      <h2 class="label hire-section__label">How to book</h2>
      <p>To arrange a recording, contact the parish office on <a class="content-link" href={`tel:${site.phoneIntl.replace(/\s+/g, '')}`}>{site.phone}</a> or <a class="content-link" href={`mailto:${site.emails.office}`}>{site.emails.office}</a>.</p>
    </section>
  </div>
  <script type="application/ld+json" set:html={JSON.stringify(videoLd)} />
</Base>

<style>
  .page-body { padding-top: 1.5rem; padding-bottom: clamp(3rem, 7vw, 6rem); }
  .prose { margin-top: 1.6rem; }
  .hire-section { margin-top: 2.8rem; }
  .hire-section__label { color: var(--burgundy); display: block; margin-bottom: 1.2rem; }
  .films { display: grid; gap: 1.6rem; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); }
  .rate-table-wrap { overflow-x: auto; }
  .rate-table { width: 100%; border-collapse: collapse; }
  .rate-table th, .rate-table td { text-align: left; padding: .8rem 1rem; border-bottom: 1px solid var(--line); }
  .rate-table thead th { font-family: var(--font-ui); text-transform: uppercase; letter-spacing: .1em; font-size: .66rem; font-weight: 600; color: var(--burgundy); border-bottom-color: var(--ink); }
  .rate-table tbody th { font-weight: 600; }
  .venue-note { margin-top: 1.2rem; color: var(--ink-soft); }
</style>
```

- [ ] **Step 2: Type-check + build**

Run: `npx astro check && npm run build`
Expected: 0 errors; `/hire/recordings` in the output.

- [ ] **Step 3: Commit**

```bash
git add src/pages/hire/recordings.astro
git commit -m "feat: add Recordings hire page (films, rate card, VideoObject JSON-LD)"
```

---

## Task 11: Concerts route (`/hire/concerts`)

**Files:**
- Create: `src/pages/hire/concerts.astro`

- [ ] **Step 1: Create the route**

```astro
---
import Base from '../../layouts/Base.astro';
import PageHeader from '../../components/PageHeader.astro';
import Figure from '../../components/Figure.astro';
import Gallery from '../../components/Gallery.astro';
import { hire } from '../../data/hire';
import { site } from '../../data/site';
const c = hire.concerts;
---
<Base title="Hire the church for concerts — Ealing" breadcrumbTitle="Concerts" description={c.description} image={c.hero.image}>
  <PageHeader kicker={c.kicker} title={c.title} intro={c.intro} />
  <div class="wrap page-body">
    <Figure src={c.hero.image} alt={c.hero.alt} eager aspect="16 / 9" />
    <div class="prose">{c.body.map((p) => <p>{p}</p>)}</div>

    <section class="hire-section">
      <h2 class="label hire-section__label">Recording &amp; concert hire rates</h2>
      <div class="rate-table-wrap">
        <table class="rate-table">
          <thead><tr><th scope="col">Item</th><th scope="col">Rate</th></tr></thead>
          <tbody>{hire.churchHireRates.map((row) => (<tr><th scope="row">{row.item}</th><td>{row.rate}</td></tr>))}</tbody>
        </table>
      </div>
      <p class="venue-note">{hire.churchHireNote}</p>
      {c.capacity && <p class="venue-note">Capacity: {c.capacity}.</p>}
    </section>

    <section class="hire-section">
      <h2 class="label hire-section__label">The space</h2>
      <Gallery images={c.gallery} />
    </section>

    <section class="hire-section">
      <h2 class="label hire-section__label">How to book</h2>
      <p>To discuss a concert, contact the parish office on <a class="content-link" href={`tel:${site.phoneIntl.replace(/\s+/g, '')}`}>{site.phone}</a> or <a class="content-link" href={`mailto:${site.emails.office}`}>{site.emails.office}</a>. Upcoming concerts appear on <a class="content-link" href="/whats-on">What's On</a>.</p>
    </section>
  </div>
</Base>

<style>
  .page-body { padding-top: 1.5rem; padding-bottom: clamp(3rem, 7vw, 6rem); }
  .prose { margin-top: 1.6rem; }
  .hire-section { margin-top: 2.8rem; }
  .hire-section__label { color: var(--burgundy); display: block; margin-bottom: 1.2rem; }
  .rate-table-wrap { overflow-x: auto; }
  .rate-table { width: 100%; border-collapse: collapse; }
  .rate-table th, .rate-table td { text-align: left; padding: .8rem 1rem; border-bottom: 1px solid var(--line); }
  .rate-table thead th { font-family: var(--font-ui); text-transform: uppercase; letter-spacing: .1em; font-size: .66rem; font-weight: 600; color: var(--burgundy); border-bottom-color: var(--ink); }
  .rate-table tbody th { font-weight: 600; }
  .venue-note { margin-top: 1.2rem; color: var(--ink-soft); }
</style>
```

- [ ] **Step 2: Type-check**

Run: `npx astro check`
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/hire/concerts.astro
git commit -m "feat: add Concerts hire page"
```

---

## Task 12: Halls route (`/hire/halls`) — migrate the Venue Hire content

**Files:**
- Create: `src/pages/hire/halls.astro`

- [ ] **Step 1: Create the route**

```astro
---
import Base from '../../layouts/Base.astro';
import PageHeader from '../../components/PageHeader.astro';
import Figure from '../../components/Figure.astro';
import Gallery from '../../components/Gallery.astro';
import { hire } from '../../data/hire';
import { site } from '../../data/site';
const h = hire.halls;
---
<Base title="Hall & Venue Hire in Ealing" breadcrumbTitle="Halls" description={h.description} image={h.hero.image}>
  <PageHeader kicker={h.kicker} title={h.title} intro={h.intro} />
  <div class="wrap page-body">
    <Figure src={h.hero.image} alt={h.hero.alt} eager aspect="16 / 9" />
    <div class="prose">{h.body.map((p) => <p>{p}</p>)}</div>

    <section class="hire-section">
      <h2 class="label hire-section__label">The halls at a glance</h2>
      <div class="rate-table-wrap">
        <table class="rate-table">
          <thead>
            <tr><th scope="col">Space</th><th scope="col">Size</th><th scope="col">Capacity</th><th scope="col">Daytime<span class="rate-table__sub">to 6pm</span></th><th scope="col">Evening<span class="rate-table__sub">6–11pm</span></th></tr>
          </thead>
          <tbody>
            {h.rates.map((row) => (<tr><th scope="row">{row.space}</th><td>{row.size}</td><td>{row.capacity}</td><td>{row.day}</td><td>{row.eve}</td></tr>))}
          </tbody>
        </table>
      </div>
      <p class="venue-note" set:html={h.ratesNote} />
    </section>

    <section class="hire-section">
      <h2 class="label hire-section__label">The spaces</h2>
      <Gallery images={h.gallery} />
    </section>

    <section class="hire-section">
      <h2 class="label hire-section__label">How to book</h2>
      <p>To check availability or arrange a visit, contact <strong>Sanjit Sil</strong> at the parish office on <a class="content-link" href={`tel:${site.phoneIntl.replace(/\s+/g, '')}`}>{site.phone}</a> or <a class="content-link" href={`mailto:${site.emails.office}`}>{site.emails.office}</a>. You can also <a class="content-link" href="/documents">download a booking form</a>.</p>
    </section>
  </div>
</Base>

<style>
  .page-body { padding-top: 1.5rem; padding-bottom: clamp(3rem, 7vw, 6rem); }
  .prose { margin-top: 1.6rem; }
  .hire-section { margin-top: 2.8rem; }
  .hire-section__label { color: var(--burgundy); display: block; margin-bottom: 1.2rem; }
  .rate-table-wrap { overflow-x: auto; }
  .rate-table { width: 100%; border-collapse: collapse; font-size: .98rem; }
  .rate-table th, .rate-table td { text-align: left; padding: .9rem 1rem; border-bottom: 1px solid var(--line); vertical-align: top; }
  .rate-table thead th { font-family: var(--font-ui); text-transform: uppercase; letter-spacing: .1em; font-size: .66rem; font-weight: 600; color: var(--burgundy); border-bottom-color: var(--ink); }
  .rate-table tbody th { font-family: var(--font-display); font-weight: 600; font-size: 1.2rem; }
  .rate-table__sub { display: block; text-transform: none; letter-spacing: 0; font-size: .62rem; color: var(--ink-soft); font-weight: 400; margin-top: .15rem; }
  .venue-note { margin-top: 1.2rem; color: var(--ink-soft); }
</style>
```

- [ ] **Step 2: Type-check**

Run: `npx astro check`
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/hire/halls.astro
git commit -m "feat: add Halls hire page (migrated from venue-hire)"
```

---

## Task 13: Retire `/venue-hire` and add redirects

**Files:**
- Delete: `src/pages/venue-hire.astro`
- Modify: `public/_redirects`

- [ ] **Step 1: Delete the old route**

```bash
git rm src/pages/venue-hire.astro
```

- [ ] **Step 2: Update `public/_redirects`** — replace the existing `/venues` line and add `/venue-hire`. Find:

```
# Thin /venues page merged into /venue-hire
/venues  /venue-hire/  301
```

Replace with:

```
# Venue hire became the Hire section; halls live at /hire/halls
/venues       /hire/halls  301
/venue-hire   /hire/halls  301
```

- [ ] **Step 3: Confirm nothing else links to `/venue-hire`**

Run: `grep -rn "/venue-hire" src public/admin | grep -v _redirects`
Expected: no results (the nav link is handled in Task 14).

- [ ] **Step 4: Commit**

```bash
git add -A src/pages/venue-hire.astro public/_redirects
git commit -m "feat: redirect /venue-hire and /venues to /hire/halls"
```

---

## Task 14: Navigation — add the Hire tree

**Files:**
- Modify: `src/data/nav.ts`

- [ ] **Step 1: Add `Hire` to the top band.** In `src/data/nav.ts`, insert this object **after** the `Community` block and **before** `{ label: 'News', href: '/news' }`:

```ts
  {
    label: 'Hire',
    href: '/hire',
    children: [
      { label: 'Recordings', href: '/hire/recordings' },
      { label: 'Concerts', href: '/hire/concerts' },
      { label: 'Halls', href: '/hire/halls' },
    ],
  },
```

- [ ] **Step 2: Remove the old footer link.** In the same file, delete this line from `utilityNav`:

```ts
  { label: 'Venue hire', href: '/venue-hire' },
```

- [ ] **Step 3: Type-check**

Run: `npx astro check`
Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/data/nav.ts
git commit -m "feat: add Hire to the primary navigation"
```

---

## Task 15: Full verification pass

- [ ] **Step 1: Unit tests**

Run: `npm test`
Expected: all pass, including the new `youtube` and `hire` tests. (The image-guard test lives under `scripts/` and was run explicitly in Task 4; if `npm test`'s config does not include `scripts/`, run `npx vitest run scripts/check-image-paths.test.mjs` as well.)

- [ ] **Step 2: Image guard**

Run: `npm run check:images`
Expected: `all referenced images exist.`

- [ ] **Step 3: Type-check + build**

Run: `npx astro check && npm run build`
Expected: 0 errors; the build lists `/hire`, `/hire/recordings`, `/hire/concerts`, `/hire/halls`; page count rises by ~4; Pagefind index builds; no `/venue-hire` page.

- [ ] **Step 4: Dual-write sanity check**

Confirm `hire.json`'s shape matches the `hire` fields in `public/admin/config.yml` (every JSON key has a field; every field maps to a key). Confirm `src/content.config.ts` is unchanged (settings files are imported directly, not a content collection — correct).

- [ ] **Step 5: Preview pass** — `npm run preview`, then check in the browser:
  - `/hire` hub — three cards, hero renders, links work.
  - `/hire/recordings` — three film posters show; clicking one loads the player (no cookies before click); rate table correct; organ cross-link works. **If the player fails to load, check `public/_headers` for a Content-Security-Policy `frame-src`; if present, add `https://www.youtube-nocookie.com` to it.**
  - `/hire/concerts` — rate table + gallery; capacity line hidden (blank).
  - `/hire/halls` — halls table matches the old page; gallery lightbox opens; booking details correct.
  - Visit `/venue-hire` → redirects to `/hire/halls` (test on the built preview or note redirects are Cloudflare-side).
  - Top nav shows **Hire** with its dropdown; footer no longer lists Venue hire.
  - Mobile width + dark mode: nav doesn't overflow; figures/tables scroll rather than overflow the page.

- [ ] **Step 6: Final commit (if any preview fixes were needed)**

```bash
git add -A
git commit -m "fix: preview adjustments for the Hire section"
```

---

## Post-plan: what's next

The remaining spec PRs become their own plans:
- **PR3** — Life Events (photo-led) + Worship/Music/Community/About/Families figures & galleries + News/What's-On image fields.
- **PR4** — the homepage "life of the parish" strip (code-driven cornerstone band).
- **PR5** — the seasonal-hero side-by-side review.

## ⚑ Parish sign-off still needed before the people-photo PRs (3–4) merge
- Photo consent / safeguarding for identifiable people (esp. children).
- Concert capacity (leave `concerts.capacity` blank until supplied).
- Whether concerts share the recordings rate card (assumed yes here).
- Photographer credit(s), if required.
