import type { CollectionEntry } from 'astro:content';
import {
  DEFAULT_EVENT_CATEGORY,
  type EventCategory,
} from '../data/eventCategories';

/**
 * Events, as the site understands them.
 *
 * Everything in this module is **pure** — it takes already-loaded collection entries and plain
 * values, so it can be unit-tested without the Astro runtime (same approach as src/lib/history.ts).
 * The impure halves live in `events-feed.ts` (the iCal fetch) and `events-source.ts` (the loader).
 *
 * ## Dates are civil, not instants
 *
 * A CMS event is a *date* ("7 June 2026"), a feed event is an *instant*. Formatting both in UTC —
 * as the old implementation did — files a 9pm summer event on the wrong day, and therefore under
 * the wrong month heading. So every event is normalised here to a **Europe/London civil date**
 * (`date: 'YYYY-MM-DD'`, optional `time: 'HH:mm'`) alongside the raw `Date`. Grouping, display,
 * `<time datetime>` and the upcoming filter all use the civil string; only sorting and the ICS
 * feed use the `Date`.
 */

export type EventEntry = CollectionEntry<'events'>;

export interface SiteEvent {
  /** Unique per occurrence — `seriesId` for a one-off, `seriesId@date` for a repeat. */
  id: string;
  /** Stable per series: the collection entry id, or the feed event's UID. */
  seriesId: string;
  title: string;
  /** The instant the event starts (UTC midnight for an all-day event). Sorting and ICS only. */
  start: Date;
  end?: Date;
  /** Europe/London civil start date, `YYYY-MM-DD`. The one used for display and grouping. */
  date: string;
  /** Europe/London civil end date for a multi-day event, inclusive. */
  endDate?: string;
  /** Europe/London civil start time, `HH:mm`. Absent for an all-day event. */
  time?: string;
  endTime?: string;
  allDay: boolean;
  category: EventCategory;
  location?: string;
  description?: string;
  url?: string;
  urlLabel?: string;
  image?: string;
  imageAlt?: string;
  featured: boolean;
  /** "Every Thursday, until 17 December" — set only on a repeating series. */
  recurrenceText?: string;
  source: 'cms' | 'feed';
}

export type Repeat = 'none' | 'weekly' | 'fortnightly' | 'monthly';

/** Belt-and-braces stop so a malformed series can never spin the build. */
const MAX_OCCURRENCES = 1000;

const WEEKDAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

const ORDINALS = ['first', 'second', 'third', 'fourth', 'fifth'] as const;

/* ------------------------------------------------------------------ civil dates */

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * The civil date of a value that is *already* a civil date — a date-only content field, which
 * Zod coerces to UTC midnight. Read the UTC parts; never convert zones.
 */
export function civilFromDateOnly(d: Date): string {
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

/**
 * Re-stamp a date-only value that sits at *local* midnight as the same civil date at UTC
 * midnight, so `civilFromDateOnly` can read it.
 *
 * Two conventions meet in this codebase. Everything we build ourselves — `addDays`,
 * `shiftBack`, the `events` collection's `z.coerce.date()` — puts a date-only value at UTC
 * midnight. **node-ical does not:** it parses `DTSTART;VALUE=DATE:20260904` at *local*
 * midnight. In any zone ahead of UTC that instant is the previous day in UTC (Europe/London
 * in BST: `2026-09-03T23:00Z`), so reading UTC parts off it silently loses a day. Pass every
 * node-ical date-only value through here first.
 *
 * The trap is that it is invisible in UTC and in zones behind UTC, so CI on `ubuntu-latest`
 * cannot catch it — which is why the test suite pins TZ to Europe/London (vitest.config.ts).
 */
export function utcMidnightOfDateOnly(d: Date): Date {
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
}

/**
 * The Europe/London civil date and time of a genuine instant (a feed event). This is the single
 * chokepoint for time-zone handling: get it right here and nothing downstream can be off by a day.
 */
export function toLondonCivil(d: Date): { date: string; time: string } {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(d);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? '00';
  // en-GB renders midnight as "24" in some ICU versions; normalise it.
  const hour = get('hour') === '24' ? '00' : get('hour');
  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    time: `${hour}:${get('minute')}`,
  };
}

/** Today's date in Europe/London, `YYYY-MM-DD`. */
export function todayInLondon(now: Date = new Date()): string {
  return toLondonCivil(now).date;
}

