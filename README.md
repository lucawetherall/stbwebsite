# St Barnabas Church, Ealing — barnabites.org

A statically generated [Astro](https://astro.build) site for the parish, deployed to
Cloudflare Pages. ChurchDesk remains the backend (calendar, contacts, bookings, newsletter,
giving); this is a bespoke front end in the parish's service-sheet house style.

## Quick start

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # → dist/
npm test         # liturgical-engine unit tests
```

## How it's put together

- **Design system** — `src/styles/tokens.css` (one burgundy accent, Cormorant Garamond +
  Source Serif 4) and `src/styles/base.css`. Fonts self-hosted in `public/fonts/`.
- **Liturgical engine** — `src/lib/liturgy.ts` computes the season/feast (Computus); the hero
  artwork is chosen from `src/data/artwork.ts`; the footer shows a live season line.
- **Content** — `src/content/` collections: `pages` (MDX editorial), `news` (129 migrated
  posts), `services` (weekly music sheets), `events`, `staff`, `documents`. Schemas in
  `src/content.config.ts`.
- **Site data** — `src/data/site.ts` (contacts, people, social, safeguarding) and
  `src/data/nav.ts` (navigation).
- **Deploy** — `public/_redirects` (301s incl. the blog map) and `public/_headers`.

## Maintenance

- **Weekly music list:** add `src/content/services/YYYY-MM-DD.json` (see existing files).
- **News post:** add `src/content/news/<slug>.md` with `title` + `date` frontmatter.
- **One-off scripts:** `scripts/fetch-fonts.mjs`, `scripts/fetch-images.mjs`,
  `scripts/scrape-blog.mjs`.

See **[DECISIONS.md](./DECISIONS.md)** for defaults taken, items to confirm with the parish,
environment variables, and the DNS cutover runbook.
