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
| 1 | **ChurchDesk events feed** (iCal/API for org 1901) | Manual `events` collection + env-driven iCal hook | The old `barnabites.org` has **no events/calendar page and no calendar widget** — events were communicated only via the weekly ChurchDesk newsletter and periodic "Regular Events & Activities [month]" blog posts (migrated to `/news/`). So the new site's `events` collection + `/worship/special-services` listing is a **new feature**, not a migration of an existing page. The public ChurchDesk API/iCal endpoints are also **not exposed** server-side (all probes 404). `src/lib/events.ts` reads the manual `events` collection and, **if `CHURCHDESK_ICAL_URL` is set**, merges a live iCal feed. To enable live events: in ChurchDesk go Calendar → share/subscribe, copy the iCal URL, set it as the `CHURCHDESK_ICAL_URL` env var in Cloudflare Pages, and add a daily deploy hook (see §6). Optional — strip `events.ts` + `node-ical` if a manual/CMS-only events list is preferred. |
| 2 | **Music-list source** for `services` | Manual JSON in `src/content/services/` | Seeded with the two real sheets from the brief (Corpus Christi 7 Jun, St Mary Magdalene 19 Jul). Add one JSON file per Sunday; `ThisSunday` auto-selects the coming Sunday and falls back to the standing pattern. |
| 3 | **Blog/photography reuse rights** | Migrated all 129 posts; self-hosted the parish's own liturgy photos with on-page credit support | **Confirm** the parish holds rights to the liturgy photographs and blog images before go-live. |
| 4 | **Children's Church age range** (nav 5–9 vs home 5–11) | **5–9** | The live `/families-children/childrens-church-ages-5-9` page itself states 5–9 in both heading and body, so 5–9 is used throughout. (Slug kept as `…-5-9`.) |
| 5 | **Burgundy hue `#6A1B2D`** | As specified | Single token `--burgundy` in `src/styles/tokens.css`; change once to retune. |
| 6 | **Analytics** (Plausible vs Beats) | **Plausible**, but emitted only when `PLAUSIBLE_DOMAIN` is set | We do **not** ship a hard-coded analytics tag, so there is no broken/unowned script in production. Set `PLAUSIBLE_DOMAIN=barnabites.org` (and create the Plausible site) to enable. Plausible is cookieless, so it needs no consent gate. |
| 7 | **Official lancet logo SVG** | The §4.4 placeholder mark | In `src/components/Logo.astro` and `public/favicon.svg`. Swap in the parish's official SVG when available. |

---

## 2. Decisions made during the build

- **Content sourcing.** All editorial copy was ported faithfully from the *current* live
  `barnabites.org` pages (fetched and re-set into the design). New copy was written only for
  `/visit` (Plan Your Visit — did not exist before) and the Choral Scholarship section of
  `/worship/music` (the live site has no scholarship detail).
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
4. **Who's Who.** The directory (`src/content/staff/`) lists everyone published on the live page
   (Mother Sarah Howard-Jones, Mother Valerie Aitken, Mother Jenny Krige, Felicity Mather, Luca
   Wetherall, Nick Barnes) **plus Hugh Mather (Organist)**, who comes from the brief's `site.ts`
   but is **not** on the current live who's-who. Confirm he should be listed (and add
   churchwardens / PCC officers if wanted).
5. **Youth Group age.** The brief's home copy said "12 and up"; the live page says **10–16**. We
   used 10–16 (the live page is authoritative). Confirm.
6. **Patronal/Corpus Christi event details** seeded in `src/content/events/` are dated correctly
   but service times should be confirmed (or replaced by the live calendar feed — item §1.1).
7. **Photography rights** (see §1.3).
8. **Choral Scholarship details** on `/worship/music` (eligibility/stipend) were written to a
   sensible default + the "apply by 12 June" line; confirm specifics and the role-description PDF.
9. **Hugh Mather in Who's Who — update 23 June 2026.** Resolving item 4 for launch: Hugh appears
   as **Organist (name + role only)** on the new Our Musicians page (`/music/our-musicians`),
   pulled from his `staff` record. A full Who's-Who profile (bio + photo) remains pending parish
   sign-off.

---

## 4. Environment variables (all optional)

See `.env.example`. None are required to build.

- `CHURCHDESK_ICAL_URL` — live events feed (item §1.1).
- `PLAUSIBLE_DOMAIN` — enables the Plausible analytics tag (item §1.6).

---

## 5. Commands

```bash
npm install
npm run dev        # local dev server (http://localhost:4321)
npm run build      # static build → dist/
npm run preview    # preview the production build
npm test           # vitest — liturgical-engine unit tests (35 tests)

# one-off maintenance scripts:
node scripts/fetch-fonts.mjs    # re-download self-hosted woff2 + regenerate fonts.css
node scripts/fetch-images.mjs   # re-download + optimise hero photos, marks, OG image
node scripts/scrape-blog.mjs    # re-migrate the ChurchDesk blog (regenerates public/_redirects.blog)
```

> After re-running `scrape-blog.mjs`, re-merge `public/_redirects.blog` into `public/_redirects`
> (the blog 301 block sits between the "specific" redirects and the `/b/*` catch-all).

---

## 6. Cloudflare Pages deploy + DNS cutover runbook

**Pages project settings:** build command `npm run build`, output directory `dist`, Node 20+.
`public/_redirects` and `public/_headers` are picked up automatically.

1. Create the Pages project from this repo; build & verify on the `*.pages.dev` preview URL —
   walk the §2 parity checklist and spot-check 5–10 old `/b/blog-…` URLs 301 to `/news/<slug>/`.
2. (Optional) set `CHURCHDESK_ICAL_URL` and `PLAUSIBLE_DOMAIN` env vars; add a **Deploy Hook**
   and a daily cron (e.g. via Cloudflare Worker Cron or an external scheduler) so build-time
   events stay fresh.
3. Add `barnabites.org` as a custom domain on the Pages project. Move the domain's nameservers
   to Cloudflare (or add the zone). **Keep ChurchDesk hosting live during propagation.**
4. Point `www` (CNAME) at the Pages project; apex via CNAME-flattening; the apex→www redirect is
   in `_redirects` as belt-and-braces.
5. Verify 301s on a sample of old URLs; submit the new `sitemap-index.xml` to Search Console.
6. Decommission ChurchDesk *hosting* only after the new site is confirmed live and indexed.
   **ChurchDesk stays the backend** (calendar, contacts, bookings, newsletter, giving).

---

## 7. Possible future hardening (not blocking)

- Add a Content-Security-Policy header once the third-party origins (ChurchDesk, Google Maps,
  YouTube, Plausible) are finalised — omitted now to avoid breaking inline/island scripts
  untested.
- Replace the parish liturgy photos on feast days with curated **public-domain feast paintings**
  per the brief's art direction (`src/data/artwork.ts` already maps season/feast keys → images).
- Transcribe the organ stop-specification (currently an image on the old site) onto
  `/worship/st-barnabas-organ`.
