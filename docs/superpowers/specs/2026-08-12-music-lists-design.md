# Music lists, September 2026 – July 2027 — design

**Date:** 12 August 2026
**Status:** approved, for implementation

## What this is

The Director of Music produced three printed music lists covering the 2026–27 choir year —
*Michaelmas 2026*, *Epiphany & Lent 2027*, *Eastertide & Trinity 2027*. This brings them onto
the site: each Sunday's music appearing on the homepage and on `/music` in the week before it,
and the whole forward list browsable on a page of its own.

## Scope

- 52 new `services` entries covering 6 September 2026 – 25 July 2027.
- A correctness fix to how the "This Sunday" sheet is chosen.
- A new page, `/music/music-list`, carrying the forward list.
- The coming service, in full, added to `/music`.

Out of scope: an archive of *past* music lists; adding these services to the `events`
collection; a downloadable PDF.

## The data

One file per date, `src/content/services/YYYY-MM-DD.json`, matching the existing schema exactly.
**No schema change and no `config.yml` field change** — the collection as it stands already
holds everything these lists contain.

Days with two services (e.g. 4 October 2026: Sung Mass and Choral Evensong) are one file with
two entries in `offices`.

### Said and no-choir dates

Where the printed list says *Said Mass — No choir; Mass said*, nothing is written:

| Date | Treatment |
|---|---|
| 27 December 2026 | Silent throughout — **no file** |
| 6 May 2027 (Ascension Day) | Silent throughout — **no file** |
| 4 April 2027 | 10.30am Said Mass omitted; the 6pm Choral Evensong is written, so the day still shows music |

The absence of a file *is* the silence. This works only because of the picker fix below;
without it the site would reach forward and show the following week's music on a silent Sunday.

### Off-site services

18 October 2026 is a joint service at St John the Baptist, Holland Road. Rather than add a
`note` field, the venue goes in the office name: `Joint Choral Service at St John the Baptist,
Holland Road`. Slightly long in the tracked-uppercase heading, but it wraps, and it keeps the
schema and the CMS untouched.

### Times

Twelve services were marked *Time tbc* in the printed lists. Nine were confirmed by the
Director of Music and are written in house format (`6.30pm`, `11.00pm`, `7.30pm`); the other
three fall on the silent dates and are not written at all.

| Date | Service | Time |
|---|---|---|
| 18 Oct 2026 | Joint Choral Service (at St John the Baptist, Holland Road) | 6.30pm |
| 1 Nov 2026 | Solemn Requiem | 6.00pm |
| 13 Dec 2026 | A Festival of Nine Lessons & Carols | 6.00pm |
| 24 Dec 2026 | Midnight Mass | 11.00pm |
| 3 Jan 2027 | Epiphany Carol Service | 6.00pm |
| 10 Feb 2027 | Ash Wednesday, Sung Mass | 7.00pm |
| 25 Mar 2027 | Maundy Thursday, Sung Mass | 7.00pm |
| 26 Mar 2027 | The Liturgy of Good Friday | 2.00pm |
| 27 Mar 2027 | The Easter Vigil & First Mass of Easter | 7.30pm |

### Feast names

The internal lectionary references (`Proper 18`, `Proper 5`) are dropped — they mean nothing to
a visitor. The meaningful sub-titles are kept: *Whit Sunday*, *Patronal Festival, transferred*,
*Remembrance Sunday*, *Passiontide begins*, *Blessing of Backpacks & Baptisms*, *Noisy Mass*.

## The picker fix

`ThisSunday.astro` currently selects *the coming Sunday's sheet, or failing that any sheet
within 14 days*. Once silent Sundays exist that misfires: on Saturday 26 December it finds no
sheet for the 27th, reaches forward, and shows Epiphany's music from 3 January — a fortnight
early, on the one Sunday that was meant to be blank.

The rule becomes:

> **Show the earliest sheet dated between today and the coming Sunday inclusive.**

