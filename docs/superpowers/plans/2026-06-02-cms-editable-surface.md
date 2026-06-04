# Expand Sveltia CMS Editable Surface + Editor UX — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make site settings, the standing service-times pattern, and all 17 existing pages editable in Sveltia CMS, with a non-technical-friendly editor UX (hidden raw markdown, guardrails, clear labels).

**Architecture:** Editable content moves into CMS-managed JSON (`src/content/settings/*.json`); typed TypeScript wrappers (`src/data/*.ts`) import that JSON, merge developer-only technical constants, and export the same shape so the 16 existing consumers are untouched. Pages become editable via a File collection that enumerates each file (Sveltia's `nested` tree display is unsupported until v1.0). The Markdown widget is locked to rich-text-only with a minimal toolbar.

**Tech Stack:** Astro 6, Sveltia CMS 0.165.1 (Decap-compatible config in `public/admin/config.yml`), Vitest, TypeScript (`astro/tsconfigs/strict`, `resolveJsonModule` on).

**Spec:** `docs/superpowers/specs/2026-06-02-cms-editable-surface-design.md`

---

## File Structure

**Create:**
- `src/content/settings/site.json` — editor-owned site settings (name, phone, emails, people, social, giving, safeguarding leads, affiliations)
- `src/content/settings/serviceTimes.json` — editor-owned standing service pattern
- `src/data/site.test.ts` — unit tests for the hybrid merge + build guard
- `src/data/serviceTimes.test.ts` — unit tests for the JSON-backed service times

**Modify:**
- `src/data/site.ts` — import JSON, merge technical constants, derive `phoneIntl`, build guard
- `src/data/serviceTimes.ts` — import JSON, keep `ServiceTime` type + `serviceTimes` export
- `src/content.config.ts` — add optional `gallery` to the `pages` schema
- `src/content/pages/worship.mdx` — move gallery from body → frontmatter; body becomes pure prose
- `src/pages/[...slug].astro` — render optional `gallery` frontmatter via `Gallery`
- `src/components/StaffGrid.astro` — render the existing `photo` field
- `src/pages/news/[slug].astro` — render the existing `hero` field
- `public/admin/config.yml` — the CMS config: new collections, page enumeration, image fields, hidden `legacySlug`, rich-text lockdown, hints, sidebar dividers
- `CMS-SETUP.md` — update the "What you can edit" table

**Unchanged (verify still render identically):** the 14 `site.ts` consumers and 2 `serviceTimes.ts` consumers (footer, Contact Us, Worship pages, schema.org, etc.).

---

## Task 1: Extract editor-owned site settings to JSON

**Files:**
- Create: `src/content/settings/site.json`

- [ ] **Step 1: Create the JSON file**

```json
{
  "name": "St Barnabas Church, Ealing",
  "shortName": "St Barnabas, Ealing",
  "locality": "Pitshanger Lane, London W5 1QG",
  "tagline": "The Church of England parish church of Pitshanger",
  "phone": "020 8998 4079",
  "emails": {
    "office": "parish.office@barnabites.org",
    "vicar": "vicar@barnabites.org",
    "music": "music@barnabites.org",
    "safeguarding": "safeguarding@barnabites.org",
    "childrensChampion": "childrens.champion@barnabites.org"
  },
  "people": {
    "vicar": "Mother Sarah Howard-Jones",
    "directorOfMusic": "Luca Wetherall",
    "organist": "Hugh Mather"
  },
  "social": {
    "facebook": "https://www.facebook.com/barnabites/",
    "instagram": "https://www.instagram.com/ealingbarnabites",
    "youtube": "https://www.youtube.com/@stbarnabasealing2270"
  },
  "giving": "https://www.parishgiving.org.uk/donors/find-your-parish/ealing-st-barnabas-ealing/",
  "newsletterArchive": "https://app.churchdesk.com/public/newsletter/6b44359c-38fc-4441-812f-3a62e1fce3c2",
  "diocesanSafeguardingPolicy": "https://www.london.anglican.org/wp-content/uploads/2025/07/Diocese-of-London-Safeguarding-policy-v10.3.pdf",
  "affiliations": [
    { "name": "Inclusive Church", "url": "https://www.inclusive-church.org/" },
    { "name": "Church of England", "url": "https://www.churchofengland.org/" }
  ],
  "safeguardingLeads": [
    { "role": "Parish Safeguarding Officer", "name": "Pat Chapman", "email": "safeguarding@barnabites.org" },
    { "role": "Children's Champion", "name": "Helen Ward", "email": "childrens.champion@barnabites.org" },
    { "role": "Diocesan Safeguarding Advisor", "name": "Angela Colman", "email": "angela.colman@london.anglican.org" }
  ]
}
```

- [ ] **Step 2: Verify it is valid JSON**

Run: `node -e "JSON.parse(require('fs').readFileSync('src/content/settings/site.json','utf8')); console.log('valid')"`
Expected: prints `valid`

- [ ] **Step 3: Commit**

```bash
git add src/content/settings/site.json
git commit -m "feat(cms): extract editor-owned site settings to JSON"
```

---

## Task 2: Refactor site.ts into the hybrid wrapper (TDD)

**Files:**
- Test: `src/data/site.test.ts`
- Modify: `src/data/site.ts`

- [ ] **Step 1: Write the failing test**

Create `src/data/site.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { site, assertSiteSettings } from './site';

describe('site — hybrid settings merge', () => {
  it('exposes editor-owned fields from site.json', () => {
    expect(site.name).toBe('St Barnabas Church, Ealing');
    expect(site.phone).toBe('020 8998 4079');
    expect(site.emails.office).toBe('parish.office@barnabites.org');
    expect(site.people.vicar).toBe('Mother Sarah Howard-Jones');
  });

  it('keeps technical fields present at runtime (never in the CMS)', () => {
    expect(typeof site.geo.lat).toBe('number');
    expect(site.mapEmbed).toContain('google.com/maps/embed');
    expect(site.churchdeskOrgId).toBe(1901);
    expect(site.url).toBe('https://www.barnabites.org');
    expect(site.address.postcode).toBe('W5 1QG');
  });

  it('derives phoneIntl from the single editable phone', () => {
    expect(site.phoneIntl).toBe('+44 20 8998 4079');
  });
});

describe('assertSiteSettings — build guard', () => {
  const ok = { name: 'X', tagline: 'Y', phone: '020', emails: { office: 'a@b.c' } } as never;

  it('passes when required fields are present', () => {
    expect(() => assertSiteSettings(ok)).not.toThrow();
  });

  it('throws when a required field is blank', () => {
    expect(() => assertSiteSettings({ ...ok, phone: '  ' } as never)).toThrow(/phone/);
  });

  it('throws when emails.office is missing', () => {
    expect(() => assertSiteSettings({ ...ok, emails: {} } as never)).toThrow(/emails\.office/);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test -- src/data/site.test.ts`
Expected: FAIL — `assertSiteSettings` is not exported yet (and merged fields differ).

- [ ] **Step 3: Rewrite `src/data/site.ts`**

Replace the entire file with:

```ts
import editable from '../content/settings/site.json';

// Technical / structural fields — NEVER exposed to CMS editors. Edit in code only.
const technical = {
  url: 'https://www.barnabites.org',
  address: { street: 'Pitshanger Lane', area: 'Ealing', city: 'London', postcode: 'W5 1QG' },
  geo: { lat: 51.52708621708429, lng: -0.3115046840361693 },
  mapEmbed:
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2482.2438991924796!2d-0.3115046840361693!3d51.52708621708429!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x4876126d1066d097%3A0xdfc50a4e636cce59!2sSt+Barnabas+Church!5e0!3m2!1sen!2suk!4v1498738937601',
  churchdeskOrgId: 1901,
} as const;

/** Throws (failing the build) if the editor has emptied a field the site depends on. */
export function assertSiteSettings(s: typeof editable): void {
  const required: Array<[string, unknown]> = [
    ['name', s.name],
    ['tagline', s.tagline],
    ['phone', s.phone],
    ['emails.office', s.emails?.office],
  ];
  const missing = required.filter(([, v]) => !v || String(v).trim() === '').map(([k]) => k);
  if (missing.length) {
    throw new Error(
      `site.json is missing required field(s): ${missing.join(', ')}. ` +
        'Refusing to build with broken site settings.'
    );
  }
}

assertSiteSettings(editable);

// International phone derived from the single editable `phone` (UK 0… → +44 …),
// so editors never maintain two numbers.
const phoneIntl = '+44 ' + editable.phone.replace(/^0/, '').replace(/\s+/g, ' ');

export const site = { ...technical, ...editable, phoneIntl } as const;
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm run test -- src/data/site.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 5: Type-check the consumers are still happy**

Run: `npx astro check`
Expected: 0 errors. (If `site.name` literal-type narrowing is needed anywhere it will surface here; none is expected.)

- [ ] **Step 6: Commit**

```bash
git add src/data/site.ts src/data/site.test.ts
git commit -m "refactor(cms): site.ts reads editable JSON, keeps technical fields in code"
```

---

## Task 3: Extract service times to JSON

**Files:**
- Create: `src/content/settings/serviceTimes.json`

- [ ] **Step 1: Create the JSON file**

```json
{
  "sundays": [
    {
      "time": "10.30am",
      "name": "Sung Mass",
      "note": "with Children's Church (ages 5–9) and a Youth Group (ages 10–16)",
      "description": "Our main service — around an hour and a quarter — combining choral music, the depth of the liturgy and accessible preaching, with groups for every age."
    },
    {
      "time": "10.30am",
      "name": "Noisy Mass",
      "note": "in the small hall — ages 0–4 and their carers, with Stay & Play",
      "description": "A short, lively and interactive service for under-5s, with the Eucharist offered, followed by toys and time to play."
    },
    {
      "time": "8.00am",
      "name": "Said Mass (BCP)",
      "when": "first Sunday of the month",
      "description": "A reflective, contemplative service of about 45 minutes in the language of the 1662 Book of Common Prayer, with a short sermon."
    },
    {
      "time": "6.00pm",
      "name": "Choral Evensong",
      "when": "first Sunday of the month",
      "description": "Sung psalms, canticles and hymns to close the day."
    }
  ],
  "weekdays": [
    {
      "time": "12.30pm",
      "name": "Midweek Mass",
      "when": "Wednesdays",
      "note": "in the Lady Chapel — enter by the south door",
      "description": "A reflective communion service for midweek refreshment, often drawing on the deep Celtic tradition of Christianity."
    },
    {
      "time": "12.00pm",
      "name": "Dementia-Friendly Worship",
      "when": "Thursdays",
      "note": "in church, following the Memory Café",
      "description": "A very short, gentle time of prayer, designed especially for those who struggle with their memory."
    },
    {
      "time": "9.30am",
      "name": "Morning Prayer",
      "when": "Tuesday, Wednesday & Thursday",
      "note": "in the Lady Chapel — enter by the south door",
      "description": "Praying the Daily Office to begin the day — about 20 minutes of scripture and prayer for the world and ourselves."
    }
  ]
}
```

- [ ] **Step 2: Verify it is valid JSON**

Run: `node -e "JSON.parse(require('fs').readFileSync('src/content/settings/serviceTimes.json','utf8')); console.log('valid')"`
Expected: prints `valid`

- [ ] **Step 3: Commit**

```bash
git add src/content/settings/serviceTimes.json
git commit -m "feat(cms): extract standing service times to JSON"
```

---

## Task 4: Refactor serviceTimes.ts into the JSON-backed wrapper (TDD)

**Files:**
- Test: `src/data/serviceTimes.test.ts`
- Modify: `src/data/serviceTimes.ts`

- [ ] **Step 1: Write the failing test**

Create `src/data/serviceTimes.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { serviceTimes } from './serviceTimes';

describe('serviceTimes — loaded from JSON', () => {
  it('has non-empty sundays and weekdays', () => {
    expect(serviceTimes.sundays.length).toBeGreaterThan(0);
    expect(serviceTimes.weekdays.length).toBeGreaterThan(0);
  });

  it('preserves the first Sunday service', () => {
    expect(serviceTimes.sundays[0]).toMatchObject({ time: '10.30am', name: 'Sung Mass' });
  });

  it('keeps optional fields where present', () => {
    const bcp = serviceTimes.sundays.find((s) => s.name === 'Said Mass (BCP)');
    expect(bcp?.when).toBe('first Sunday of the month');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test -- src/data/serviceTimes.test.ts`
Expected: PASS is possible against the OLD hardcoded file — so first confirm the data source. The test must read from JSON. It will still pass against the current literal too, so this task's real verification is Step 4 (the import path). Run it now and expect PASS either way; proceed to swap the source.

- [ ] **Step 3: Rewrite `src/data/serviceTimes.ts`**

Replace the entire file with:

```ts
import data from '../content/settings/serviceTimes.json';

export interface ServiceTime {
  time: string;
  name: string;
  when?: string;
  note?: string;
  description?: string;
}

// Standing service pattern — editor-owned via Sveltia (src/content/settings/serviceTimes.json).
// Used by /worship/sundays, /worship/weekdays and as the ThisSunday fallback.
export const serviceTimes: { sundays: ServiceTime[]; weekdays: ServiceTime[] } =
  data as { sundays: ServiceTime[]; weekdays: ServiceTime[] };
```

- [ ] **Step 4: Run the test + type-check**

Run: `npm run test -- src/data/serviceTimes.test.ts && npx astro check`
Expected: tests PASS; `astro check` 0 errors. (`ServiceTimes.astro` imports `type ServiceTime` from this file — confirm it still resolves.)

- [ ] **Step 5: Commit**

```bash
git add src/data/serviceTimes.ts src/data/serviceTimes.test.ts
git commit -m "refactor(cms): serviceTimes.ts reads editable JSON"
```

---

## Task 5: Lift the worship gallery to frontmatter (unblocks rich-text-only)

**Files:**
- Modify: `src/content.config.ts` (add `gallery` to `pages` schema)
- Modify: `src/content/pages/worship.mdx`
- Modify: `src/pages/[...slug].astro`

- [ ] **Step 1: Add the `gallery` field to the `pages` schema**

In `src/content.config.ts`, inside the `pages` collection's `z.object({ … })`, add after the `draft` line:

```ts
    gallery: z
      .array(z.object({ src: z.string(), alt: z.string() }))
      .optional(),
```

- [ ] **Step 2: Rewrite `src/content/pages/worship.mdx`**

Replace the entire file with (gallery now in frontmatter; body is pure prose — no `import`, no `<Gallery>`):

```mdx
---
title: Worship
kicker: At the heart of our life
intro: Worship is one of the ways human beings open themselves to life-giving mystery.
description: Worship at St Barnabas, Ealing — Sung Mass on Sundays, weekday services, choral music and the great feasts of the Church's year, in the modern Catholic tradition.
gallery:
  - { src: /images/hero/thurible-1280.webp, alt: Incense rising from the thurible at the Sung Mass }
  - { src: /images/hero/procession-1280.webp, alt: The Sunday procession through the nave }
  - { src: /images/hero/altar-1280.webp, alt: The high altar dressed for the liturgy }
  - { src: /images/hero/worship-1280.webp, alt: The congregation gathered for worship }
---

We hope that the experience of God in worship — through Scripture, prayer, silence, music,
sacrament and relationship — increases our awareness of God’s presence in our daily lives. We
are followers of Jesus Christ, the full human expression of God’s Word of love, and we trust
that the Holy Spirit is at work in our worship, bringing us into communion as the Body of
Christ, and through Christ into relationship with God the Father — connecting ourselves, our
neighbour and our world.

## Find your way in

- **[Sundays](/worship/sundays)** — the Sung Mass at 10.30am, and more
- **[During the week](/worship/weekdays)** — Mass, Morning Prayer and quiet worship
- **[Special Services](/worship/special-services)** — the great feasts of the Church’s year
- **[Worship Online](/worship/online)** — join the Sunday Mass by livestream
- **[Music](/worship/music)** — our choir and the Anglican choral tradition
- **[The St Barnabas Organ](/worship/st-barnabas-organ)** — our historic Hill instrument

Thinking about a baptism, wedding or funeral? See [Life Events](/life-events).
```

- [ ] **Step 3: Render the optional gallery in `src/pages/[...slug].astro`**

Add the import alongside the existing imports:

```ts
import Gallery from '../components/Gallery.astro';
```

Add `gallery` to the destructure:

```ts
const { title, description, kicker, intro, gallery } = entry.data;
```

Render it right after the `<Prose>` block, still inside `.page-body`:

```astro
    <Prose><Content /></Prose>
    {gallery && gallery.length > 0 && <Gallery images={gallery} />}
```

- [ ] **Step 4: Verify build + that the gallery still renders on /worship**

Run: `npx astro check && npm run build`
Expected: 0 type errors; build succeeds.
Run: `grep -c 'thurible-1280.webp' dist/worship/index.html`
Expected: at least `1` (the gallery image is present in the built Worship page).

- [ ] **Step 5: Commit**

```bash
git add src/content.config.ts src/content/pages/worship.mdx src/pages/'[...slug].astro'
git commit -m "refactor(cms): move worship gallery to frontmatter so all page bodies are plain prose"
```

---

## Task 6: Render staff photos on Who's Who

**Files:**
- Modify: `src/components/StaffGrid.astro`

The `staff` schema already allows `photo`; the template ignores it. (No schema change needed.)

- [ ] **Step 1: Render the photo**

In `src/components/StaffGrid.astro`, inside the `<li class="staff-card">`, add as the first child (before the role `<p>`):

```astro
      {person.data.photo && (
        <img
          class="staff-card__photo"
          src={person.data.photo}
          alt={person.data.name}
          loading="lazy"
          decoding="async"
        />
      )}
```

Add to the `<style>` block:

```css
  .staff-card__photo {
    width: 100%;
    aspect-ratio: 1 / 1;
    object-fit: cover;
    border-radius: 4px;
    margin-bottom: 1rem;
  }
```

- [ ] **Step 2: Verify build**

Run: `npx astro check && npm run build`
Expected: 0 errors; build succeeds. (No staff entry has a `photo` yet, so visually nothing changes until an editor adds one — that is expected.)

- [ ] **Step 3: Commit**

```bash
git add src/components/StaffGrid.astro
git commit -m "feat(cms): render staff photos on Who's Who when present"
```

---

## Task 7: Render news hero images

**Files:**
- Modify: `src/pages/news/[slug].astro`

The `news` schema already allows `hero`/`heroAlt`; the template ignores them. (No schema change needed.)

- [ ] **Step 1: Add `hero`/`heroAlt` to the destructure**

In `src/pages/news/[slug].astro`, change:

```ts
const { title, date, category, author, description } = entry.data;
```

to:

```ts
const { title, date, category, author, description, hero, heroAlt } = entry.data;
```

- [ ] **Step 2: Render the hero image**

Inside `<div class="wrap page-body">`, immediately before `<Prose>`, add (alt falls back to the title so it is never empty — accessibility):

```astro
      {hero && (
        <img
          class="news-article__hero"
          src={hero}
          alt={heroAlt ?? title}
          loading="eager"
          decoding="async"
        />
      )}
```

Add to the `<style>` block:

```css
  .news-article__hero {
    width: 100%;
    max-height: 460px;
    object-fit: cover;
    border-radius: 4px;
    margin-bottom: 2rem;
  }
```

- [ ] **Step 3: Verify build**

Run: `npx astro check && npm run build`
Expected: 0 errors; build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/pages/news/'[slug].astro'
git commit -m "feat(cms): render news hero images when present"
```

---

## Task 8: Rewrite the Sveltia config — collections, pages, image fields, UX

**Files:**
- Modify: `public/admin/config.yml`

This is the CMS-facing change. It adds **Site settings** and **Service times** (file collections), converts **Main Pages** to a file collection enumerating all 17 pages, adds the **hidden `legacySlug`** + **hero image** fields to News (preventing redirect breakage), adds the **photo** field to Who's Who, locks the Markdown widget to **rich-text-only with a minimal toolbar**, and reorders the sidebar with dividers.

- [ ] **Step 1: Replace `public/admin/config.yml` in full**

```yaml
# Sveltia CMS configuration — St Barnabas Church, Ealing
# Editors manage content at  https://www.barnabites.org/admin
# Saving "Publish" commits to GitHub, which rebuilds the live site (~1 minute).
# Setup steps (GitHub login) are in CMS-SETUP.md at the repo root.

backend:
  name: github
  repo: lucawetherall/stbwebsite
  branch: main
  # Auth Worker (sveltia-cms-auth). MOCKUP value below; at go-live re-point this at the
  # church-owned Worker if the account/repo moves (see DECISIONS.md go-live checklist).
  base_url: https://sveltia-cms-auth.luca-wetherall.workers.dev

# Lets you edit locally without GitHub by running:  npx @sveltia/cms-proxy-server
local_backend: true

# MOCKUP URLs — point "view live"/preview links at the temporary Pages site.
# Revert both to https://www.barnabites.org at go-live.
display_url: https://barnabites.pages.dev
site_url: https://barnabites.pages.dev

# Where uploaded images are stored / served from
media_folder: public/images/uploads
public_folder: /images/uploads

collections:
  # ════════ EVERYDAY ════════
  # ── News & notices ──────────────────────────────────────────────────────────
  - name: news
    label: News
    label_singular: News post
    description: Notices, reflections and announcements. Newest appears first.
    folder: src/content/news
    create: true
    extension: md
    format: frontmatter
    slug: '{{slug}}'
    sortable_fields: [date, title]
    summary: '{{date}} — {{title}}'
    editor:
      preview: false
    fields:
      - { name: title, label: Title, widget: string }
      - { name: date, label: Date, widget: datetime, format: 'YYYY-MM-DD', date_format: 'YYYY-MM-DD', time_format: false, picker_utc: true }
      - { name: category, label: Category, widget: string, required: false, default: News, hint: 'e.g. News, Music, Reflection' }
      - { name: author, label: Author, widget: string, required: false }
      - { name: description, label: Summary (shown to search engines), widget: text, required: false }
      - { name: hero, label: Header image (optional), widget: image, required: false, hint: 'A picture shown at the top of the post.' }
      - { name: heroAlt, label: Header image description, widget: string, required: false, hint: 'Describe the picture for people using screen readers.' }
      - { name: draft, label: Draft (hide from the site), widget: boolean, default: false }
      - name: body
        label: Body
        widget: markdown
        modes: [rich_text]
        buttons: [bold, italic, link, heading-two, heading-three, bulleted-list, numbered-list, quote]
        editor_components: [image]
      # Hidden: preserves the original blog URL for redirects. Do not remove.
      - { name: legacySlug, widget: hidden }

  # ── This Sunday’s music (service sheets) ─────────────────────────────────────
  - name: services
    label: This Sunday’s Music
    label_singular: Service sheet
    description: The music list for a Sunday, shown in the “This Sunday” block.
    folder: src/content/services
    create: true
    extension: json
    format: json
    slug: '{{year}}-{{month}}-{{day}}'
    identifier_field: feast
    sortable_fields: [date]
    summary: '{{feast}} — {{date}}'
    fields:
      - { name: date, label: Sunday date, widget: datetime, format: 'YYYY-MM-DD', date_format: 'YYYY-MM-DD', time_format: false, picker_utc: true }
      - { name: feast, label: Feast / title, widget: string, hint: 'e.g. Corpus Christi, Trinity Sunday' }
      - name: offices
        label: Services that day
        label_singular: Service
        widget: list
        summary: '{{fields.time}} · {{fields.name}}'
        fields:
          - { name: time, label: Time, widget: string, hint: 'e.g. 10.30am' }
          - { name: name, label: Service name, widget: string, hint: 'e.g. Sung Mass, Choral Evensong' }
          - name: items
            label: Music & readings
            label_singular: Line
            widget: list
            summary: '{{fields.label}}'
            fields:
              - { name: label, label: Label, widget: string, hint: 'e.g. Setting, Psalm, Anthem' }
              - name: values
                label: Value(s)
                widget: list
                hint: 'One per line. Put the composer first, then a comma — e.g. “Mozart, Ave verum corpus”.'
                field: { name: value, label: Entry, widget: string }

  # ── Events / What’s on ───────────────────────────────────────────────────────
  - name: events
    label: Events
    label_singular: Event
    description: Special services and events shown on Worship → Special Services.
    folder: src/content/events
    create: true
    extension: json
    format: json
    slug: '{{year}}-{{month}}-{{day}}-{{slug}}'
    sortable_fields: [start]
    summary: '{{start}} · {{title}}'
    fields:
      - { name: title, label: Title, widget: string }
      - { name: start, label: Date, widget: datetime, format: 'YYYY-MM-DD', date_format: 'YYYY-MM-DD', time_format: false, picker_utc: true }
      - { name: end, label: End date (optional), widget: datetime, format: 'YYYY-MM-DD', date_format: 'YYYY-MM-DD', time_format: false, required: false, picker_utc: true }
      - { name: location, label: Location, widget: string, required: false, default: St Barnabas Church }
      - { name: description, label: Description, widget: text, required: false, hint: 'Service times can go here, e.g. “Sung Mass at 10.30am”.' }
      - { name: url, label: Link (optional), widget: string, type: url, required: false }

  - divider: true

  # ════════ NOW & THEN ════════
  # ── Standing service times ───────────────────────────────────────────────────
  - name: service_times
    label: Service times
    description: The regular weekly Sunday & weekday pattern (the “This Sunday” fallback and Worship pages).
    files:
      - name: standing
        label: Service times
        file: src/content/settings/serviceTimes.json
        description: The standing weekly pattern. For a one-off Sunday’s music, use “This Sunday’s Music” instead.
        fields:
          - name: sundays
            label: Sunday services
            label_singular: Sunday service
            widget: list
            summary: '{{fields.time}} · {{fields.name}}'
            fields:
              - { name: time, label: Time, widget: string, hint: 'e.g. 10.30am' }
              - { name: name, label: Service name, widget: string }
              - { name: when, label: When (optional), widget: string, required: false, hint: 'e.g. first Sunday of the month — leave blank if every Sunday.' }
              - { name: note, label: Note (optional), widget: string, required: false }
              - { name: description, label: Description (optional), widget: text, required: false }
          - name: weekdays
            label: Weekday services
            label_singular: Weekday service
            widget: list
            summary: '{{fields.time}} · {{fields.name}}'
            fields:
              - { name: time, label: Time, widget: string, hint: 'e.g. 12.30pm' }
              - { name: name, label: Service name, widget: string }
              - { name: when, label: When (optional), widget: string, required: false, hint: 'e.g. Wednesdays' }
              - { name: note, label: Note (optional), widget: string, required: false }
              - { name: description, label: Description (optional), widget: text, required: false }

  # ── Who’s Who (clergy & people) ──────────────────────────────────────────────
  - name: staff
    label: Who’s Who
    label_singular: Person
    description: The people listed on About Us → Who’s Who.
    folder: src/content/staff
    create: true
    extension: json
    format: json
    slug: '{{fields.order}}-{{name}}'
    identifier_field: name
    sortable_fields: [order]
    summary: '{{order}}. {{name}} — {{role}}'
    fields:
      - { name: name, label: Name, widget: string }
      - { name: role, label: Role, widget: string }
      - { name: photo, label: Photo (optional), widget: image, required: false, hint: 'A square photo works best.' }
      - { name: email, label: Email, widget: string, type: email, required: false }
      - { name: bio, label: Short bio, widget: text, required: false }
      - { name: order, label: Order (lower shows first), widget: number, value_type: int, required: false }

  # ── Documents (PDFs etc.) ────────────────────────────────────────────────────
  - name: documents
    label: Documents
    label_singular: Document
    description: Downloads listed on the Documents page. Upload a PDF or link out.
    folder: src/content/documents
    create: true
    extension: json
    format: json
    slug: '{{fields.order}}-{{slug}}'
    identifier_field: title
    sortable_fields: [order, category]
    summary: '{{title}}'
    media_folder: /public/documents
    public_folder: /documents
    fields:
      - { name: title, label: Title, widget: string }
      - { name: file, label: File or link, widget: file, hint: 'Upload a PDF, or paste a full https:// link for an external document.' }
      - { name: external, label: This is an external link (not an uploaded file), widget: boolean, default: false }
      - { name: description, label: Description, widget: string, required: false }
      - { name: category, label: Category, widget: string, required: false, hint: 'e.g. Worship, Forms, Governance & policies' }
      - { name: order, label: Order, widget: number, value_type: int, required: false }

  - divider: true

  # ════════ SET UP ONCE (rarely touched) ════════
  # ── Main pages (text of every standalone & section page) ─────────────────────
  # File collection enumerating each page (Sveltia has no nested-folder tree until v1.0).
  # `&pf` defines the shared field set once; `*pf` reuses it. Worship has its own set (gallery).
  - name: pages
    label: Main Pages
    description: Edit the wording of any page. The formatting buttons are all you need.
    editor:
      preview: false
    files:
      - name: about-us
        label: About Us
        file: src/content/pages/about-us.mdx
        fields: &pf
          - { name: title, label: Title, widget: string }
          - { name: kicker, label: Kicker (small label above the title), widget: string, required: false }
          - { name: intro, label: Intro line, widget: string, required: false }
          - { name: description, label: Summary (shown to search engines), widget: text, required: false }
          - { name: draft, label: Draft (hide from the site), widget: boolean, required: false, default: false }
          - name: body
            label: Body
            widget: markdown
            modes: [rich_text]
            buttons: [bold, italic, link, heading-two, heading-three, bulleted-list, numbered-list, quote]
            editor_components: [image]
            hint: Edit the wording freely. There is no code to break here.
      - { name: about-accessibility, label: 'About · Accessibility', file: src/content/pages/about-us/accessibility.mdx, fields: *pf }
      - { name: about-pastoral-care, label: 'About · Pastoral Care', file: src/content/pages/about-us/pastoral-care.mdx, fields: *pf }
      - { name: about-social-action, label: 'About · Social Action', file: src/content/pages/about-us/social-action.mdx, fields: *pf }
      - { name: about-winter-night-shelter, label: 'About · Winter Night Shelter', file: src/content/pages/about-us/social-action/winter-night-shelter.mdx, fields: *pf }
      - { name: community, label: Community, file: src/content/pages/community.mdx, fields: *pf }
      - { name: community-food-pantry, label: 'Community · Food Pantry', file: src/content/pages/community/food-pantry-at-st-barnabas.mdx, fields: *pf }
      - { name: curious-about-christianity, label: Curious about Christianity, file: src/content/pages/curious-about-christianity.mdx, fields: *pf }
      - { name: families-children, label: Families & Children, file: src/content/pages/families-children.mdx, fields: *pf }
      - { name: families-childrens-church, label: 'Families · Children’s Church', file: src/content/pages/families-children/childrens-church-ages-5-9.mdx, fields: *pf }
      - { name: families-noisy, label: 'Families · Noisy Mass', file: src/content/pages/families-children/noisy.mdx, fields: *pf }
      - { name: families-youth-group, label: 'Families · Youth Group', file: src/content/pages/families-children/youth-group.mdx, fields: *pf }
      - { name: life-events, label: Life Events, file: src/content/pages/life-events.mdx, fields: *pf }
      - { name: community-memory-cafe, label: 'Community · Memory Café', file: src/content/pages/community/memory-cafe.md, fields: *pf }
      - { name: visit, label: Visit, file: src/content/pages/visit.mdx, fields: *pf }
      - { name: worship-organ, label: 'Worship · St Barnabas Organ', file: src/content/pages/worship/st-barnabas-organ.mdx, fields: *pf }
      - name: worship
        label: Worship
        file: src/content/pages/worship.mdx
        fields:
          - { name: title, label: Title, widget: string }
          - { name: kicker, label: Kicker (small label above the title), widget: string, required: false }
          - { name: intro, label: Intro line, widget: string, required: false }
          - { name: description, label: Summary (shown to search engines), widget: text, required: false }
          - { name: draft, label: Draft (hide from the site), widget: boolean, required: false, default: false }
          - name: body
            label: Body
            widget: markdown
            modes: [rich_text]
            buttons: [bold, italic, link, heading-two, heading-three, bulleted-list, numbered-list, quote]
            editor_components: [image]
            hint: Edit the wording freely. There is no code to break here.
          - name: gallery
            label: Photo gallery
            widget: list
            required: false
            summary: '{{fields.alt}}'
            fields:
              - { name: src, label: Image, widget: image }
              - { name: alt, label: Image description (for screen readers), widget: string }

  # ── Site-wide settings (contact details, people, links) ──────────────────────
  - name: site_settings
    label: Site settings
    description: Church contact details, key people and links used across the whole site.
    files:
      - name: general
        label: Site settings
        file: src/content/settings/site.json
        description: Changing these updates the footer, Contact Us and every page that shows them.
        fields:
          - { name: name, label: Church name, widget: string }
          - { name: shortName, label: Short name, widget: string }
          - { name: locality, label: Locality line, widget: string, hint: 'e.g. Pitshanger Lane, London W5 1QG' }
          - { name: tagline, label: Tagline, widget: string }
          - { name: phone, label: Phone, widget: string, hint: 'Shown in the footer and on Contact Us.' }
          - name: emails
            label: Email addresses
            widget: object
            fields:
              - { name: office, label: Parish office, widget: string, type: email }
              - { name: vicar, label: Vicar, widget: string, type: email }
              - { name: music, label: Music, widget: string, type: email }
              - { name: safeguarding, label: Safeguarding, widget: string, type: email }
              - { name: childrensChampion, label: Children’s Champion, widget: string, type: email }
          - name: people
            label: Key people
            widget: object
            fields:
              - { name: vicar, label: Vicar, widget: string }
              - { name: directorOfMusic, label: Director of Music, widget: string }
              - { name: organist, label: Organist, widget: string }
          - name: social
            label: Social media links
            widget: object
            fields:
              - { name: facebook, label: Facebook, widget: string, type: url }
              - { name: instagram, label: Instagram, widget: string, type: url }
              - { name: youtube, label: YouTube, widget: string, type: url }
          - { name: giving, label: Giving page link, widget: string, type: url }
          - { name: newsletterArchive, label: Newsletter archive link, widget: string, type: url }
          - { name: diocesanSafeguardingPolicy, label: Diocesan safeguarding policy link, widget: string, type: url }
          - name: affiliations
            label: Affiliations
            label_singular: Affiliation
            widget: list
            summary: '{{fields.name}}'
            fields:
              - { name: name, label: Name, widget: string }
              - { name: url, label: Link, widget: string, type: url }
          - name: safeguardingLeads
            label: Safeguarding leads
            label_singular: Safeguarding lead
            widget: list
            summary: '{{fields.role}} — {{fields.name}}'
            fields:
              - { name: role, label: Role, widget: string }
              - { name: name, label: Name, widget: string }
              - { name: email, label: Email, widget: string, type: email }
```

- [ ] **Step 2: Verify the YAML parses**

Run: `npx -y js-yaml public/admin/config.yml > /dev/null && echo "yaml ok"`
Expected: prints `yaml ok` (confirms anchors `&pf`/`*pf` and structure are valid). If `npx` cannot fetch offline, parse with Node + the bundled parser instead:
`node -e "const y=require('yaml');y.parse(require('fs').readFileSync('public/admin/config.yml','utf8'));console.log('yaml ok')"` (the `yaml` package ships transitively with Astro).

- [ ] **Step 3: Manual round-trip in the CMS (local proxy)**

Run, in two terminals:
```bash
npx @sveltia/cms-proxy-server   # terminal 1
npm run dev                     # terminal 2
```
Open `http://localhost:4321/admin` and confirm, ticking each:
- Sidebar shows three groups (dividers) and the new **Service times** + **Site settings** entries, plus **Main Pages** listing all 17 pages.
- **Site settings** → edit Phone → Save → `src/content/settings/site.json` changes on disk; the footer on the running site updates.
- **Service times** → edit a Sunday note → Save → `src/content/settings/serviceTimes.json` changes.
- **Main Pages → Worship** → the body opens as rich text (no raw markdown, no `import`/`<Gallery>` visible); the **Photo gallery** list shows 4 images. Save → `worship.mdx` keeps both body and `gallery:` frontmatter.
- **Main Pages → About · Accessibility** (a sub-page) opens and saves correctly.
- **News** → open an existing post → Save with no changes → `legacySlug:` is still present in the file (redirect preserved). The body editor shows no raw-markdown toggle.

> **Fallback (only if the file-collection body mapping for `.mdx` pages misbehaves):** revert the `pages` collection to a folder collection for the top-level pages and add one folder collection per subfolder (`src/content/pages/about-us`, `.../families-children`, `.../community`, `.../worship`, `.../about-us/social-action`) with `create: false` and the `*pf` fields. Group them under the same SET UP ONCE divider. This uses the already-proven folder mechanism at the cost of a busier sidebar.

- [ ] **Step 4: Commit**

```bash
git add public/admin/config.yml
git commit -m "feat(cms): add Site settings + Service times, enumerate all pages, lock rich-text, preserve legacySlug"
```

---

## Task 9: Full verification + docs update

**Files:**
- Modify: `CMS-SETUP.md`

- [ ] **Step 1: Run the full check suite**

Run: `npm run test && npx astro check && npm run build`
Expected: all tests PASS; 0 type errors; build succeeds.

- [ ] **Step 2: Update the "What you can edit" table in `CMS-SETUP.md`**

In the Part 2 table, add two rows and adjust the Main Pages row:

```markdown
| **Service times** | The regular weekly Sunday & weekday pattern shown on the Worship pages. |
| **Site settings** | Church contact details, key people, and the links used across the whole site. |
```

Change the **Main Pages** row to:

```markdown
| **Main Pages** | The wording of every standalone and section page (now including the deeper pages — Accessibility, Pastoral Care, the Organ, Food Pantry, etc.). |
```

Also update the "What's deliberately *not* in the CMS" note: remove "deeper sub-pages" from the excluded list (they are now editable); keep navigation and homepage layout as developer-owned.

- [ ] **Step 3: Commit**

```bash
git add CMS-SETUP.md
git commit -m "docs(cms): document Site settings, Service times and full-page editing"
```

---

## Self-Review (completed by plan author)

- **Spec coverage:** Site settings (Tasks 1–2, 8) ✓; Service times (Tasks 3–4, 8) ✓; deeper pages editable (Task 8 pages file collection) ✓; hybrid data split (Tasks 2, 4) ✓; build-time guard (Task 2 `assertSiteSettings`) ✓; sidebar dividers/IA (Task 8) ✓; hints/descriptions + View-on-Live-Site built-in (Task 8) ✓; rich-text-only (`modes: [rich_text]`, Task 8) ✓; worship gallery lift (Task 5) ✓; staff photos (Task 6) ✓; news heroes (Task 7) ✓; service `when` free-text (Task 8, string field) ✓; out-of-scope nav/homepage untouched ✓.
- **Added beyond spec (justified):** hidden `legacySlug` on News — without it, editing an existing post drops the 301 redirect slug. In scope as a correctness fix for the surface being made editable.
- **Type consistency:** `assertSiteSettings` defined and used in Task 2; `ServiceTime` type kept in Task 4 (consumed by `ServiceTimes.astro`); `gallery` schema (Task 5) matches `Gallery` component's `{ src, alt }` props and the worship frontmatter + CMS field (Task 8).
- **Risk flagged:** file-collection `.mdx` body mapping has a documented fallback (Task 8, Step 3).
