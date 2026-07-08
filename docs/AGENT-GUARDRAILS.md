# Agent guardrails

The depth behind **[CLAUDE.md](../CLAUDE.md)**. Read CLAUDE.md first for the summary; come here
when you are about to change a content surface, the design system, the liturgical engine, or the
structure of the site. This document says **what to do**; DECISIONS.md and CMS-SETUP.md say
**why**. Everything here is written to protect one thing above all: **non-technical parish staff
being able to edit the site safely, without being able to break it.**

---

## A. The CMS editability contract (read this before touching content)

### How the wiring fits together

```
Editor at /admin  →  Sveltia CMS (public/admin/index.html, config.yml)
   → signs in with GitHub via the sveltia-cms-auth Cloudflare Worker
   → "Publish" commits Markdown/JSON to the `main` branch
   → .github/workflows/deploy.yml builds & deploys to Cloudflare Pages (~1 min)
   → live site updated. No database. Content stays as plain files in the repo.
```

- **`public/admin/config.yml`** declares every editable collection, its fields, and the friendly
  hints editors see. Grouped into *Everyday* (News, This Sunday's Music, Events), *Now & then*
  (Service times, Who's Who, Documents) and *Set up once* (Main Pages, Site settings).
- **`public/admin/index.html`** loads Sveltia (pinned at `@sveltia/cms@0.165.1`), applies the St
  Barnabas branding (logo, "St Barnabas Content Manager" title, splash, light-mode default), and
  styles the preview pane to match the live site via `registerPreviewStyle`. **No Sveltia source
  is forked** — only config, our own files, and the documented JS API — so CMS upgrades stay safe.
- **Media folders:** global uploads → `public/images/uploads` (`/images/uploads`); per-collection
  overrides: Who's Who → `public/images/staff`, Documents → `public/documents`.
- **Auth/secrets** (GitHub OAuth client + Cloudflare token) live in the Worker and as repo
  secrets — never in the repo. MOCKUP URLs in `config.yml` are flagged to revert at go-live.

### Editor-owned vs developer-owned

| Editor-owned — **must stay editable** | Developer-owned — code-driven, **not** in the CMS |
|---|---|
| News, This Sunday's Music, Events | Homepage layout & section order |
| Standing Service times | The `/news` listing template & the music archive |
| Who's Who (incl. photo upload) | Site navigation (`src/data/nav.ts`) |
| Documents (PDF upload or link) | Design tokens (`src/styles/tokens.css`) & components |
| **Every standalone & section page's wording** | The liturgical engine & route logic |
| Site settings (contacts, people, emails, links, safeguarding leads) | Technical constants in `src/data/site.ts` (`url`, `geo`, `mapEmbed`, IDs) |

`src/data/site.ts` is the model for the split: it imports the **editor-owned** `site.json`, then
spreads **developer-only** `technical` constants *last* so an editor can never override
`url`/`geo`/`mapEmbed`/`churchdeskOrgId`. Copy that pattern when you add settings.

### The dual-write invariant (the #1 way to break the CMS)

A collection's shape is defined in **two** files that must always agree:

1. `src/content.config.ts` — the Zod schema the **build** enforces.
2. `public/admin/config.yml` — the fields the **editor** sees.

**Whenever you add, rename, or remove a field, do it in both.** A field in the schema but not in
`config.yml` is invisible to editors; a field in `config.yml` but not the schema (or with the
wrong type) makes a Publish fail the build. After any such change, confirm both sides match and
run `/verify`.

### How to add a new editable page (the common case)

1. Create `src/content/pages/<path>.md` with the standard frontmatter (`title`, optional
   `kicker`, `intro`, `description`, `draft`) and the body. **Keep it `.md`, not `.mdx`.**
2. The catch-all route `src/pages/[...slug].astro` will render it from its slug.
3. **Register it in the `pages` file collection in `public/admin/config.yml`** so its wording is
   editable — add a `files:` entry reusing the shared field set with `fields: *pf` (Worship is the
   one exception, with its own set because of the gallery).
4. `/verify`, then sanity-check it loads in a local CMS session.

### Safety mechanisms — understand them, don't remove them

- **`.md`, not `.mdx`, for editable prose pages.** MDX executes a literal `<` or `{` in prose as
  code; the deeper pages were deliberately converted to `.md` so an editor can type anything
  without breaking the build. Never convert an editor-facing page back to `.mdx`.
- **Constrained markdown buttons.** The editor exposes only bold, italic, link, H2/H3, lists,
  quote and image — so editors can't produce layouts that fight the design. Keep it that way.
- **Build-time guards.** `assertSiteSettings` (`src/data/site.ts`) — and its `assertServiceTimes`
  sibling — throw and fail the build if an editor empties a required field, rather than shipping a
  blank site. Keep guarding new required fields the same way.
- **Hidden `legacySlug`.** A hidden field on news posts preserving the original `/b/blog-…` slug
  for the ~129 redirects. Do not remove it or drop it on save.

### Non-negotiables

- **Never move editable content into code.** Editable → code is a regression; code → editable is
  an upgrade.
- **Never weaken a guard** (or delete a required-field check) just to make a Publish/build pass —
  fix the content instead.
- **Never add raw HTML/JSX** to an editor-facing page, and keep editor hints friendly and
  non-technical (write for a churchwarden, not a developer).
- **Done means an editor can still manage it.** Local round-trip test: with `npm run dev` running,
  open `http://localhost:4321/admin`, click **"Work with Local Repository"**, and confirm the
  content opens and saves (Sveltia uses the browser File System Access API — Chrome/Edge — so
  there is no proxy to run).

---

## B. Design philosophy & rules

**The why.** The site is the parish's **printed service sheet / prayer book, translated to the
web** (README: "service-sheet house style"). Every visual decision serves **restraint, reverence
and readability**, never marketing flash. The single accent is a liturgical red — "deep Sarum
wine" — a deliberate nod to English liturgical use; the site quietly **breathes with the church
calendar** through its hero art and footer season line.

**The rules** (all enforced by `src/styles/tokens.css` + `src/styles/base.css`):

- **Tokens only.** Colour, spacing and fonts come from `tokens.css`. Never hard-code a hex value
  or an arbitrary px. Need a new value? Add a token and justify it.
- **One accent.** `--burgundy #6A1B2D`, `--burgundy-deep` for hover/pressed only. No second accent
  colour. Retune the whole site by changing the one token.
- **Two serifs, no sans.** Cormorant Garamond (display) + Source Serif 4 (body), **self-hosted**
  in `public/fonts/`. No Google Fonts, no web-font CDN. Body 18px / line-height 1.7 / 66ch measure.
- **Flat, not glossy.** No gradients anywhere; the image overlay (`--scrim`) is a flat colour on
  purpose. The 2px burgundy ribbon at the top of every page is constant (never season-variable).
- **Components, patterns.** Outlined buttons that fill burgundy on hover; tracked uppercase
  small-caps `.label`s; hairline rules. Reuse these rather than inventing new treatments.
- **Motion is minimal.** A single `.fade-in`; honour `prefers-reduced-motion` (it disables all
  animation/transition — don't add motion that ignores it).
- **`overflow-x: clip`, not `hidden`.** Deliberate (DECISIONS §2): `hidden` makes `<body>` a
  scroll container and breaks `window.scrollTo`, anchor jumps and sticky positioning. Don't
  change it back.

---

## C. Safe-to-edit map

- **Routine — edit freely (within schema):** `src/content/**` (page copy, news, services, events,
  staff, documents), `src/data/site.ts` factual config, `src/data/nav.ts` labels/order.
- **Edit carefully — there's an invariant or a test:** `src/content.config.ts` (keep in step with
  `public/admin/config.yml`); `src/styles/tokens.css` (one change retunes the whole site — that's
  the point, but it's global); `src/lib/liturgy.ts` & `src/data/artwork.ts` (tested — see §D);
  components in `src/components/` (shared across pages).
- **Code-driven — don't hand-edit:** the blog 301 block in `public/_redirects` (regenerated by
  `scripts/scrape-blog.mjs`, then re-merged — DECISIONS §5); `public/fonts/` + `src/styles/fonts.css`
  (regenerated by `scripts/fetch-fonts.mjs`); `dist/`, `.astro/` (build output); staff portraits
  and hero images (run source images through the sharp scripts — don't commit a raw 4 MB phone
  photo).

---

## D. "How to add X" recipes & content shapes

> The most common recipes are also packaged as step-by-step skills in **`.claude/skills/`**
> (`add-page`, `cms-dual-write`, `add-feast`, `news-post`, `optimise-images`) — Claude Code
> loads them automatically when the task matches.

Each recipe ends the same way: **the content stays CMS-editable.** Shapes below are *examples* —
the source of truth is always `src/content.config.ts`.

- **A news post:** `src/content/news/<kebab-slug>.md` with frontmatter `title`, `date`
  (`YYYY-MM-DD`), optional `category`/`author`/`description`/`hero`/`heroAlt`, `draft`. Also
  editable in **CMS › News**.
- **A Sunday music sheet:** `src/content/services/<YYYY-MM-DD>.json` — filename equals the `date`
  field; `feast` is the title; `offices[]` is each service (`time`, `name`, `items[]`), and each
  item is a `label` (e.g. "Setting", "Psalm", "Anthem") with `values[]` (one per line, composer
  first). Use **`/sunday`** to scaffold it, or **CMS › This Sunday's Music**. `ThisSunday` auto-
  selects the coming Sunday and falls back to the standing service times.
- **A person (Who's Who):** `src/content/staff/NN-name.json` (the `NN-` prefix sets order) with
  `name`, `role`, optional `email`, `bio`, `photo`, `photoAlt`, `order`. A detail page generates
  automatically when there's a photo and/or bio; the URL slug strips the `NN-` prefix
  (`src/lib/staff.ts`). Optimise the portrait (~600–800px webp) — see `scripts/fetch-staff-photos.mjs`.
  Also **CMS › Who's Who**.
- **An event:** `src/content/events/*.json` — `title`, `start` (+ optional `end`), `location`,
  `description`, `url`. Shows on Worship → Special Services. Best done in **CMS › Events** (or, if
  the iCal feed is wired, via ChurchDesk — DECISIONS §1).
- **A document:** put the PDF in `public/documents/`, add an entry in `src/content/documents/`
  (`title`, `file`, `external`, `description`, `category`, `order`). Best done in **CMS › Documents**.
- **A whole new page:** see §A "How to add a new editable page" — and remember step 3 (register it
  in `config.yml`).

### Liturgical-engine guardrails

`src/lib/liturgy.ts` is unit-tested (`src/lib/liturgy.test.ts`). To add a feast: add it in the
engine, add a matching key in `src/data/artwork.ts` (with alt text), and **add a test case**. Run
`npm test`. **Never weaken or delete a test to make a change pass** — the calendar must stay
correct across years.

### Always

UK English and correct liturgical naming in everything. Alt text is required for every `hero`,
`photo` and gallery image. Respect the deliberately-open content in **DECISIONS §3** — don't
"correct" it without a source.
