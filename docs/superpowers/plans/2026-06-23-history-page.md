# History page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a single, captivating, CMS-editable **History** page at `/about-us/history` for the St Barnabas (barnabites.org) Astro site, from the approved spec `docs/superpowers/specs/2026-06-23-history-page-design.md`.

**Architecture:** A custom Astro page (`src/pages/about-us/history.astro`) renders CMS-editable content. Chapters are a `news`-style **folder collection** of Markdown files (native rendering, no new deps); page matter (hero/intro/credits) is a `settings`-style **singleton** guarded at build time. Pure logic (validation, sort, anchor) is unit-tested with Vitest; `.astro` components are verified via `astro check`, `build`, and the preview server — matching the repo's existing patterns (there is no component-test harness, and we will not add one). The page is **not** registered in the `pages` collection, so it never collides with `src/pages/[...slug].astro`.

**Tech Stack:** Astro 6.4 (static), TypeScript strict, plain CSS with design tokens, Vitest 4, `sharp` for image optimisation, Sveltia CMS (`public/admin/config.yml`).

**Conventions:** Branch `claude/<slug>` (already in a worktree). Commit per task. UK English everywhere. Use design tokens from `src/styles/tokens.css` — never hard-code a hex/px colour. End commit messages with `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.

**Refinements to the spec made during planning (faithful, noted for the reviewer):**
- The per-chapter **`anchor`** is computed from the file id (strip the `NN-` prefix, like `staff.ts`) rather than stored as an editor field — simpler, stable, and removes a field from the CMS. The `year` field is a single display year (the prose carries full spans).
- The timeline **year sits above each heading** (in normal flow) rather than in an absolutely-positioned gutter — robust and accessible across breakpoints, same spine aesthetic.
- The closing chapter (8) reuses an existing, already-licensed parish photo in `public/images/hero/`, so it needs no migration.

---

## File structure

| File | Responsibility |
|---|---|
| `src/content/settings/historyPage.json` | Page matter: kicker, title, intro, description, hero, credits, onward links (editor-owned singleton). |
| `src/data/history.ts` | Typed import of `historyPage.json` + `assertHistoryPage()` build guard + `historyPage` export. Mirrors `src/data/site.ts`. |
| `src/data/history.test.ts` | Vitest for `assertHistoryPage()`. |
| `src/content.config.ts` | + `history` collection Zod schema (modify). |
| `src/lib/history.ts` | Pure helpers: `chapterAnchor()`, `prepareChapters()`, types. No `astro:content` value import → unit-testable. |
| `src/lib/history.test.ts` | Vitest for `chapterAnchor()` + `prepareChapters()`. |
| `src/content/history/01..08-*.md` | The eight chapters (frontmatter + prose). |
| `src/components/history/PullQuote.astro` | Burgundy pull-quote `<figure>`. |
| `src/components/history/AtAGlance.astro` | Derived year strip with in-page anchor links. |
| `src/components/history/HistoryHeroBand.astro` | Full-width hero image + caption (no text on image). |
| `src/components/history/Timeline.astro` | The burgundy spine; renders chapter stations + bodies. |
| `src/pages/about-us/history.astro` | Assembles the page. |
| `src/data/nav.ts` | + "Our History" under About, 2nd (modify). |
| `src/content/pages/about-us.md` | + "Our History" bullet in "Find out more" (modify). |
| `public/admin/config.yml` | + `history` folder collection + `history_page` singleton (modify). |
| `scripts/list-history-images.mjs` | One-off: print archive image URLs for discovery. |
| `scripts/fetch-history-images.mjs` | One-off: fetch + `sharp`-optimise archive images → `public/images/history/`. |

---

## Task 1: Page-matter singleton + build guard (TDD)

**Files:**
- Create: `src/content/settings/historyPage.json`
- Create: `src/data/history.ts`
- Test: `src/data/history.test.ts`

- [ ] **Step 1: Create the singleton content file**

`src/content/settings/historyPage.json`:

```json
{
  "kicker": "About Us",
  "title": "The story of St Barnabas",
  "intro": "From an iron mission church in a new garden suburb to E. C. Shearman’s soaring brick basilica — how our church came to be, and the people who built and adorned it.",
  "description": "The history of St Barnabas Church, Ealing — the Brentham garden suburb, the Tin Church, E. C. Shearman’s 1916 basilica, James Clark’s apse painting, and a century of Anglo-Catholic worship in Pitshanger.",
  "hero": {
    "image": "/images/history/apse-painting.webp",
    "alt": "James Clark’s apse painting: ranks of angels in red and gold gathered around the Holy Trinity above the high altar.",
    "caption": "The apse painting, ‘the Three Hierarchies of Angels’, by James Clark, 1917–1920."
  },
  "credits": "Compiled from the parish history by Hugh Mather; photographs by Dr John Salmon.",
  "onward": [
    { "label": "The organ today", "href": "/worship/st-barnabas-organ" },
    { "label": "Plan your visit", "href": "/visit" }
  ]
}
```

- [ ] **Step 2: Write the failing test**

`src/data/history.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { assertHistoryPage, type HistoryPage } from './history';

const valid: HistoryPage = {
  kicker: 'About Us',
  title: 'The story of St Barnabas',
  intro: 'How our church came to be.',
  description: 'The history of St Barnabas Church, Ealing.',
  hero: { image: '/images/history/apse-painting.webp', alt: 'The apse painting.', caption: 'The apse painting.' },
  credits: 'Compiled by Hugh Mather.',
  onward: [],
};

