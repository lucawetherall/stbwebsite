# Graph Report - st-barnabas-music-lists-0ddddc  (2026-08-18)

## Corpus Check
- 367 files · ~141,967 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1103 nodes · 1513 edges · 123 communities (82 shown, 41 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 85 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Utilities & Data
- Utilities & Data
- Astro Components
- News & Notices Archive
- Package Dependencies
- People & Named Entities
- News & Notices Archive
- Section Pages Content
- Events & iCal Logic
- Utilities & Data
- This Sunday Music Sheets
- News & Notices Archive
- Events & iCal Logic
- News & Notices Archive
- Music & Organ Pages
- Agent Guardrails Doc
- Utilities & Data
- Utilities & Data
- News & Notices Archive
- DECISIONS.md Rationale
- Church History Chapters
- Events & iCal Logic
- Content Schema
- News & Notices Archive
- DECISIONS.md Rationale
- TS/Astro Config
- CMS Setup Guide
- Build Scripts
- CI/CD Workflows
- CLAUDE.md Guardrails
- Roadmap Backlog
- DECISIONS.md Rationale
- People & Named Entities
- Build Scripts
- Build Scripts
- CLAUDE.md Guardrails
- Astro Components
- News & Notices Archive
- News & Notices Archive
- Roadmap Backlog
- Design Specs & Plans
- News & Notices Archive
- CMS Setup Guide
- News & Notices Archive
- Events & iCal Logic
- CLAUDE.md Guardrails
- Design Specs & Plans
- CLAUDE.md Guardrails
- Build Scripts
- Build Scripts
- Build Scripts
- Build Scripts
- Church History Chapters
- News & Notices Archive
- News & Notices Archive
- News & Notices Archive
- News & Notices Archive
- News & Notices Archive
- Build Scripts
- Build Scripts
- Build Scripts
- News & Notices Archive
- News & Notices Archive
- News & Notices Archive
- News & Notices Archive
- News & Notices Archive
- Community 66
- Build Scripts
- Build Scripts
- Build Scripts
- Church History Chapters
- Church History Chapters
- News & Notices Archive
- News & Notices Archive
- News & Notices Archive
- News & Notices Archive
- News & Notices Archive
- News & Notices Archive
- News & Notices Archive
- News & Notices Archive
- News & Notices Archive
- News & Notices Archive
- News & Notices Archive
- News & Notices Archive
- News & Notices Archive
- News & Notices Archive
- News & Notices Archive
- DECISIONS.md Rationale
- DECISIONS.md Rationale
- Church History Chapters
- Church History Chapters
- Church History Chapters
- News & Notices Archive
- News & Notices Archive
- News & Notices Archive
- News & Notices Archive
- News & Notices Archive
- News & Notices Archive
- News & Notices Archive
- News & Notices Archive
- News & Notices Archive
- News & Notices Archive
- News & Notices Archive
- News & Notices Archive
- News & Notices Archive
- Community 106
- Church History Chapters
- News & Notices Archive
- News & Notices Archive
- News & Notices Archive
- News & Notices Archive
- News & Notices Archive
- News & Notices Archive
- News & Notices Archive
- News & Notices Archive
- News & Notices Archive
- News & Notices Archive
- News & Notices Archive
- News & Notices Archive
- News & Notices Archive
- News & Notices Archive

## God Nodes (most connected - your core abstractions)
1. `Site` - 18 edges
2. `civilFromDateOnly()` - 12 edges
3. `toIcs()` - 12 edges
4. `baseEvent()` - 10 edges
5. `The events architecture (July 2026)` - 10 edges
6. `/about-us/history page (custom Astro template)` - 10 edges
7. `Justin Dodd (Vicar)` - 10 edges
8. `Housing, Living Wages, Mental Health & SEN for Ealing` - 10 edges
9. `toSiteEvent()` - 9 edges
10. `SiteEvent` - 9 edges

## Surprising Connections (you probably didn't know these)
- `src/content/history/*.md (folder collection of chapters)` --semantically_similar_to--> `Content collection: news`  [INFERRED] [semantically similar]
  docs/superpowers/specs/2026-06-23-history-page-design.md → CLAUDE.md
- `src/data/history.ts (typed loader + assertHistoryPage guard)` --semantically_similar_to--> `src/data/site.ts (typed site settings wrapper)`  [INFERRED] [semantically similar]
  docs/superpowers/specs/2026-06-23-history-page-design.md → CLAUDE.md
- `Decision: event times are free text, not a datetime widget` --semantically_similar_to--> `Event times typed as free text (no time picker)`  [INFERRED] [semantically similar]
  DECISIONS.md → CMS-SETUP.md
- `#ThyKingdomCome` --semantically_similar_to--> `Sunday Indabas`  [AMBIGUOUS] [semantically similar]
  src/content/news/thykingdomcome.md → src/content/news/sunday-indabas.md
- `.github/workflows/deploy.yml` --rationale_for--> `Why a GitHub Action instead of native Cloudflare Git integration`  [EXTRACTED]
  CLAUDE.md → CMS-SETUP.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **The editability-contract enforcement group** — claude_md_editability_contract, claude_md_dual_write_invariant, src_content_config_ts, public_admin_config_yml, src_data_site_ts_assertsitesettings, claude_md_legacyslug_field [INFERRED 0.85]
- **Three-typefaces type system** — font_montserrat, font_cormorant_garamond, font_source_serif_4, tokens_css_burgundy [EXTRACTED 1.00]
- **The events architecture file group** — src_data_eventcategories_ts, src_lib_events_ts, src_lib_events_feed_ts, src_lib_events_source_ts, src_lib_events_jsonld_ts, src_pages_calendar_ics_ts [EXTRACTED 1.00]
- **Designing and building St Barnabas, 1913–1916** — src_content_history_02_building_the_church_ernestshearman, src_content_history_02_building_the_church_ernesttyler, src_content_history_02_building_the_church_stbarnabaschurch [EXTRACTED 1.00]
- **Painting the apse, 1917–1920** — src_content_history_04_the_angels_of_the_apse_jamesclark, src_content_history_04_the_angels_of_the_apse_lilianclark, src_content_history_04_the_angels_of_the_apse_apsepainting, src_content_history_04_the_angels_of_the_apse_archangels [EXTRACTED 1.00]
- **The church that Shearman raised and Clark adorned, cherished today** — src_content_history_02_building_the_church_ernestshearman, src_content_history_04_the_angels_of_the_apse_jamesclark, src_content_history_08_a_living_church_today_livingchurchtoday [INFERRED 0.85]
- **St Barnabas COVID-19 pandemic response** — src_content_news_covid19_guidance_covid19_pandemic, src_content_news_covid19_guidance, src_content_news_extra_surge_testing_for_ealing, src_content_news_climate_listening_groups_justin_dodd [INFERRED 0.80]
- **West London Citizens housing & jobs advocacy** — src_content_news_ealing_housing_assembly_west_london_citizens, src_content_news_ealing_citizens_local_jobs_secured_and_commitments_for_living_wage_roles_citizens_uk, src_content_news_ealing_housing_assembly, src_content_news_ealing_housing_assembly_30050, src_content_news_ealing_citizens_local_jobs_secured_and_commitments_for_living_wage_roles [INFERRED 0.85]
- **Evensong's liturgical heritage (Sarum, monastic Hours, Cranmer)** — src_content_news_evensong_choral_evensong, src_content_news_evensong_magnificat_and_nunc_dimittis, src_content_news_evensong_thomas_cranmer, src_content_news_evensong_book_of_common_prayer [EXTRACTED 1.00]
- **St Barnabas Food Pantry coverage across news posts** — src_content_news_harvest_donations_food_pantry, src_content_news_listening_organising_and_responding_to_covid_19_food_pantry, src_content_news_memory_cafe_receives_a_warm_welcome_from_around_ealing_food_pantry [INFERRED 0.85]
- **Ealing/London Citizens community organising campaigns** — src_content_news_housing_follow_up_action_at_ealing_town_hall_post, src_content_news_housing_living_wages_mental_health_sen_for_ealing_post, src_content_news_london_mayoral_assembly_and_evening_prayer_post [INFERRED 0.80]
- **Jazz on the Lane event series across years** — src_content_news_jazz_on_the_lane_post, src_content_news_jazz_on_the_lane_2019_post, src_content_news_introducing_jazz_on_the_lane_nights_post [INFERRED 0.85]
- **Pitshanger Pictures film screening series** — src_content_news_mozart_festival_article, src_content_news_pitshanger_pictures_even_when_i_fall_12a_article, src_content_news_mozart_festival_pitshanger_pictures [INFERRED 0.85]
- **Family ministry programmes at St Barnabas** — src_content_news_noisy_mass_article, src_content_news_noisy_mass_copy_article, src_content_news_parent_support_group_article, src_content_news_mydearnewfriend_project_article [INFERRED 0.75]
- **Community organising and social justice initiatives** — src_content_news_online_celebration_assembly_community_organising_during_lockdown_article, src_content_news_nominated_charities_article, src_content_news_race_equality_commission_article, src_content_news_nominated_charities_west_london_citizens [INFERRED 0.80]
- **Monthly Regular Activities & Events bulletin format** — src_content_news_regular_activities_and_events_march_2019_article, src_content_news_regular_activities_events_may_2018_article, src_content_news_regular_events_activities_august_2018_article, src_content_news_regular_events_activities_july_2018_article, src_content_news_regular_events_activities_november_2019_article, src_content_news_regular_events_activities_october_2018_article, src_content_news_regular_events_and_activities_july_2019_article, src_content_news_regular_events_and_activities_june_2018_article [INFERRED 0.85]
- **Memory Café recurring across monthly bulletins** — src_content_news_regular_activities_and_events_march_2019_memory_cafe, src_content_news_regular_events_activities_august_2018_memory_cafe, src_content_news_regular_events_activities_november_2019_memory_cafe, src_content_news_regular_events_activities_october_2018_memory_cafe, src_content_news_regular_events_and_activities_july_2019_memory_cafe [INFERRED 0.80]
- **Ealing Gospel Choir recurring across monthly bulletins** — src_content_news_regular_activities_events_may_2018_ealing_gospel_choir, src_content_news_regular_events_activities_july_2018_ealing_gospel_choir, src_content_news_regular_events_and_activities_june_2018_ealing_gospel_choir [INFERRED 0.80]
- **Lent 2018 weekly reflection series (The Mystery of Everything)** — src_content_news_the_magic_of_stuff, src_content_news_the_need_for_dignity, src_content_news_the_pain_of_failure, src_content_news_the_problem_of_suffering, entity_lent_course_mystery_of_everything [INFERRED 0.85]
- **St Barnabas Ministry Team ordinand appointments** — src_content_news_two_ministry_team_announcements, src_content_news_welcome_amy_merriman, entity_jenny_krige, entity_stephanie_alvis, entity_amy_merriman [INFERRED 0.85]
- **Recurring monthly 'Worship' service listing template** — src_content_news_worship_june_2018, src_content_news_worship_july_2018, src_content_news_worship_august_2018, src_content_news_worship_july_2019, entity_sung_high_mass [INFERRED 0.85]
- **About Us Section Page Network** — src_content_pages_about_us_aboutuspage, src_content_pages_about_us_visiting_visitingpage, src_content_pages_about_us_accessibility_accessibilitypage, src_content_pages_about_us_pastoral_care_pastoralcarepage, src_content_pages_about_us_social_action_socialactionpage [EXTRACTED 0.90]
- **Social Action & Community Service Network** — src_content_pages_about_us_social_action_socialactionpage, src_content_pages_about_us_social_action_winter_night_shelter_winternightshelterpage, src_content_pages_community_food_pantry_at_st_barnabas_foodpantrypage, src_content_pages_about_us_pastoral_care_pastoralcarepage [EXTRACTED 0.85]
- **Sunday 10.30am Children's & Youth Provision** — src_content_pages_families_children_familieschildrenpage, src_content_pages_families_children_noisy_noisymasspage, src_content_pages_families_children_childrens_church_ages_5_9_childrenschurchpage, src_content_pages_families_children_youth_group_youthgrouppage [EXTRACTED 0.90]
- **2011 Organ Rebuild Project Team** — src_content_pages_music_st_barnabas_organ_2011_rebuild, src_content_pages_music_st_barnabas_organ_hazel_baker, src_content_pages_music_st_barnabas_organ_john_hudson, src_content_pages_music_st_barnabas_organ_paul_joslin, src_content_pages_music_st_barnabas_organ_hugh_mather, src_content_pages_music_st_barnabas_organ_nicholson_co [EXTRACTED 1.00]
- **Organ Building & Rebuild History** — src_content_pages_music_st_barnabas_organ_gerard_smith, src_content_pages_music_st_barnabas_organ_gray_davison, src_content_pages_music_st_barnabas_organ_william_hill_son, src_content_pages_music_st_barnabas_organ_nicholson_co [EXTRACTED 1.00]

## Communities (123 total, 41 thin omitted)

### Community 0 - "Utilities & Data"
Cohesion: 0.05
Nodes (34): [], rites, src800, open(), show(), links, year, assertHireSettings() (+26 more)

### Community 1 - "Utilities & Data"
Cohesion: 0.06
Nodes (38): assertServiceTimes(), ServiceTime, serviceTimes, groupByYear(), Neighbours, neighboursOf(), NewsLike, sortNewest() (+30 more)

### Community 2 - "Astro Components"
Cohesion: 0.06
Nodes (42): add-feast skill, Liturgical engine test-preservation rule, Liturgically alive design tenet, src/components/CommunityBand.astro, Roadmap item 6: liturgical engine feast coverage & curated artwork (Open), src/components/EnquireCTA.astro, Recipe: add a feast to the liturgical engine, Wiring the dormant hero/heroAlt page fields (+34 more)

### Community 3 - "News & Notices Archive"
Cohesion: 0.05
Nodes (40): Henry Tozer, Noisy Mass, Henry returns to Noisy Mass!, Ealing Housing Assembly, Ealing Town Hall, JJ Jung, Paul Robinson, Housing Follow-up Action at Ealing Town Hall (+32 more)

### Community 4 - "Package Dependencies"
Cohesion: 0.05
Nodes (38): astro, @astrojs/check, @astrojs/mdx, @astrojs/rss, @astrojs/sitemap, cheerio, node-ical, dependencies (+30 more)

### Community 5 - "People & Named Entities"
Cohesion: 0.08
Nodes (37): Amy Merriman (ordinand), C.A.P (Christians Against Poverty) Debt Centre, Choral Evensong and Benediction, Christian Aid, Dn Jill Scott, Ealing Gospel Choir, Fiona Jack (Ordinand), Fr Simon Cuff (+29 more)

### Community 6 - "News & Notices Archive"
Cohesion: 0.06
Nodes (37): Ealing Council, Memory Café (News), Mthr Valerie Aitken, Warm Spaces Grant, Albert Einstein, More Questions than Answers (News), Confessions (Augustine), Saint Augustine of Hippo (+29 more)

### Community 7 - "Section Pages Content"
Cohesion: 0.07
Nodes (34): About Us (page), Accessibility (page), Induction Loop, Inclusive Church, All Souls' Requiem (annual), Pastoral Care (page), Pastoral Network, Prayer for Healing (+26 more)

### Community 8 - "Events & iCal Logic"
Cohesion: 0.14
Nodes (25): civilFromDateOnly(), describeRepeat(), AnyEvent, civilKey(), cleanText(), describeRule(), eventsFromCalendar(), feedUrls() (+17 more)

### Community 9 - "Utilities & Data"
Cohesion: 0.11
Nodes (19): auto, artwork, Hero, heroFor(), Division, MechanismGroup, OrganSpec, ROMAN (+11 more)

### Community 10 - "This Sunday Music Sheets"
Cohesion: 0.16
Nodes (18): sheet, sheets, comingSunday(), composerShaped(), currentSheet(), fmt(), groupByMonth(), MonthGroup (+10 more)

### Community 11 - "News & Notices Archive"
Cohesion: 0.12
Nodes (24): Climate Listening Groups, Justin Dodd (Vicar), St Barnabas and COVID19, COVID-19 pandemic, Mthr Valerie Aitken, Curacy in Coventry for Robin, Curious about Christianity?, Ealing Citizens – Local Jobs Secured and Commitments for Living Wage Roles (+16 more)

### Community 12 - "Events & iCal Logic"
Cohesion: 0.14
Nodes (23): addMinutes(), baseEvent(), daysBetween(), escapeIcs(), foldIcsLine(), icsDate(), icsLocal(), IcsOptions (+15 more)

### Community 13 - "News & Notices Archive"
Cohesion: 0.15
Nodes (23): Children's Service, 8am Low Mass, Pentecost, 10.30am Sung High Mass, Worship | May 2018, All Souls Requiem Mass, Children's Mass, Ealing Gospel Choir (+15 more)

### Community 14 - "Music & Organ Pages"
Cohesion: 0.11
Nodes (21): The Choir, Choral Evensong, Choral Scholarships, Director of Music (Luca), Music Page (/music), Our Musicians (page), Sung Mass, YouTube Channel (livestream archive) (+13 more)

### Community 15 - "Agent Guardrails Doc"
Cohesion: 0.12
Nodes (16): Astro 6.4 static-output stack, UK English house style, Content collection: documents, Content collection: pages, Content collection: staff (Who's Who), Constrained markdown editor buttons, Editor-owned vs developer-owned content split, Editable prose pages must be .md, never .mdx (+8 more)

### Community 16 - "Utilities & Data"
Cohesion: 0.16
Nodes (10): assertHistoryPage(), HistoryHero, historyPage, OnwardLink, valid, chapterAnchor(), HistoryChapter, prepareChapters() (+2 more)

### Community 17 - "Utilities & Data"
Cohesion: 0.20
Nodes (12): nav, NavItem, utilityNav, chainTo(), chainToAncestor(), CrumbOptions, crumbsFor(), HOME (+4 more)

### Community 18 - "News & Notices Archive"
Cohesion: 0.11
Nodes (18): Food Pantry (St Barnabas), Harvest Festival, Harvest Donations, Felicity Mather, Pastoral Care Groups, Join a pastoral care group, Felicity Mather, Food Pantry (St Barnabas) (+10 more)

### Community 19 - "DECISIONS.md Rationale"
Cohesion: 0.13
Nodes (15): Children's Church age range default: 5–9, Open item: .org vs .net email domain, Hero/MusicBand accessibility fix (sr-only description, not role=img), Standardised Sung Mass duration wording, Newsletter signup: consent-gated ChurchDesk widget loader, Open item: safeguarding leads names, Open item: Youth Group age range, scripts/dimension-news-images.mjs (+7 more)

### Community 20 - "Church History Chapters"
Cohesion: 0.14
Nodes (16): Consecration of the church, 1916, Ernest Shearman, Ernest Tyler, Miss Mary Baron, West Rose Window, St Barnabas Church, Basilican church-plan model, Ernest Shearman (+8 more)

### Community 21 - "Events & iCal Logic"
Cohesion: 0.23
Nodes (13): addDays(), collapseSeries(), expandOccurrences(), isAnnounced(), mergeEvents(), nextOccurrence(), normaliseTitle(), sortWithinDay() (+5 more)

### Community 22 - "Content Schema"
Cohesion: 0.15
Nodes (13): Classic-script ordering guarantees CMS global exists before registration call, CMS.registerPreviewStyle(css, {raw:true}) API, No Sveltia source is forked — config + own files + documented JS API only, CMS branding implementation plan, CMS-editable surface implementation plan, History page implementation plan, public/admin/index.html, public/admin/logo.svg (branded window mark) (+5 more)

### Community 23 - "News & Notices Archive"
Cohesion: 0.18
Nodes (11): collections, documents, events, history, news, pages, services, staff (+3 more)

### Community 24 - "DECISIONS.md Rationale"
Cohesion: 0.15
Nodes (13): First Mass of Easter, Good Friday Meditation, Great Vigil of Easter, Mass of the Last Supper, Morning Prayer, Holy Week Services, 7 Sacred Spaces Lent Course, Stations of the Cross and Compline (+5 more)

### Community 25 - "TS/Astro Config"
Cohesion: 0.18
Nodes (12): barnabites.pages.dev mockup, .github/workflows/ci.yml, Deploy reality: main is production, no staging, Go-live checklist (rotate credentials, re-own under church, attach domain), Why a GitHub Action instead of native Cloudflare Git integration, .github/workflows/deploy.yml, GitHub OAuth app "St Barnabas Website CMS", Decision: Git-connected Pages project, not direct-upload (+4 more)

### Community 26 - "CMS Setup Guide"
Cohesion: 0.20
Nodes (12): Decision: every event normalised to Europe/London civil date at ingest, Decision: diary shows one row per repeating series, The events architecture (July 2026), Two-midnights all-day bug (fixed 3 August 2026), Roadmap item 5: publish an ICS calendar feed (Shipped), src/data/eventCategories.ts, src/lib/events-feed.ts, src/lib/events-jsonld.ts (+4 more)

### Community 27 - "Build Scripts"
Cohesion: 0.17
Nodes (11): **/*, astro/tsconfigs/strict, .astro/types.d.ts, dist, compilerOptions, baseUrl, paths, strictNullChecks (+3 more)

### Community 28 - "CI/CD Workflows"
Cohesion: 0.33
Nodes (9): buildLastmodMap(), changefreqFor(), frontmatterValue(), isoDate(), makeSerializer(), priorityFor(), safeWalk(), walk() (+1 more)

### Community 29 - "CLAUDE.md Guardrails"
Cohesion: 0.20
Nodes (11): Dual-write invariant, The editability contract, Hidden legacySlug field, Local CMS editing via File System Access API (no proxy server), Roadmap item 10: near-duplicate news posts from migration (Open), CMS wiring flow: Editor → Sveltia → GitHub OAuth → Publish → deploy.yml → live, YAML anchor &pf shared field set for pages, with Worship as the exception, public/admin/config.yml (+3 more)

### Community 30 - "Roadmap Backlog"
Cohesion: 0.18
Nodes (10): Roadmap items are candidates, not standing instructions, Roadmap follow-on: FAQPage on /about-us/visiting (Open), Roadmap item 8: image weight on hero-led pages (Open), Roadmap item 11: search-intent titles across remaining pages (Open), Roadmap item 4: site search on Pagefind (Shipped), Roadmap item 1: per-post social sharing & structured data (Shipped), Roadmap item 9: structured data, breadcrumbs, 404, sitemap metadata (Shipped), optimise-images skill (+2 more)

### Community 31 - "DECISIONS.md Rationale"
Cohesion: 0.22
Nodes (10): Three typefaces, one job each, .serif vs .title class distinction, Desktop nav breakpoint raised to 1180px, Homepage header now solid on every page, Menu bar ran out of room — nav moved to its own band, Typography change: a sans arrives (August 2026), Responsive type scale in percentages, not px, Cormorant Garamond (--font-display, decorative only) (+2 more)

### Community 32 - "People & Named Entities"
Cohesion: 0.22
Nodes (10): Dr John Salmon (photographer of the archive), Copy flag: "Ernest" not "Edward" Shearman, Ernest Charles Shearman (1859–1939), architect, James Clark's apse painting, 'the Three Hierarchies of Angels' (1917–1920), Flagged: organ page vs archive spec conflict (not reconciled), /about-us/history page (custom Astro template), Readability rule: no white text over imagery on the History page, Hugh Mather (parish historian, compiler of the archive) (+2 more)

### Community 33 - "Build Scripts"
Cohesion: 0.22
Nodes (7): byDate, decode(), flatten(), MONTHS, NAMES, silent, TIMES

### Community 34 - "Build Scripts"
Cohesion: 0.20
Nodes (6): months, redirects, sm, td, urls, usedSlugs

### Community 35 - "CLAUDE.md Guardrails"
Cohesion: 0.22
Nodes (9): announceFrom field on events collection, Content collection: events, Content collection: services (This Sunday's Music), Music-list source default: manual JSON per Sunday, 52 new services entries, Sept 2026 – July 2027, The Merton College visit (4 July 2027, joint Choral Evensong), Implementation change: shows a single month at a time, not the whole year, Implementation change: folded into /music, no separate /music/music-list page (+1 more)

### Community 36 - "Astro Components"
Cohesion: 0.22
Nodes (9): Known constraints — deliberately open content facts, Open item: Hugh Mather in Who's Who, Roadmap item 7: go-live debt (Blocked, parish), Who's Who detail pages design spec (2 June 2026), src/components/StaffGrid.astro, src/lib/staff.ts (getRoster, staffSlug), src/pages/about-us/whos-who/[person].astro, Decision: dedicated detail page per person (Approach A) (+1 more)

### Community 37 - "News & Notices Archive"
Cohesion: 0.22
Nodes (7): day, WEEKDAYS, when, EventCategory, EventEntry, SiteEvent, LoadedEvents

### Community 38 - "News & Notices Archive"
Cohesion: 0.28
Nodes (9): Come and Sing!, Kavi Pau (Director of Music), St Barnabas Choir, Advent and Christmas 2023, Evensong (sermon), Book of Common Prayer (1549/1662), Choral Evensong, Magnificat and Nunc Dimittis (+1 more)

### Community 39 - "Roadmap Backlog"
Cohesion: 0.22
Nodes (9): Mozart Festival (News), Così fan Tutte (film), Don Giovanni (film), Pitshanger Pictures, The Magic Flute (film), The Marriage of Figaro (film), Pitshanger Pictures | Even When I Fall with Q&A (News), Circus Kathmandu (+1 more)

### Community 40 - "Design Specs & Plans"
Cohesion: 0.25
Nodes (8): Brentham Estate garden suburb (from 1901), Content collection: news, Roadmap item 3: alt-text remediation on migrated news images (Open), Dr Tupholme and Miss Mary Baron (founders of the Tin Church), Henry Vivian / Ealing Tenants Limited, History chapter 1: Before the church (1905), src/content/history/*.md (folder collection of chapters), The "Tin Church" (corrugated-iron mission church, consecrated 1907)

### Community 41 - "News & Notices Archive"
Cohesion: 0.25
Nodes (7): Event times typed as free text (no time picker), ChurchDesk events feed default (open item #1), Decision: event times are free text, not a datetime widget, Roadmap item 2: content freshness — empty-events state (Shipped code / Blocked content), EVENTS_ICAL_URLS environment variable, isAnnounced (pure, tested filter function), Deferring the Merton announcement to 1 May 2027

### Community 42 - "CMS Setup Guide"
Cohesion: 0.25
Nodes (8): St Barnabas Appoints New Director of Music, Harry Guthrie, Fr Justin Dodd (Vicar), Stephen Layton, Trinity College, Cambridge, St Barnabas Appoints New Vicar, Revd Sarah Howard-Jones, St Martin's, Kensal Rise

### Community 43 - "News & Notices Archive"
Cohesion: 0.29
Nodes (7): Annual Meeting, Sunday 21 May 2023, Electoral Roll 2023/2024, John Hudson, Annual Meeting, Sunday 29 May 2022, Electoral Roll 2022/2023, Jonathan Hawkes, Church Electoral Roll

### Community 44 - "Events & iCal Logic"
Cohesion: 0.38
Nodes (4): describeWhen(), formatCivilRange(), formatClockTime(), groupByMonth()

### Community 45 - "CLAUDE.md Guardrails"
Cohesion: 0.33
Nodes (5): Anglo-Catholic tradition, St Barnabas Church, Ealing website (barnabites.org), ChurchDesk as remaining backend (calendar, contacts, bookings, newsletter, giving), src/styles/base.css, src/styles/tokens.css

### Community 46 - "Design Specs & Plans"
Cohesion: 0.40
Nodes (5): Design philosophy: restraint, reverence, readability, One-accent-only rule, Scroll-container bug fix (overflow-x hidden → clip), overflow-x: clip (not hidden) on body, --burgundy #6A1B2D accent token

### Community 47 - "CLAUDE.md Guardrails"
Cohesion: 0.70
Nodes (3): findMissingImages(), main(), walk()

### Community 48 - "Build Scripts"
Cohesion: 0.60
Nodes (4): fetchOnce(), grab(), IMAGES, stripSize()

### Community 49 - "Build Scripts"
Cohesion: 0.40
Nodes (3): HEROES, MARKS, MISC

### Community 51 - "Build Scripts"
Cohesion: 0.40
Nodes (5): Hazel Baker, Nicholson & Co., The St Barnabas organ, St Jude's, Southsea, /worship/st-barnabas-organ page

### Community 52 - "Church History Chapters"
Cohesion: 0.40
Nodes (5): Catherine Pepinster, Charles III, Defenders of the Faith (book), Indaba with Catherine Pepinster, The Tablet

### Community 53 - "News & Notices Archive"
Cohesion: 0.40
Nodes (5): Jenny Krige, Paul Krige, Introducing Mtr Jenny Krige, St Mary's Junior School, Waverley, St Thomas Church, Linden, Johannesburg

### Community 54 - "News & Notices Archive"
Cohesion: 0.40
Nodes (5): PCC Induction Pack (News), CoE Governance Explained, CommonFund for PCC Induction, Overview Mission Action Plan, Trustee Booklet

### Community 55 - "News & Notices Archive"
Cohesion: 0.40
Nodes (5): Remembering John McGlashan, BBC, Sir John Betjeman, John McGlashan, Jonathan Stedall

### Community 56 - "News & Notices Archive"
Cohesion: 0.67
Nodes (4): The Way (introductory Christianity course), The Way: Introducing the Riches of Christianity (Summer 2018), The Way: Introducing the Riches of Christianity (Autumn 2018), To Live Again: Advent Course

### Community 59 - "Build Scripts"
Cohesion: 0.50
Nodes (3): mdFiles, pngs, renamed

### Community 60 - "Build Scripts"
Cohesion: 0.50
Nodes (4): 40 Ideas for Keeping Lent Holy, Nadia Bolz-Weber, Hilary Brand, Christ and the Chocolaterie: Lent Course

### Community 61 - "News & Notices Archive"
Cohesion: 0.50
Nodes (4): Data Protection Notice, General Privacy Notice (PDF), GDPR, GDPR (General Data Protection Regulation)

### Community 62 - "News & Notices Archive"
Cohesion: 0.67
Nodes (4): #MyDearNewFriend Project (News), mydearnewfriend.org, National Literacy Trust, Sandra Easton

### Community 63 - "News & Notices Archive"
Cohesion: 0.50
Nodes (4): Prayer Vigil for the Living in Love and Faith Process (News), House of Bishops, Inclusive Church, Living in Love and Faith Process

### Community 64 - "News & Notices Archive"
Cohesion: 0.50
Nodes (4): Sunday Indabas: 'After COVID - Reorientation and Renewal', Sunday Indaba series, Virtual Indaba - Community Organising as a Spiritual Practice, Sufia Alam, Daniel McKintosh & Vanessa Conant

### Community 65 - "News & Notices Archive"
Cohesion: 0.50
Nodes (3): ConsentState, Window, WindowEventMap

### Community 69 - "Build Scripts"
Cohesion: 0.67
Nodes (3): Clayton and Bell, Sanctuary windows above the high altar, Stanley and Rosa Burgess

### Community 70 - "Church History Chapters"
Cohesion: 0.67
Nodes (3): Lady Chapel triptych (1996), Renewing the Foundations appeal (1983), Sister Theresa Margaret

### Community 71 - "Church History Chapters"
Cohesion: 0.67
Nodes (3): Fr Justin Dodd, Robin Griffiths, St Mellitus College

### Community 72 - "News & Notices Archive"
Cohesion: 0.67
Nodes (3): A Good Advent app (SPCK), Bishop Sarah, Dr Jane Williams

### Community 73 - "News & Notices Archive"
Cohesion: 0.67
Nodes (3): Anti-Racism Resources, Ghost Ship (A.D.A France-Williams), 'When the word of the prophet comes true' sermon

### Community 74 - "News & Notices Archive"
Cohesion: 0.67
Nodes (3): Nepali Children's Trust, Lent Boxes, Prospex

### Community 75 - "News & Notices Archive"
Cohesion: 0.67
Nodes (3): Pilgrimage to Westminster (News), Shrine of St Edward, Westminster Abbey

### Community 76 - "News & Notices Archive"
Cohesion: 1.00
Nodes (3): Recruitment - Willesden Area Finance Adviser, Diocese of London, Willesden Area Finance Adviser (role)

### Community 77 - "News & Notices Archive"
Cohesion: 0.67
Nodes (3): Reflective Morning: Oxygen for the Soul, Fr Justin Dodd, Dn Jill Scott & Mth Valerie Aitken, The Royal Foundation of St Katherine

### Community 78 - "News & Notices Archive"
Cohesion: 0.67
Nodes (3): Regular Activities and Events | March 2019, Lent Course - Christ and the Chocolaterie, Memory Café

### Community 79 - "News & Notices Archive"
Cohesion: 0.67
Nodes (3): Regular Events & Activities | August 2018, Memory Café, Thursday Pop-in

### Community 80 - "News & Notices Archive"
Cohesion: 0.67
Nodes (3): Regular Events & Activities | July 2018, Ealing Gospel Choir, Thursday Pop-in

### Community 81 - "News & Notices Archive"
Cohesion: 0.67
Nodes (3): Regular Events and Activities | July 2019, Memory Café, Thursday Pop-in

### Community 82 - "News & Notices Archive"
Cohesion: 1.00
Nodes (3): Remembering Her Majesty the Queen, Henry Tozer, Her Majesty the Queen

### Community 83 - "News & Notices Archive"
Cohesion: 0.67
Nodes (3): All Souls' List, Revision of All Souls List 2021, Felicity Mather

### Community 84 - "News & Notices Archive"
Cohesion: 0.67
Nodes (3): SERMON: Nine Lessons and Carols, 20 December 2018, Fr Justin Dodd, Nine Lessons and Carols (service)

### Community 85 - "News & Notices Archive"
Cohesion: 0.67
Nodes (3): St Barnabas Artist in Residence Programme, Helen Charlemagne, Mtr Fiona

## Ambiguous Edges - Review These
- `Sunday Indabas` → `#ThyKingdomCome`  [AMBIGUOUS]
  src/content/news/thykingdomcome.md · relation: semantically_similar_to

## Knowledge Gaps
- **407 isolated node(s):** `name`, `version`, `type`, `private`, `dev` (+402 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **41 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Sunday Indabas` and `#ThyKingdomCome`?**
  _Edge tagged AMBIGUOUS (relation: semantically_similar_to) - confidence is low._
- **Why does `Site` connect `Utilities & Data` to `Utilities & Data`, `Events & iCal Logic`?**
  _High betweenness centrality (0.009) - this node is a cross-community bridge._
- **Why does `src/lib/liturgy.ts (liturgical engine)` connect `Astro Components` to `CLAUDE.md Guardrails`?**
  _High betweenness centrality (0.006) - this node is a cross-community bridge._
- **Why does `Photography integration & Hire section design spec (18 August 2026)` connect `Astro Components` to `Agent Guardrails Doc`?**
  _High betweenness centrality (0.005) - this node is a cross-community bridge._
- **What connects `name`, `version`, `type` to the rest of the system?**
  _407 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Utilities & Data` be split into smaller, more focused modules?**
  _Cohesion score 0.052160493827160495 - nodes in this community are weakly interconnected._
- **Should `Utilities & Data` be split into smaller, more focused modules?**
  _Cohesion score 0.06464646464646465 - nodes in this community are weakly interconnected._