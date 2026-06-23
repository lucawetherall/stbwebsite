# Design — Outward-facing improvements (Our Musicians + audit fixes)

- **Date:** 23 June 2026
- **Status:** Approved (design); moving to implementation plan
- **Author:** Luca Wetherall (with Claude)
- **Scope note:** Began as the "Our Musicians" page; expanded at the author's request to take in
  the buildable fixes from the outward-facing audit. Delivered as four staged PRs (§4).

---

## 1. Summary

A programme of outward-facing improvements to the St Barnabas website, prioritised for
**newcomers/visitors, life-events enquirers, and the wider community** (parishioner utility is
secondary). It bundles a new Music sub-page with the buildable fixes surfaced by the audit:

- **PR 1 — Our Musicians page** under Music (choir + Director of Music + Organist).
- **PR 2 — Findability & front doors:** promote Life Events in the nav, flatten Winter Night
  Shelter, and add a homepage community / "what's on" band.
- **PR 3 — Journey pages:** turn Plan Your Visit and Life Events from prose into guided pages
  (structure built now; a few parish facts and photos slot in later).
- **PR 4 — Interior imagery:** rolls out as photography arrives (mechanism ships in PR 1).

The full audit and its prioritisation are preserved in §12.

## 2. Background — facts that shape the build

- **Production = `main`.** Every merge deploys in ~1 minute. Hence the staged PRs; each must go
  green in CI and be independently shippable.
- **Editability contract.** Non-technical staff edit via Sveltia CMS. New page wording must be
  CMS-editable; the schema (`content.config.ts`) and CMS config (`config.yml`) must agree
  (dual-write); never move editable prose into code.
- **`pages` schema already defines `hero`/`heroAlt`** (`content.config.ts:12–13`) but they are
  **not rendered and not exposed in the CMS**, and **no page sets `hero`** today. The field is
  dormant — wiring it is a no-op for existing pages and gives us a CMS photo slot for free.
- **People are a collection.** `staff/*.json` (`name, role, email?, bio?, photo?, photoAlt?,
  order?`) auto-generates Who's-Who detail pages; `staffSlug()` gives stable slugs
  (`05-luca-wetherall` → `luca-wetherall`). Luca's record is complete (photo, bio); **Hugh's is
  bare** (name + role only).
- **Injection precedent.** The Organ page is a Markdown `pages` entry with a developer-owned
  `OrganSpec` component injected by `[...slug].astro` when `entry.id === 'worship/st-barnabas-organ'`.
  We reuse this slug→component pattern for the new dynamic bits.
- **Reusable components already exist:** `MapEmbed` (used on Contact), `ServiceTimes`
  (`serviceTimes.ts`), `EventsList`, `Gallery`.

## 3. Audience lens & principles

- Lens: newcomers → life-events enquirers → wider community.
- One accent, two serifs, warm/flat/quiet (house design system in `tokens.css`). No gradients;
  banner imagery is flat with the standard scrim where text overlays it.
- Every change must leave a non-technical editor able to manage the content afterwards.
- **Never invent parish facts** (fees, banns, names). Where a fact is needed and unknown, build
  the structure and leave editable copy / a flagged slot.

## 4. Scope & staging

| PR | Title | External input needed? |
|----|-------|------------------------|
| 1 | Our Musicians page | No (photo optional, slot left) |
| 2 | Findability & front doors (nav/IA + homepage band) | No (photos optional) |
| 3 | Journey pages (Plan Your Visit, Life Events) | Yes — a church photo; Life-events facts |
| 4 | Interior imagery rollout | Yes — photography |

**Non-goals (this programme):** full Hugh bio; a calendar/events back-end; the deferred audit
items in §12; any change to the liturgical engine, design tokens, or the news template.

---

## 5. PR 1 — "Our Musicians" page

### 5.1 New page — `/worship/our-musicians`
- `src/content/pages/worship/our-musicians.md` (Markdown, `pages` collection). Frontmatter:
  `title: "Our Musicians"`, `kicker: "Music"`, an `intro`, a `description`; `hero` left unset.
- Editable body, in order: **choir portrait** (relocated from `music.astro`); **"The choir"**
  (scholars + voluntary singers, Sunday 9.30–10.15am rehearsal, young singers 10+ welcome);
  short **"Sing with us" / "Listen"** pointers back to the Music landing.
- Below the prose, an injected `Musicians` component renders the people.