| Situation | Result |
|---|---|
| Ordinary week | The coming Sunday, as before |
| Ash Wednesday, 10 Feb | Shown from the Thursday before — it falls before the coming Sunday |
| Sat 26 / Sun 27 Dec | Next sheet is 3 Jan, past the coming Sunday → **nothing renders** |
| Holy Week | Maundy Thursday, then the Vigil, then Easter Day, each in turn |
| After 25 July 2027 | Nothing renders through the summer |

This is what the 14-day window was reaching for, done precisely. It also delivers the
hide-on-silent-Sundays behaviour with no flag and no marker files.

Note: the first list entry is 6 September, so after this ships **the homepage panel stays hidden
for about three weeks**. That is correct, not a fault.

## Typography of a music value

`values` are plain strings and stay that way — an editor typing `Mozart, Ave verum corpus` must
keep getting what they expect. But the existing "italicise everything after the first comma"
rule breaks on real entries in these lists: it would set *Riu, riu, chiu* as composer "Riu",
leave *Missa de Angelis* roman, and italicise the key in *Sumsion in G*.

`fmt(label, value)` replaces it, applied in order:

1. Label `Psalm` or `Responses` → all roman (references and bare composer names).
2. Strip trailing annotations — a final `(…)` group and/or a final `— …` clause, repeatedly.
   These stay roman: `(plainsong)`, `(Gloria omitted)`, `(arr. Luboff)`, `— after communion`.
3. If what remains ends in `in <key>` (`Darke in A minor`, `Ireland in C`) → all roman.
4. Otherwise, if it contains `, ` and the text after the first one starts with a capital **and**
   the text before it is composer-shaped — every word capitalised or an initial, allowing the
   particles *of, van, von, de, du, da, la, le* — then that part is the composer (roman) and the
   rest is the title (italic).
5. Otherwise the whole thing is a title (italic).

Worked cases: `Riu, riu, chiu` → all italic (4 fails, lowercase after the comma).
`We have received thy mercy, O God (plainsong)` → all italic, `(plainsong)` roman (4 fails,
"have"/"received" are not particles). `King John IV of Portugal, Crux fidelis` → composer plus
italic title (4 passes, "of" is a particle). `Rheinberger, Missa (Crux fidelis)` → composer,
italic *Missa*, roman `(Crux fidelis)` — as printed.

Unit-tested in `src/lib/services.test.ts`.

## Structure

| File | Purpose |
|---|---|
| `src/lib/services.ts` | `currentSheet()`, `upcomingSheets()`, `fmt()` — the logic, tested |
| `src/lib/services.test.ts` | Picker cases and the `fmt` rule set |
| `src/components/ServiceSheet.astro` | Renders one sheet; lifted out of `ThisSunday` |
| `src/components/ThisSunday.astro` | Homepage band, now wrapping `ServiceSheet` |
| `src/components/MusicList.astro` | The forward list on `/music/music-list` |

## `/music`

Prose (unchanged) → **This Sunday / Next service** in full → three compact rows of what follows
→ outlined button, *The full music list →* → Listen (unchanged). About eight lines added. The
three-row glance is what gives the button meaning; a bare "more →" says nothing about whether
the list is alive.

## `/music/music-list`

A dedicated page, so a long list is the point rather than an intrusion. Four design moves:

**The month rule comes across from the printed list** — hairline, diamond, `SEPTEMBER`, diamond,
hairline. It is the most distinctive mark in the booklets and the site does not have it yet.
Pure CSS on existing tokens; the parish's own vocabulary, borrowed.

**A pinned month bar.** The site header is not sticky, so the bar can pin flush to the top with
no offset arithmetic. Months jump to their section, the current one in burgundy, horizontally
scrollable on mobile. Sections carry `scroll-margin-top` so a jump does not tuck the month name
under the bar. `scroll-behavior: smooth` and its `prefers-reduced-motion` override are already
in `base.css`.

**The next service carries a filled diamond** in the date column — the month rule's mark at
small size. Wayfinding without a "next up" card repeating what `/music` just showed.

