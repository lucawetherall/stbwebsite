# Our Musicians page — Implementation Plan (PR 1 of 4)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a CMS-editable "Our Musicians" page under Music that introduces the choir and pulls the Director of Music (Luca) and Organist (Hugh) from the existing `staff` records, and wire the dormant `hero` field so the page has a banner-photo slot to fill later.

**Architecture:** A new Markdown page in the `pages` collection holds editable prose; a developer-owned `Musicians.astro` component is injected by `[...slug].astro` (the same slug→component pattern the Organ page already uses) and reads people from `getRoster()`. The one piece of real logic — deriving a one-line teaser from a person's bio — lives in a tested `lib` helper. The existing-but-unrendered `hero`/`heroAlt` page fields are rendered as a flat banner and exposed in the CMS.

**Tech Stack:** Astro 6 (static), TypeScript strict, plain CSS with design tokens, Vitest (lib only), Sveltia CMS (`config.yml`).

**Spec:** `docs/superpowers/specs/2026-06-23-our-musicians-page-design.md` (§5, §13).

**Pre-flight:** confirm a clean branch off `main` named `claude/our-musicians` (never commit to `main`). Run `npm run build` once to capture the **baseline page count** (used to confirm +1 later).

---

### Task 1: `firstSentence` teaser helper (TDD)

**Files:**
- Create: `src/lib/text.ts`
- Test: `src/lib/text.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest';
import { firstSentence } from './text';

describe('firstSentence', () => {
  it('returns the first sentence up to and including its full stop', () => {
    const bio =
      'Luca is a conductor, singing teacher, pianist and musicologist. He is a Tutor in Music at the University of Oxford.';
    expect(firstSentence(bio)).toBe(
      'Luca is a conductor, singing teacher, pianist and musicologist.'
    );
  });

  it('returns the whole string when there is no sentence-ending punctuation', () => {
    expect(firstSentence('Organist and choir trainer')).toBe('Organist and choir trainer');
  });

  it('trims surrounding whitespace', () => {
    expect(firstSentence('  Hello there. More text.  ')).toBe('Hello there.');
  });

  it('handles a question or exclamation as a sentence end', () => {
    expect(firstSentence('Curious about singing? Come along.')).toBe('Curious about singing?');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/text.test.ts`
Expected: FAIL — `firstSentence` is not exported / module not found.

- [ ] **Step 3: Write minimal implementation**

```ts
/**
 * The first sentence of a block of prose — up to and including the first
 * sentence-ending mark (. ! ?) that is followed by whitespace or the end of
 * the string. Naive by design (no abbreviation handling); our bios are curated,
 * and an editor can rephrase a first sentence if needed.
 */
export function firstSentence(text: string): string {
  const trimmed = text.trim();
  const match = trimmed.match(/^.*?[.!?](?=\s|$)/);
  return (match ? match[0] : trimmed).trim();
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/text.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/text.ts src/lib/text.test.ts
git commit -m "feat: add firstSentence helper for musician card teasers"
```

---

### Task 2: `Musicians.astro` component

**Files:**
- Create: `src/components/Musicians.astro`

Reuses the global `label`, `serif` and `txt-link` classes and mirrors the Who's-Who detail page's 4:5 photo/monogram frame.

- [ ] **Step 1: Write the component**