/** Add whole days to a civil date string, calendar-safely. */
export function addDays(date: string, days: number): string {
  const [y, m, d] = date.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + days));
  return civilFromDateOnly(t);
}

/** The number of whole days between two civil dates. */
export function daysBetween(from: string, to: string): number {
  const a = Date.parse(`${from}T00:00:00Z`);
  const b = Date.parse(`${to}T00:00:00Z`);
  return Math.round((b - a) / 86_400_000);
}

/** The weekday index (0 = Sunday) of a civil date. */
export function weekdayOf(date: string): number {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/** "Sunday 7 June 2026" and friends, in UK style, from a civil date string. */
export function formatCivilDate(
  date: string,
  opts: { weekday?: boolean; year?: boolean } = {}
): string {
  const [y, m, d] = date.split('-').map(Number);
  const weekday = opts.weekday ? `${WEEKDAYS[weekdayOf(date)]} ` : '';
  const year = opts.year === false ? '' : ` ${y}`;
  return `${weekday}${d} ${MONTHS[m - 1]}${year}`;
}

/* ------------------------------------------------------------------ clock times */

/**
 * Parse the free-text time an editor types — "10.30am", "6pm", "18:00" — into 24-hour parts.
 * The field is free text on purpose: it matches how the parish already writes times in
 * `serviceTimes.json`, and it sidesteps the CMS datetime widget's UTC picker, which would store
 * an editor's 10.30 in summer as 11.30. Anything unparseable returns undefined and the event is
 * treated as all-day rather than guessed at.
 */
export function parseClockTime(value: string | undefined): { h: number; m: number } | undefined {
  if (!value) return undefined;
  const text = value.trim().toLowerCase().replace(/\s+/g, '');
  const match = text.match(/^(\d{1,2})(?:[.:](\d{2}))?(am|pm)?$/);
  if (!match) return undefined;

  let h = Number(match[1]);
  const m = match[2] ? Number(match[2]) : 0;
  const meridiem = match[3];

  if (m > 59) return undefined;
  if (meridiem) {
    if (h < 1 || h > 12) return undefined;
    if (meridiem === 'pm' && h !== 12) h += 12;
    if (meridiem === 'am' && h === 12) h = 0;
  } else if (h > 23) {
    return undefined;
  }
  return { h, m };
}

/** "10.30am" from 24-hour parts — how the parish writes a time. */
export function formatClockTime(time: string | undefined): string | undefined {
  if (!time) return undefined;
  const [h, m] = time.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return undefined;
  const meridiem = h < 12 ? 'am' : 'pm';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${hour12}${meridiem}` : `${hour12}.${pad(m)}${meridiem}`;
}

/* ------------------------------------------------------------------ recurrence */

/**
 * A plain-English description of a repeat, for the diary row. The parish already speaks this way
 * ("first Sunday of the month" in serviceTimes.json), so no editor ever meets RRULE syntax.
 */
export function describeRepeat(data: {
  start: Date;
  repeat?: Repeat;
  repeatUntil?: Date;
}): string | undefined {
  const repeat = data.repeat ?? 'none';
  if (repeat === 'none') return undefined;

  const date = civilFromDateOnly(data.start);
  const weekday = WEEKDAYS[weekdayOf(date)];
  const day = Number(date.split('-')[2]);

  let phrase: string;
  if (repeat === 'weekly') phrase = `Every ${weekday}`;
  else if (repeat === 'fortnightly') phrase = `Every other ${weekday}`;
  else phrase = `The ${ORDINALS[Math.floor((day - 1) / 7)]} ${weekday} of the month`;

  if (!data.repeatUntil) return phrase;
  return `${phrase}, until ${formatCivilDate(civilFromDateOnly(data.repeatUntil), { year: false })}`;
}

/**
 * The civil start dates of a series, in order. Weekly and fortnightly step by days; monthly keeps
 * the **weekday and its ordinal** — "the second Tuesday" — rather than the day of the month, which
 * is how a parish diary actually works. Months with no fifth such weekday are simply skipped.
 *
 * The caller's window governs how far this runs: a series with no `repeatUntil` is genuinely
 * open-ended (the Memory Café does not stop), so it fills the window rather than being truncated
 * at some arbitrary anniversary.
 */
function* occurrenceDates(
  data: { start: Date; repeat?: Repeat; repeatUntil?: Date },
  to: string
): Generator<string> {
  const first = civilFromDateOnly(data.start);
  const repeat = data.repeat ?? 'none';
  const until = data.repeatUntil ? civilFromDateOnly(data.repeatUntil) : undefined;

  if (repeat === 'none') {
    yield first;
    return;
  }

  const limit = until && until < to ? until : to;

  if (repeat === 'weekly' || repeat === 'fortnightly') {
    const step = repeat === 'weekly' ? 7 : 14;
    let date = first;
    for (let i = 0; i < MAX_OCCURRENCES && date <= limit; i++) {
      yield date;
      date = addDays(date, step);
    }
    return;
  }

  // monthly — the nth <weekday> of each month
  const weekday = weekdayOf(first);
  const ordinal = Math.floor((Number(first.split('-')[2]) - 1) / 7);
  let [year, month] = first.split('-').map(Number);
  for (let i = 0; i < MAX_OCCURRENCES; i++) {
    const date = nthWeekdayOfMonth(year, month, weekday, ordinal);
    if (date && date >= first) {
      if (date > limit) return;
      yield date;
    }
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
    if (`${year}-${pad(month)}-01` > limit) return;
  }
}

/** The civil date of the nth (0-based) `weekday` in a month, or undefined if there isn't one. */
function nthWeekdayOfMonth(
  year: number,
  month: number,
  weekday: number,
  ordinal: number
): string | undefined {
  const firstOfMonth = new Date(Date.UTC(year, month - 1, 1));
  const offset = (weekday - firstOfMonth.getUTCDay() + 7) % 7;
  const day = 1 + offset + ordinal * 7;
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  if (day > daysInMonth) return undefined;
  return `${year}-${pad(month)}-${pad(day)}`;
}

/* ------------------------------------------------------------------ entries → events */

function baseEvent(entry: EventEntry, date: string, isSeries: boolean): SiteEvent {
  const d = entry.data;
  const startClock = parseClockTime(d.time);
  const endClock = parseClockTime(d.endTime);
  const span = d.end ? daysBetween(civilFromDateOnly(d.start), civilFromDateOnly(d.end)) : 0;
  const endDate = span > 0 ? addDays(date, span) : undefined;

  return {
    id: isSeries ? `${entry.id}@${date}` : entry.id,
    seriesId: entry.id,
    title: d.title,
    start: instantFor(date, startClock),
    end: endDate || endClock ? instantFor(endDate ?? date, endClock ?? startClock) : undefined,
    date,
    endDate,
    time: startClock ? `${pad(startClock.h)}:${pad(startClock.m)}` : undefined,
    endTime: endClock ? `${pad(endClock.h)}:${pad(endClock.m)}` : undefined,
    allDay: !startClock,
    category: d.category ?? DEFAULT_EVENT_CATEGORY,
    location: d.location,
    description: d.description,
    url: d.url,
    urlLabel: d.urlLabel,
    image: d.image,
    imageAlt: d.imageAlt,
    featured: d.featured ?? false,
    recurrenceText: isSeries ? describeRepeat(d) : undefined,
    source: 'cms',
  };
}

/** A sortable instant for a civil date + optional civil time, read as Europe/London. */
function instantFor(date: string, clock: { h: number; m: number } | undefined): Date {
  const [y, m, d] = date.split('-').map(Number);
  if (!clock) return new Date(Date.UTC(y, m - 1, d));
  // Guess UTC, then correct by the offset London was actually at for that guess.
  const guess = Date.UTC(y, m - 1, d, clock.h, clock.m);
  const offset = londonOffsetMinutes(new Date(guess));
  return new Date(guess - offset * 60_000);
}

/** Europe/London's UTC offset, in minutes, at a given instant. */
export function londonOffsetMinutes(at: Date): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    timeZoneName: 'longOffset',
  }).formatToParts(at);
  const name = parts.find((p) => p.type === 'timeZoneName')?.value ?? 'GMT';
  const match = name.match(/([+-])(\d{2}):(\d{2})/);
  if (!match) return 0;
  const sign = match[1] === '-' ? -1 : 1;
  return sign * (Number(match[2]) * 60 + Number(match[3]));
}

/**
 * Every occurrence of a series that falls inside the window — used for the ICS feed, where a
 * weekly event genuinely should appear every week.
 */
export function expandOccurrences(
  entry: EventEntry,
  window: { from: string; to: string }
): SiteEvent[] {
  const isSeries = (entry.data.repeat ?? 'none') !== 'none';
  const out: SiteEvent[] = [];
  for (const date of occurrenceDates(entry.data, window.to)) {
    const event = baseEvent(entry, date, isSeries);
    if ((event.endDate ?? event.date) >= window.from) out.push(event);
  }
  return out;
}

/**
 * The single occurrence a series should contribute to the diary. Listing all 52 weeks of the
 * Memory Café would bury the four special services anyone came to find, so the page shows one row
 * per series carrying its `recurrenceText` instead.
 */
export function nextOccurrence(entry: EventEntry, today: string): SiteEvent | undefined {
  const isSeries = (entry.data.repeat ?? 'none') !== 'none';
  // Five years is well past any plausible parish series; the generator's own cap backs it up.
  const horizon = `${Number(today.slice(0, 4)) + 5}-12-31`;
  for (const date of occurrenceDates(entry.data, horizon)) {
    const event = baseEvent(entry, date, isSeries);
    if ((event.endDate ?? event.date) >= today) return event;
  }
  return undefined;
}

/* ------------------------------------------------------------------ lists */

const normaliseTitle = (t: string) =>
  t
    .toLowerCase()
    .replace(/[‘’“”]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

/**
 * Merge the CMS collection with the calendar feed, sorted. A feed event is dropped when a CMS
 * event shares its civil date and title, so an editor can enrich a feed entry — add a picture, a
 * booking link, better wording — and have their version win rather than appear twice.
 */
export function mergeEvents(cms: SiteEvent[], feed: SiteEvent[]): SiteEvent[] {
  const claimed = new Set(cms.map((e) => `${e.date}|${normaliseTitle(e.title)}`));
  const merged = [
    ...cms,
    ...feed.filter((e) => !claimed.has(`${e.date}|${normaliseTitle(e.title)}`)),
  ];
  return merged.sort((a, b) => (a.date === b.date ? sortWithinDay(a, b) : a.date < b.date ? -1 : 1));
}

function sortWithinDay(a: SiteEvent, b: SiteEvent): number {
  const at = a.time ?? '';
  const bt = b.time ?? '';
  if (at !== bt) return at < bt ? -1 : 1;
  return a.title.localeCompare(b.title, 'en-GB');
}

/**
 * Events that have not finished. Compares civil dates, so an event still running today survives —
 * the old `(end ?? start) >= now` dropped an event the moment its start time passed.
 */
export function upcomingEvents(events: SiteEvent[], today: string): SiteEvent[] {
  return events.filter((e) => (e.endDate ?? e.date) >= today);
}

/**
 * One row per series, keeping the earliest occurrence of each. The diary shows a repeating event
 * once, with its `recurrenceText`, rather than fifty-two times. Expects a date-sorted list.
 */
export function collapseSeries(events: SiteEvent[]): SiteEvent[] {
  const seen = new Set<string>();
  return events.filter((e) => {
    if (seen.has(e.seriesId)) return false;
    seen.add(e.seriesId);
    return true;
  });
}

export interface MonthGroup {
  key: string;
  label: string;
  events: SiteEvent[];
}

/** Group events under "July 2026" headings, in order. */
export function groupByMonth(events: SiteEvent[]): MonthGroup[] {
  const groups = new Map<string, MonthGroup>();
  for (const event of events) {
    const key = event.date.slice(0, 7);
    if (!groups.has(key)) {
      const [y, m] = key.split('-').map(Number);
      groups.set(key, { key, label: `${MONTHS[m - 1]} ${y}`, events: [] });
    }
    groups.get(key)!.events.push(event);
  }
  return [...groups.values()].sort((a, b) => (a.key < b.key ? -1 : 1));
}

/** "4–6 September", or "30 September – 2 October" when it straddles a month. */
export function formatCivilRange(from: string, to: string): string {
  if (from === to) return formatCivilDate(from, { year: false });
  const sameMonth = from.slice(0, 7) === to.slice(0, 7);
  const firstDay = Number(from.split('-')[2]);
  return sameMonth
    ? `${firstDay}–${formatCivilDate(to, { year: false })}`
    : `${formatCivilDate(from, { year: false })} – ${formatCivilDate(to, { year: false })}`;
}

/**
 * "10.30am · St Barnabas Church" — the row's meta line, prefixed with a date range when the event
 * runs over several days. Pass `includeDate: false` where the date is already displayed alongside.
 */
export function describeWhen(event: SiteEvent, opts: { includeDate?: boolean } = {}): string {
  const parts: string[] = [];
  if (opts.includeDate !== false && event.endDate && event.endDate !== event.date) {
    parts.push(formatCivilRange(event.date, event.endDate));
  }
  const from = formatClockTime(event.time);
  const to = formatClockTime(event.endTime);
  if (from) parts.push(to ? `${from} – ${to}` : from);
  if (event.location) parts.push(event.location);
  return parts.join(' · ');
}

/* ------------------------------------------------------------------ ICS */

const ICS_ESCAPE = /([\\;,])/g;

const escapeIcs = (value: string) =>
  value.replace(ICS_ESCAPE, '\\$1').replace(/\r?\n/g, '\\n');

/** Fold a content line to 75 octets, continuations prefixed with a single space (RFC 5545 §3.1). */
export function foldIcsLine(line: string): string {
  const bytes = Buffer.from(line, 'utf8');
  if (bytes.length <= 75) return line;

  const out: string[] = [];
  let start = 0;
  let limit = 75;
  while (start < bytes.length) {
    let end = Math.min(start + limit, bytes.length);
    // Never split a multi-byte character.
    while (end > start && end < bytes.length && (bytes[end] & 0xc0) === 0x80) end--;
    out.push(bytes.subarray(start, end).toString('utf8'));
    start = end;
    limit = 74; // continuation lines carry a leading space
  }
  return out.join('\r\n ');
}

const icsStamp = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
const icsDate = (date: string) => date.replace(/-/g, '');
const icsLocal = (date: string, time: string) => `${icsDate(date)}T${time.replace(':', '')}00`;

/**
 * Europe/London's rules, so a subscriber abroad sees 10.30 *our* time rather than theirs. Floating
 * times would be simpler and quietly wrong.
 */
const VTIMEZONE = [
  'BEGIN:VTIMEZONE',
  'TZID:Europe/London',
  'X-LIC-LOCATION:Europe/London',
  'BEGIN:DAYLIGHT',
  'TZOFFSETFROM:+0000',
  'TZOFFSETTO:+0100',
  'TZNAME:BST',
  'DTSTART:19700329T010000',
  'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU',
  'END:DAYLIGHT',
  'BEGIN:STANDARD',
  'TZOFFSETFROM:+0100',
  'TZOFFSETTO:+0000',
  'TZNAME:GMT',
  'DTSTART:19701025T020000',
  'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU',
  'END:STANDARD',
  'END:VTIMEZONE',
];

export interface IcsOptions {
  now: Date;
  siteUrl: string;
  calendarName?: string;
}

/** A complete, subscribable VCALENDAR for the given events. */
export function toIcs(events: SiteEvent[], opts: IcsOptions): string {
  const host = new URL(opts.siteUrl).hostname;
  const stamp = icsStamp(opts.now);
  const name = opts.calendarName ?? 'St Barnabas Church, Ealing';

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:-//${name}//Events//EN`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeIcs(name)}`,
    'X-WR-TIMEZONE:Europe/London',
    ...VTIMEZONE,
  ];

  for (const event of events) {
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${event.id.replace(/[^A-Za-z0-9@._-]/g, '-')}@${host}`);
    lines.push(`DTSTAMP:${stamp}`);

    if (event.allDay) {
      lines.push(`DTSTART;VALUE=DATE:${icsDate(event.date)}`);
      // DTEND is exclusive for all-day events — the day after the last one.
      lines.push(`DTEND;VALUE=DATE:${icsDate(addDays(event.endDate ?? event.date, 1))}`);
    } else {
      lines.push(`DTSTART;TZID=Europe/London:${icsLocal(event.date, event.time!)}`);
      const endDate = event.endDate ?? event.date;
      const endTime = event.endTime ?? addMinutes(event.time!, 60);
      lines.push(`DTEND;TZID=Europe/London:${icsLocal(endDate, endTime)}`);
    }

    lines.push(`SUMMARY:${escapeIcs(event.title)}`);
    if (event.description) lines.push(`DESCRIPTION:${escapeIcs(event.description)}`);
    if (event.location) lines.push(`LOCATION:${escapeIcs(event.location)}`);
    if (event.url) lines.push(`URL:${escapeIcs(absoluteUrl(event.url, opts.siteUrl))}`);
    lines.push(`CATEGORIES:${escapeIcs(event.category)}`);
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  return lines.map(foldIcsLine).join('\r\n') + '\r\n';
}

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = Math.min(h * 60 + m + minutes, 23 * 60 + 59);
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
}

export function absoluteUrl(url: string, siteUrl: string): string {
  return /^https?:\/\//i.test(url) ? url : new URL(url, siteUrl).href;
}