**The page prints as the booklet.** `@media print` strips the chrome and reconstitutes something
close to the A4 list. The house philosophy is the printed sheet translated to the web; letting
it translate back completes the thought, costs only CSS, and follows the print blocks already in
`base.css` and `OrganSpec.astro`. Choir members will use it.

### Considered and rejected: grouping by liturgical season

Tempting, since `liturgy.ts` already drives the hero artwork and the footer season line. But
these lists transfer feasts freely — *Corpus Christi (transferred)* on 30 May, *Candlemas* on
31 January, *St Barnabas, Patronal Festival, transferred* on 13 June. The engine computes the
calendar's season and would confidently label those with a season the parish is not keeping.
Being subtly wrong about the church's year on the Director of Music's own page is worse than
being plainly right. Grouped by month, as the printed lists are.

## Editability

The wording of the new page is editor-owned, following the `/whats-on` pattern exactly:

- `src/content/pages/music/music-list.md` holds title, kicker, intro and description.
- Registered in the `pages` files list in `public/admin/config.yml` with the shared `*pf` fields.
- `[...slug].astro` gains `showMusicList` to inject the component.
- `src/data/nav.ts` gains *Music List* under Music; breadcrumbs follow automatically.

The 52 service files are ordinary CMS entries — an editor can edit, add or delete any of them in
*This Sunday's Music* exactly as before. Deleting one makes that Sunday silent, which is now a
coherent thing to do rather than a bug.

## Verification

`npm run build`, `npx astro check`, `npm test`, all clean; page count up by one; the CMS still
matches `content.config.ts` (unchanged on both sides, bar the new page registration).

---

## What changed during implementation

The design above is the record of what was *planned*. Three things changed as it was built and
reviewed, and the shipped feature differs from it in these respects.

**One page, not two.** The spec put the forward list on a new `/music/music-list` and left `/music`
with a "This Sunday" panel and a link through to it. That page was built, then folded into `/music`
itself: a page that mostly linked to another page was not earning its place, and the list already
opens on the next service, so the panel was saying the same thing twice. `/music/music-list`,
its content page, its CMS registration and its nav entry were all removed; `src/content/pages/music/music-list.md`
never shipped.

**A month at a time, not the whole year.** The spec showed every remaining service in one scroll.
That buried the thing most readers want, so the list now shows a single month, opening on the
month that holds the next service and stepping with chevrons on the month rule or the month bar.
Every month is in the page and hidden, so navigation needs no round-trip; `<noscript>` and the
print stylesheet reveal them all, which is why a printed copy is still the whole booklet.

**A nightly rebuild.** Not anticipated in the spec. The site is static, so `new Date()` is frozen
at build time — for the music list's next service, the "This Sunday" band, the footer season line
and the What's On diary alike. Deploys fired only on a push to `main`, so a fortnight without a
CMS publish would leave the page naming a service already sung. `deploy.yml` now also runs on a
daily schedule.

The picker rule, the `fmt` typography rules, the data conventions (silent dates, off-site venue in
the service name, dropped lectionary references) and the decision to group by month rather than by
liturgical season all shipped as designed.

**Editability, closed.** `/music`'s prose was hard-coded in `music.astro`, a gap against the
contract in CLAUDE.md §4 that predated this work. It is now `src/content/pages/music.md`, served
by `[...slug].astro` and registered in `config.yml` — the same shape as `/whats-on`. The list on
it stays developer-owned: it is generated from the `services` collection, `MusicList.astro` owns
its own section heading, and nothing in `config.yml` gives an editor a handle on it.

**The Merton College visit.** The 6pm Choral Evensong on 4 July 2027 is a joint service with the
Choir of Merton College, Oxford. It is named so in the music list and carries a featured event, so
it reaches What's On, Worship → Special Services and the parish calendar. The printed lists name
an off-site venue when there is one, and name none here, so it is taken to be at St Barnabas.