```astro
---
import { getRoster, staffInitials, staffFirstName, type RosterMember } from '../lib/staff';
import { firstSentence } from '../lib/text';

const roster = await getRoster();
const order = ['luca-wetherall', 'hugh-mather'];
const people: RosterMember[] = order
  .map((slug) => roster.find((p) => p.slug === slug))
  .filter((p): p is RosterMember => Boolean(p));
---
<section class="musicians" aria-labelledby="musicians-heading">
  <h2 id="musicians-heading" class="label musicians__label">Those who lead the music</h2>
  <div class="musicians__grid">
    {people.map((person) => {
      const { name, role, photo, photoAlt, bio } = person.data;
      const teaser = bio ? firstSentence(bio) : '';
      return (
        <article class="musician">
          <div class="musician__media">
            {photo ? (
              <img
                class="musician__photo"
                src={photo}
                alt={photoAlt || `Portrait of ${name}`}
                loading="lazy"
                decoding="async"
              />
            ) : (
              <span class="musician__monogram serif" aria-hidden="true">{staffInitials(name)}</span>
            )}
          </div>
          <div class="musician__body">
            <p class="label musician__role">{role}</p>
            <h3 class="musician__name serif">{name}</h3>
            {teaser && <p class="musician__teaser">{teaser}</p>}
            {bio && (
              <a class="txt-link musician__link" href={`/about-us/whos-who/${person.slug}`}>
                Read {staffFirstName(name)}’s full profile
              </a>
            )}
          </div>
        </article>
      );
    })}
  </div>
</section>

<style>
  .musicians { margin-top: 3rem; }
  .musicians__label { display: block; color: var(--burgundy); margin-bottom: 1.4rem; }
  .musicians__grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: clamp(1.6rem, 4vw, 2.4rem);
  }
  .musician { display: grid; grid-template-columns: 96px 1fr; gap: 1.2rem; align-items: start; }
  .musician__photo,
  .musician__monogram {
    width: 96px;
    aspect-ratio: 4 / 5;
    border-radius: 5px;
    border: 1px solid var(--line);
    background: var(--paper-2);
  }
  .musician__photo { height: auto; object-fit: cover; object-position: center top; }
  .musician__monogram {
    display: flex; align-items: center; justify-content: center;
    font-size: 1.8rem; font-weight: 500; color: var(--burgundy);
  }
  .musician__role { display: block; margin-bottom: 0.4rem; }
  .musician__name { font-weight: 500; font-size: 1.5rem; line-height: 1.1; }
  .musician__teaser { margin-top: 0.5rem; color: var(--ink-soft); max-width: 52ch; }
  .musician__link { display: inline-block; margin-top: 0.7rem; }

  @media (min-width: 640px) {
    .musicians__grid { grid-template-columns: 1fr 1fr; }
  }
</style>
```

- [ ] **Step 2: Type-check (verifies imports, the type guard, and props exist)**

Run: `npx astro check`
Expected: 0 errors. (If `RosterMember`, `staffInitials`, or `staffFirstName` fail to import, confirm they are exported from `src/lib/staff.ts`.)

- [ ] **Step 3: Commit**

```bash
git add src/components/Musicians.astro
git commit -m "feat: add Musicians component sourcing people from the staff roster"
```

---

### Task 3: Render `Musicians` + the `hero` banner in `[...slug].astro`

**Files:**
- Modify: `src/pages/[...slug].astro`

- [ ] **Step 1: Add the import and flags, and destructure `hero`/`heroAlt`**

In the frontmatter, add the import alongside the others and extend the destructure + flags:

```astro
import Musicians from '../components/Musicians.astro';
```

```astro
const { title, description, kicker, intro, gallery, hero, heroAlt } = entry.data;
const showOrganSpec = entry.id === 'music/st-barnabas-organ';
const showMusicians = entry.id === 'music/our-musicians';
```

- [ ] **Step 2: Render the banner (when set) and the component**

Replace the template body with:

```astro
<Base title={title} description={description}>
  <PageHeader kicker={kicker} title={title} intro={intro} />
  {hero && (
    <div class="wrap page-hero">
      <img class="page-hero__img" src={hero} alt={heroAlt ?? ''} decoding="async" />
    </div>
  )}
  <div class="wrap page-body">
    <Prose><Content /></Prose>
    {gallery && gallery.length > 0 && <Gallery images={gallery} />}
    {showOrganSpec && <OrganSpec />}
    {showMusicians && <Musicians />}
  </div>
</Base>
```

- [ ] **Step 3: Add banner styles to the existing `<style>` block**

```css
.page-hero { padding-top: 1rem; }
.page-hero__img {
  width: 100%; height: auto; display: block;
  border-radius: 5px; border: 1px solid var(--line);
}
```

- [ ] **Step 4: Type-check**

