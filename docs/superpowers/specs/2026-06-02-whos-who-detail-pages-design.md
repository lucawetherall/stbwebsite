# Who's Who detail pages — design

**Date:** 2026-06-02
**Goal:** On the new site, each person on **About Us → Who's Who** becomes clickable, opening their
own page with a portrait photo and full bio. Content is ported from the current live
`barnabites.org/about-us/whos-who`, and the whole thing is editable in Sveltia CMS.

## Decisions (locked)

- **Approach A — a dedicated detail page per person** (chosen over inline-expand/modal and a single
  anchored page). Mirrors the existing `src/pages/news/[slug].astro` pattern and the content-collection
  conventions already in the repo.
- **Roster:** the live 6 (Sarah Howard-Jones, Valerie Aitken, Jenny Krige, Felicity Mather,
  Luca Wetherall, Nick Barnes) **+ Hugh Mather** (Organist), keeping the current
  `src/content/staff/` set of 7.
- **Everyone is clickable.** People without a photo/bio (Hugh Mather) get a thin page with a
  **monogram** (initials) in place of a portrait and just their role.
- **Bios** are taken from the live site **with small, unambiguous typo/grammar fixes only**
  (listed under "Bio copy-edits" below); editable later in the CMS.
- **Email moves off the grid cards** onto the detail pages; the grid card shows portrait + role + name.

## Architecture

```
src/content/staff/NN-name.json        ← data (name, role, email, bio, photo, order)
        │
        ├── src/lib/staff.ts           ← getRoster(): sorted people + computed slug
        │        slug = id with leading "NN-" stripped  (01-sarah-howard-jones → sarah-howard-jones)
        │
        ├── src/components/StaffGrid.astro      ← photo-led cards, each links to the detail page
        └── src/pages/about-us/whos-who/[person].astro  ← getStaticPaths over getRoster()
                                                            renders portrait + bio
public/images/staff/<slug>.webp        ← portraits (downloaded from live, sharp-normalised)
public/admin/config.yml                ← Sveltia staff collection gains a `photo` field
```

`src/pages/about-us/whos-who.astro` (the grid page) is unchanged in route; it just renders the
redesigned `StaffGrid`. The folder `about-us/whos-who/` coexists with the `whos-who.astro` file in
Astro. The detail route is more specific than `src/pages/[...slug].astro`, so there is no conflict.

## Components / units

### `src/lib/staff.ts` (new)
- `staffSlug(id: string): string` — strips a leading `^\d+-` from the collection entry id.
- `getRoster()` — `getCollection('staff')`, sorted by `order` (missing → 99), each augmented with
  `{ slug }`. Single source of truth imported by both the grid and the detail route so their links
  cannot drift.

### `src/pages/about-us/whos-who/[person].astro` (new)
- `getStaticPaths()` maps `getRoster()` → one path per `slug`, passing the person as a prop.
- Layout: `Base`. Back link "← Who's Who", role kicker (burgundy), name as large Cormorant H1.
- **Two columns on desktop** (portrait ~300px left, bio right); **stacked on mobile**.
- Portrait: `<img>` with `alt="Portrait of <name>"`; **no photo → burgundy-tinted monogram** of
  initials filling the same frame.
- Bio rendered as paragraphs by splitting the stored string on blank lines (`\n\n`). No new deps.
- `mailto:` "Email <name>" where an address exists. Back-to-Who's-Who link at the foot.
- SEO: `title` = name, `description` = `role` + first line of bio; `image` (OG) = the portrait if present.

### `src/components/StaffGrid.astro` (rewrite)
- Iterates `getRoster()`. Each card is an `<a>` wrapping the whole tile → `/about-us/whos-who/<slug>`.
- Card = square rounded portrait (monogram fallback) + role label (burgundy) + name (serif).
- Hover: subtle lift / name underline. No email on the card.
- Grid: 1 col (mobile) → 2 (tablet) → 3 (desktop) via `auto-fill minmax(~220px, 1fr)`.

