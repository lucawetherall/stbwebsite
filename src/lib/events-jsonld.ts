import { absoluteUrl, londonOffsetMinutes, type SiteEvent } from './events';
import { site } from '../data/site';
import { CHURCH_ID } from './seo';

/**
 * schema.org `Event` nodes for a list of events. These are folded into the page's site graph
 * (see `src/lib/seo.ts`), so they carry no `@context` of their own and reference the parish by
 * `@id` wherever the event is held here.
 */
export function eventsJsonLd(events: SiteEvent[]): unknown[] {
  return events.map((event) => ({
    '@type': 'Event',
    name: event.title,
    startDate: isoWithOffset(event, event.date, event.time),
    ...(event.endDate || event.endTime
      ? { endDate: isoWithOffset(event, event.endDate ?? event.date, event.endTime ?? event.time) }
      : {}),
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    ...(event.description ? { description: event.description } : {}),
    ...(event.image ? { image: absoluteUrl(event.image, site.url) } : {}),
    ...(event.url ? { url: absoluteUrl(event.url, site.url) } : {}),
    // Held here unless the editor named somewhere else — in which case we can only pass on the
    // name they typed, so the event does not claim our address for a hall across the borough.
    location: event.location
      ? { '@type': 'Place', name: event.location }
      : { '@id': CHURCH_ID },
    organizer: { '@id': CHURCH_ID },
  }));
}

/** "2026-06-07" for an all-day event, "2026-06-07T10:30:00+01:00" for a timed one. */
function isoWithOffset(event: SiteEvent, date: string, time: string | undefined): string {
  if (!time) return date;
  const minutes = londonOffsetMinutes(event.start);
  const sign = minutes < 0 ? '-' : '+';
  const abs = Math.abs(minutes);
  const offset = `${sign}${String(Math.floor(abs / 60)).padStart(2, '0')}:${String(abs % 60).padStart(2, '0')}`;
  return `${date}T${time}:00${offset}`;
}
