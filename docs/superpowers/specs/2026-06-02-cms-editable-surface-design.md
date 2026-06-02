# Expand the Sveltia CMS editable surface + non-technical editor UX — design

**Date:** 2026-06-02
**Goal:** Make more of the St Barnabas site editable through Sveltia CMS — specifically
**site-wide settings**, the **standing service-times pattern**, and the **deeper existing
pages** — and redesign the editor experience so a non-technical parish volunteer can use it
without fear, confusion, or meeting raw markdown. Verified against the Sveltia CMS docs
(<https://sveltiacms.app/en/docs>) and Astro docs (<https://docs.astro.build>) on 2026-06-02.

## Decisions (locked)

- **Approach A — hybrid data + explicit page enumeration + full UX pass.** Editable content
  moves into CMS-managed JSON; technical config stays in TypeScript and is never exposed.
- **In scope (the three editable surfaces):** Site settings, Standing service times, and the
  16 deeper sub-pages currently outside the CMS.
- **Out of scope (deliberate):** Navigation menu and homepage composition stay developer-owned
  (too easy to break site structure). No editorial-workflow/PR mode — the `draft` toggle is
  friendlier for non-technical editors. No service-recurrence picker — `when` stays free text.
- **UX target:** design against all four failure modes the parish flagged — *fear of breaking
  it*, *getting lost/overwhelmed*, *not knowing what maps where*, and *formatting/markdown fear*.

## Docs verification summary (what changed vs. first draft)

| Claim | Verdict | Resolution |
|---|---|---|
| Import JSON into `.ts`, re-export; `file()` loader for single JSON | ✅ supported | Hybrid data architecture stands |
| **File collections** for settings (`files:` list, per-file `file`/`fields`) | ✅ supported | Used for Site settings + Service times |
| Sidebar **`divider: true`** between collections | ✅ supported | Used for sidebar grouping |
| Field `hint` / `required` / `default` / `minLength` / `maxLength`; string `type: email\|url`; list `min`/`max` | ✅ supported | Used throughout; email/url validation is a bonus |
| RichText **`buttons`**, **`modes`**, **`editor_components`**, **`minimal`**, `field_defaults.richtext` | ✅ supported | Strong fix for "markdown fear" — incl. `modes: [rich_text]` to hide raw |
| **`nested`** collections (tree display of subfolders) | ❌ **NOT supported** (planned Sveltia v1.0, ~mid-2026) | **Replaced** with a File collection enumerating pages |
| **`preview_path`** per collection | ❌ not a config option | Built-in **"View on Live Site"** (3-dot menu, from `site_url`) — zero config |
| Live preview pane fetching the real site | ❌ not supported by design | Irrelevant; we use `editor: { preview: false }` |

## Architecture — the hybrid data pattern

Each typed data file is split into an **editor-owned JSON** (Sveltia writes it) and a
**developer-owned TypeScript wrapper** (imports the JSON, merges technical constants, exports the
same shape it does today — so none of the 14 `site.ts` consumers / 2 `serviceTimes.ts` consumers
change).

```
src/content/settings/site.json          ← Sveltia File collection writes here (editor-owned)
src/data/site.ts                         ← imports the JSON, merges technical constants, exports `site`
src/content/settings/serviceTimes.json   ← Sveltia File collection writes here (editor-owned)
src/data/serviceTimes.ts                 ← imports the JSON, exports `serviceTimes`
```

`site.ts` becomes (shape of exported `site` unchanged):

```ts
import editable from '../content/settings/site.json';

const technical = {
  url: 'https://www.barnabites.org',
  address: { street: 'Pitshanger Lane', area: 'Ealing', city: 'London', postcode: 'W5 1QG' },
  geo: { lat: 51.52708621708429, lng: -0.3115046840361693 },
  mapEmbed: 'https://www.google.com/maps/embed?pb=…',
  churchdeskOrgId: 1901,
} as const;

export const site = {
  ...technical,
  ...editable,
  phoneIntl: '+44 ' + editable.phone.replace(/^0/, '').replace(/\s+/g, ' '),
} as const;
```

### Editable vs. technical split

| Editor-owned (`site.json`) | Technical-only (stays in `site.ts`) |
|---|---|
| name, shortName, locality, tagline | canonical `url` |
| phone, all email addresses | street / area / city / postcode + `geo` coords |
| people (vicar, director of music, organist) | Google Maps embed string |
| social links, giving link, newsletter link | `churchdeskOrgId` |
| safeguarding leads, affiliations, diocesan policy link | `phoneIntl` (auto-derived from `phone`) |

Why hybrid: (1) zero changes to the 14 consuming files — lowest-risk; (2) the editor cannot see
or break the map embed / coordinates / IDs; (3) `phoneIntl` collapses into the single `phone`
field, so editors update one field, not two that must stay in sync.

### Build-time validation (safety net)

A zod schema validates `site.json` and `serviceTimes.json` at build (an Astro content collection
with a `file()` loader, or a direct zod parse in the `.ts` wrapper). If an editor empties a
required field, the **build fails loudly** instead of shipping a blank phone number on the live
site. Turns "editor breaks the site" from a live incident into a caught error.

## Collections & sidebar information architecture

Two new **File collections** (single fixed entry each — the editor lands straight in one form):

- **Site settings** → `src/content/settings/site.json`
- **Service times** → `src/content/settings/serviceTimes.json`

**Pages become editable via a File collection** (NOT nested folders — unsupported). One
collection, **"Main Pages,"** enumerates all 17 page files (top-level + the 16 sub-pages),
each with the same field set, ordered to mirror the site's nav (About → Worship → Families →
Community → standalone). Stays effectively `create: false` — editors edit existing pages, never
invent URLs. (Enumeration verbosity is managed with YAML anchors for the shared field set.)