### Content & assets
- Populate the 6 live bios into the matching `src/content/staff/*.json` `bio` fields (live copy with
  the "Bio copy-edits" below applied).
- Download the 6 portraits from the live ChurchDesk `/uploads/...webp` URLs into
  `public/images/staff/<slug>.webp` (normalise/cap width ~800px with `sharp`); set `photo:` on each.
- Hugh Mather: no bio/photo → monogram + role-only page.

### Sveltia CMS (`public/admin/config.yml`, `staff` collection)
- Add `photo` — `{ name: photo, label: Photo, widget: image, required: false }` with collection-level
  `media_folder: /public/images/staff` and `public_folder: /images/staff` (same pattern the
  `documents` collection already uses for its own folder).
- Keep `bio` as the `text` widget; add a hint: "A blank line starts a new paragraph."

## Live-site content (source of truth for bios + photo URLs)

| Person | Role | Email | Live photo URL (relative to barnabites.org) |
|---|---|---|---|
| Mother Sarah Howard-Jones | Vicar | vicar@barnabites.org | `/uploads/DgL1jD80/768x0_320x0/SHJ2__msi___jpeg.webp` |
| Felicity Mather | PCC & Pastoral Assistant | parish.office@barnabites.org | `/uploads/HYzX0Krt/96x0_96x0/stb_.felicity.mather__msi___png.webp` |
| Mother Valerie Aitken | Associate Priest | parish.office@barnabites.org | `/uploads/gAooyJmu/768x0_320x0/Valerie__msi___jpg.webp` |
| Mother Jenny Krige | Assistant Priest for Children and Families | j.mabin@gmail.com | `/uploads/jUgec6TC/241x0_241x0/thumbnail_img_5456_1__msi___jpg.webp` |
| Luca Wetherall | Director of Music | directorofmusic@barnabites.org | `/uploads/qfDaOrCs/768x0_320x0/Lucaheadshot1__msi___jpg.webp` |
| Nick Barnes | Verger | parish.office@barnabites.org | `/uploads/HlgIaXUS/320x0_320x0/thumbnail_img_1664_1__msi___jpg.webp` |
| Hugh Mather | Organist | — | (none — monogram) |

Full bio text for each is captured from `https://www.barnabites.org/about-us/whos-who` and pasted
into the JSON `bio` fields during implementation, with the small fixes below applied.

### Bio copy-edits (small fixes only — no stylistic rewriting)

- **Valerie Aitken** — run-on split: "I married Stephen in 1967 we moved back to Ealing in 1977…"
  → "I married Stephen in 1967. We moved back to Ealing in 1977…"
- **Valerie Aitken** — "Institut Francais" → "Institut Français" (cedilla).
- **Luca Wetherall** — "a degree in Music **at** the University of Oxford" → "…**from** the
  University of Oxford".

Sarah Howard-Jones, Felicity Mather, Jenny Krige and Nick Barnes need no corrections.

## Verification

- `npm run build` produces the 7 new person pages (`/about-us/whos-who/<slug>`) with 0 errors and no
  TypeScript/content-schema failures.
- Preview server: screenshot (a) the redesigned grid, (b) one person page with a photo, (c) the
  monogram fallback (Hugh Mather). Confirm bios paragraph correctly, portraits have alt text,
  responsive 1→2→3 columns, and no burgundy-on-burgundy contrast regression.

## Flagged / non-blocking

- **Photo reuse rights** — these are already-public parish headshots, but confirm at go-live
  alongside `DECISIONS.md` §3.7 (photography rights).
- **Roster freshness** — resolved. A web search had surfaced a "Harry Guthrie" (Director of Music)
  and "Henry Tozer" (Gospel Choir); the user confirmed on 2026-06-02 that **both have since left**,
  so they are correctly excluded. Roster stands at live 6 + Hugh Mather. Revisit if the parish
  updates the team.
- The `bio` paragraph-splitting is deliberately plain (no markdown engine). If rich bios (links,
  lists) are ever needed, upgrade `bio` to a rendered-markdown field then.