Run: `npx astro check`
Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
git add "src/pages/[...slug].astro"
git commit -m "feat: inject Musicians and render the page hero banner when set"
```

---

### Task 4: The "Our Musicians" page content

**Files:**
- Create: `src/content/pages/music/our-musicians.md`

- [ ] **Step 1: Write the page (editable prose; `hero` intentionally omitted for a text-only launch)**

```markdown
---
title: Our Musicians
kicker: Music
intro: The choir, and those who lead the sung worship of this church.
description: Meet the choir, Director of Music and Organist of St Barnabas Church, Ealing — a thriving choir in the Anglican choral tradition leading the Sung Mass each Sunday.
---

We are fortunate to have a well-established and thriving choir, rooted in the Anglican choral
tradition, that leads our musical offering and helps us encounter God in our common worship. The
choir sings the **Sung Mass every Sunday at 10.30am** — a sung setting or the leading of
congregational settings, hymns, a sung psalm and a communion anthem — and also sings Choral
Evensong and the great festivals of the year.

## The choir

Our singers span a wide range of ages and experience: two paid choral scholars sing alongside a
committed body of voluntary singers. The main choir rehearses on **Sundays from 9.30 to 10.15am**,
before the Mass. We actively welcome young people aged 10 and over who are interested in liturgical
singing — many find the experience earns encouragement, and sometimes credit, at school.

## Sing with us

We offer two paid choral scholarships each year. To enquire about singing with us — as a scholar or
a voluntary singer — see [the Music page](/music) or contact the Director of Music.

## Listen

Many of our services are livestreamed and archived on our YouTube channel, where you can hear the
choir and organ. You are always welcome to come and listen in person.
```

- [ ] **Step 2: Build to confirm the new page is generated**

Run: `npm run build`
Expected: 0 errors, and the page count is **baseline + 1**. Confirm `dist/music/our-musicians/index.html` exists.

- [ ] **Step 3: Commit**

```bash
git add src/content/pages/music/our-musicians.md
git commit -m "feat: add the Our Musicians page content"
```

---

### Task 5: Trim the Music landing and link across

**Files:**
- Modify: `src/pages/music.astro`

- [ ] **Step 1: Remove the relocated content**

Delete the entire `<section class="music-section">` block whose heading is **"The choir"** (the singers/young-people paragraphs), and delete the closing `<p class="page-aside">…</p>` that names the Director of Music. Leave the intro paragraph, the **Listen** section, and the **Choral Scholarships** `<aside>` untouched.

- [ ] **Step 2: Add a teaser + link where the choir section was**

Insert, immediately after the intro `<div class="prose">…</div>`:

```astro
<p class="page-aside">
  Our choir is led by a Director of Music and Organist, with paid choral scholars and a body of
  voluntary singers. <a href="/music/our-musicians">Meet our musicians →</a>
</p>
```

- [ ] **Step 3: Type-check and build**

Run: `npx astro check && npm run build`
Expected: 0 errors; page count unchanged from Task 4 (still baseline + 1).

- [ ] **Step 4: Commit**

```bash
git add src/pages/music.astro
git commit -m "refactor: slim the Music landing and link to Our Musicians"
```

---

### Task 6: Add "Our Musicians" to the navigation

**Files:**
- Modify: `src/data/nav.ts`

- [ ] **Step 1: Add the child before the Organ**

Change the Music block's `children` from:

```ts
  {
    label: 'Music',
    href: '/music',
    children: [
      { label: 'St Barnabas Organ', href: '/music/st-barnabas-organ' },
    ],
  },
```

to:

```ts
  {
    label: 'Music',
    href: '/music',
    children: [
      { label: 'Our Musicians', href: '/music/our-musicians' },
      { label: 'St Barnabas Organ', href: '/music/st-barnabas-organ' },
    ],
  },
```

- [ ] **Step 2: Type-check and build**

Run: `npx astro check && npm run build`
Expected: 0 errors. Spot-check the built header: the Music dropdown lists "Our Musicians" then "St Barnabas Organ".

- [ ] **Step 3: Commit**

```bash
git add src/data/nav.ts
git commit -m "feat: add Our Musicians to the Music nav menu"
```

---

### Task 7: CMS dual-write — register the page and expose the banner field

**Files:**
- Modify: `public/admin/config.yml`

- [ ] **Step 1: Expose `hero`/`heroAlt` on the shared `&pf` anchor**

In the `pages` collection, the first file entry (`about-us`) defines `fields: &pf`. Add these two fields to that anchor list, immediately **after** the `draft` field and **before** the `body` field:

```yaml
          - { name: hero, label: Banner photo (optional), widget: image, required: false, hint: 'A wide landscape photo. Leave empty for a text-only page.' }
          - { name: heroAlt, label: Banner photo description (for screen readers), widget: string, required: false }
