import ical from 'node-ical';
import { toEventCategory } from '../data/eventCategories';
import {
  civilFromDateOnly,
  toLondonCivil,
  daysBetween,
  formatCivilDate,
  weekdayOf,
  type SiteEvent,
} from './events';

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const ORDINALS = ['first', 'second', 'third', 'fourth', 'fifth'];

/**
 * The live calendar feed — the impure half of the events pipeline.
 *
 * Any iCal/webcal URL works: ChurchDesk, Google Calendar ("secret address in iCal format"),
 * Outlook, anything that publishes RFC 5545. Set `EVENTS_ICAL_URLS` (comma- or newline-separated)
 * in the Cloudflare Pages environment and add a daily deploy hook so build-time events stay fresh
 * (DECISIONS §6). Nothing here is required: with no feed configured the site runs happily on the
 * CMS collection alone.
 *
 * This module never throws. A feed that is missing, slow, unreachable or malformed produces a
 * warning and an empty list — `main` is production and deploys in about a minute, so a third
 * party having a bad afternoon must not be able to fail a parish deploy.
 */

const FETCH_TIMEOUT_MS = 8000;

/** Feed URLs from the environment, newest name first, legacy name still honoured. */
export function feedUrls(env: NodeJS.ProcessEnv = process.env): string[] {
  const raw = env.EVENTS_ICAL_URLS ?? env.CHURCHDESK_ICAL_URL ?? '';
  return raw
    .split(/[\n,]/)
    .map((u) => u.trim())
    .filter(Boolean)
    .map((u) => u.replace(/^webcal:\/\//i, 'https://'));
}

export interface FeedWindow {
  /** Civil date, inclusive. */
  from: string;
  /** Civil date, inclusive. */
  to: string;
}

export async function fetchFeedEvents(
  window: FeedWindow,
  urls: string[] = feedUrls()
): Promise<SiteEvent[]> {
  if (urls.length === 0) return [];

  const results = await Promise.all(urls.map((url) => fetchOne(url, window)));
  return results.flat();
}

async function fetchOne(url: string, window: FeedWindow): Promise<SiteEvent[]> {
  try {
    // Our own fetch rather than node-ical's HTTP layer, so a slow feed can never hang the build.
    const response = await fetch(url, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: { Accept: 'text/calendar, text/plain;q=0.9, */*;q=0.8' },
    });
    if (!response.ok) {
      console.warn(`[events] feed responded ${response.status}: ${redact(url)}`);
      return [];
    }
    const parsed = await ical.async.parseICS(await response.text());
    return eventsFromCalendar(parsed, window);
  } catch (error) {
    console.warn(`[events] feed unavailable (${redact(url)}):`, (error as Error).message);
    return [];
  }
}

/** Keep a secret calendar address out of the build log. */
function redact(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.origin}/…`;
  } catch {
    return 'feed';
  }
}

type AnyEvent = Record<string, any>;

/**
 * Turn a parsed calendar into site events, expanding repeating series across the window.
 * Exported so the parsing and recurrence logic can be unit-tested without a network round trip.
 */
export function eventsFromCalendar(
  parsed: ical.CalendarResponse,
  window: FeedWindow
): SiteEvent[] {
  const from = new Date(`${window.from}T00:00:00Z`);
  const to = new Date(`${window.to}T23:59:59Z`);
  const out: SiteEvent[] = [];

  for (const key of Object.keys(parsed)) {
    const vevent = parsed[key] as AnyEvent;
    if (vevent?.type !== 'VEVENT' || !vevent.start) continue;

    if (!vevent.rrule) {
      const event = toSiteEvent(vevent, vevent.start, vevent.end);
      if (event && withinWindow(event, window)) out.push(event);
      continue;
    }

    // A repeating series: every occurrence in the window, minus exclusions, plus overrides.
    const excluded = new Set(
      Object.values((vevent.exdate ?? {}) as Record<string, Date>).map((d) =>
        civilKey(d, vevent.datetype === 'date')
      )
    );
    const overrides = (vevent.recurrences ?? {}) as Record<string, AnyEvent>;
    // Duration in milliseconds, not days: a two-hour gathering must stay two hours on every
    // occurrence. (For an all-day event DTEND is exclusive midnight, so this is still whole days.)
    const durationMs =
      vevent.end instanceof Date ? Math.max(0, +vevent.end - +vevent.start) : 0;

    let occurrences: Date[] = [];
    try {
      occurrences = vevent.rrule.between(from, to, true) ?? [];
    } catch (error) {
      console.warn('[events] could not expand a repeating event:', (error as Error).message);
      occurrences = [];
    }
    const recurrenceText = describeRule(vevent.rrule, civilKey(vevent.start, vevent.datetype === 'date'));

    for (const occurrence of occurrences) {
      const dayKey = civilKey(occurrence, vevent.datetype === 'date');
      if (excluded.has(dayKey)) continue;

      const override = overrides[dayKey] ?? findOverride(overrides, occurrence);
      const source = override ?? vevent;
      const start = override ? override.start : occurrence;
      const end = override ? override.end : new Date(occurrence.getTime() + durationMs);

      const event = toSiteEvent(source, start, end, occurrence);
      if (event && withinWindow(event, window)) out.push({ ...event, recurrenceText });
    }
  }

  return out;
}

/**
 * "Every Thursday, until 17 December" from the feed's own RRULE, so a repeating feed event can be
 * shown once in the diary with its pattern spelled out — the same treatment CMS repeats get.
 *
 * Built from the rule's options rather than node-ical's `toText()`, which returns American
 * phrasing with the time and zone bolted on ("every week on Thursday at 2 PM GMT+1 until December
 * 17, 2026"). Anything we cannot phrase cleanly returns undefined; the row simply omits the line.
 */
function describeRule(rrule: AnyEvent, firstDate: string): string | undefined {
  let options: AnyEvent | undefined;
  try {
    options = typeof rrule.options === 'function' ? rrule.options() : rrule.options;
  } catch {
    return undefined;
  }
  if (!options?.freq) return undefined;

  const weekday = WEEKDAYS[weekdayOf(firstDate)];
  const every = Number(options.interval ?? 1);
  let phrase: string | undefined;

  switch (String(options.freq).toUpperCase()) {
    case 'DAILY':
      phrase = every === 1 ? 'Every day' : `Every ${every} days`;
      break;
    case 'WEEKLY':
      phrase =
        every === 1
          ? `Every ${weekday}`
          : every === 2
            ? `Every other ${weekday}`
            : `Every ${every} weeks, on a ${weekday}`;
      break;
    case 'MONTHLY': {
      const ordinal = ORDINALS[Math.floor((Number(firstDate.split('-')[2]) - 1) / 7)];
      phrase = ordinal ? `The ${ordinal} ${weekday} of the month` : 'Every month';
      break;
    }
    case 'YEARLY':
      phrase = 'Every year';
      break;
    default:
      return undefined;
  }

  const until = options.until ? new Date(options.until) : undefined;
  if (!until || Number.isNaN(until.getTime())) return phrase;
  return `${phrase}, until ${formatCivilDate(toLondonCivil(until).date, { year: false })}`;
}

/** node-ical keys recurrence overrides by date or by full ISO instant; try both. */
function findOverride(
  overrides: Record<string, AnyEvent>,
  occurrence: Date
): AnyEvent | undefined {
  return overrides[occurrence.toISOString()] ?? overrides[occurrence.toISOString().slice(0, 10)];
}

function civilKey(d: Date, allDay: boolean): string {
  return allDay ? civilFromDateOnly(d) : toLondonCivil(d).date;
}

function withinWindow(event: SiteEvent, window: FeedWindow): boolean {
  return (event.endDate ?? event.date) >= window.from && event.date <= window.to;
}

function toSiteEvent(
  vevent: AnyEvent,
  start: Date,
  end: Date | undefined,
  occurrence?: Date
): SiteEvent | undefined {
  if (!(start instanceof Date) || Number.isNaN(start.getTime())) return undefined;

  const allDay = vevent.datetype === 'date';
  const startCivil = allDay
    ? { date: civilFromDateOnly(start), time: undefined }
    : toLondonCivil(start);

  let endDate: string | undefined;
  let endTime: string | undefined;
  if (end instanceof Date && !Number.isNaN(end.getTime())) {
    if (allDay) {
      // DTEND is exclusive for all-day events — step back to the last day actually covered.
      const exclusive = civilFromDateOnly(end);
      endDate = daysBetween(startCivil.date, exclusive) > 1 ? shiftBack(exclusive) : undefined;
    } else {
      const endCivil = toLondonCivil(end);
      endTime = endCivil.time;
      endDate = endCivil.date !== startCivil.date ? endCivil.date : undefined;
    }
  }

  const seriesId = String(vevent.uid ?? `${startCivil.date}-${vevent.summary ?? 'event'}`);

  return {
    id: occurrence ? `${seriesId}@${startCivil.date}` : seriesId,
    seriesId,
    title: String(vevent.summary ?? 'Event').trim() || 'Event',
    start,
    end: end instanceof Date && !Number.isNaN(end.getTime()) ? end : undefined,
    date: startCivil.date,
    endDate,
    time: startCivil.time,
    endTime,
    allDay,
    category: toEventCategory(
      typeof vevent.categories === 'string'
        ? vevent.categories
        : Array.isArray(vevent.categories)
          ? vevent.categories.join(',')
          : undefined
    ),
    location: cleanText(vevent.location),
    description: cleanText(vevent.description),
    url: typeof vevent.url === 'string' ? vevent.url : undefined,
    featured: false,
    source: 'feed',
  };
}

function shiftBack(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d - 1));
  return civilFromDateOnly(t);
}

function cleanText(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const text = value.replace(/\r\n/g, '\n').trim();
  return text || undefined;
}
