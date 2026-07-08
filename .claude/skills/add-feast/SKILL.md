---
name: add-feast
description: >-
  Add a feast or season to the liturgical engine, or change the seasonal hero artwork. Use
  before touching src/lib/liturgy.ts, src/data/artwork.ts or src/lib/liturgy.test.ts, or when
  asked to make the site recognise a feast day (e.g. Corpus Christi, Candlemas).
---

# Add a feast to the liturgical engine

`src/lib/liturgy.ts` computes the Western season/feast (Anonymous Gregorian Computus). It
drives the hero artwork (`src/data/artwork.ts` via `heroFor(key)`) and the footer season line.
It is unit-tested and the calendar **must stay correct across years** — see
`docs/AGENT-GUARDRAILS.md` §D.

A feast is a three-part change: **engine row → artwork key → test cases.** Never ship one
without the others.

## 1. Engine row — `src/lib/liturgy.ts`

Principal feasts live in the `feasts` array inside `getLiturgicalDay()`:

```ts
const feasts: [Date, string, Season][] = [
  [new Date(y, 5, 11), 'Feast of St Barnabas', 'Ordinary Time'], // patronal, 11 Jun
  ...
  [ascension, 'Ascension Day', 'Eastertide'],
];
```

- **Fixed-date feast** (Candlemas, Christmas Day): `new Date(y, monthIndex, day)` — months are
  **0-indexed** (5 = June).
- **Movable feast**: derive from `easter(y)` with `add(e, offset)` — e.g. Corpus Christi is the
  Thursday after Trinity Sunday, `add(e, 60)`. Verify the offset against a published calendar
  for at least two different years before trusting it.
- The `Season` value is the season the feast sits within (used if the hero has no feast art).
- Order matters only if two feasts could fall on the same date; the first match wins.
- Get the name liturgically right ("Candlemas (The Presentation of Christ in the Temple)" vs a
  guess) — when unsure of the parish's preferred title, flag it rather than invent.

## 2. Artwork key — `src/data/artwork.ts`

The feast's `key` is its slugified name (`'Corpus Christi'` → `corpus-christi`). Add that key
to the `artwork` map **with genuine alt text**. Note the current reality: the artwork map holds
only season keys plus `default`, so today's five feasts intentionally fall back to `default` —
reuse one of the existing five parish photos (`thurible`, `procession`, `altar`, `worship`
webp variants) rather than adding new imagery; curated public-domain feast paintings are a
roadmap item (docs/ROADMAP.md item 6, DECISIONS §7). If the fallback to `default` is the right
look for a minor feast, omitting the key is acceptable — say so explicitly in the PR.

## 3. Test cases — `src/lib/liturgy.test.ts`

Follow the existing style. For a movable feast, cover **at least two years** (the point of the
test is the offset arithmetic):

```ts
it('Corpus Christi 2026 (4 Jun)', () => {
  const d = getLiturgicalDay(new Date(2026, 5, 4));
  expect(d.feast).toBe('Corpus Christi');
  expect(d.key).toBe('corpus-christi');
});
```

Also confirm an adjacent non-feast day still returns its plain season (no accidental
overrides). Run `npm test`. **Never weaken or delete an existing test to make a change pass.**

## Finish

`/verify` — build, type-check, tests all green. If the feast should also appear as a service,
that is separate content (`src/content/events/` via CMS › Events), not the engine's job.