```

- [ ] **Step 2: Register the new page**

Add this entry to the `pages` collection `files:` list, next to `worship-organ`:

```yaml
      - { name: worship-our-musicians, label: 'Worship · Our Musicians', file: src/content/pages/music/our-musicians.md, fields: *pf }
```

- [ ] **Step 3: Verify dual-write parity by eye**

Confirm against `src/content.config.ts` `pages` schema: every field now in `&pf` (`title, kicker, intro, description, draft, hero, heroAlt, body`) exists in the Zod schema (it does — `hero`/`heroAlt` were already defined). No schema change is needed.

- [ ] **Step 4: Build (config.yml is static; this just confirms nothing else broke)**

Run: `npm run build`
Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
git add public/admin/config.yml
git commit -m "feat(cms): register Our Musicians and expose the optional page banner"
```

---

### Task 8: Record Hugh's interim listing in DECISIONS

**Files:**
- Modify: `DECISIONS.md`

- [ ] **Step 1: Add a note under the open-items section (§3)**

Find the §3 open-items list (the one referenced by CLAUDE.md §10, which mentions "whether Hugh Mather is listed in Who's Who"). Append a dated note in the same formatting as the surrounding entries:

```markdown
- **Hugh Mather in Who's Who (update 23 June 2026):** Hugh now appears as **Organist (name + role
  only)** on the Our Musicians page (`/music/our-musicians`), pulled from his `staff` record.
  A full Who's-Who profile (bio + photo) remains pending parish sign-off.
```

- [ ] **Step 2: Commit**

```bash
git add DECISIONS.md
git commit -m "docs: record Hugh's interim Organist listing in DECISIONS"
```

---

### Task 9: Final verification

- [ ] **Step 1: Full verification suite**

Run: `npm run build && npx astro check && npm test`
Expected: build 0 errors and page count = **baseline + 1**; astro check 0 errors; all Vitest suites pass (the existing liturgy/service-time tests plus the new `text` test).

- [ ] **Step 2: Manual checks (preview the production build)**

Run: `npm run preview`, then confirm:
- `/music/our-musicians` renders: header, choir prose, and two cards — **Luca** with photo, teaser and a "Read Luca's full profile" link to `/about-us/whos-who/luca-wetherall`; **Hugh** with an "HM" monogram, "Organist", and **no** teaser or link.
- **No** banner image appears (because `hero` is unset).
- `/music` no longer shows the long choir section and links "Meet our musicians →".
- The Music dropdown shows both children.

- [ ] **Step 3: Record the verification line**

Capture for the PR body, e.g.: `Build: <N> pages, 0 errors; astro check 0 errors; tests green.`

---

## Self-review (completed against the spec)

- **Spec coverage (§5, §13):** new page (Task 4) ✔; `Musicians` component reusing `staff` (Task 2) ✔; teaser from bio first sentence (Task 1) ✔; profile link only when bio exists (Task 2) ✔; `hero` banner wired + empty launch (Task 3) ✔; Music landing trimmed + link (Task 5) ✔; nav child added (Task 6) ✔; CMS register + expose `hero` (Task 7) ✔; DECISIONS note (Task 8) ✔; verification incl. +1 page (Task 9) ✔.
- **Placeholder scan:** none — every step has concrete code/commands.
- **Type consistency:** `firstSentence` (Task 1) used in Task 2; `RosterMember`/`staffInitials`/`staffFirstName` imported from `staff.ts`; `showMusicians` flag (Task 3) matches the page id `music/our-musicians` (Task 4); nav href matches the page URL.

## Next plans (separate PRs)
- **PR 2 — Findability & front doors** (spec §6): nav promotion of Life Events, Winter Night Shelter re-parenting, homepage community band.
- **PR 3 — Journey pages** (spec §7): `VisitDetails` + `EnquireCTA` injected components.
- **PR 4 — Interior imagery** (spec §8): set `hero` on key pages as photography arrives.