### 5.2 `Musicians` component (people reused from `staff`)
- `src/components/Musicians.astro`; injected by `[...slug].astro` when
  `entry.id === 'worship/our-musicians'` (mirrors `showOrganSpec`).
- `getRoster()`, select by stable slug in order: `['luca-wetherall', 'hugh-mather']`.
- Per card: media (`photo`, else `staffInitials()` monogram in the 4:5 frame); role label; name;
  **teaser = first sentence of `bio`, shown only when a bio exists**; **"Read full profile →"**
  to `/about-us/whos-who/<slug>` **only when a bio exists**. Result: Luca = photo + teaser +
  link; Hugh = monogram "HM" + role + name, nothing else. No bios duplicated.

### 5.3 Choir-photo banner (wire the dormant `hero`)
- In `[...slug].astro`, when `entry.data.hero` is set, render a flat banner `<img alt=heroAlt>`
  between `PageHeader` and the prose (house aesthetic; no gradient). Unset → render nothing, so
  every existing page is unchanged. Our Musicians leaves it empty → text-only launch; the editor
  adds a choir photo later (optimise via `scripts/` sharp pipeline). This is the PR-4 mechanism.

### 5.4 Music landing (`worship/music.astro`)
- Remove the detailed "The choir" `<section>` and the closing Director-of-Music `page-aside`
  (content relocated to §5.1). Add a short teaser + **"Meet our musicians →"** to the new page.
  Keep the intro, Choral Scholarships aside, and "Listen".

### 5.5 Nav & CMS for PR 1
- `nav.ts`: add `{ label: 'Our Musicians', href: '/worship/our-musicians' }` under **Music**,
  before "St Barnabas Organ".
- `config.yml`: register the page in the `pages` `files:` list with `fields: *pf`; **expose
  `hero`/`heroAlt`** on the shared `&pf` anchor (optional image + string, friendly hints). This
  closes the existing schema↔CMS dual-write gap.

---

## 6. PR 2 — Findability & front doors

### 6.1 Navigation / IA (`src/data/nav.ts`)
- **Promote Life Events:** remove it from the Worship submenu and add `Life Events` as a
  top-level item (href `/life-events`). Worship submenu becomes Sundays · Weekdays · Special
  Services · Worship Online. (Once §7.2 sections the page, optional anchor children
  Baptisms/Weddings/Funerals may be added.)
- **Flatten Winter Night Shelter:** re-parent it in the nav from About › Social Action › Winter
  Night Shelter to a child of **Community** (Food Pantry · Memory Café · **Winter Night Shelter** ·
  Pitshanger Pictures). **The page URL stays** (`/about-us/social-action/winter-night-shelter`) —
  this is a nav-grouping change only, so no redirect is needed. The Social Action page keeps a
  cross-link so the topical grouping survives.
- **Density:** the primary bar becomes eight items + Give. Keep News. **Verify the desktop row
  does not wrap** at the current breakpoint; if tight, raise the inline-nav breakpoint
  (`1024px` → e.g. `1120px`) so it collapses to the mobile panel a little sooner. No item is
  demoted.

### 6.2 Homepage community / "what's on" band
- New `src/components/CommunityBand.astro`, placed on the homepage (after `NewsIndex`, before
  `NewsletterSignup`). Surfaces the outward offer with links to existing pages: Food Pantry,
  Memory Café, Winter Night Shelter, Pitshanger Pictures, plus a **Life Events** entry point
  (baptisms · weddings · funerals). Text-and-links first; optional per-item images later (can
  reuse the `hero`/`gallery` imagery once supplied). Developer-owned layout linking to
  editor-owned pages — no new editable surface required, so no schema change.

---

## 7. PR 3 — Journey pages (structure now, parish content later)

### 7.1 Plan Your Visit (`visit.md` + injected detail)
- Keep the editable prose. Add an injected `VisitDetails` component (slug `visit`, same pattern
  as §5.2) rendering: a **`MapEmbed`**, an **at-a-glance service card** (the Sunday Sung Mass
  10.30am from `serviceTimes.ts`), and a **prominent next-step CTA** ("Plan your visit" → contact
  / "Get directions"). Wire the **`hero` photo slot** for a church exterior shot (left empty until
  supplied). No invented content — all copy already exists or is structural.

### 7.2 Life Events (`life-events.md` + injected CTAs)
- Keep the pastoral prose; its existing H2s (Baptisms & Confirmation · Weddings · Funerals)
  become clear sections. Add an injected `EnquireCTA` (slug `life-events`) giving each rite a
  prominent **"Enquire about a baptism / wedding / funeral"** button → the parish office /
  clergy email. **No fees, banns, or qualifying-connection wording is invented** — those remain
  for the parish to add as editable copy; the spec/DECISIONS records the gap.

