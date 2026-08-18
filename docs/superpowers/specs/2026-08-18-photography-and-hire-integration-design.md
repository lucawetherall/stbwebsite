# Photography integration & a proper Hire section — design

- **Date:** 18 August 2026
- **Status:** Approved design, ready for implementation planning
- **Branch:** `claude/st-barnabas-image-integration-e7c0f6`

## 1. What & why

The parish has a library of ~94 photographs (worship, choir, recordings/concerts, community
life, halls, weddings, youth, architecture, atmospheric candlelit shots). The site is currently
almost text-only: two homepage bands carry CSS-background artwork, staff and history pages carry
photos, and every other standing page is prose through the header. The goal is to **integrate the
photography across the whole site, in context, in a restrained and well-designed way** — and, as
a distinct improvement discovered during design, to **build a proper "Hire" section** so the
church-as-venue (recordings, concerts) and the halls each have a real home instead of a single
footer link.

Two hard constraints from the outset:

1. **No hero added to the homepage.** The existing top seasonal-artwork band stays; we do not
   introduce a new photographic hero at the top of the home page.
2. **Do not remove any current high-res image** unless we are 100% certain a new one is better.
   The only replacement candidates are the four seasonal hero artworks, and only via an explicit,
   per-image side-by-side review (see §12).

## 2. Principles this must respect

- **The editability contract (CLAUDE.md §4).** New content must stay manageable by non-technical
  staff via Sveltia CMS. Any schema/field change is **dual-written** to both
  `src/content.config.ts` and `public/admin/config.yml`. We never move editable content into code
  (except the deliberately code-driven "cornerstone" layer: homepage layout, nav, components,
  design tokens).
- **Design ethos (CLAUDE.md §5).** Restraint, reverence, readability. One accent (`--burgundy`),
  three typefaces, no gradients, flat scrims, tokens not hard-coded values, WCAG 2.1 AA.
- **Self-hosted, no CDNs.** No Google Fonts, no third-party embeds that load before consent.
  Images optimised ahead of commit via the existing `sharp` scripts → WebP → `public/images/…`.
- **UK English everywhere.** Copy, captions, commits, docs.
- **Flag, don't invent.** Where a fact isn't known (rates, capacity, who is in a photo, consent),
  leave a clearly-marked placeholder for the parish rather than making something up.

## 3. The photo library (source)

Local originals at `/Users/lucawetherall/Documents/st barnabas picture/` (417 MB, JPEG), grouped:

| Folder | Count | Feeds |
|---|---|---|
| `2026 worship` | 20 (+1 PDF) | Worship pages, homepage strip, News |
| `2026 exterior and interior shots` | 23 | About, Visiting, Contact, Hire hub |
| `2026 community` | 15 | Community pages, What's On, homepage strip |
| `2026 choir` | 10 | Music pages, homepage strip |
| `2026 recordings and concerts` | 10 | **Hire → Recordings / Concerts** |
| `2026 halls and lettings` | 8 | **Hire → Halls** |
| `church shots` | 4 (14–18 MB each) | Hire hub, Worship, Concerts |
| `2026 weddings etc` | 2 | Life Events, Halls (receptions) |
| `2026 youth` | 2 | Families & Children |

The single PDF (`Picture Pentecost…`) is not an image and is out of scope for direct use.

## 4. Information architecture — the new **Hire** section

### 4.1 Navigation

Add **Hire** as a top-level item in `src/data/nav.ts`, placed after *Community* and before
*News*, with three children:

```
Hire  (/hire)
 ├─ Recordings  (/hire/recordings)
 ├─ Concerts    (/hire/concerts)
 └─ Halls       (/hire/halls)
```

- Remove the old **Venue hire → /venue-hire** entry from `utilityNav` (footer); the section is
  now top-level. (Optionally keep a footer link to `/hire`.)
- The top band grows to ten items; verify it does not overflow on narrow desktop and mobile
  (it now has its own band, so there should be room).

### 4.2 Routes & content ownership

