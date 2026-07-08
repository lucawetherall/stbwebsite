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

## 2. Content freshness: empty-events state and news recency — **Open / partly Blocked**

Both entries in `src/content/events/` are past (June 2026), and `getEvents()`
(`src/lib/events.ts`) filters to future events — so Worship → Special Services currently renders
an empty list. Code side: give `EventsList` a considered "no special services are planned just
now — see the regular pattern of services" empty state rather than a bare gap. Content side: the
newest news post is 19 March 2024; fresh notices and events are editorial work for the parish
(or enabling the ChurchDesk iCal feed — `CHURCHDESK_ICAL_URL`, DECISIONS §1.1 and §6).
*Effort: S (empty state). Parish input: yes, for actual content.*

## 3. Alt-text remediation on migrated news images — **Open**

Every image in a migrated post carries the post title as its alt text (e.g. each image in a 2018
post reads `alt="Worship | November 2018"`) — present but non-descriptive and duplicated, across
roughly 42 posts in `src/content/news/`. Rewrite alts to describe each image; pairs naturally
with promoting a hero image per post (item 1). A liturgically literate reviewer should
spot-check names of vestments, rites and feasts. *Effort: M. Parish input: no.*

## 4. Site search — **Open**

129 news posts plus ~40 other pages with no search. [Pagefind](https://pagefind.app/) is the
natural fit for a static Astro site: post-build indexing over `dist/`, a small client UI, no
service to run. Style the UI with the existing tokens (`src/styles/tokens.css`) — no new accent
colours, two serifs only. Add a `/search` page and a header entry point (`SiteHeader.astro` is
developer-owned). *Effort: M. Parish input: no.*

## 5. Publish an ICS calendar feed — **Open**

The site *consumes* an iCal feed (`node-ical` in `src/lib/events.ts`) but publishes none. A
static `calendar.ics` endpoint (an `.ics.ts` route mirroring `src/pages/news/rss.xml.ts`) built
from the `events` collection + standing service times would let congregants subscribe in their
calendar apps. Include a link on Worship → Special Services. *Effort: M. Parish input: no.*

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
