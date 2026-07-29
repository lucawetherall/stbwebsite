import { absoluteUrl, londonOffsetMinutes, type SiteEvent } from './events';
import { site } from '../data/site';

/**
 * schema.org `Event` markup for a list of events, emitted as a single JSON-LD array rather than a
 * script tag per event.
 */
export function eventsJsonLd(events: SiteEvent[]): unknown[] {
  return events.map((event) => ({
    '@context': 'https://schema.org',
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
    location: {
      '@type': 'Place',
      name: event.location ?? site.name,
      address: {
        '@type': 'PostalAddress',
        streetAddress: site.address.street,
        addressLocality: site.address.area,
        addressRegion: site.address.city,
        postalCode: site.address.postcode,
        addressCountry: 'GB',
      },
    },
    organizer: { '@type': 'Organization', name: site.name, url: site.url },
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
