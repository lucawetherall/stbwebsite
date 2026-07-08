---
name: news-post
description: >-
  Write or add a news post, notice or announcement. Use when creating any file under
  src/content/news, drafting parish news, or asked to "post" something to the site. Covers the
  schema, the house voice, and the legacySlug rule.
---

# Write a news post

News lives in `src/content/news/<kebab-slug>.md` and renders at `/news/<slug>/`, newest first.
Parish staff edit the same content in **Sveltia CMS › News** — this skill is the agent
fast-path, not a replacement for that.

## File and frontmatter

Schema: the `news` collection in `src/content.config.ts`. Only `title` and `date` are required:

```yaml
---
title: Choral Evensong for Candlemas
date: 2027-01-31            # YYYY-MM-DD; drives ordering and the displayed date
category: Music             # optional — e.g. News, Music, Reflection
author: The Director of Music   # optional
description: Summary shown to search engines and social shares.   # optional but worth writing
hero: /images/uploads/…     # optional header image — see the optimise-images skill first
heroAlt: Describe the picture for screen-reader users.   # mandatory whenever hero is set
draft: false
---
```

- **Never add `legacySlug` to a new post** — it exists solely to preserve old `/b/blog-…`
  URLs on the ~129 migrated posts. **Never strip it from a migrated post** either.
- Body is plain markdown: headings, lists, links, quotes, images. No raw HTML/JSX.
- A `hero` post also gets its image on social shares (Open Graph) automatically — one more
  reason to set `hero`/`heroAlt` rather than pasting an image into the body.

## Voice

- Reverent, warm, plain. No marketing breeziness, no emoji, no exclamation-mark enthusiasm.
- **UK English** (*organise, programme, centre*; -ise not -ize) and British dates in prose
  ("Sunday 7 June 2026").
- Liturgical names exactly right: "Sung Mass", "Choral Evensong", "Corpus Christi", "the
  Blessed Virgin Mary". Feast and season names are checkable against `src/lib/liturgy.ts`.
- People's names and titles (Mother Sarah, churchwardens, safeguarding officers): check
  `src/content/staff/` and DECISIONS §3 — **flag rather than invent**, and don't "correct"
  the deliberately-open facts without a source.

## Finish

Run `/verify` (the build validates the frontmatter against the schema). If the post announces
a special service, consider whether it also needs an entry in `src/content/events/`
(CMS › Events) so it appears on Worship → Special Services.