describe('assertHistoryPage', () => {
  it('accepts a complete page', () => {
    expect(() => assertHistoryPage(valid)).not.toThrow();
  });
  it('throws naming the field when the title is blank', () => {
    expect(() => assertHistoryPage({ ...valid, title: '   ' })).toThrow(/title/);
  });
  it('throws when the hero image is missing', () => {
    expect(() => assertHistoryPage({ ...valid, hero: { ...valid.hero, image: '' } })).toThrow(/hero\.image/);
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npx vitest run src/data/history.test.ts`
Expected: FAIL — cannot find module `./history` (not created yet).

- [ ] **Step 4: Write the implementation**

`src/data/history.ts`:

```ts
import data from '../content/settings/historyPage.json';

export interface OnwardLink {
  label: string;
  href: string;
}
export interface HistoryHero {
  image: string;
  alt: string;
  caption: string;
}
export interface HistoryPage {
  kicker: string;
  title: string;
  intro: string;
  description: string;
  hero: HistoryHero;
  credits: string;
  onward: OnwardLink[];
}

/** Throws (failing the build) if the editor has emptied a field the History page depends on. */
export function assertHistoryPage(p: HistoryPage): void {
  const required: Array<[string, unknown]> = [
    ['title', p.title],
    ['intro', p.intro],
    ['hero.image', p.hero?.image],
    ['hero.alt', p.hero?.alt],
    ['credits', p.credits],
  ];
  const missing = required.filter(([, v]) => !v || String(v).trim() === '').map(([k]) => k);
  if (missing.length) {
    throw new Error(
      `historyPage.json is missing required field(s): ${missing.join(', ')}. ` +
        'Refusing to build with a broken History page.'
    );
  }
}

assertHistoryPage(data as HistoryPage);

export const historyPage = data as HistoryPage;
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run src/data/history.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add src/content/settings/historyPage.json src/data/history.ts src/data/history.test.ts
git commit -m "Add History page settings singleton with build guard

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: Chapters collection + pure helpers (TDD)

**Files:**
- Modify: `src/content.config.ts`
- Create: `src/lib/history.ts`
- Test: `src/lib/history.test.ts`

- [ ] **Step 1: Register the `history` collection**

In `src/content.config.ts`, add this collection definition after the `documents` collection (before the `export const collections` line):

```ts
const history = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/history' }),
  schema: z.object({
    order: z.number(),
    year: z.string(),
    title: z.string(),
    image: z.string().optional(),
    imageAlt: z.string().optional(),
    imageCaption: z.string().optional(),
    pullquote: z.string().optional(),
    pullquoteAttribution: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});
```

Then change the export line to include it:

```ts
export const collections = { pages, news, services, events, staff, documents, history };
```

- [ ] **Step 2: Write the failing test**

`src/lib/history.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { chapterAnchor, prepareChapters } from './history';

describe('chapterAnchor', () => {
  it('strips the NN- order prefix', () => {
    expect(chapterAnchor('01-before-the-church')).toBe('before-the-church');
  });
  it('handles multi-digit prefixes', () => {
    expect(chapterAnchor('10-a-living-church-today')).toBe('a-living-church-today');
  });
});

describe('prepareChapters', () => {
  const make = (id: string, order: number) =>
    ({ id, data: { order, year: '', title: '' } }) as never;
  it('sorts by order and attaches a stable anchor', () => {
    const out = prepareChapters([make('03-c', 3), make('01-a', 1), make('02-b', 2)]);
    expect(out.map((c) => c.id)).toEqual(['01-a', '02-b', '03-c']);
    expect(out[0].anchor).toBe('a');
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npx vitest run src/lib/history.test.ts`
Expected: FAIL — cannot find module `./history`.

- [ ] **Step 4: Write the implementation**

`src/lib/history.ts` (note: `import type` is erased at runtime, so this file does **not** pull in `astro:content` and stays unit-testable):

```ts
import type { CollectionEntry } from 'astro:content';

export type HistoryChapter = CollectionEntry<'history'>;
export type PreparedChapter = HistoryChapter & { anchor: string };

/**
 * In-page anchor for a chapter: the collection-entry id with its leading "NN-"
 * order prefix removed. e.g. "01-before-the-church" → "before-the-church".
 * (Same approach as staffSlug in src/lib/staff.ts.)
 */
export function chapterAnchor(id: string): string {
  return id.replace(/^\d+-/, '');
}

/**
 * Chapters sorted by `order` (missing → last), each augmented with its anchor.
 * Pure: takes already-loaded entries so it can be unit-tested without astro:content.
 * The page loads the entries with getCollection() and passes them here.
 */
export function prepareChapters(entries: HistoryChapter[]): PreparedChapter[] {
  return [...entries]
    .sort((a, b) => (a.data.order ?? 99) - (b.data.order ?? 99))
    .map((entry) => ({ ...entry, anchor: chapterAnchor(entry.id) }));
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run src/lib/history.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 6: Type-check the new collection**

Run: `npx astro check`
Expected: 0 errors (the `history` collection types resolve even with no content files yet).

- [ ] **Step 7: Commit**

```bash
git add src/content.config.ts src/lib/history.ts src/lib/history.test.ts
git commit -m "Add history chapters collection and pure helpers

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: The eight chapter files

**Files:**
- Create: `src/content/history/01-before-the-church.md` … `08-a-living-church-today.md`

Prose is faithful to the archive (see the spec's chapter source map). UK English; "Ernest Charles Shearman" (not "Edward"); no listed-building grade asserted; the Upper Room date is deliberately not stated. `image` paths point at files produced in Task 9; chapter 8 reuses an existing parish photo. These are publishable drafts for the parish to proofread.

- [ ] **Step 1: Create `src/content/history/01-before-the-church.md`**

```markdown
---
order: 1
year: "1905"
title: Before the church
image: /images/history/tin-church.webp
imageAlt: A drawing of the corrugated-iron "Tin Church" on the corner of Pitshanger Lane.
imageCaption: The "Tin Church", c.1907.
draft: false
---

Until the Great Western Railway reached Ealing in 1838, this was farmland north of the Uxbridge Road — open fields running down to the River Brent, with only Pitshanger Farmhouse for company. "Pitshanger" was the name of a track, not yet a parish.

That changed with the **Brentham Estate**. From 1901, Ealing Tenants Limited — a pioneering co-partnership led by Henry Vivian — laid out the garden suburb of well-built houses and tree-lined avenues that still surrounds the church today. Within twenty years some five thousand people had come to live here, and they needed somewhere to worship.

The first St Barnabas was a modest one: a corrugated-iron mission church on the corner of Pitshanger Lane, its land bought in December 1905 by Dr Tupholme of St Stephen's, helped by Miss Mary Baron and her sisters. Consecrated in 1907 and affectionately known as the "Tin Church", it seated just 250 — and was soon outgrown.
```

- [ ] **Step 2: Create `src/content/history/02-building-the-church.md`**

```markdown
---
order: 2
year: "1914"
title: Building the church
image: /images/history/church-1916.webp
imageAlt: The newly built St Barnabas Church, seen from Pitshanger Lane around 1916.
imageCaption: The new church, consecrated in 1916.
draft: false
---

By 1913 the parish had resolved to build a permanent church worthy of its growing community, on a new site at the corner of Pitshanger Lane and Denison Road. The design was entrusted to **Ernest Shearman**, working with the Ealing architect **Ernest Tyler**.

Cost forced hard choices. To bring the price below £10,000, Shearman pared back his first design — losing two west towers, a bay of the nave and a north chapel — but he insisted on keeping the great **rose window** on the west front. The revised plans were approved in May 1914, and on 13 June **Miss Mary Baron** laid the foundation stone, blessed by the Bishop of Kensington.

Building through the First World War was not easy, and a dispute over timber saw Shearman leave the work to Tyler to complete. Yet on **Saturday 3 June 1916** the Bishop of London consecrated the finished church. Such crowds came that the doors were closed a quarter of an hour before the service began, and many were turned away.
```

- [ ] **Step 3: Create `src/content/history/03-ernest-shearman.md`**

```markdown
---
order: 3
year: "1916"
title: Ernest Shearman, architect
image: /images/history/rose-window.webp
imageAlt: The west rose window in silhouette, its flowing stone tracery dark against the light.
imageCaption: The west rose window — one of Shearman's three at St Barnabas.
pullquote: Almost the final flowering of the last phase of the Gothic Revival.
pullquoteAttribution: Dr John Salmon, on Shearman's churches
draft: false
---

**Ernest Charles Shearman (1859–1939)** designed six London churches between 1910 and 1936, and St Barnabas is among the finest. They share an unmistakable character: tall, dignified buildings of plain brick, without spire or tower, their austere walls left ready for the painting, glass and furnishing that would come later.

Shearman loved the rose window, with its flowing tracery, and St Barnabas has three — at the west end, in the Lady Chapel and in the Upper Room. He planned the church on a **basilican** model: a wide nave giving the whole congregation a clear view of the altar, set in the centre of the apse. His biographer, Dr John Salmon, calls these churches "almost the final flowering of the last phase of the Gothic Revival".
```

- [ ] **Step 4: Create `src/content/history/04-the-angels-of-the-apse.md`**

```markdown
---
order: 4
year: "1920"
title: The angels of the apse
image: /images/history/clark-at-work.webp
imageAlt: The artist James Clark at work on the great apse painting.
imageCaption: James Clark at work on the apse painting.
pullquote: My most important work.
pullquoteAttribution: James Clark, of the apse painting
draft: false
---

Above and around the high altar spreads the church's great treasure: a vast painting of **the Three Hierarchies of Angels praising and adoring the Holy Trinity**, sixty-nine feet long and twenty-five feet high.

It is the work of **James Clark (1857–1943)**, who painted it in vertical strips at his studio in Bedford Park between 1917 and 1920, his daughter Lilian assisting; the two archangels, Gabriel and Michael, were painted directly onto the walls. Clark thought it his most important work — and a century on, it still draws the eye upward the moment you step inside.
```

- [ ] **Step 5: Create `src/content/history/05-glass-banner-and-furnishings.md`**

```markdown
---
order: 5
year: "1922"
title: Glass, banner and furnishings
image: /images/history/sanctuary-window.webp
imageAlt: One of the stained-glass windows above the high altar, showing two standing saints.
imageCaption: A sanctuary window by Clayton and Bell, given in 1916.
draft: false
---

The five windows above the high altar were given in 1916 by Stanley and Rosa Burgess, in memory of Stanley's mother, and made by the celebrated firm of **Clayton and Bell**. Among their saints stand Barnabas and Paul, Andrew and George, Patrick and David. Two further windows in the south aisle, dedicated in 1922, remember four nephews of the family who fell in the Great War.

Other treasures gathered over the years: the **St Barnabas banner**, embroidered in 1916 and reputedly the work of Mrs Betty Mitchell, the first vicar's wife; and a handful of old paintings hung in the nave, among them a sixteenth-century *Holy Trinity* attributed to Pedro Machuca, restored at the Courtauld Institute in 1986.
```

- [ ] **Step 6: Create `src/content/history/06-war-fire-and-renewal.md`**

```markdown
---
order: 6
year: "1944"
title: War, fire and renewal
image: /images/history/lady-chapel-triptych.webp
imageAlt: The painted triptych in the Lady Chapel, its haloes in gold leaf.
imageCaption: The Lady Chapel triptych, added for the church's 80th anniversary in 1996.
pullquote: The beautiful Rose Window now lets in enough wind to blow the organ.
pullquoteAttribution: Fr Barrett, after the bombing of 1944
draft: false
---

The church has known its share of trial. On 20 August 1944 a flying bomb fell nearby, blowing out the windows along the north side; the west rose window, wrote the vicar, now "lets in enough wind to blow the organ".

Worse came in March 1962, when an arsonist set fire to the high altar; a new altar was first used at Easter 1963. And in 1983 subsidence threatened the Lady Chapel, prompting the "Renewing the Foundations" appeal that secured it.

Each time the parish rebuilt and adorned anew. In June 1996, for the church's eightieth anniversary, a triptych by **Sister Theresa Margaret** — painted in tempera on gesso, its haloes in 22-carat gold leaf — was added to the restored Lady Chapel.
```

- [ ] **Step 7: Create `src/content/history/07-the-organ.md`**

```markdown
---
order: 7
year: "2011"
title: The organ
image: /images/history/organ.webp
imageAlt: The organ in the west gallery of St Barnabas, its pipes rising above the rose window.
imageCaption: The organ in the west gallery, rebuilt in 2011.
draft: false
---

Music has always mattered here, though a worthy organ was long in coming. The church of 1916 made do with a second-hand instrument; only in 2011 did St Barnabas gain the fine organ it has today.

Built in 1851 and first heard at St Jude's, Southsea, it was rebuilt in the west gallery by **Nicholson & Co.** of Malvern, funded by the generous legacy of **Hazel Baker**, the parish's long-serving Director of Music. It is heard now at the Sung Mass and in regular recitals.

Read more about [the St Barnabas organ](/worship/st-barnabas-organ).
```

- [ ] **Step 8: Create `src/content/history/08-a-living-church-today.md`**

```markdown
---
order: 8
year: Today
title: A living church today
image: /images/hero/worship.webp
imageAlt: The congregation gathered for worship at St Barnabas today.
imageCaption: Worship at St Barnabas today.
draft: false
---

A hundred years and more since its consecration, St Barnabas is still what it was built to be: a place of prayer and beauty at the heart of Pitshanger, worshipping in the Anglo-Catholic tradition of the Church of England.

The story is not finished. Sunday by Sunday, the church that Shearman raised, Clark adorned and generations have cherished gathers a new congregation into the same unbroken offering of worship.

You are always welcome to [come and visit](/visit).
```

- [ ] **Step 9: Verify the collection parses**

Run: `npx astro check`
Expected: 0 errors (all eight chapters match the schema).

- [ ] **Step 10: Commit**

```bash
git add src/content/history/
git commit -m "Add the eight History chapter files

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4: PullQuote and AtAGlance components

**Files:**
- Create: `src/components/history/PullQuote.astro`
- Create: `src/components/history/AtAGlance.astro`

- [ ] **Step 1: Create `src/components/history/PullQuote.astro`**

```astro
---
interface Props {
  quote: string;
  attribution?: string;
}
const { quote, attribution } = Astro.props;
---
<figure class="pullquote">
  <blockquote>&ldquo;{quote}&rdquo;</blockquote>
  {attribution && <figcaption>{attribution}</figcaption>}
</figure>

<style>
  .pullquote { margin: 1.8rem 0; text-align: center; }
  .pullquote blockquote {
    margin: 0 auto;
    max-width: 32ch;
    font-family: var(--font-display);
    font-style: italic;
    font-size: clamp(1.4rem, 3vw, 1.9rem);
    line-height: 1.3;
    color: var(--burgundy);
  }
  .pullquote figcaption {
    margin-top: .9rem;
    font-size: .78rem;
    letter-spacing: .14em;
    text-transform: uppercase;
    color: var(--ink-soft);
  }
</style>
```

- [ ] **Step 2: Create `src/components/history/AtAGlance.astro`**

```astro
---
import type { PreparedChapter } from '../../lib/history';
interface Props {
  chapters: PreparedChapter[];
}
const { chapters } = Astro.props;
---
<nav class="ataglance" aria-label="The story at a glance">
  <div class="wrap ataglance__inner">
    <span class="ataglance__label">The story at a glance</span>
    <ol class="ataglance__years">
      {chapters.map((c) => (
        <li><a href={`#${c.anchor}`}>{c.data.year}</a></li>
      ))}
    </ol>
  </div>
</nav>

<style>
  .ataglance {
    background: var(--paper-2);
    border-block: 1px solid var(--line);
  }
  .ataglance__inner {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: .5rem 1.2rem;
    padding-block: .85rem;
  }
  .ataglance__label {
    font-size: .72rem;
    letter-spacing: .18em;
    text-transform: uppercase;
    color: var(--ink-soft);
  }
  .ataglance__years {
    display: flex;
    flex-wrap: wrap;
    gap: .2rem 1.1rem;
    margin: 0;
    padding: 0;
    list-style: none;
    font-family: var(--font-display);
    font-size: 1.2rem;
  }
  .ataglance__years a {
    color: var(--burgundy);
    text-decoration: none;
  }
  .ataglance__years a:hover { text-decoration: underline; }
</style>
```

- [ ] **Step 3: Type-check**

Run: `npx astro check`
Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/history/PullQuote.astro src/components/history/AtAGlance.astro
git commit -m "Add PullQuote and AtAGlance history components

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 5: HistoryHeroBand and Timeline components

**Files:**
- Create: `src/components/history/HistoryHeroBand.astro`
- Create: `src/components/history/Timeline.astro`

- [ ] **Step 1: Create `src/components/history/HistoryHeroBand.astro`**

```astro
---
interface Props {
  image: string;
  alt: string;
  caption?: string;
}
const { image, alt, caption } = Astro.props;
---
<figure class="hero-band">
  <img src={image} alt={alt} width="1600" height="900" fetchpriority="high" decoding="async" />
  {caption && <figcaption class="wrap">{caption}</figcaption>}
</figure>

<style>
  .hero-band { margin: 0; }
  .hero-band img {
    display: block;
    width: 100%;
    max-height: 60vh;
    object-fit: cover;
    background: var(--paper-2);
  }
  .hero-band figcaption {
    padding-top: .6rem;
    font-family: var(--font-display);
    font-style: italic;
    font-size: 1rem;
    color: var(--ink-soft);
  }
</style>
```

- [ ] **Step 2: Create `src/components/history/Timeline.astro`**

```astro
---
import { render } from 'astro:content';
import type { PreparedChapter } from '../../lib/history';
import PullQuote from './PullQuote.astro';

interface Props {
  chapters: PreparedChapter[];
}
const { chapters } = Astro.props;

// Render each chapter's Markdown body to a component up front.
const stations = await Promise.all(
  chapters.map(async (chapter) => ({ chapter, Content: (await render(chapter)).Content }))
);
---
<ol class="timeline">
  {stations.map(({ chapter, Content }, i) => (
    <li class:list={['station', { 'station--lead': i === 0 }]} id={chapter.anchor}>
      <p class="station__year">{chapter.data.year}</p>
      <h2 class="station__title serif">{chapter.data.title}</h2>
      <div class="prose station__body"><Content /></div>
      {chapter.data.image && (
        <figure class="station__figure">
          <img src={chapter.data.image} alt={chapter.data.imageAlt ?? ''} loading="lazy" decoding="async" />
          {chapter.data.imageCaption && <figcaption>{chapter.data.imageCaption}</figcaption>}
        </figure>
      )}
      {chapter.data.pullquote && (
        <PullQuote quote={chapter.data.pullquote} attribution={chapter.data.pullquoteAttribution} />
      )}
    </li>
  ))}
</ol>

<style>
  .timeline {
    list-style: none;
    margin: 2rem 0 0;
    padding: 0 0 0 28px;
    border-left: 2px solid var(--burgundy);
  }
  .station {
    position: relative;
    padding-bottom: clamp(2rem, 5vw, 3rem);
    scroll-margin-top: 5rem;
  }
  .station::before {
    content: "";
    position: absolute;
    left: -35px;
    top: .4rem;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: var(--burgundy);
    border: 3px solid var(--paper);
  }
  .station__year {
    margin: 0 0 .2rem;
    font-family: var(--font-display);
    font-weight: 600;
    font-size: 1.35rem;
    line-height: 1;
    color: var(--burgundy);
  }
  .station__title {
    margin: 0 0 .6rem;
    font-weight: 500;
    font-size: clamp(1.5rem, 3.4vw, 2rem);
    line-height: 1.1;
  }
  .station__body { max-width: 60ch; }
  /* Drop cap on the opening chapter only, for a quiet flourish. */
  .station--lead .station__body > :global(p:first-of-type::first-letter) {
    float: left;
    padding: .08em .12em 0 0;
    font-family: var(--font-display);
    font-weight: 600;
    font-size: 3.6rem;
    line-height: .7;
    color: var(--burgundy);
  }
  .station__figure { margin: 1.2rem 0 0; }
  .station__figure img {
    display: block;
    width: 100%;
    max-width: 520px;
    background: var(--paper-2);
  }
  .station__figure figcaption {
    padding-top: .4rem;
    font-family: var(--font-display);
    font-style: italic;
    font-size: .95rem;
    color: var(--ink-soft);
  }
</style>
```

- [ ] **Step 3: Type-check**

Run: `npx astro check`
Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/history/HistoryHeroBand.astro src/components/history/Timeline.astro
git commit -m "Add HistoryHeroBand and Timeline history components

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 6: The History page

**Files:**
- Create: `src/pages/about-us/history.astro`

- [ ] **Step 1: Create the page**

`src/pages/about-us/history.astro`:

```astro
---
import { getCollection } from 'astro:content';
import Base from '../../layouts/Base.astro';
import PageHeader from '../../components/PageHeader.astro';
import HistoryHeroBand from '../../components/history/HistoryHeroBand.astro';
import AtAGlance from '../../components/history/AtAGlance.astro';
import Timeline from '../../components/history/Timeline.astro';
import { prepareChapters } from '../../lib/history';
import { historyPage } from '../../data/history';

const entries = await getCollection('history', ({ data }) => !data.draft);
const chapters = prepareChapters(entries);
const { kicker, title, intro, description, hero, credits, onward } = historyPage;
---
<Base title={title} description={description} image={hero.image}>
  <PageHeader kicker={kicker} title={title} intro={intro} />
  <HistoryHeroBand image={hero.image} alt={hero.alt} caption={hero.caption} />
  <AtAGlance chapters={chapters} />
  <div class="wrap page-body">
    <Timeline chapters={chapters} />

    <footer class="history-foot">
      <p class="history-credits">{credits}</p>
      {onward.length > 0 && (
        <p class="history-onward">
          {onward.map((l) => (<a href={l.href}>{l.label} &rarr;</a>))}
        </p>
      )}
    </footer>
  </div>
</Base>

<style>
  .page-body { padding-top: 1.5rem; padding-bottom: clamp(3rem, 7vw, 6rem); }
  .history-foot { margin-top: 2.5rem; padding-top: 1.4rem; border-top: 1px solid var(--line); }
  .history-credits { font-size: .85rem; letter-spacing: .03em; color: var(--ink-soft); }
  .history-onward { display: flex; flex-wrap: wrap; gap: .8rem; margin-top: 1.2rem; }
  /* Outlined button (house style: outline, fills on hover). Self-contained so the page
     does not depend on a global button class. */
  .history-onward a {
    font-size: .78rem;
    letter-spacing: .14em;
    text-transform: uppercase;
    color: var(--burgundy);
    border: 1px solid var(--burgundy);
    padding: .7rem 1.1rem;
    text-decoration: none;
  }
  .history-onward a:hover { background: var(--burgundy); color: var(--white); }
</style>
```

- [ ] **Step 2: Type-check**

Run: `npx astro check`
Expected: 0 errors.

- [ ] **Step 3: Build and confirm the page is generated**

Run: `npm run build`
Expected: 0 errors; output includes `/about-us/history`; total page count is **one more** than before this task (e.g. 167 → 168).

- [ ] **Step 4: Preview and verify (text-based checks)**

Start the preview server, then check the route renders: the paper header, the hero `<figure>`, the at-a-glance `<nav>`, and eight `<li class="station">` items with anchors `before-the-church` … `a-living-church-today`. (Images will 404 until Task 9 — that is expected here.) Confirm there is **no white text over the hero image** (the header sits above it on paper).

- [ ] **Step 5: Commit**

```bash
git add src/pages/about-us/history.astro
git commit -m "Add the History page at /about-us/history

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 7: Navigation + About hub link

**Files:**
- Modify: `src/data/nav.ts`
- Modify: `src/content/pages/about-us.md`

- [ ] **Step 1: Add the nav item**

In `src/data/nav.ts`, inside the About `children` array, insert "Our History" as the **second** item (immediately after Who's Who):

```ts
      { label: "Who's Who", href: '/about-us/whos-who' },
      { label: 'Our History', href: '/about-us/history' },
      { label: 'Pastoral Care', href: '/about-us/pastoral-care' },
```

- [ ] **Step 2: Add the About-hub bullet**

In `src/content/pages/about-us.md`, in the "Find out more" list, add the History bullet directly after the Who's Who bullet:

```markdown
- [Who’s Who](/about-us/whos-who) — the clergy and people who lead our common life
- [Our History](/about-us/history) — how our church came to be, and the people who built and adorned it
```

- [ ] **Step 3: Build and verify the link appears**

Run: `npm run build`
Expected: 0 errors. In the preview, the About menu shows "Our History" second, linking to `/about-us/history`, and the About page lists it under "Find out more".

- [ ] **Step 4: Commit**

```bash
git add src/data/nav.ts src/content/pages/about-us.md
git commit -m "Link Our History from the About menu and hub page

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 8: CMS dual-write (`public/admin/config.yml`)

**Files:**
- Modify: `public/admin/config.yml`

Add two collections so editors can manage the page. Mirrors the existing `documents` (folder, own media folder) and `service_times`/`site_settings` (files singleton) patterns. Keep the dual-write invariant: these fields must match `src/content.config.ts` (`history`) and `historyPage.json`.

- [ ] **Step 1: Insert the two collections**

In `public/admin/config.yml`, immediately **after** the `documents` collection block and **before** the `- divider: true` that begins the "SET UP ONCE" section, insert:

```yaml
  # ── History (the About → Our History page) ───────────────────────────────────
  - name: history_page
    label: 🏛️ History page (intro & hero)
    description: The heading, hero photograph and credits at the top of the History page.
    files:
      - name: intro
        label: History page
        file: src/content/settings/historyPage.json
        media_folder: /public/images/history
        public_folder: /images/history
        fields:
          - { name: kicker, label: Kicker (small label above the title), widget: string }
          - { name: title, label: Title, widget: string }
          - { name: intro, label: Intro line, widget: text }
          - { name: description, label: Summary (shown to search engines), widget: text }
          - name: hero
            label: Hero photograph
            widget: object
            fields:
              - { name: image, label: Image, widget: image, hint: 'A wide (landscape) photo around 1600px works well.' }
              - { name: alt, label: Image description (for screen readers), widget: string }
              - { name: caption, label: Caption, widget: string }
          - { name: credits, label: Credits line, widget: string }
          - name: onward
            label: Onward links (buttons at the foot)
            widget: list
            summary: '{{fields.label}}'
            fields:
              - { name: label, label: Link text, widget: string }
              - { name: href, label: Link, widget: string, hint: 'e.g. /worship/st-barnabas-organ' }

  - name: history
    label: 🏛️ History chapters
    label_singular: Chapter
    description: The chapters of the History page. They appear in order, oldest first.
    folder: src/content/history
    create: true
    extension: md
    format: frontmatter
    slug: '{{fields.order}}-{{slug}}'
    sortable_fields: [order]
    identifier_field: title
    summary: '{{order}}. {{year}} — {{title}}'
    media_folder: /public/images/history
    public_folder: /images/history
    fields:
      - { name: order, label: Order (lower shows first), widget: number, value_type: int }
      - { name: year, label: Year (shown on the timeline), widget: string, hint: 'The single year shown on the timeline and the “at a glance” strip, e.g. 1916 or Today. The prose can give the full span.' }
      - { name: title, label: Chapter title, widget: string }
      - { name: image, label: Photograph (optional), widget: image, required: false, hint: 'Around 1600px wide is plenty.' }
      - { name: imageAlt, label: Photo description (for screen readers), widget: string, required: false }
      - { name: imageCaption, label: Caption, widget: string, required: false }
      - { name: pullquote, label: Pull-quote (optional), widget: text, required: false, hint: 'A short, memorable line lifted from the story.' }
      - { name: pullquoteAttribution, label: Pull-quote — who said it, widget: string, required: false }
      - { name: draft, label: Draft (hide from the page), widget: boolean, default: false }
      - name: body
        label: Chapter text
        widget: markdown
        modes: [rich_text]
        buttons: [bold, italic, link, heading-three, bulleted-list, numbered-list, quote]
        editor_components: [image]
        hint: Edit the wording freely. There is no code to break here.
```

- [ ] **Step 2: Validate the YAML**

Run: `node -e "import('js-yaml').then(m=>m.load(require('fs').readFileSync('public/admin/config.yml','utf8'))).then(()=>console.log('config.yml: valid YAML')).catch(e=>{console.error(e.message);process.exit(1)})"`

If `js-yaml` is not installed, instead verify by eye that indentation matches the surrounding two-space list style, then confirm the build is unaffected: `npm run build` (expected 0 errors).

- [ ] **Step 3: Confirm dual-write parity (by eye)**

Check each `history` field name matches `src/content.config.ts` (`order, year, title, image, imageAlt, imageCaption, pullquote, pullquoteAttribution, draft`, plus the Markdown `body`), and each `history_page` field matches `historyPage.json` (`kicker, title, intro, description, hero.{image,alt,caption}, credits, onward[].{label,href}`).

- [ ] **Step 4: Commit**

```bash
git add public/admin/config.yml
git commit -m "Add History page and chapters to the CMS (Sveltia)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 9: Image migration

**Files:**
- Create: `scripts/list-history-images.mjs`
- Create: `scripts/fetch-history-images.mjs`
- Output: `public/images/history/*.webp`

The exact source filenames live on the old WordPress site and must be discovered at run time (they are not knowable in advance). Step 1 prints them; Step 2's script fetches and optimises them, trying the full-resolution original (suffix stripped) first.

- [ ] **Step 1: Create the discovery script**

`scripts/list-history-images.mjs`:

```js
// One-off: print every <img> URL on the relevant history archive pages, so we can
// choose the right source for each target image (then strip any -WxH size suffix).
const ORIGIN = 'https://barnabites.org.uk';
const PAGES = [
  '/history/apse-painting/',
  '/history/tinchurch/',
  '/history/construction/',
  '/history/shearmanchurches/',
  '/history/stained-glass/',
  '/history/lady-chapel/',
  '/history/organ2011/',
  '/history/photographs/',
];
for (const page of PAGES) {
  try {
    const html = await (await fetch(ORIGIN + page)).text();
    const urls = [...html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)].map((m) => m[1]);
    console.log(`\n# ${page}`);
    for (const u of [...new Set(urls)]) console.log(u);
  } catch (e) {
    console.log(`# ${page} — ERROR ${e.message}`);
  }
}
```

- [ ] **Step 2: Run discovery and record the URLs**

Run: `node scripts/list-history-images.mjs`
Read the output and choose the best image for each of the eight targets below. Note the path on `www.barnabites.org` (image assets resolve on the `.org` host). The old site 500s intermittently — re-run if a page errors.

Targets (output file name → what to look for):
- `apse-painting` — the full apse painting (the hero)
- `tin-church` — the drawing of the corrugated-iron church
- `church-1916` — an early exterior of the finished church
- `rose-window` — the west rose window (Salmon's silhouette)
- `clark-at-work` — James Clark painting the apse
- `sanctuary-window` — one of the five Clayton & Bell windows
- `lady-chapel-triptych` — the 1996 triptych
- `organ` — the organ in the west gallery

- [ ] **Step 3: Create the fetch/optimise script**

`scripts/fetch-history-images.mjs` — fill each `src` from Step 2's output (use the path as printed; the script strips any `-WxH` suffix to try for the original, and falls back to the printed path):

```js
// One-off: download the parish history photographs and self-host optimised webp copies.
// Source images live on www.barnabites.org (the .org host). Fill `src` for each entry
// from the output of scripts/list-history-images.mjs.
import { mkdir } from 'node:fs/promises';
import sharp from 'sharp';

const ORIGIN = 'https://www.barnabites.org';

const IMAGES = [
  { name: 'apse-painting', src: '/wp-content/uploads/2015/09/REPLACE-apse.jpg' },
  { name: 'tin-church', src: '/wp-content/uploads/2015/09/REPLACE-tinchurch.jpg' },
  { name: 'church-1916', src: '/wp-content/uploads/2015/09/REPLACE-exterior.jpg' },
  { name: 'rose-window', src: '/wp-content/uploads/2015/09/REPLACE-rose.jpg' },
  { name: 'clark-at-work', src: '/wp-content/uploads/2015/09/REPLACE-clark.jpg' },
  { name: 'sanctuary-window', src: '/wp-content/uploads/2015/09/REPLACE-window.jpg' },
  { name: 'lady-chapel-triptych', src: '/wp-content/uploads/2015/09/REPLACE-triptych.jpg' },
  { name: 'organ', src: '/wp-content/uploads/2015/09/REPLACE-organ.jpg' },
];

const stripSize = (p) => p.replace(/-\d+x\d+(?=\.[a-z]+$)/i, '');

async function grab(path) {
  for (const candidate of [stripSize(path), path]) {
    const res = await fetch(ORIGIN + candidate);
    if (res.ok) return Buffer.from(await res.arrayBuffer());
  }
  throw new Error(`could not fetch ${path}`);
}

await mkdir('public/images/history', { recursive: true });
for (const img of IMAGES) {
  try {
    const buf = await grab(img.src);
    await sharp(buf)
      .resize({ width: 1600, withoutEnlargement: true })
      .webp({ quality: 78 })
      .toFile(`public/images/history/${img.name}.webp`);
    console.log('ok  ', img.name);
  } catch (e) {
    console.log('FAIL', img.name, e.message);
  }
}
```

- [ ] **Step 4: Run it and confirm the files**

Run: `node scripts/fetch-history-images.mjs`
Then: `ls -1 public/images/history/`
Expected: eight `.webp` files. If any logged `FAIL`, re-check that image's URL from Step 2 (it may need the size suffix kept, or a different page). Any that cannot be sourced are noted as a follow-up — the page still builds (broken `<img>` only) and the masters can be supplied by the parish later.

- [ ] **Step 5: Confirm chapter 8's photo exists (reused, already licensed)**

Run: `ls public/images/hero/worship.webp`
If it is absent, pick any existing `public/images/hero/*.webp` and update `image:` in `src/content/history/08-a-living-church-today.md` to match.

- [ ] **Step 6: Build with images in place**

Run: `npm run build`
Expected: 0 errors.

- [ ] **Step 7: Commit**

```bash
git add scripts/list-history-images.mjs scripts/fetch-history-images.mjs public/images/history/
git commit -m "Migrate and optimise parish history photographs

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 10: Final verification

**Files:** none (verification + visual proof).

- [ ] **Step 1: Full test suite**

Run: `npm test`
Expected: all green — the new `assertHistoryPage`, `chapterAnchor`, `prepareChapters` tests plus the existing liturgy tests.

- [ ] **Step 2: Type-check**

Run: `npx astro check`
Expected: 0 errors.

- [ ] **Step 3: Production build**

Run: `npm run build`
Expected: 0 errors; page count is exactly **+1** versus `main` (the new `/about-us/history`); no other route lost.

- [ ] **Step 4: Preview screenshots (visual proof)**

On the preview server, capture and confirm:
1. **Hero** — paper header + apse image band, **no white text over the image**.
2. **At a glance** — the year strip; clicking a year jumps to that station (anchors resolve, header clearance correct).
3. **Timeline** — the burgundy spine, a station with an image frame, the drop cap on chapter one.
4. **Pull-quote** — burgundy on paper, legible (chapter 3 or 6).
5. **Mobile** — single column; spine and images stack; nothing overflows.
6. **Dark/contrast** — burgundy-on-paper meets AA; focus rings visible on the at-a-glance links.

- [ ] **Step 5: CMS parity (by eye)**

Confirm `public/admin/config.yml` (`history` + `history_page`) still matches `src/content.config.ts` and `historyPage.json`, and that an editor could add a chapter / edit the hero with no code exposed.

- [ ] **Step 6: House verification line**

Record in the PR description, e.g.: `Build: 168 pages, 0 errors; astro check 0 errors; vitest green.`

---

## Before merging to `main` (flags from the spec — not code)

- **Dr John Salmon's photo rights** — confirm permission to publish the migrated photographs before this branch merges to `main` (merging publishes to the live site). If unconfirmed, hold the merge or set the affected chapters' images aside.
- **Image resolution** — if any migrated master is too small, request a better copy from the parish; the slots are ready.
- **Organ-spec reconciliation** and **Hugh Mather in Who's Who** remain open items elsewhere — untouched here.
- **Listed-building grade** — not asserted anywhere; do not add one without Historic England.

---

## Self-review (completed)

- **Spec coverage:** route + nav + about-hub link (Tasks 6–7); hybrid content model — chapters folder collection (Task 2–3) + page singleton with guard (Task 1); dual-write to `config.yml` (Task 8); the blend layout — paper hero, hero band, at-a-glance, timeline spine, pull-quotes, credits, onward (Tasks 4–6); no-white-text rule (hero on paper, verified Tasks 6 & 10); 8 curated chapters with faithful facts (Task 3); image migration with full-res attempt (Task 9); verification incl. page-count +1 and CMS parity (Task 10); all spec flags carried (final section). ✓
- **Placeholder scan:** the only run-time-filled values are the remote image `src` URLs (Task 9), which are genuinely discoverable only at run time — the discovery tool and fetch logic are fully written; the `REPLACE-*` markers are explicitly replaced from Step 2 output, not hand-waved logic.
- **Type consistency:** `HistoryPage`/`assertHistoryPage`/`historyPage` (Task 1) and `chapterAnchor`/`prepareChapters`/`PreparedChapter`/`HistoryChapter` (Task 2) are used consistently in the components (Tasks 4–5) and page (Task 6); component props (`quote`/`attribution`, `chapters`, `image`/`alt`/`caption`) match their call sites.
