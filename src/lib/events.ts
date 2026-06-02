import ical from 'node-ical';
import { getCollection } from 'astro:content';

export interface SiteEvent {
  title: string;
  start: Date;
  end?: Date;
  location?: string;
  description?: string;
  url?: string;
}

// Build-time events for org 1901. Sources, merged:
//   1. the manual `events` content collection (always available)
//   2. a live ChurchDesk iCal feed, IF process.env.CHURCHDESK_ICAL_URL is set
// Falls back gracefully to the manual collection (or empty) so the build never
// blocks on the feed. (See DECISIONS.md, open item #1.)
export async function getEvents(): Promise<SiteEvent[]> {
  const now = new Date();
  const events: SiteEvent[] = [];

  const manual = await getCollection('events');
  for (const e of manual) {
    events.push({
      title: e.data.title,
      start: e.data.start,
      end: e.data.end,
      location: e.data.location,
      description: e.data.description,
      url: e.data.url,
    });
  }

  const FEED = process.env.CHURCHDESK_ICAL_URL;
  if (FEED) {
    try {
      const data = await ical.async.fromURL(FEED);
      for (const key of Object.keys(data)) {
        const e = data[key] as any;
        if (e?.type === 'VEVENT' && e.start) {
          events.push({
            title: e.summary ?? 'Event',
            start: e.start,
            end: e.end,
            location: e.location,
            description: e.description,
            url: e.url,
          });
        }
      }
    } catch (err) {
      console.warn('[events] iCal fetch failed:', (err as Error).message);
    }
  }

  return events
    .filter((e) => (e.end ?? e.start) >= now)
    .sort((a, b) => +a.start - +b.start);
}
