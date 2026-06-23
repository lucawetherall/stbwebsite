# History page — design

**Date:** 2026-06-23
**Goal:** A single, captivating **History** page at `/about-us/history` (under About → Our History,
second after Who's Who), telling the story of St Barnabas from the Brentham garden suburb to today.
Source material is the parish's own history archive on the old site (`barnabites.org.uk`) — 25 pages
compiled by **Hugh Mather** for the 2016 centenary, with photography by **Dr John Salmon**. The page
is a **designed, code-driven template fed by CMS-editable content**, so non-technical staff can still
fix a date, swap a photograph or add the next chapter. The archive is also mined to **enrich a few
existing pages**, carefully and with flags.

---

## Decisions (locked)

- **Scope:** one curated, streamlined narrative page — *not* a hub-and-spoke of sub-pages, and *not*
  a verbatim reproduction of all 25 archive pages. It tells the best of the story and links out for
  depth (e.g. the organ page).
- **Design direction — "the blend":** a paper hero (title + intro in dark ink) followed by a
  full-width **apse-painting image band**, then a slim **"at a glance" year strip**, then the body
  as a **vertical burgundy timeline spine** of **8 chapters**, each with optional image frame and
  burgundy pull-quote, then credits and onward links.
- **★ Readability rule (firm):** **no white text over imagery anywhere on this page.** All text is
  dark ink (or burgundy) on paper. Images are never used as text backgrounds; their captions sit
  *below* them in ink-soft. (This overrides the homepage's overlay-hero treatment for this page, at
  the user's explicit request — the apse painting is too bright for legible overlay text.)
- **Architecture — hybrid:** a custom Astro template (`src/pages/about-us/history.astro`) renders
  CMS-editable content. Two content surfaces, each following an **existing repo pattern**:
  - **Chapters** = a **folder collection** of Markdown files (`src/content/history/*.md`), exactly
    like `news`/`staff`. Bodies render natively through Astro's own Markdown pipeline (no new
    dependency, no build-break risk from a stray `<` — Markdown is parsed, not evaluated).
  - **Page matter** (hero, intro, credits, onward links) = a **settings singleton**
    (`src/content/settings/historyPage.json`), like `settings/site.json` and
    `settings/serviceTimes.json`, read through a typed loader with a build-time guard.
- **Headline:** kicker **"About Us"**, H1 **"The story of St Barnabas"** (evergreen — no centenary
  date to go stale), with an italic Cormorant intro beneath.
- **Images:** migrate the archive photographs **now**, attempting the full-resolution WordPress
  originals (strip the `-WxH` size suffixes), optimised via a `sharp` script into
  `public/images/history/`; every image gets descriptive alt text; CMS image fields point there so
  editors can replace them.
- **Attribution:** a standing credit line — *"Compiled from the parish history by Hugh Mather;
  photographs by Dr John Salmon."*
- **The page owns its route.** It is a custom `.astro` page; it is **not** registered in the `pages`
  collection, so it never collides with `src/pages/[...slug].astro`.

---

## Architecture

```
src/content/history/NN-slug.md              ← one Markdown file per chapter (folder collection)
        │   frontmatter: order, year, title, image?, imageAlt?, imageCaption?,
        │                pullquote?, pullquoteAttribution?, draft
        │   body: the chapter prose (Markdown, rendered natively)
        │
src/content/settings/historyPage.json       ← page matter: kicker, title, intro, description,
        │                                       hero{image,alt,caption}, credits, onward[]
        │
        ├── src/data/history.ts              ← typed loader + assertHistoryPage() build guard
        │                                       (mirrors src/data/site.ts / assertSiteSettings)
        ├── src/lib/history.ts               ← pure helpers: chapterAnchor(id), prepareChapters()
        │                                       (no astro:content value import → unit-tested)
        │
        └── src/pages/about-us/history.astro ← the template: Base → PageHeader → hero band →
                                                AtAGlance → Timeline (chapters) → credits → onward
src/components/history/
        ├── HistoryHeroBand.astro            ← full-width apse-painting image + caption (no text on image)
        ├── AtAGlance.astro                  ← derived year strip with in-page anchor links
        ├── Timeline.astro                   ← the burgundy spine; renders the chapter stations
        └── PullQuote.astro                  ← burgundy italic <figure><blockquote> + attribution

public/images/history/<name>.webp           ← migrated, sharp-optimised archive photographs
scripts/fetch-history-images.mjs            ← one-time migration (models scripts/fetch-images.mjs)
src/content.config.ts                       ← + `history` collection Zod schema
public/admin/config.yml                     ← + `history` folder collection + `history_page` singleton
src/data/nav.ts                             ← + "Our History" under About (2nd, after Who's Who)
src/content/pages/about-us.md               ← + "Our History" bullet in the "Find out more" list
```

The folder `src/pages/about-us/` already exists (it holds `whos-who.astro` and `whos-who/`), so
adding `history.astro` beside them is conflict-free; the explicit route out-specifies the catch-all
`[...slug].astro`.

---

## Page structure (top → bottom)

1. **Header (on paper).** `PageHeader` — kicker "About Us", H1 "The story of St Barnabas", italic
   intro. Dark ink; fully legible.
2. **Hero image band.** Full-width apse-painting photograph (`HistoryHeroBand`), flat, with an
   ink-soft italic caption beneath. No overlaid text.
3. **At a glance.** A slim `--paper-2` strip: the chapter **years** (`1905 · 1914 · 1916 · 1920 ·
   1922 · 1944 · 2011 · Today`) as burgundy small-caps **anchor links** that jump to each station.
   Derived from the chapters' `year` field — no separate editor input. Each chapter carries one
   clean display year (the prose can still state a full span, e.g. "built 1914–1916"). Respects
   `prefers-reduced-motion` for the scroll.
4. **The timeline spine.** A single 2px burgundy vertical rule down the page (the left border of a
   semantic `<ol>`). Each chapter is a **station**: a burgundy dot on the rule, the year marker
   (Cormorant burgundy) above a Cormorant heading, the rendered Markdown body in `.prose`, an
   **optional** image frame (caption beneath), and an **optional** burgundy `PullQuote`. The opening
   chapter uses a drop cap (CSS `::first-letter` on its lead paragraph).
5. **Credits + onward.** The Mather/Salmon credit line, and outlined onward links (e.g. "The organ
   today →" → `/worship/st-barnabas-organ`; "Plan your visit →" → `/visit`).

Mobile: single column; the rule stays at the left margin with the year above each heading; image
frames go full-width and stack. Standard responsive behaviour.

---

## Content model & dual-write

### `history` chapters — `src/content.config.ts` (Zod)

```ts
const history = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/history' }),
  schema: z.object({
    order: z.number(),
    year: z.string(),                       // single display year: "1905", "1916", "Today"
    title: z.string(),
    image: z.string().optional(),
    imageAlt: z.string().optional(),
    imageCaption: z.string().optional(),
    pullquote: z.string().optional(),
    pullquoteAttribution: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});
// …add `history` to `export const collections`.
```

### `history` chapters — `public/admin/config.yml` (Sveltia, mirror)

A folder collection modelled on `news`, with its own media folder:

```yaml
- name: history
  label: 🏛️ History chapters
  label_singular: Chapter
  description: The chapters of the History page (About → Our History). They appear in order.
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

(There is no `anchor` field — the in-page anchor is computed from the entry id, stripping the
`NN-` order prefix, exactly like `staffSlug` in `src/lib/staff.ts`.)

### `historyPage` singleton — `src/content/settings/historyPage.json`

Read by `src/data/history.ts` with a build-time `assertHistoryPage()` guard (the same belt-and-braces
approach as `assertSiteSettings`). Shape:

```json
{
  "kicker": "About Us",
  "title": "The story of St Barnabas",
  "intro": "From an iron mission church in a new garden suburb to E. C. Shearman’s soaring brick basilica — how our church came to be, and the people who built and adorned it.",
  "description": "The history of St Barnabas Church, Ealing — the Brentham garden suburb, the Tin Church, E. C. Shearman’s 1916 basilica, James Clark’s apse painting, and a century of Anglo-Catholic worship in Pitshanger.",
  "hero": { "image": "/images/history/apse-painting.webp", "alt": "James Clark’s apse painting: ranks of angels in red and gold gathered around the Holy Trinity.", "caption": "The apse painting, ‘the Three Hierarchies of Angels’, by James Clark, 1917–1920." },
  "credits": "Compiled from the parish history by Hugh Mather; photographs by Dr John Salmon.",
  "onward": [
    { "label": "The organ today", "href": "/worship/st-barnabas-organ" },
    { "label": "Plan your visit", "href": "/visit" }
  ]
}
```

### `historyPage` singleton — `public/admin/config.yml` (Sveltia, mirror)

```yaml
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
        - { name: kicker, label: Kicker, widget: string }
        - { name: title, label: Title, widget: string }
        - { name: intro, label: Intro line, widget: text }
        - { name: description, label: Summary (for search engines), widget: text }
        - name: hero
          label: Hero photograph
          widget: object
          fields:
            - { name: image, label: Image, widget: image }
            - { name: alt, label: Image description (for screen readers), widget: string }
            - { name: caption, label: Caption, widget: string }
        - { name: credits, label: Credits line, widget: string }
        - name: onward
          label: Onward links
          widget: list
          summary: '{{fields.label}}'
          fields:
            - { name: label, label: Link text, widget: string }
            - { name: href, label: Link, widget: string }
```

**Dual-write checklist for this page:** `history` chapters live in `content.config.ts` **and**
`config.yml`; `historyPage.json` is guarded in `src/data/history.ts` **and** mirrored by the
`history_page` collection in `config.yml`. Change a field in one, change it in the other.

---

## Components / units

- **`src/lib/history.ts`** — pure helpers `chapterAnchor(id)` and `prepareChapters(entries)` (sort
  by `order`, attach the id-derived anchor). No `astro:content` *value* import (only `import type`),
  so they unit-test cleanly under Vitest. The page itself calls `getCollection('history')`, passes
  the entries through `prepareChapters(...)`, and hands the prepared chapters to both `AtAGlance` and
  `Timeline` — so the strip and the stations cannot drift.
- **`src/data/history.ts`** — typed import of `historyPage.json` + `assertHistoryPage()` (throws at
  build if a required field is missing), mirroring `src/data/site.ts`.
- **`src/pages/about-us/history.astro`** — composes `Base` (SEO from the singleton's
  `title`/`description`; OG image = hero), `PageHeader`, `HistoryHeroBand`, `AtAGlance`, `Timeline`,
  credits, onward links. Renders each chapter via `render(entry)` → `<Content />` inside `.prose`.
- **`HistoryHeroBand.astro`** — full-bleed `<img>` (lazy below the fold? no — it's the hero, eager +
  `fetchpriority="high"`), flat, ink-soft italic caption beneath. No text overlay.
- **`AtAGlance.astro`** — `<nav aria-label="The story at a glance">` of year anchor links, built
  from the prepared chapters passed in as a prop.
- **`Timeline.astro`** — the `<ol>` spine + stations (a dot on the rule, the year marker above the
  heading, the Markdown body rendered via `render(entry)`, optional image `<figure>`, optional
  `PullQuote`). The continuous rule is the `<ol>`'s own left border, so there are no gaps between
  stations.
- **`PullQuote.astro`** — `<figure><blockquote>` in burgundy Cormorant italic + `<figcaption>`
  attribution in tracked small-caps. Reusable.

All tokens from `tokens.css`; no hard-coded hex/px. Burgundy used only for the rule, year markers,
dots, pull-quotes and outlined links. Visible focus rings on the anchor links; full
`prefers-reduced-motion` support on the smooth-scroll.

---

## Chapter source map (faithful facts for the copy)

Prose to be written in reverent, plain **UK English**, faithful to the archive — exact names and
dates as verified below. Each chapter links out where deeper detail already lives.

Each chapter's **`year`** (the single year below) is what shows on the timeline and the "at a glance"
strip; the full spans live in the prose.

| # | Year | Title | Key facts to include (verbatim-faithful) | Candidate image | Pull-quote |
|---|---|---|---|---|---|
| 1 | 1905 | **Before the church** | Rural Ealing until the GWR (1838); the **Brentham** garden suburb from 1901 (Ealing Tenants Ltd, Henry Vivian); the **"Tin Church"** — land bought Dec 1905 by Dr Tupholme with **Miss Mary Baron** and her sisters; iron mission church built 1907, consecrated **9 Nov 1907**, seating 250; later the parish hall; destroyed by fire **1 May 1942**. | Drawing of the Tin Church | — |
| 2 | 1914 | **Building the church** | Site at Pitshanger Lane / Denison Road (negotiations from Dec 1911); architects **Ernest Shearman** and **Ernest Tyler**; revised plans approved **25 May 1914** (two west towers, a nave bay and the north chapel cut to save ~30% — **the west rose window kept**); foundation stone laid **13 June 1914 by Miss Mary Baron**, blessed by the Bishop of Kensington, **Dr J. P. Maud**; builders **James Burges & Sons of Wimbledon**; Shearman dismissed in 1915, **Tyler** completed; **consecrated Saturday 3 June 1916** by the Bishop of London, **Dr A. F. Winnington-Ingram**; crowds turned away at the doors. | Exterior / the foundation stone | — |
| 3 | 1916 | **Ernest Shearman, architect** | **Ernest Charles Shearman (1859–1939)** — *use "Ernest", the homepage "Edward" is a typo*; six London churches 1910–1936; tall brick, no spires or towers, flowing rose-window tracery, the **Basilican** plan (altar central in the apse); St Barnabas one of six (St Matthew Wimbledon 1910; St Silas Kentish Town 1913; St Barnabas Ealing 1916; St Gabriel Acton 1931; St Barnabas Temple Fortune 1934; St Francis Osterley 1935). | Rose-window silhouette (J. Salmon) | **"Almost the final flowering of the last phase of the Gothic Revival."** — Dr John Salmon, on Shearman's churches |
| 4 | 1920 | **The angels of the apse** | **James Clark (1857–1943)** painted *"the Three Hierarchies of Angels praising and adoring the Holy Trinity"* — spirit fresco on canvas, **69 ft long × 25 ft high**, in three stages 1917–1920; the archangels **Gabriel and Michael** painted onto the walls in 1920; worked in vertical strips at his Bedford Park studio, his daughter **Lilian** assisting. | The apse painting | Clark called it **"my most important work."** |
| 5 | 1922 | **Glass, banner and furnishings** | Sanctuary windows given by **Stanley and Rosa Burgess, 1916** (Stanley a surgeon on Castlebar Hill), made by **Clayton and Bell**; two south-aisle windows **dedicated 1922**, one to four nephews who fell in the First World War; the **St Barnabas Banner** embroidered **1916**, reputedly by **Mrs Betty Mitchell**; nave paintings (the **Machuca "Holy Trinity"**, c.1516–1550, restored at the Courtauld 1986; a Murillo "Guardian Angel" copy; others). | A sanctuary window | *(optional)* Gillean Craig on the Trinity painting |
| 6 | 1944 | **War, fire and renewal** | A flying bomb on **20 Aug 1944** blew out the north windows; **1962** — arson at the high altar (**13 March**), the new altar first used **Easter 1963**; **1983** Lady Chapel subsidence and the "Renewing the Foundations" appeal; a triptych by **Sister Theresa Margaret** added **June 1996** for the 80th anniversary (tempera on gesso, 22-carat gold leaf). | Lady Chapel triptych | **"The beautiful Rose Window now lets in enough wind to blow the organ."** — Fr Barrett, 1944 |
| 7 | 2011 | **The organ** | The 1916 church made do with a second-hand **Bryceson** organ (1865, from All Hallows, St Pancras); dismantled 2010. The present instrument came from **St Jude's, Southsea** — first heard in **1851** — and was rebuilt in the west gallery by **Nicholson & Co.** in **2011**, funded by the legacy of **Hazel Baker**, Director of Music. *Keep this chapter short; link to the full organ page.* ⚠️ Use the **existing organ page's** authoritative framing for the present instrument; do not import the archive's looser spec wording. | The organ in the west gallery | — |
| 8 | Today | **A living church today** | A brief, warm close: a century of Anglo-Catholic worship on the same spot (centenary 2016); the parish today; an invitation to visit. Link to Worship / Visit. | A recent liturgy photograph | — |

**Copy flags to respect:** "Ernest" not "Edward" Shearman; do **not** assert a listed-building grade
(the archive never states one — verify with Historic England before any such claim); the Upper Room
date is given as both 1935 and 1936 in the source — omit or hedge rather than pick silently.

---

## Image migration

- **`scripts/fetch-history-images.mjs`** (new), modelled on `scripts/fetch-images.mjs`: fetch each
  chosen archive image from the old domain, **trying the un-suffixed original first** (strip
  `-250x178`-style size suffixes) and falling back to the largest available; resize/cap with `sharp`
  to a sensible width (~1600px) and emit optimised `.webp` into `public/images/history/`; produce a
  responsive variant where the source is large enough.
- A curated set of ~8 images (one hero + seven chapter photographs); the closing chapter reuses an
  existing, already-licensed parish photo in `public/images/hero/`. Each needs real **alt text**
  written from the archive captions.
- The CMS `media_folder`/`public_folder` for both history collections point at
  `public/images/history` / `/images/history`, so editors replace images in place.

---

## Enrichments to existing pages

In-scope, safe (done as part of this work):

- **`src/data/nav.ts`** — add `{ label: 'Our History', href: '/about-us/history' }` as the **second**
  child of About (after Who's Who).
- **`src/content/pages/about-us.md`** — add a bullet to the "Find out more" list:
  `- [Our History](/about-us/history) — how our church came to be, and the people who built it`.
- **Cross-links** from the History page out to the organ and visit pages (above).

Flagged, **not** changed here (need a source or parish sign-off):

- **Organ page (`/worship/st-barnabas-organ`).** The archive adds colour (the abandoned 1916 Willis
  scheme; the second-hand 1865 Bryceson; Hazel Baker's story) but its **spec details conflict** with
  the authoritative organ page (the Nicholson `websitespec.pdf`). Do **not** overwrite the spec; a
  one-line cross-link from the organ page to the History page is the only safe change, and even that
  is optional. Full reconciliation is a separate task.
- **Who's Who / Hugh Mather.** The archive confirms Mather as parish historian — which touches the
  **open DECISIONS item** on whether he is listed in Who's Who. Flag only; no change.

---

## Verification

- `npm run build` — page count **+1** (the new `/about-us/history`), **0 errors**; the chapter
  Markdown renders; `historyPage.json` passes its build guard.
- `npx astro check` — **0 errors** (new collection typed; helpers, components and page typed).
- `npm test` — green (the liturgical engine is untouched).
- **CMS parity:** `public/admin/config.yml` (the `history` folder + `history_page` singleton) matches
  `src/content.config.ts` and `historyPage.json`; an editor can add/reorder a chapter, edit the
  hero/intro/credits, and replace an image — with no code exposed.
- **Preview (screenshots):** (a) the paper hero + apse image band — **confirm no white-on-image
  text anywhere**; (b) the timeline spine with a pull-quote; (c) an image station; (d) the
  "at a glance" anchors jumping to stations; (e) mobile single-column stack. Confirm burgundy-on-paper
  contrast meets AA and focus rings are visible.

House verification line, e.g.: `Build: 168 pages, 0 errors; astro check 0 errors; vitest green.`

---

## Flagged / non-blocking

- **Photo rights (publish gate).** Confirm permission to republish **Dr John Salmon's** photographs
  (his copyright) and the parish archive before go-live — alongside `DECISIONS.md` §3.7.
- **Image resolution.** Even the un-suffixed WordPress originals may be modest; the best masters are
  likely held by Hugh Mather / John Salmon. The typographic design holds up regardless; better
  masters can drop into the same slots later.
- **Organ-spec reconciliation** (archive vs `websitespec.pdf`) — separate task; see memory
  `organ-spec-sources`.
- **Hugh Mather in Who's Who** — open `DECISIONS.md` item; untouched here.
- **Listed-building status** — never stated in the source; do not assert a grade without Historic
  England.
- **Source fragility.** The old WordPress site 500s intermittently; capture the images promptly.
- **MOCKUP preview URLs** in `config.yml` are unaffected by this change and still revert at go-live.