Four dedicated `.astro` routes render the section, **mirroring the `history.astro` precedent**
(a dedicated route fed by a guarded, CMS-editable settings file):

- `/hire` — hub. Introduces the church & halls as venues (acoustics, concert organ, grand piano,
  transport). Lead figure, then routes to the three sub-pages.
- `/hire/recordings` — the church as a **recording venue**. Features the three films (§7.3),
  recording/broadcast photos, links to the Organ spec.
- `/hire/concerts` — the church as a **concert venue** (organ, piano, candlelit atmosphere,
  sightlines, how to enquire). Cross-links to What's On.
- `/hire/halls` — **the existing Venue Hire content moved here**: the rates table, "how to book"
  (Sanjit Sil / parish office), plus a photo gallery of the halls, kitchen and lobby.

### 4.3 Redirects (`public/_redirects`, first-match-wins, 301)

```
/venue-hire   /hire/halls   301
/venues       /hire/halls   301   # currently points to /venue-hire; repoint to avoid chaining
```

Confirm no other internal links reference `/venue-hire` (the booking-form link targets
`/documents`, which is unaffected).

## 5. Distribution map — photography, area by area

Photography flows into every relevant area, always in context. **★ = a re-shaped, photo-led
layout** (the licence to restructure a page where it clearly helps). Everything else slots into
existing layouts.

| Area | Plan | Source |
|---|---|---|
| **Homepage** | One "life of the parish" **strip** (4 photos) low on the page, by News/Community; each links to its section. Top seasonal band untouched. | worship · choir · community |
| **What's On** | Featured-event images (field already exists) | community · worship |
| **Worship** (hub) | Lead figure + extend the **existing gallery** | worship · church shots |
| — Sundays / Weekdays / Special Services | A figure each (Sung Mass; Compline; per-feast) | worship |
| **Music** (hub) | Lead figure + small gallery; cross-link to Hire → Recordings | choir |
| — Our Musicians / Organ | Choir & loft context; organ figure | choir · recordings |
| **★ Hire** (new) | Hub + Recordings + Concerts + Halls (§4, §7.3) | recordings · halls · church shots · exterior |
| **★ Life Events** | Photo-led: wedding & baptism figures on a currently text-only page; cross-link to Halls for receptions | weddings · worship (baptism) |
| **About** (hub) | Exterior lead figure | exterior |
| — Visiting Us | Exterior + interior wayfinding figures | exterior/interior |
| — Our History | Keep the historical set; optionally 1–2 current architecture figures | exterior/interior |
| — Pastoral Care / Social Action | One quiet figure each | worship · community |
| **Families & Children** (hub + Noisy Mass, Youth Group) | Lead + per-page figures | youth |
| **Community** (hub + Food Pantry, Memory Café) | Lead figure + small gallery | community |
| **Contact** | Exterior "recognise the building" figure | exterior |
| **News** | Begin using the post header-image field (wired, currently 0/129 used) | all, as relevant |

## 6. The house photo style (decided)

A single reusable **`src/components/Figure.astro`**:

- Image **contained** to the text column, **square corners, no border**, `object-fit: cover`,
  `--paper-2` backing while loading.
- **Caption beneath** in italic serif (`--font-display`, i.e. Cormorant), muted ink, with an
  optional **credit** line.
- **Alt text required** (empty string only for purely decorative use).
- Intrinsic `width`/`height` always set (no CLS); `loading="lazy"` / `decoding="async"` by
  default, with an `eager`/`fetchpriority` opt-in for a page's lead image.
- Uses **tokens only** — no stray hex or px. This also becomes the canonical figure style,
  gently unifying the currently-inconsistent 4px/5px, bordered/unbordered treatments (we do **not**
  refactor the existing history figure components now — see §16).

Galleries reuse the existing **`src/components/Gallery.astro`** lightbox (currently only on
Worship) for Worship, Music, Community and Hire → Halls. **No standalone gallery page.**

## 7. Components & pipeline

### 7.1 Image pipeline

