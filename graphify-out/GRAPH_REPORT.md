# Graph Report - st-barnabas-music-lists-0ddddc  (2026-08-18)

## Corpus Check
- Large corpus: 556 files · ~736,763 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder.

## Summary
- 455 nodes · 819 edges · 33 communities (23 shown, 10 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 7 edges (avg confidence: 0.76)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Utilities & Lib
- Components & Layouts
- Community 2
- Utilities & Lib
- Components & Layouts
- Utilities & Lib
- Liturgical Engine
- Utilities & Lib
- Content & Pages
- Components & Layouts
- Content & Pages
- Tests
- Astro Config
- Community 13
- Community 14
- Community 15
- Community 16
- Community 17
- Community 18
- Community 19
- Community 20
- Community 21
- Community 22
- Community 23
- Community 24
- Community 25
- Community 26
- Community 28
- Community 29
- Community 30
- Content & Pages

## God Nodes (most connected - your core abstractions)
1. `Site` - 18 edges
2. `civilFromDateOnly()` - 12 edges
3. `toIcs()` - 12 edges
4. `baseEvent()` - 10 edges
5. `toSiteEvent()` - 9 edges
6. `SiteEvent` - 9 edges
7. `getLiturgicalDay()` - 9 edges
8. `scripts` - 8 edges
9. `crumbsFor()` - 8 edges
10. `eventsFromCalendar()` - 8 edges

## Surprising Connections (you probably didn't know these)
- `SiteEvent` --references--> `EventCategory`  [EXTRACTED]
  src/lib/events.ts → src/data/eventCategories.ts
- `toSiteEvent()` --calls--> `toEventCategory()`  [EXTRACTED]
  src/lib/events-feed.ts → src/data/eventCategories.ts
- `labels()` --calls--> `crumbsFor()`  [EXTRACTED]
  src/lib/breadcrumbs.test.ts → src/lib/breadcrumbs.ts
- `getStaticPaths()` --calls--> `neighboursOf()`  [EXTRACTED]
  src/pages/news/[slug].astro → src/lib/news.ts
- `on()` --calls--> `currentSheet()`  [EXTRACTED]
  src/lib/services.test.ts → src/lib/services.ts

## Import Cycles
- None detected.

## Communities (33 total, 10 thin omitted)

### Community 0 - "Utilities & Lib"
Cohesion: 0.06
Nodes (70): day, WEEKDAYS, when, addDays(), addMinutes(), baseEvent(), civilFromDateOnly(), collapseSeries() (+62 more)

### Community 1 - "Components & Layouts"
Cohesion: 0.08
Nodes (18): [], src800, open(), show(), links, year, hire, assertSiteSettings() (+10 more)

### Community 2 - "Community 2"
Cohesion: 0.05
Nodes (38): astro, @astrojs/check, @astrojs/mdx, @astrojs/rss, @astrojs/sitemap, cheerio, node-ical, dependencies (+30 more)

### Community 3 - "Utilities & Lib"
Cohesion: 0.11
Nodes (26): assertServiceTimes(), ServiceTime, serviceTimes, abs(), breadcrumbListNode(), CHURCH_ID, churchNode(), DAYS (+18 more)

### Community 4 - "Components & Layouts"
Cohesion: 0.16
Nodes (18): sheet, sheets, comingSunday(), composerShaped(), currentSheet(), fmt(), groupByMonth(), MonthGroup (+10 more)

### Community 5 - "Utilities & Lib"
Cohesion: 0.12
Nodes (11): rites, Division, MechanismGroup, OrganSpec, ROMAN, Stop, absoluteUrl(), eventsJsonLd() (+3 more)

### Community 6 - "Liturgical Engine"
Cohesion: 0.18
Nodes (14): auto, artwork, Hero, heroFor(), add(), D(), easter(), eq() (+6 more)

### Community 7 - "Utilities & Lib"
Cohesion: 0.16
Nodes (10): assertHistoryPage(), HistoryHero, historyPage, OnwardLink, valid, chapterAnchor(), HistoryChapter, prepareChapters() (+2 more)

### Community 8 - "Content & Pages"
Cohesion: 0.20
Nodes (11): groupByYear(), Neighbours, neighboursOf(), NewsLike, sortNewest(), post(), posts, YearGroup (+3 more)

### Community 9 - "Components & Layouts"
Cohesion: 0.22
Nodes (12): nav, NavItem, utilityNav, chainTo(), chainToAncestor(), CrumbOptions, crumbsFor(), HOME (+4 more)

### Community 10 - "Content & Pages"
Cohesion: 0.16
Nodes (12): collections, documents, events, history, news, pages, services, staff (+4 more)

### Community 11 - "Tests"
Cohesion: 0.19
Nodes (12): assertHireSettings(), GalleryImage, HallRate, HireConcerts, HireFilm, HireHalls, HireImage, HirePageBase (+4 more)

### Community 12 - "Astro Config"
Cohesion: 0.17
Nodes (11): **/*, astro/tsconfigs/strict, .astro/types.d.ts, dist, compilerOptions, baseUrl, paths, strictNullChecks (+3 more)

### Community 13 - "Community 13"
Cohesion: 0.33
Nodes (9): buildLastmodMap(), changefreqFor(), frontmatterValue(), isoDate(), makeSerializer(), priorityFor(), safeWalk(), walk() (+1 more)

### Community 14 - "Community 14"
Cohesion: 0.22
Nodes (7): byDate, decode(), flatten(), MONTHS, NAMES, silent, TIMES

### Community 15 - "Community 15"
Cohesion: 0.20
Nodes (6): months, redirects, sm, td, urls, usedSlugs

### Community 16 - "Community 16"
Cohesion: 0.70
Nodes (3): findMissingImages(), main(), walk()

### Community 17 - "Community 17"
Cohesion: 0.60
Nodes (4): fetchOnce(), grab(), IMAGES, stripSize()

### Community 18 - "Community 18"
Cohesion: 0.40
Nodes (3): HEROES, MARKS, MISC

### Community 22 - "Community 22"
Cohesion: 0.50
Nodes (3): mdFiles, pngs, renamed

### Community 23 - "Community 23"
Cohesion: 0.50
Nodes (3): ConsentState, Window, WindowEventMap

## Knowledge Gaps
- **142 isolated node(s):** `name`, `version`, `type`, `private`, `dev` (+137 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Site` connect `Components & Layouts` to `Utilities & Lib`, `Utilities & Lib`, `Utilities & Lib`?**
  _High betweenness centrality (0.046) - this node is a cross-community bridge._
- **Why does `DEFAULT_EVENT_CATEGORY` connect `Content & Pages` to `Utilities & Lib`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **Why does `s()` connect `Liturgical Engine` to `Components & Layouts`, `Components & Layouts`, `Utilities & Lib`, `Components & Layouts`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._
- **What connects `name`, `version`, `type` to the rest of the system?**
  _142 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Utilities & Lib` be split into smaller, more focused modules?**
  _Cohesion score 0.06110154905335628 - nodes in this community are weakly interconnected._
- **Should `Components & Layouts` be split into smaller, more focused modules?**
  _Cohesion score 0.07518796992481203 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.05128205128205128 - nodes in this community are weakly interconnected._