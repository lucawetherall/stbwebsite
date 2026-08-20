import { toEventCategory, type EventCategory } from '../data/eventCategories';
import { addDays, normaliseTitle, tidyFeedTitle, toLondonCivil, worshipEventUrl } from './events';

/**
 * The calendar view's in-browser half.
 *
 * The site is static, but the parish office keeps its diary in ChurchDesk — which does not
 * trigger a rebuild — so a page built last Tuesday can lag the real calendar. The What's On
 * calendar therefore re-fetches the same public feeds in the visitor's browser (they allow
 * cross-origin reads) and re-renders from fresh data, falling back to the build-time snapshot
 * whenever the network lets it down.
 *
 * This module is the pure, browser-safe part — a deliberately small reading of RFC 5545, sized
 * to what ChurchDesk actually publishes: one VEVENT per occurrence, UTC or date-only stamps, no
 * RRULEs. It shares its date and category vocabulary with `events.ts` so the two halves can
 * never drift apart, and it is unit-tested in `events-client.test.ts`.
 */

/** The slim event shape the calendar view renders — a subset of `SiteEvent`. */
export interface CalendarEvent {
  /** Europe/London civil start date, `YYYY-MM-DD`. */
  date: string;
  /** Civil end date for a multi-day event, inclusive. */
  endDate?: string;
  /** Civil start time, `HH:mm`. Absent for an all-day event. */
  time?: string;
  endTime?: string;
  allDay: boolean;
  title: string;
  category: EventCategory;
  location?: string;
  url?: string;
  source: 'cms' | 'feed';
}

interface IcsProp {
  params: string;
  value: string;
}

function prop(body: string, name: string): IcsProp | undefined {
  const match = body.match(new RegExp(`^${name}((?:;[^:\\n]*)?):(.*)$`, 'm'));
  return match ? { params: match[1], value: match[2].trim() } : undefined;
}

const unescapeText = (value: string) =>
  value.replace(/\\n/gi, '\n').replace(/\\([\\;,])/g, '$1');

/** A DTSTART/DTEND value as a London civil date (+ time for a timed stamp). */
function civilOf(p: IcsProp): { date: string; time?: string; allDay: boolean } | undefined {
  const v = p.value;
  if (/VALUE=DATE(?:;|$)/i.test(p.params) || /^\d{8}$/.test(v)) {
    const m = v.match(/^(\d{4})(\d{2})(\d{2})/);
    return m ? { date: `${m[1]}-${m[2]}-${m[3]}`, allDay: true } : undefined;
  }
  const m = v.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z?)$/);
  if (!m) return undefined;
  if (m[7] === 'Z') {
    const instant = new Date(`${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}Z`);
    if (Number.isNaN(instant.getTime())) return undefined;
    const civil = toLondonCivil(instant);
    return { date: civil.date, time: civil.time, allDay: false };
  }
  // A local stamp — the feeds declare Europe/London, so read it as our civil time directly.
  return { date: `${m[1]}-${m[2]}-${m[3]}`, time: `${m[4]}:${m[5]}`, allDay: false };
}

/** Every usable VEVENT in an iCal document, in the order published. */
export function parseIcsEvents(text: string): CalendarEvent[] {
  const unfolded = text.replace(/\r\n/g, '\n').replace(/\n[ \t]/g, '');
  const out: CalendarEvent[] = [];

  for (const match of unfolded.matchAll(/BEGIN:VEVENT\n([\s\S]*?)END:VEVENT/g)) {
    const body = match[1];
    // This reader shows one entry per VEVENT. A feed that publishes RRULE series (Google
    // Calendar, say, via the env override) would silently lose every repeat here while the
    // build-time snapshot — which expands recurrences properly — has them all. Refuse the
    // whole document instead, so the caller keeps the snapshot. ChurchDesk never sends these.
    if (/^RRULE:/m.test(body)) {
      throw new Error('feed carries recurring events this reader cannot expand');
    }
    if (/^STATUS:CANCELLED$/im.test(body)) continue;

    const startProp = prop(body, 'DTSTART');
    const start = startProp && civilOf(startProp);
    if (!start) continue;

    const endProp = prop(body, 'DTEND');
    const end = endProp && civilOf(endProp);

    let endDate: string | undefined;
    let endTime: string | undefined;
    if (end) {
      if (start.allDay) {
        // DTEND is exclusive for all-day events — step back to the last day covered.
        const inclusive = addDays(end.date, -1);
        endDate = inclusive > start.date ? inclusive : undefined;
      } else {
        endTime = end.time;
        endDate = end.date !== start.date ? end.date : undefined;
      }
    }

    const title = tidyFeedTitle(unescapeText(prop(body, 'SUMMARY')?.value ?? '')) || 'Event';
    out.push({
      date: start.date,
      endDate,
      time: start.allDay ? undefined : start.time,
      endTime,
      allDay: start.allDay,
      title,
      category: toEventCategory(unescapeText(prop(body, 'CATEGORIES')?.value ?? '')),
      location: unescapeText(prop(body, 'LOCATION')?.value ?? '').trim() || undefined,
      // Regular worship always links home rather than to ChurchDesk's event page — the same
      // rule the build-time pipeline applies (events-feed.ts).
      url: worshipEventUrl(title) ?? (prop(body, 'URL')?.value || undefined),
      source: 'feed',
    });
  }

  return out;
}

/**
 * Merge freshly fetched feed events with the build-time CMS events, sorted, a CMS entry winning
 * over a feed entry of the same title on the same day — the same rule as `mergeEvents`, so an
 * editor's enriched version is what the calendar shows too.
 */
export function mergeCalendarEvents(
  cms: CalendarEvent[],
  feed: CalendarEvent[]
): CalendarEvent[] {
  const claimed = new Set(cms.map((e) => `${e.date}|${normaliseTitle(e.title)}`));
  const merged = [...cms, ...feed.filter((e) => !claimed.has(`${e.date}|${normaliseTitle(e.title)}`))];
  return merged.sort(
    (a, b) =>
      a.date.localeCompare(b.date) ||
      (a.time ?? '').localeCompare(b.time ?? '') ||
      a.title.localeCompare(b.title, 'en-GB')
  );
}