- New photos are optimised to **WebP** under tidy, kebab-cased paths:
  `public/images/hire/`, `public/images/worship/`, `public/images/music/`,
  `public/images/community/`, `public/images/life-events/`, `public/images/families/`,
  `public/images/about/` (exterior/interior). Create the missing `public/images/uploads/` (the
  CMS default target).
- Extend the existing `scripts/` sharp pattern with a prep script that resizes each curated
  library image to **two widths** (≈800 and ≈1600) as WebP, plus gallery thumbnails
  (`aspect-ratio 4/3`), stamping intrinsic dimensions. Budgets in the spirit of the
  `optimise-images` skill: figures/heroes < ~300 KB, thumbnails small.
- `Figure`/`Gallery` use **`srcset` + `sizes`** across the two widths — a modest, consistent
  responsiveness upgrade. We stay on **public-path strings, not `astro:assets`**, because
  CMS-uploaded images are referenced by public path and cannot be build-time imported (§16).

### 7.2 `settings/hire.json` (new, CMS-editable)

A single guarded settings file — the `historyPage.json` precedent — holding everything editable
for the Hire section so staff can change it without code:

- Per-page intro copy (hub, recordings, concerts, halls).
- **Hall rates** (the table currently hard-coded in `venue-hire.astro`) + booking contact + notes.
- **Featured films** list for Recordings: `[{ youtubeUrl, title, ensemble, work, posterImage,
  posterAlt }]`.
- Concert-venue details (capacity — *to confirm*, facilities).
- Per-page hero/gallery image references + alt.

Add an `assertHireSettings()` build guard (mirrors `assertSiteSettings`). **Dual-write** the shape
to `public/admin/config.yml` as a `file` collection with friendly hints, matching
`content.config.ts`/the `site.ts` import pattern.

### 7.3 `YouTubeFacade.astro` (new, privacy-friendly)

- Renders a **self-hosted poster image** + an accessible play **button**; the YouTube `<iframe>`
  (via `youtube-nocookie.com`) is injected **only on click**. No cookies or third-party requests
  until the visitor opts in; no third-party JS library.
- Poster images are fetched from the video thumbnail at prep time and stored/optimised locally
  (self-hosted convention), or a church photo is used.
- Accessibility: real `<button>` with an `aria-label` naming the film, keyboard-operable, focus
  moved into the iframe on activation, honours `prefers-reduced-motion`.
- The three initial films (from YouTube oEmbed):
  - **Alma Consort** — *Abide With Me* (arr. Moses Hogan) — `x6XVNkIXqlU`
  - **Continuum** — *Bring us, O Lord God* (William Harris) — `tvX1nPE_fKc`
  - **Choir of Merton College / Britten Sinfonia** — John Ireland, *Greater Love* (Delphian
    Records) — `UIaTngP-l-4`

## 8. Editability summary

- **Editor-owned (CMS):** every content photo and its alt/caption — via existing fields (`pages`
  `hero`/`gallery`, `news` `hero`, `events` `image`, `staff` `photo`, `history` `image`) and the
  new `settings/hire.json`. All dual-written.
- **Code-driven cornerstone (deliberately not CMS):** the **homepage "life of the parish" strip**
  is part of the developer-owned homepage layer, exactly like the existing Hero and MusicBand
  bands — its four images are curated in code (a small data file). This is consistent with the
  contract; if staff later want to rotate it themselves we can wire it to settings, but we do not
  over-build that now (YAGNI).

## 9. Captions, alt text, credits

- Captions drafted in the house voice — reverent, plain, **liturgically correct** (Sung Mass,
  Choral Evensong, Compline, correct feast names).
- **Alt text on every image**; decorative-only images take `alt=""`.
- Where the specific occasion/person/feast in a photo cannot be verified from its filename, the
  caption is drafted conservatively and **flagged for parish confirmation** rather than asserted.
- If photos require a **photographer credit**, the `Figure` credit line carries it (⚑ confirm).