## 8. PR 4 — Interior imagery rollout (deferred)
- The `hero` mechanism ships in PR 1. As photography arrives, set `hero` on key landing pages
  (Visit, Worship, Community, Families section pages) for warmth — within the restrained
  aesthetic. No code change beyond what PR 1 provides; this is content + light styling.

---

## 9. Editability-contract compliance (all PRs)
- New/edited page wording stays CMS-editable Markdown; the new page is registered in `config.yml`. ✔
- People stay single-source in `staff`; no bios duplicated. ✔
- Net direction moves prose *out* of code (choir copy `.astro` → Markdown). ✔
- Dual-write honoured: `hero` exposed; new page registered. ✔
- Dynamic bits are injected components (like `OrganSpec`), never raw HTML/JSX in editor prose. ✔
- Nav (`nav.ts`), homepage layout, and the injected components are deliberately developer-owned. ✔

## 10. Content the parish must supply (does not block structural work)
- **Choir photo** → Our Musicians banner.
- **Church exterior photo** → Plan Your Visit banner.
- **Life-events facts** (optional, when ready): wedding/funeral fees (or "ask us"); eligibility /
  banns wording; process/timeline. Until then the pages carry pastoral copy + enquiry CTAs only.
- **Optional** community photos for the homepage band and PR 4.

## 11. Verification (house format, per PR)
- `npm run build` (page count: **+1** at PR 1 for Our Musicians; unchanged at PR 2; unchanged at
  PR 3) with **0 errors**; `npx astro check` **0 errors**; `npm test` green.
- **CMS parity** after PR 1: `config.yml` ↔ `content.config.ts` agree (page registered, `hero`
  exposed).
- Manual: PR 1 — Music dropdown shows both children; Luca links, Hugh does not; no banner while
  `hero` empty. PR 2 — Life Events on the top bar; Winter Night Shelter under Community; desktop
  bar does not wrap. PR 3 — map + service card + CTA on Visit; enquiry buttons on Life Events.
- Each PR: `Build: N pages, 0 errors; astro check 0 errors; tests green.`
- **DECISIONS.md** updated: Hugh's interim listing (§3); Life-events facts still pending.

## 12. Deferred backlog — remaining audit items
Recorded so nothing is lost; **not** in this programme:
- **Item 6 (broad):** full interior-imagery rollout beyond the mechanism (needs photography).
- **A unified "What's on" / events surface** — events still appear only as Special Services under
  Worship; newcomers/neighbours have no single upcoming-events view. (The homepage band in §6.2 is
  a partial step.)
- **Deeper Life Events content** — fees/banns/process detail (gated on parish facts, §10).
- **Cross-cutting:** consistent next-step CTAs everywhere; warmth-through-photography across the
  site. *Reviewed, no action:* mobile nav is sound; the typographic system, liturgical hero engine
  and palette are strengths to preserve.

## 13. File-change checklist
**PR 1 — Our Musicians**
- `src/content/pages/worship/our-musicians.md` — new (editable prose).
- `src/components/Musicians.astro` — new (people from `staff`).
- `src/pages/[...slug].astro` — inject `Musicians`; render `hero` banner when set.
- `src/pages/worship/music.astro` — trim choir section; add "Meet our musicians →".
- `src/data/nav.ts` — add "Our Musicians" under Music.
- `public/admin/config.yml` — register page; expose `hero`/`heroAlt` on `&pf`.
- `DECISIONS.md` — Hugh interim listing.

**PR 2 — Findability & front doors**
- `src/data/nav.ts` — promote Life Events to top level; move Winter Night Shelter under Community.
- `src/components/SiteHeader.astro` — verify/raise inline-nav breakpoint if the bar wraps.
- `src/content/pages/about-us/social-action.md` — add cross-link to Winter Night Shelter.
- `src/components/CommunityBand.astro` — new; `src/pages/index.astro` — place it.

**PR 3 — Journey pages**
- `src/components/VisitDetails.astro` — new (map + service card + CTA); inject for `visit`.
- `src/components/EnquireCTA.astro` — new (per-rite buttons); inject for `life-events`.
- `src/pages/[...slug].astro` — wire the two injections.
- `DECISIONS.md` — note Life-events facts pending.
