---
name: cms-dual-write
description: >-
  Keep the CMS and the build in agreement when changing content schemas. Use before editing
  src/content.config.ts or public/admin/config.yml, adding/renaming/removing a field on any
  content collection, or adding a whole new collection. Prevents the #1 way to break the site
  for non-technical editors.
---

# The dual-write invariant

A content collection's shape is defined in **two** files that must always agree:

1. **`src/content.config.ts`** — the Zod schema the **build** enforces.
2. **`public/admin/config.yml`** — the fields the **editor** sees in Sveltia CMS at `/admin`.

Change one without the other and the site breaks asymmetrically:

- A field in the **schema only** is invisible to editors — they can never fill it in, and if it
  is required their next Publish fails the build (and `main` deploys are production, ~1 minute).
- A field in **`config.yml` only** (or with a mismatched type/format) writes frontmatter the
  schema rejects — the editor's Publish commits fine, then the deploy build fails and they
  cannot debug it.

**Rule: change both files in the same commit, or change neither.**

## Procedure

1. **Schema first.** Edit the collection in `src/content.config.ts`. Prefer `.optional()` (or a
   `.default(...)`) for new fields so the ~170 existing entries don't all fail validation.
2. **Mirror it in `public/admin/config.yml`.** Match name, type and format exactly — see
   [reference.md](reference.md) for the Zod ↔ Sveltia widget mapping and a worked example.
   Write `label` and `hint` for a churchwarden, not a developer ("Describe the picture for
   people using screen readers", not "a11y alt attribute").
3. **Migrate existing content** if the field is required: every file in `src/content/<collection>/`
   needs a value or a schema default.
4. **Guard required site-critical fields.** If an empty value would ship a broken page, add a
   build-time assertion following the `assertSiteSettings` pattern in `src/data/site.ts` — fail
   the build with a friendly message rather than deploying a blank.
5. **Verify both sides.** Run `/verify`. Then round-trip the CMS locally: with `npm run dev`
   running, open `http://localhost:4321/admin` → **"Work with Local Repository"** (Chrome/Edge)
   and confirm the entry opens, edits and saves.

## Hard warnings

- **Never remove or rename `legacySlug`** on `news` (schema *and* the hidden widget in
  `config.yml`) — it preserves the old `/b/blog-…` URLs behind ~129 redirects.
- **Never weaken a guard or loosen a schema just to make a Publish/build pass** — fix the
  content instead.
- **Never move editable content into code.** Editable → code is a regression.
- Keep editable prose pages **`.md`, never `.mdx`** — a stray `<` or `{` typed by an editor
  must not become executable.

## Precision notes

- `src/content/settings/*.json` (site settings, service times, history page) are **not** in
  `content.config.ts` — they are read and validated via `src/data/site.ts` and its siblings.
  Their editor side still lives in `config.yml`, so the invariant holds: schema-equivalent
  guards in the data module, fields in `config.yml`.
- The full rationale and wiring diagram are in `docs/AGENT-GUARDRAILS.md` §A.