## 10. SEO & metadata

- Each new page sets `title`, `description`, breadcrumb, and a **relevant OG image** (not the
  single default) via the existing `Base.astro`/`seo.ts` layer.
- Recordings page emits **`VideoObject` JSON-LD** per film (name, thumbnailUrl, embedUrl,
  ensemble).
- Confirm new routes appear in the sitemap and Pagefind search index at build.

## 11. Accessibility

WCAG 2.1 AA throughout: visible focus rings, meaningful alt, the facade and gallery fully
keyboard-operable, `prefers-reduced-motion` respected, sufficient contrast for captions over
paper and for any text over imagery (existing `--white`/scrim tokens).

## 12. The current high-res images (protecting incumbents)

Nothing existing is removed. Staff portraits, history images and news images are **added to,
never replaced**. The **only** swap candidates are the four seasonal hero artworks
(`procession`, `altar`, `worship`, `thurible`). For each, present a **side-by-side comparison**
with the best new-library candidate and change it **only on explicit approval**. The homepage
MusicBand background is **not** touched (homepage decision was the strip alone).

## 13. Safeguarding & consent — a publish gate

Several photos show identifiable individuals, **including children** (youth group, choristers,
Noisy Mass). Before any such image is published, the parish must **confirm photo consent per its
safeguarding policy**. Implementation stages that would publish images of people must not merge
until this confirmation exists; where consent is unclear, prefer images without identifiable
faces, or crowd/architecture shots.

## 14. Staging — five reviewable PRs, dependency-ordered

Each PR must build green (`npm run build`, `astro check`, `npm test`) before the next.

1. **Foundations** — image-prep script + folders + `public/images/uploads/`; `Figure.astro`;
   `YouTubeFacade.astro`; the missing-image build guard. No page changes yet.
2. **The Hire section** — nav update; `settings/hire.json` + guard + dual-write; the four `/hire`
   routes; migrate `venue-hire.astro` content to `/hire/halls`; redirects; recordings films +
   halls gallery + hub/concerts photography; `VideoObject` JSON-LD.
3. **Life Events + section figures** — Life Events photo-led; Worship/Music/Community/About/
   Families figures & galleries; begin using News + What's On image fields. *(Publishes images of
   people — gated by the §13 consent check.)*
4. **Homepage strip** — the code-driven "life of the parish" band by News/Community. *(Publishes
   images of people — gated by the §13 consent check.)*
5. **Seasonal-hero review** — side-by-side comparisons; swap only those the parish approves.

## 15. Verification (every PR)

- `npm run build` — page count rises as expected, **0 errors**; Pagefind index builds.
- `npx astro check` — 0 errors.
- `npm test` — liturgy engine stays green (unaffected).
- **Dual-write check:** `public/admin/config.yml` matches `src/content.config.ts` and any new
  settings shape; an editor could still manage every new surface.
- Image budgets respected; every image has alt text; no CLS on image-heavy pages.
- Preview pass in the browser (desktop + mobile, light/dark) on changed pages.

## 16. Out of scope / explicit non-goals

- **No migration to `astro:assets`** — incompatible with CMS public-path images; the manual
  `sharp` → WebP convention is retained deliberately.
- **No refactor of the existing history figure components** now — `Figure.astro` is introduced
  for new usage; consolidating history onto it is a possible later tidy, not this work.
- **No cleanup of unused legacy assets** (`garden.webp`, `marks/*`, hero logo PNG) — separate.
- **No standalone gallery page.**

## 17. Open items for the parish (flagged, not invented)

1. ⚑ **Photo consent / safeguarding** sign-off for images of identifiable people, especially
   children (see §13).
2. ⚑ **Church-hire rates** for recordings and concerts.
3. ⚑ **Concert capacity** of the building.
4. ⚑ **Photographer credit(s)**, if any are required.
5. ⚑ Confirmation of the **occasion/feast/people** depicted where filenames are ambiguous.

These should be tracked in `DECISIONS.md §3` alongside the other open content items.
