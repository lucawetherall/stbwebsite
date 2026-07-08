---
name: add-page
description: >-
  End-to-end recipe for adding a new CMS-editable page. Use when adding a new standalone or
  section page, creating any file under src/content/pages, or asked to "add a page" to the
  site. Ensures the page is registered so non-technical editors can edit its wording.
---

# Add a new editable page

Every prose page on this site must end up editable by parish staff in Sveltia CMS (`/admin`).
"Done" means the page renders **and** an editor can change its wording. Full rationale:
`docs/AGENT-GUARDRAILS.md` §A.

## Steps

1. **Create the content file** — `src/content/pages/<path>.md`. The slug is the file path
   (`about-us/pastoral-care.md` → `/about-us/pastoral-care/`). **`.md`, never `.mdx`** — MDX
   would execute a stray `<` or `{` typed by an editor as code and break the build.

   Frontmatter (schema: the `pages` collection in `src/content.config.ts`; all optional except
   `title`):

   ```yaml
   ---
   title: Pastoral Care            # required
   kicker: About Us                # small label above the title
   intro: A single welcoming line under the title.
   description: Summary shown to search engines.
   hero: /images/uploads/…         # wide landscape photo; omit for a text-only page
   heroAlt: Required whenever hero is set — describe the picture.
   draft: false
   ---
   Body in plain markdown. No raw HTML/JSX — headings, lists, links, quotes, images only.
   ```

2. **No route file needed.** The catch-all `src/pages/[...slug].astro` renders every entry in
   the `pages` collection from its slug. Only touch route files for genuinely bespoke layouts —
   and then the wording should still come from a content file.

3. **Register it in the CMS** — add a `files:` entry to the `pages` collection in
   `public/admin/config.yml`, reusing the shared field set:

   ```yaml
   - { name: about-pastoral-care, label: 'About · Pastoral Care', file: src/content/pages/about-us/pastoral-care.md, fields: *pf }
   ```

   `&pf` is defined once on the first entry (`about-us`); every other page reuses it with
   `fields: *pf`. (Worship is the one exception — it carries its own field set for the
   gallery.) Skipping this step is the classic failure: the page ships but editors cannot see
   it — that regresses the editability contract.

4. **Navigation is developer-owned.** Add a link in `src/data/nav.ts` only if the task asks
   for the page to appear in the menu; not every page is a nav item.

5. **Verify.** Run `/verify`. Then round-trip the CMS locally: with `npm run dev` running, open
   `http://localhost:4321/admin` → **"Work with Local Repository"** (Chrome/Edge) and confirm
   the new page appears under **Main Pages**, opens, and saves.

## Remember

- UK English and the house voice: reverent, warm, plain; liturgical names correct.
- Alt text is mandatory for any `hero` or body image.
- If the page needs a redirect from an old URL, add it to `public/_redirects` **above** the
  `/b/*` catch-all (and never hand-edit the generated blog block).
