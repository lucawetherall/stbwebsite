# Improvement roadmap — barnabites.org

A prioritised, living backlog of site improvements, written so that an AI agent (or a developer)
can pick an item up cold. Each entry says what to do, why it matters, where the work lives, a
size estimate, and whether it is blocked on parish input.

> **Contract:** items here are *candidates*, not standing instructions. Do **not** implement a
> roadmap item unprompted — wait to be asked, then treat the entry as the brief and
> [CLAUDE.md](../CLAUDE.md) + [AGENT-GUARDRAILS.md](AGENT-GUARDRAILS.md) as the rules. Several
> workflows below are packaged as skills in `.claude/skills/`. Re-verify an entry's claims
> against the code before starting — this document can drift. Update the entry (and its status)
> in the same PR that ships it.

Statuses: **Open** · **Shipped** (kept briefly for context, then pruned) · **Blocked** (needs
parish input).

---

## 1. Per-post social sharing & structured data — **Shipped** (July 2026)

`src/pages/news/[slug].astro` now passes the post hero to `Base` as the Open Graph image, emits
`og:type article`, and adds `BlogPosting` JSON-LD (headline, date, author, image, publisher).
**Follow-on, still open:** no migrated post sets the `hero` frontmatter field — their images sit
in the body as raw `<img>` tags — so all 129 posts still share the default OG image. Promoting
each post's best body image to `hero`/`heroAlt` (natural to pair with item 3) would light this
up. *Effort: S (done) / M (hero promotion). Parish input: no.*

## 2. Content freshness: empty-events state and news recency — **Shipped (code) / Blocked (content)**

The code side is done: What's On (`/whats-on`) carries a considered empty state — "There is
nothing in the diary just now" alongside the regular pattern of worship — so a quiet diary reads
as a quiet diary rather than a bare gap. **Still open, and editorial:** both entries in
`src/content/events/` are past (June 2026) and the newest news post is 19 March 2024, so the page
ships showing that empty state. Fresh notices and events are parish work, either in **CMS ›
Events** or by setting `EVENTS_ICAL_URLS` to a live parish calendar (DECISIONS §1.1, §6, §8).
*Effort: done (code). Parish input: yes, for actual content.*

## 3. Alt-text remediation on migrated news images — **Open**

Every image in a migrated post carries the post title as its alt text (e.g. each image in a 2018
post reads `alt="Worship | November 2018"`) — present but non-descriptive and duplicated, across
roughly 42 posts in `src/content/news/`. Rewrite alts to describe each image; pairs naturally
with promoting a hero image per post (item 1). A liturgically literate reviewer should
spot-check names of vestments, rites and feasts. *Effort: M. Parish input: no.*

## 4. Site search — **Shipped** (July 2026)

