# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) — and any other AI agent — when
working in this repository. It is the briefing; read it before your first edit. Depth lives in
the docs it points to, so this file stays short and high-signal.

---

## 1. What this is & who it's for

The website of **St Barnabas Church, Ealing** (`barnabites.org`) — the Church of England parish
church of Pitshanger, in the **Anglo-Catholic** tradition. The audience is parishioners, visitors
and enquirers; much of the content is pastoral and liturgical.

**Voice & tone.** Reverent, warm, plain. Liturgically correct — get feast names, seasons and
service titles right ("Sung Mass", "Choral Evensong", "Corpus Christi"). No breezy marketing
voice, no emoji in site content. When you are unsure about a point of doctrine, a person's title,
or a name, **flag it rather than invent** (and see the open items in §10).

**UK English is mandatory — going forward, everywhere.** Site copy, component text, commit
messages, PR descriptions and these docs all use British spelling and grammar: *colour, organise,
programme, centre, recognise, licence (n.)*, **-ise not -ize**; British date style ("7 June
2026"). The whole existing body of work is British English — never drift to US spelling.

## 2. Stack & commands

Astro 6.4 (static output), TypeScript strict (`@/*` → `src/*`), plain CSS with design tokens
(no Tailwind), self-hosted fonts, Vitest. No SSR.

```bash
npm run dev        # local dev server → http://localhost:4321
npm run build      # static build → dist/
npm run preview    # preview the production build
npm test           # vitest — the liturgical-engine unit tests
npx astro check    # type-check (@astrojs/check + typescript are devDependencies)
npx vitest run src/lib/liturgy.test.ts   # a single test file
```

## 3. Deploy reality — the highest-consequence fact

**`main` is production. There is no staging.** Merging to `main` triggers
`.github/workflows/deploy.yml`, which builds and deploys to Cloudflare Pages within ~1 minute.
A CMS "Publish" commits to `main`, so it deploys the same way. **Never push directly to `main`** —
branch `claude/<slug>`, open a PR, and let CI (`.github/workflows/ci.yml`) go green first.

## 4. ★ The editability contract (the thing to protect above all)

This site exists to be run day-to-day by **non-technical parish staff** through **Sveltia CMS at
`/admin`** (GitHub login). Preserving and *extending* safe, non-technical editing is a primary
goal of every change — not an afterthought. It is also the easiest thing to break without
noticing, so treat it as a hard contract.

- **Editor-owned (must stay editable in the CMS):** News, This Sunday's Music, Events, standing
  Service times, Who's Who (incl. photos), Documents, **the wording of every standalone & section
  page**, and Site settings (contacts, people, emails, social, giving, safeguarding leads).
- **Developer-owned / code-driven (deliberately *not* in the CMS — the "cornerstone" layer):**
  homepage layout, the `/news` listing template, the music archive, site navigation
  (`src/data/nav.ts`), design tokens, and components.
- **Dual-write invariant.** A content collection's shape is defined in **two** places that must
  always agree: the Zod schema in `src/content.config.ts` **and** the fields in
  `public/admin/config.yml`. Change a field in one ⇒ change it in the other, or the editor and
  the build will disagree.
- **Do not regress editability.** Never move editable content *into* code. Never convert an
  editable prose page from `.md` back to `.mdx`, and never drop raw HTML/JSX into an editor-facing
  page (a stray `<` or `{` would break the build for an editor who can't debug it). Don't remove
  the build-time guards (e.g. `assertSiteSettings` in `src/data/site.ts`) or the hidden
  `legacySlug` field (it protects ~129 news redirects). Don't fork Sveltia — config, our own
  `public/admin/` files, and the documented JS API only.
- **The test.** A change is only "done" if a non-technical editor could still safely manage that
  content afterwards. Adding content? Make it CMS-editable (a new page ⇒ register it in the
  `pages` collection in `config.yml`; a new content type ⇒ add the collection to **both**
  `config.yml` and `content.config.ts`, with friendly hints).

Full wiring, the dual-write checklist, and "how to add a page" are in
**[docs/AGENT-GUARDRAILS.md](docs/AGENT-GUARDRAILS.md)**; the editor's-eye view is in
**[CMS-SETUP.md](CMS-SETUP.md)**.

## 5. Design philosophy (codified)

The house style is **the parish's printed service sheet / prayer book, translated to the web**.
Three watchwords: **restraint, reverence, readability.** The tenets:

- **One accent, used sparingly.** A single liturgical red — `--burgundy #6A1B2D` ("deep Sarum
  wine"), with `--burgundy-deep` for hover only. No other accent colours. Everything comes from
  the tokens in `src/styles/tokens.css`; **use tokens, never hard-code a hex or a stray px.**
- **Two serifs, no sans.** Cormorant Garamond (display) + Source Serif 4 (body), **self-hosted**
  in `public/fonts/`. Do not add Google Fonts or any web-font CDN.
- **Warm, flat, quiet.** Paper ground, near-black ink. **No gradients** — the image scrim is a
  flat overlay on purpose. A constant 2px burgundy ribbon sits at the top of every page; buttons
  are outlined and fill on hover; labels are tracked uppercase small-caps.
- **Liturgically alive.** The hero artwork changes with the church season/feast
  (`src/data/artwork.ts` keyed off `src/lib/liturgy.ts`); the footer shows a live season line.
- **Accessibility is part of the aesthetic.** WCAG 2.1 AA; visible focus rings, skip link,
  `.sr-only`, full `prefers-reduced-motion` support. `body` uses `overflow-x: clip` (not
  `hidden`) deliberately — **do not "fix" it back** (it would break scrolling/anchors/sticky; see
  DECISIONS §2).

Concrete design rules and rationale: **[docs/AGENT-GUARDRAILS.md](docs/AGENT-GUARDRAILS.md) §B**.

## 6. Content model

Source of truth for every schema is **`src/content.config.ts`**.

| Collection  | Lives in                              | What it is |
|-------------|---------------------------------------|------------|
| `pages`     | `src/content/pages/**/*.md`           | Editorial & section page copy (frontmatter + body) |
| `news`      | `src/content/news/<slug>.md`          | News posts / notices (newest first) |
| `services`  | `src/content/services/YYYY-MM-DD.json`| Weekly "This Sunday" music sheets (nested `offices[].items[].values[]`) |
| `events`    | `src/content/events/*.json`           | Special services on Worship → Special Services |
| `staff`     | `src/content/staff/NN-name.json`      | Who's Who — each person auto-generates a detail page |
| `documents` | `src/content/documents/*.json`        | Downloads (PDF in `public/documents/`) |

Plus `src/data/site.ts` (a typed wrapper merging the **editor-owned** `settings/site.json` with
**developer-only** constants — map embed, geo, IDs) and `src/data/nav.ts` (navigation tree).
Media: CMS uploads → `public/images/uploads`; staff → `public/images/staff`; docs →
`public/documents`. Optimise images via the sharp scripts in `scripts/`; every image needs alt
text.

## 7. The liturgical engine — handle with care

`src/lib/liturgy.ts` computes the Western liturgical season/feast (Computus) and is unit-tested
(`src/lib/liturgy.test.ts`). It drives the hero artwork and the footer season line. If you touch
it, run `npm test` and keep the tests green; **add cases for any new feast and never weaken a
test to make a change pass.** Adding a feast is roughly one row in the engine + one key in
`src/data/artwork.ts` + a test.

## 8. Conventions

- Branch `claude/<short-slug>`; squash-merge to `main`.
- Commit and PR bodies follow **What / Why / Changes / Verification**, with a house-format
  verification line, e.g. `Build: 169 pages, 0 errors; astro check 0 errors; vitest 59 passed`
  (always report the *measured* numbers, not these). See recent PRs (#8–#12) for the exact
  shape, and use the PR template.
- End commits/PRs with the `Co-Authored-By: Claude …` trailer.
- Commit or push **only when asked**; never commit straight to `main`.

## 9. Before you finish — verify

Run **`/verify`** (or by hand: `npm run build` → `npx astro check` → `npm test`); confirm 0
errors and that the page count didn't drop unexpectedly. **If you touched a content schema or any
content surface, also confirm the CMS side:** `public/admin/config.yml` still matches
`src/content.config.ts`, and an editor could still edit it.

## 10. Known constraints — don't "correct" these blindly

Several content facts are **deliberately open**, pending parish sign-off (safeguarding officer
names; `.org` vs `.net` email domains; whether Hugh Mather is listed in Who's Who; the Youth
Group age). Do **not** overwrite them without a source — they are tracked in **DECISIONS.md §3**.
The CMS `config.yml` also still holds **MOCKUP** preview URLs to revert at go-live (CMS-SETUP.md).

## 11. Further docs

- **[README.md](README.md)** — quick start & architecture.
- **[DECISIONS.md](DECISIONS.md)** — defaults taken, open items, env vars, DNS/deploy runbook.
- **[docs/ROADMAP.md](docs/ROADMAP.md)** — the prioritised improvement backlog (candidates, not
  standing instructions).
- **[CMS-SETUP.md](CMS-SETUP.md)** — Sveltia CMS setup & the editor's guide.
- **[docs/AGENT-GUARDRAILS.md](docs/AGENT-GUARDRAILS.md)** — the editability contract in full, the
  design rules, the safe-to-edit map, and "how to add X" recipes.
- **`.claude/skills/`** — the recurring workflows packaged as skills (add a page, dual-write a
  schema change, add a feast, write a news post, optimise images); loaded automatically when a
  task matches.
- **[docs/superpowers/](docs/superpowers/README.md)** — dated design specs and plans from past
  work (historical record; indexed in its README).