**Reordered sidebar**, grouped with `divider: true`, everyday tasks on top and "settings" sunk
to the bottom out of the nervous-editor path:

```
EVERYDAY
  News
  This Sunday's Music
  Events
─── divider ───
NOW & THEN
  Service times          (new)
  Who's Who
  Documents
─── divider ───
SET UP ONCE (rarely touched)
  Main Pages
  Site settings          (new)
```

## Field-level UX (the anti-fear layer)

- **Every field gets a plain-English `hint`** naming what it controls and where it appears
  (e.g. phone: *"Shown in the footer and on Contact Us."*). Antidote to "what maps where."
- **Every collection gets a `description`** one-liner at the top of its form.
- **"View on Live Site"** — built-in per-entry (3-dot menu, from `site_url`). No config; works
  for News, Pages, etc. Reinforces the mapping from CMS entry → live page.
- **Drafts made obvious** — the `draft` toggle on News and Pages gets a hint:
  *"Tick to hide this from the public site."* A safe way to save without going live.
- **Validation via field types** — email fields use string `type: email`, link fields
  `type: url`, so a malformed address is caught in the form.
- **Rich-text, fear-free** — set globally via `field_defaults.richtext`:
  - `modes: [rich_text]` — **hides the raw-markdown view entirely**; editors never see `#`/`< >`.
  - `buttons: [bold, italic, link, heading-two, heading-three, bulleted-list, numbered-list, quote]`
  - `editor_components: [image]` — keep image insertion, drop `code-block`.
- **Technical fields simply aren't present** — handled by the data split; nothing scary to find.

## Improvements folded in (all approved)

1. **Lift the worship gallery to frontmatter** — move [worship.mdx](../../../src/content/pages/worship.mdx)'s
   `<Gallery>` (4 fixed hero images) out of the MDX body into an optional frontmatter `gallery`
   field rendered by the page template. Result: **every page body is pure prose**, so the
   `modes: [rich_text]` (no-raw) setting is safe across all pages — no body contains component
   syntax to mangle. Prereq for the rich-text-only UX above.
2. **Staff photos** — `StaffGrid.astro` currently renders name/role/bio/email but ignores the
   schema's `photo`. Render it, and expose an **Image** field in the Who's Who collection with
   **required alt text** (accessibility). Editors can add a face to each person.
3. **News hero images** — schema allows `hero`/`heroAlt` but the news templates don't render them
   and the CMS doesn't expose them. Render a hero on the post (and optionally the index card),
   and expose an **Image** field + **required alt text** in the News collection.
4. **Service `when` stays free text** — no recurrence picker; "first Sunday of the month" remains
   a plain string. Simplest for editors (explicit YAGNI decision).

## Testing

- `astro build` and `astro check` must pass after the refactor.
- Round-trip each new/changed collection through the local proxy
  (`npx @sveltia/cms-proxy-server` + `npm run dev`, open `http://localhost:4321/admin`): edit a
  field, confirm the JSON/MDX file changes on disk and the rendered site reflects it.
- Confirm the exported `site` / `serviceTimes` shapes are byte-identical in effect to today
  (the 14 + 2 consumers render unchanged) — e.g. footer, Contact Us, Worship pages, schema.org.
- Confirm `modes: [rich_text]` does not corrupt any existing page body (it shouldn't, once the
  worship gallery is lifted and all bodies are plain markdown).
- Verify required-field validation: emptying `phone` in `site.json` fails the build.

## Go-live fit

No new infrastructure or secrets. The new JSON are committed content, edited via the existing
GitHub backend + auth Worker; editors remain GitHub collaborators with Write access. The existing
go-live checklist (rotate the OAuth client secret + Cloudflare API token, re-own under a church
account/org, attach `barnabites.org`, revert `display_url`/`site_url`) is unaffected.

## Out of scope (explicit)

- Navigation menu editing (`nav.ts`) and homepage band composition — developer-owned.
- Hero-artwork-per-season mapping (`artwork.ts`) — developer-owned for now.
- Editorial workflow / PR review mode — `draft` toggle instead.
- Nested-collection tree display — unsupported in Sveltia 0.165.1; revisit if/when v1.0 ships it
  and the explicit page enumeration becomes burdensome.