`/search` searches every page and all ~129 news posts, on [Pagefind](https://pagefind.app/):
`npm run build` runs `pagefind --site dist` after the Astro build, and the index is static, so
there is no service to run and nothing for the parish to maintain. The UI is ours (Pagefind's
packaged UI ships its own stylesheet and its own idea of a result row) and is driven through the
Pagefind JS API. Entry points: a magnifier in the header on every width, plus the mobile menu's
utility list. Notes for anyone changing it:

- The index only exists in a built site — search returns nothing under `astro dev`. Use
  `npm run build && npm run preview`.
- `Base.astro` marks `<main data-pagefind-body>`, so a `noindex` page (404, `/search` itself) is
  excluded automatically; it also emits the page's section as Pagefind metadata and a filter.
- News posts carry `searchWeight={0.5}` so a query like "evensong" offers `/worship/sundays`
  ahead of a 2018 notice that happens to use the word more often. **Still open:** the filter is
  indexed but not yet surfaced in the UI — a "narrow to section" control is the obvious next
  step, as is a keyboard shortcut to open search. *Effort: S each.*

## 5. Publish an ICS calendar feed — **Shipped** (July 2026)

`src/pages/calendar.ics.ts` publishes a subscribable `/calendar.ics`, built from the `events`
collection and any configured feed, reaching 90 days back and 18 months forward. It expands every
occurrence of a repeating series (unlike the diary, which shows one row per series), ships a
`VTIMEZONE` for Europe/London so a subscriber abroad sees our times, and is linked from What's On
as both a `webcal://` subscription and a download. **Follow-on, still open:** the standing service
times in `src/content/settings/serviceTimes.json` are *not* in the feed — their `when` field is
free text ("first Sunday of the month") and would need parsing into recurrence rules before
Sunday Mass could appear in a subscriber's calendar. *Effort: M (done) / M (service times).*

## 6. Liturgical engine: feast coverage and curated artwork — **Open**

`src/lib/liturgy.ts` hard-codes only five principal feasts (St Barnabas, the BVM, All Saints,
Ascension, Trinity). The parish demonstrably observes more: Corpus Christi (a real 2026 event in
the repo), Candlemas, Christmas Day, Epiphany, and the named days of Holy Week (Maundy Thursday,
Good Friday) are all absent. Use the **`add-feast` skill** — every feast needs an engine row, an
`artwork.ts` key and a test. Artwork is the second half: all keys currently reuse five parish
photos; DECISIONS §7 records the intent to move to curated public-domain feast paintings.
*Effort: M (feasts) + M (artwork sourcing). Parish input: artwork choices, ideally.*

## 7. Go-live debt — **Blocked (parish)**

Tracked elsewhere; gathered here for visibility. MOCKUP preview/auth URLs in
`public/admin/config.yml` to revert (CMS-SETUP.md); the open content facts in DECISIONS §3
(safeguarding names, email domains, Who's Who, youth age, photo rights); `PLAUSIBLE_DOMAIN`
unset so no analytics run; the placeholder lancet logo (DECISIONS §1.7). *Effort: S each.
Parish input: yes — that is the blocker.*

## 8. Image weight on hero-led pages — **Open**

A few heroes are heavy for their role (`public/images/hero/procession.webp` ≈ 334 KB;
several raw JPGs in `public/images/news/` at 55–78 KB). Re-run the sharp pipeline at a tighter
quality/size, or serve responsive variants (a 1280px variant already exists for some). See the
**`optimise-images` skill** for the script inventory. *Effort: S. Parish input: no.*

## 9. Structured data, breadcrumbs, 404 and sitemap metadata — **Shipped** (July 2026)

Every page now emits a single JSON-LD `@graph` (`src/lib/seo.ts`) instead of a standalone
`Church` node repeated 170 times with no `@id`. The parish and the site are each declared once,
with stable ids, and page-level nodes (`BlogPosting`, `Person`, diary `Event`s, `BreadcrumbList`)
reference them rather than restating the address. The standing service times are marked up as
`Event`s with a `Schedule` parsed out of `serviceTimes.json` — "mass times" is the query that
brings strangers to a parish site, and until now the times existed only as prose. Also shipped:
breadcrumbs (visible + `BreadcrumbList`, derived from `nav.ts`), a real `/404` page, and
sitemap `lastmod`/`changefreq`/`priority` read from content frontmatter.

**Follow-ons, still open:**

- **`FAQPage` on `/visit`.** That page is already a set of question-shaped `h2`s ("What happens
  in the service", "Coming to communion", "What to wear") — exactly the shape `FAQPage` wants,
  and a strong rich-result candidate. Not done here because extracting Q&A pairs from rendered
  Markdown headings is fragile; it wants an explicit, CMS-editable FAQ field rather than a
  parser. *Effort: M. Parish input: no.*
- **`openingHoursSpecification` for the building itself.** The services are marked up, but the
  hours the church is simply *open* — for private prayer, for a visitor who wants to see the
  Shearman interior — live only in prose, and they are what a "is it open" query wants. Needs
  the parish to state the hours before it can be marked up. *Effort: S. Parish input: yes.*

## 10. Near-duplicate news posts from the migration — **Open (needs an editorial decision)**

The 2018 scrape brought over several posts that are near-identical in body, published days or
weeks apart under different legacy slugs — `noisy-mass` / `noisy-mass-copy`,
`ealing-housing-assembly` / `ealing-housing-assembly-30050`,
`the-way-introducing-the-riches-of-christianity` (+`-33083`), `sunday-indabas-copy`,
`advent-and-christmas-2019-copy`. Search engines see duplicate content; readers see the same
notice twice in the archive.

Deleting them is **not** safe on its own: each carries a `legacySlug` backing a 301 in
`public/_redirects`, so removing the file breaks an inbound link. The fix is either (a) a
`canonicalTo` frontmatter field pointing the duplicate at the surviving post and emitting
`<link rel="canonical">` plus a `noindex`, or (b) deleting the file *and* repointing its redirect
at the survivor. Either way someone who knows the parish should confirm which of each pair is the
one to keep. *Effort: S (mechanism) + S (review). Parish input: yes — which post survives.*

## 11. Search-intent titles across the remaining pages — **Open**

`seoTitle` now exists on the `pages` collection (dual-written to the CMS) and is set on Worship
and Life Events; `/worship/sundays`, `/worship/weekdays` and `/venue-hire` carry equivalent
titles in code. The rest of the site still titles pages as the parish speaks rather than as
strangers search — "Who's Who" is not what someone types when looking for the vicar, and
"Curious about Christianity?" is not "how to become a Christian". Worth a pass with someone who
can weigh parish voice against search wording; the mechanism is in place, so each page is a
one-line change. *Effort: S. Parish input: helpful.*
