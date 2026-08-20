# Build decisions & open items — barnabites.org

This is the handover record for the new **St Barnabas Ealing** website (Astro → Cloudflare
Pages). It lists every default taken where the brief left a choice, decisions made while
building, things to confirm with the parish, and the deploy runbook.

**Status:** all 10 milestones of the brief complete. `npm run build` produces **160 pages**
(home + 28 editorial/section pages + 129 migrated news posts + RSS) with **0 axe WCAG 2.1 AA
violations** on the page types tested (home, content, contact, news article).

---

## 1. §19 open items — defaults taken

| # | Item | Default implemented | Notes |
|---|------|---------------------|-------|
| 1 | **ChurchDesk events feed** (iCal/API for org 1901) | Manual `events` collection + env-driven iCal hook, surfaced on **What's On** (`/whats-on`) | The old `barnabites.org` has **no events/calendar page and no calendar widget** — events were communicated only via the weekly ChurchDesk newsletter and periodic "Regular Events & Activities [month]" blog posts (migrated to `/news/`). So the `events` collection and the `/whats-on` diary are a **new feature**, not a migration. **Update (19 August 2026):** working public ChurchDesk iCal endpoints were later supplied by the parish (`api2.churchdesk.com/ical/taxonomy/<id>?organizationId=1901` — Community 48613, Concert 46604, Worship 46609 & 181496, superseding the earlier finding that no endpoint was exposed). They are unauthenticated and CORS-open, so they are baked into `src/lib/events-feed.ts` as **`DEFAULT_FEED_URLS`**; **`EVENTS_ICAL_URLS`** (comma- or newline-separated; `CHURCHDESK_ICAL_URL` still honoured) *overrides* them wholesale, and setting it to an empty string turns feeds off. The twice-daily scheduled deploy (deploy.yml) keeps build-time pages fresh, and the What's On **calendar view** re-reads the feeds live in the visitor's browser (see §8). Feed events are merged with the collection, with a CMS entry winning over a feed entry of the same title on the same day so an editor can enrich it. A missing, slow or broken feed only logs a warning; it can never fail a deploy. See §8 for the full events architecture. |
| 2 | **Music-list source** for `services` | Manual JSON in `src/content/services/` | Seeded with the two real sheets from the brief (Corpus Christi 7 Jun, St Mary Magdalene 19 Jul). Add one JSON file per Sunday; `ThisSunday` auto-selects the coming Sunday and falls back to the standing pattern. |
| 3 | **Blog/photography reuse rights** | Migrated all 129 posts; self-hosted the parish's own liturgy photos with on-page credit support | **Confirm** the parish holds rights to the liturgy photographs and blog images before go-live. |
| 4 | **Children's Church age range** (nav 5–9 vs home 5–11) | **5–9** | The live `/families-children/childrens-church-ages-5-9` page itself states 5–9 in both heading and body, so 5–9 is used throughout. (Slug kept as `…-5-9`.) |
| 5 | **Accent hue `#400642`** | A very dark plum-violet taken from the parish logo, replacing the original Sarum wine `#6A1B2D` | Single token `--violet` in `src/styles/tokens.css`; change once to retune. Watch its contrast against `--ink` as well as the paper — a dark accent stops reading as an accent well before it fails AA. |
| 6 | **Analytics** (Plausible vs Beats) | **Plausible**, but emitted only when `PLAUSIBLE_DOMAIN` is set | We do **not** ship a hard-coded analytics tag, so there is no broken/unowned script in production. Set `PLAUSIBLE_DOMAIN=barnabites.org` (and create the Plausible site) to enable. Plausible is cookieless, so it needs no consent gate. |
| 7 | **Official lancet logo SVG** | The §4.4 placeholder mark | In `src/components/Logo.astro` and `public/favicon.svg`. Swap in the parish's official SVG when available. |

---

## 2. Decisions made during the build

