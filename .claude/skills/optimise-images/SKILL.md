---
name: optimise-images
description: >-
  Prepare, optimise or replace any image on the site — news heroes, staff portraits, page
  heroes, gallery or OG images. Use before committing any image file, when adding images to
  content, or when asked to shrink/convert pictures. Covers targets, folders and the scripts/
  toolkit.
---

# Images: optimise before you commit

Never commit a raw camera/phone photo. Every image is self-hosted, sized for its role, and
converted to WebP via `sharp` (already a devDependency). Every image needs **genuine alt
text** — describing the picture, not repeating the page title.

## Where images live

| Role | Folder | Target |
|---|---|---|
| CMS uploads (news heroes, page banners) | `public/images/uploads/` | landscape, ~1600px wide max, WebP |
| Staff portraits (Who's Who) | `public/images/staff/` | ~600px wide WebP |
| Hero/section artwork | `public/images/hero/` | 1920px + a 1280px variant, quality ~74 WebP |
| Social/OG image | `public/images/` | 1200×630 |
| Documents | `public/documents/` | PDFs, not images |

A one-off conversion needs no script — `npx sharp` isn't a CLI here, so a small inline node
script using `sharp` (resize → `.webp({ quality: 74 })`) matching the patterns below is fine.

## The `scripts/` toolkit (run as `node scripts/<name>.mjs`)

**Idempotent — safe to re-run:**

- `optimise-news-images.mjs` — converts legacy news PNGs to WebP and rewrites the references
  in the news markdown; skips already-converted files.
- `dimension-news-images.mjs` — stamps intrinsic `width`/`height` onto raw `<img>` tags in
  news bodies so the browser reserves space (no layout shift). **Run after embedding any
  `<img>` in a post body**; skips tags that already have a width.

**One-time acquisition/migration — do not re-run casually:**

- `fetch-images.mjs` — downloaded the parish liturgy photos + marks; generates the 1280px
  hero variants and the 1200×630 OG image. Reuse its resize pattern for new heroes.
- `fetch-staff-photos.mjs` — downloaded Who's Who portraits; caps at 600px WebP. Reuse its
  pattern for a new portrait.
- `fetch-fonts.mjs` — regenerates `public/fonts/` + `src/styles/fonts.css`. Those outputs are
  **never hand-edited**.
- `fetch-history-images.mjs` / `list-history-images.mjs` — history-page photo sourcing from
  the old WordPress site (fragile origin; each source was verified by eye).
- `scrape-blog.mjs` (`npm run scrape`) — the one-time blog migration; regenerates
  `public/_redirects.blog`, which is then re-merged into `public/_redirects` **by hand**
  (DECISIONS §5).

## Checklist before committing

1. Right folder, right size (table above), WebP unless there's a reason not to.
2. Alt text present and descriptive (`heroAlt`, `photoAlt`, gallery `alt`, or the `alt`
   attribute on a body `<img>`).
3. Body `<img>` tags dimensioned (`dimension-news-images.mjs`).
4. No file bloat: heroes should land well under ~300 KB; portraits under ~60 KB.
5. `/verify` still green.