- **Content sourcing.** All editorial copy was ported faithfully from the *current* live
  `barnabites.org` pages (fetched and re-set into the design). New copy was written only for
  the Visiting page (did not exist before) and the Choral Scholarship section of
  `/worship/music` (the live site has no scholarship detail).
- **Service times lead the homepage; Plan Your Visit moved under About (2 August 2026).** The
  standing Sunday pattern used to appear on `/` only as a *fallback* inside `ThisSunday`, so it
  vanished in any week the choir's music sheet was published. It now has its own permanent band
  (`src/components/ServiceTimesBand.astro`) directly under the hero, with the music sheet below
  it and rendered only when a sheet exists. With the homepage doing that front-door job,
  `/visit` no longer earned a top-level nav slot: it moved to `/about-us/visiting` ("Visiting
  Us", `seoTitle` still "Plan Your Visit"), with a 301 from `/visit`.
- **Seasonal features derive from the music list (August 2026).** The homepage hero insert,
  the site notice line and the season panels on What's On / Special Services are computed at
  build time by `src/lib/seasons.ts` from the existing `services` collection — windows anchored
  on `liturgicalDates()` in the engine, services gathered **by date containment, never by
  matching the Director of Music's wording**, which stays verbatim. A new content collection
  was considered and rejected: the music list already records every special service, the parish
  keeps exactly one artefact, and a derived feature cannot go stale. Consequences accepted
  knowingly: the engine states kalendar dates while the parish often keeps feasts *transferred*
  to Sunday (the sheets say so — the features take their dates from the sheets where the
  keeping moves, e.g. the Requiem on All Saints' evening); a principal window with no sheets
  warns at build and renders nothing (never a throwing guard — a CMS Publish must not be able
  to fail the production deploy); and the twice-daily cron is now more load-bearing — a stalled
  schedule (GitHub disables crons after ~60 days of repo inactivity, and failures are silent)
  freezes the seasonal panels along with "This Sunday", so check the Actions tab if the site
  seems stuck in time.
- **`/worship/online` is a new clean URL.** The live "Worship online" page lives at the opaque
  `/worship/p1663` (a ChurchDesk landing redirect). We built a clean `/worship/online` page and
  301 the old URL to it.
- **`/venues` → `/venue-hire`.** The live `/venues` page is a thin stub; the substantive halls
  /pricing content is on `/venue-hire`. `/venues` now 301s to `/venue-hire`.
- **Astro 6 content layer.** Content config lives at `src/content.config.ts` (Astro 6
  requirement) using the glob/loader API, not the legacy `src/content/config.ts`.
- **Scroll-container bug fixed.** The brief's `body { overflow-x: hidden }` makes `<body>` a
  scroll container, which breaks `window.scrollTo`, anchor jumps and sticky positioning. Changed
  to `overflow-x: clip` (same clipping, no scroll container).
- **Hero/MusicBand accessibility.** Art-led bands use a CSS background image plus a visually
  hidden (`.sr-only`) description rather than `role="img"` (which would be an invalid
  nested-interactive container, since the bands contain links). Fixed during the a11y pass.
- **Newsletter signup.** Implemented as the brief's "robust" option: a consent-gated loader for
  the official ChurchDesk signup widget (`signup-loader.js`, org 1901), with the public archive
  as a always-available fallback link. No fragile custom endpoint.
- **`functions/newsletter.ts` not created.** The widget approach posts directly to ChurchDesk
  from the browser, so no server-side proxy is needed. Add the Pages Function only if you later
  switch to a fully custom `<form>` that hits a documented ChurchDesk POST endpoint blocked by
  CORS.
- **Documents self-hosted.** Order of Service, Choral Scholar role description, Expense Form
  (all PDF) and the Data Protection Notice (**actually a Word `.docx`** as served by ChurchDesk)
  are in `public/documents/`. The Annual Report & APCM use **expiring tokenised** links and were
  **not** migrated — obtain current copies from the parish office and drop them in
  `public/documents/`, then add entries in `src/content/documents/`.
- **Hero images** capped at 1920px / quality 74 webp (+ a 1280 variant) for LCP.
- **Responsive type scale (accessibility).** The congregation skews elderly, so the root font-size
  steps up with the viewport — **103%** mobile, **108%** ≥768px, **111%** ≥1024px — and `body` is
  `1.125rem` (≈18.5 / 19.4 / 20.0px). Because virtually every size on the site is in `rem`, the
  root is the single lever and everything scales in proportion. **Percentages, not px, on
  purpose:** a percentage is relative to the reader's own browser default, so anyone who has
  already raised it for legibility keeps that benefit; a px value would silently override them.
  The rules are `@media screen`-scoped so the print size (`11.5pt`) still wins. Don't collapse
  these to a single value or convert them to px.
- **Desktop nav breakpoint 1180px** (was 1024px). The primary nav bar was already close to
  overflowing at 1024px, and the type scale above widens it further; 1180px matches `--maxw`, above
  which the capped `.wrap` gives the nav a constant width budget. iPad landscape therefore gets the
  full-screen mobile menu — larger tap targets, no cramped single-line bar.

---

## 3. To confirm with the parish before go-live

1. **Safeguarding leads.** The live page names **no** safeguarding officers. The names used on
   `/safeguarding` (Pat Chapman — PSO; Helen Ward — Children's Champion; Angela Colman — DSA)
   come from the brief's data and **must be verified** (this is a real content gap on the old
   site, not an error).
2. **Email domain `.org` vs `.net`.** A few live pages showed `@barnabites.net` (garden team,
   and the vicar/office on one or two pages) while the canonical site is `@barnabites.org`. We
   used **`.org` throughout**. Confirm the garden-team and vicar addresses.
3. **Music enquiries email.** The live music page uses **`music@barnabites.org`** (now used
   site-wide for music, incl. the footer), but the brief's `site.ts` specified
   `directorofmusic@barnabites.org`. Both likely reach the Director of Music — confirm which is
   preferred (`src/data/site.ts` → `emails.music`).
4. **Special Services naming (August 2026).** The page now follows the music list's printed
   usage — "Easter Day", "The Easter Vigil & First Mass of Easter", and "Solemn Requiem for the
   Faithful Departed" (with an All Souls gloss) in place of "Easter Sunday", "The Great Vigil"
   and "All Souls' Requiem". Also to confirm: may visitors ask for a name on the list of the
   departed, and are confessions heard before Christmas and Easter? (Both flagged, not built.)
5. **Who's Who.** The directory (`src/content/staff/`) lists everyone published on the live page
   (Mother Sarah Howard-Jones, Mother Valerie Aitken, Mother Jenny Krige, Felicity Mather, Luca
   Wetherall, Nick Barnes) **plus Hugh Mather (Organist)**, who comes from the brief's `site.ts`
   but is **not** on the current live who's-who. Confirm he should be listed (and add
   churchwardens / PCC officers if wanted).
6. **Youth Group age.** The brief's home copy said "12 and up"; the live page says **10–16**. We
   used 10–16 (the live page is authoritative). Confirm.
7. **Patronal/Corpus Christi event details** seeded in `src/content/events/` are dated correctly
   but service times should be confirmed (or replaced by the live calendar feed — item §1.1).
8. **Photography rights** (see §1.3).
9. **Choral Scholarship details** on `/worship/music` (eligibility/stipend) were written to a
   sensible default + the "apply by 12 June" line; confirm specifics and the role-description PDF.
10. **Hugh Mather in Who's Who — update 23 June 2026.** Resolving item 5 for launch: Hugh appears
   as **Organist (name + role only)** on the new Our Musicians page (`/music/our-musicians`),
   pulled from his `staff` record. A full Who's-Who profile (bio + photo) remains pending parish
   sign-off.
10. **How long the Sung Mass lasts.** Three of *our own* sources disagreed:
    `serviceTimes.json` ("around an hour and a quarter"), `VisitDetails.astro` ("about an hour
    and a quarter") and the Visiting page ("a little over an hour"). All three were written for
    this site, not ported from the live one, so no parish statement was overridden. Standardised
    on **about an hour and a quarter** — the CMS-editable value, which two of the three already
    agreed with. Confirm with the parish.

---

## 4. Environment variables (all optional)

See `.env.example`. None are required to build.

- `EVENTS_ICAL_URLS` — live events feed(s), any iCal/webcal provider (item §1.1, §8).
- `CHURCHDESK_ICAL_URL` — the legacy name for the same thing, still honoured.
- `PLAUSIBLE_DOMAIN` — enables the Plausible analytics tag (item §1.6).

---

## 5. Commands

```bash
npm install
npm run dev        # local dev server (http://localhost:4321)
npm run build      # static build → dist/
npm run preview    # preview the production build
npm test           # vitest — the unit tests (liturgy, data guards, text helpers)
```

**Maintenance scripts** (`node scripts/<name>.mjs`; details in each script's header comment and
the `optimise-images` skill in `.claude/skills/`):

| Script | Kind | What it does |
|---|---|---|
| `scrape-blog.mjs` (`npm run scrape`) | one-time | Migrate the ChurchDesk `/b/blog-*` posts into `news`; regenerates `public/_redirects.blog` |
| `fetch-fonts.mjs` | one-time | Re-download self-hosted woff2 + regenerate `src/styles/fonts.css` |
| `fetch-images.mjs` | one-time | Download + optimise hero photos, affiliation marks, the OG image |
| `fetch-staff-photos.mjs` | one-time | Download Who's Who portraits; cap to 600px WebP |
| `fetch-history-images.mjs` | one-time | Download + optimise the history-page photographs |
| `list-history-images.mjs` | one-off helper | Print candidate history images (src/alt/caption) for sourcing |
| `optimise-news-images.mjs` | idempotent | Convert legacy news PNGs to WebP and rewrite references |
| `generate-image-variants.mjs` | idempotent | Write the -1200/-800/-256 responsive siblings srcsets offer (from the committed WebPs; downscale only) |
| `dedupe-news-images.mjs` | idempotent | Fold byte-identical newsletter images onto one URL and rewrite the posts' references |
| `dimension-news-images.mjs` | idempotent | Stamp `width`/`height` onto news `<img>` tags (no layout shift) |

> After re-running `scrape-blog.mjs`, re-merge `public/_redirects.blog` into `public/_redirects`
> (the blog 301 block sits between the "specific" redirects and the `/b/*` catch-all).

---

## 6. Cloudflare Pages deploy + DNS cutover runbook

**Pages project settings:** build command `npm run build`, output directory `dist`, Node 20+.
`public/_redirects` and `public/_headers` are picked up automatically.

1. Create the Pages project from this repo; build & verify on the `*.pages.dev` preview URL —
   walk the §2 parity checklist and spot-check 5–10 old `/b/blog-…` URLs 301 to `/news/<slug>/`.
2. (Optional) set `EVENTS_ICAL_URLS` and `PLAUSIBLE_DOMAIN` env vars; add a **Deploy Hook**
   and a daily cron (e.g. via Cloudflare Worker Cron or an external scheduler) so build-time
   events stay fresh. Without the cron the diary is only as current as the last deploy — a CMS
   publish also triggers one, so a parish that edits events in Sveltia needs no cron at all.
3. Add `barnabites.org` as a custom domain on the Pages project. Move the domain's nameservers
   to Cloudflare (or add the zone). **Keep ChurchDesk hosting live during propagation.**
4. Point `www` (CNAME) at the Pages project; apex via CNAME-flattening. **Apex→www must be a
   zone-level Redirect Rule (or Bulk Redirect)** — `barnabites.org/*` →
   `https://www.barnabites.org/$1`, 301 — because Pages `_redirects` rejects absolute-URL
   sources, so no Pages-level rule can do this (the file documents the same).
5. Verify 301s on a sample of old URLs; submit the new `sitemap-index.xml` to Search Console.
6. Decommission ChurchDesk *hosting* only after the new site is confirmed live and indexed.
   **ChurchDesk stays the backend** (calendar, contacts, bookings, newsletter, giving).

---

## 7. Possible future hardening (not blocking)

> The prioritised improvement backlog now lives in **[docs/ROADMAP.md](docs/ROADMAP.md)**; the
> items below remain here as the original record.

- Add a Content-Security-Policy header once the third-party origins (ChurchDesk, Google Maps,
  YouTube, Plausible) are finalised — omitted now to avoid breaking inline/island scripts
  untested.
- Replace the parish liturgy photos on feast days with curated **public-domain feast paintings**
  per the brief's art direction (`src/data/artwork.ts` already maps season/feast keys → images).
- Transcribe the organ stop-specification (currently an image on the old site) onto
  `/worship/st-barnabas-organ`.

---

## 8. The events architecture (added July 2026)

What's On (`/whats-on`) is a CMS-editable prose page (`src/content/pages/whats-on.md`) with the
diary injected by `src/pages/[...slug].astro`, following the same opt-in hook as
`/about-us/visiting` and `/music/our-musicians`. The machinery:

| File | Role |
|---|---|
| `src/data/eventCategories.ts` | The category vocabulary. A leaf module with no imports, so `content.config.ts` and `lib/events.ts` can share it. |
| `src/lib/events.ts` | **Pure and unit-tested.** Civil dates, clock-time parsing, recurrence description/expansion, merging, month grouping, ICS generation. |
| `src/lib/events-feed.ts` | The iCal fetch, with RRULE/EXDATE expansion and the default ChurchDesk feed URLs. Never throws. |
| `src/lib/events-source.ts` | The single, memoised loader both consumers share. |
| `src/lib/events-client.ts` | **Pure and unit-tested.** The browser-side iCal reading the calendar view refreshes from. |
| `src/lib/events-jsonld.ts` | schema.org `Event` markup. |
| `src/components/WhatsOnCalendar.astro` | The month-grid calendar view (added August 2026): renders from a build-time snapshot, then re-fetches the feeds in the browser on load, on tab focus and every ten minutes, so it tracks ChurchDesk edits without a rebuild. Hidden without JavaScript — the diary list is the no-JS experience. |
| `src/pages/calendar.ics.ts` | The published, subscribable calendar. |

Three decisions worth not undoing:

- **Times are free text** (`"10.30am"`), matching `serviceTimes.json`. A CMS `datetime` widget with
  `picker_utc: true` would store an editor's 10.30 in summer as 11.30. `parseClockTime` reads what
  they type; anything unparseable becomes an all-day event rather than a guess.
- **Every event is normalised to a Europe/London civil date** at ingest. Formatting a real instant
  in UTC — as the original `getEvents()` did — files a late-evening summer event on the wrong day
  and under the wrong month heading.
- **The diary shows one row per repeating series**, with its pattern in words; `/calendar.ics`
  carries every occurrence. Expanding a weekly event into the diary would bury the feasts.
  ChurchDesk publishes every Sunday Mass as its *own* VEVENT with its own UID, so
  `collapseFeedRepeats` additionally collapses repeated titles, inferring the cadence ("Every
  Sunday", "The first Sunday of the month") from the dates themselves and flagging the row
  `regular` — which is how Worship → Special Services keeps only the feasts.
- **Feed descriptions are tidied before publication** (`tidyFeedDescription`): the "Rotas:" block
  — which names individual parishioners — the redundant "Event URL:" line and bracketed tracking
  links are stripped before anything reaches a page, the JSON-LD or `/calendar.ics`. Don't undo
  this: the rota names are for the parish's own sheet, not for us to republish.

**Two midnights — the all-day trap (fixed 3 August 2026).** A date-only value reaches us under two
conventions. Everything we build ourselves (`addDays`, `shiftBack`, the collection's
`z.coerce.date()`) puts it at **UTC** midnight, which is what `civilFromDateOnly` reads. **node-ical
does not:** it parses `DTSTART;VALUE=DATE:20260904` at **local** midnight. In any zone ahead of UTC
that instant is the previous day in UTC — Europe/London in BST gives `2026-09-03T23:00Z` — so
reading UTC parts off it silently loses a day on every all-day feed event. Feed dates now pass
through `utcMidnightOfDateOnly` before any civil date is read.

The reason it survived review is worth remembering: **it is invisible in UTC and in every zone
behind UTC**, so CI on `ubuntu-latest` stayed green while the suite failed on a maintainer's machine
in British Summer Time. `vitest.config.ts` therefore pins the test timezone to **Europe/London** —
the zone this site actually computes in. Don't remove that pin to make a test pass; it is the only
thing standing between this class of bug and production.

---

## 9. Typography: a sans arrives (August 2026)

The site launched under a "two serifs, no sans" rule (CLAUDE.md §5). That rule has been
**deliberately overturned**: **Montserrat** now sets headings, titles, the menu bar and every
tracked uppercase label. It is self-hosted like the others — `scripts/fetch-fonts.mjs` fetches
weights 500, 600 and 700 (no italic) into `public/fonts/`. The "no Google Fonts, no web-font CDN
at runtime" half of the rule is untouched.

Why, and what not to undo:

- **The menu bar had run out of room.** Measured on the old single-row header at 1280px: brand
  174px + nav 850px + search 31px + 53px of flex gaps = 1108px inside 1109px of available width.
  The bar was at 100% capacity, so nothing could be enlarged without a structural change. The nav
  now sits on **its own ruled band** below the masthead, which is what bought the space: links
  went from `.68rem` Source Serif 4 to `.82rem` Montserrat 600, and ~218px of slack remains even
  with a 19-character label — headroom that matters because `nav.ts` labels are editor-editable.
- **The homepage header is solid on every page now.** It used to float transparently over the
  hero artwork, leaving white nav type over whatever the season's photograph happened to be. The
  `overlay` prop is gone from `Base.astro`, `SiteHeader.astro` and `index.astro`; the homepage
  passes `hideBreadcrumbs` instead, which is what suppressed its breadcrumb trail before. The
  trade accepted: the hero starts below the header rather than at the very top of the page.
- **Cormorant Garamond was not retired** — it is now *decorative only* (wordmark, monograms,
  pull quotes, the big date numeral, organ pitch numerals, italic display lines). Keeping it is
  deliberate: it is what still carries the prayer-book character.
- **`.serif` is a Cormorant class, not a heading class.** It out-specifies the `h1–h4` rule, so
  leaving it on a heading silently reverts that heading to Cormorant. Non-heading title text uses
  the `.title` class instead. See AGENT-GUARDRAILS §B.
- **Every display size was scaled ~0.8** when it moved to Montserrat, whose x-height is far larger
  than Cormorant's. Size new headings against their neighbours, not against the old scale.
- **Headings are Montserrat 700.** Under Cormorant many headings were deliberately set to
  `font-weight: 500` for a softer look; all of those overrides were removed rather than retuned, so
  every heading now simply inherits 700 from the `h1–h4` rule and there is one place to change it.
  600 is the nav and label layer; 500 is the fallback weight for Montserrat text that declares
  none. Three weights is the cost of that split — ~106KB of latin woff2, all `font-display: swap`.
- **Preloads changed.** `Base.astro` preloads Montserrat **700** and Source Serif 4 400 — the
  heading is the largest text on the page and the usual LCP element on interior pages. The nav's
  600 and Cormorant's wordmark are not preloaded: both are small text in fixed-height rows, so
  swapping them costs nothing visible, and the critical path stays at two files.
