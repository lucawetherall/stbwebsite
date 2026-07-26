import type { APIContext } from 'astro';
import { getCalendarEvents } from '../lib/events-source';
import { toIcs } from '../lib/events';
import { site } from '../data/site';

/**
 * A subscribable parish calendar, built at deploy time from the events collection and any
 * configured iCal feed. Unlike the What's On diary this carries every occurrence of a repeating
 * event, and reaches back a few months — someone subscribing in Apple Calendar expects to see
 * what happened recently as well as what is coming.
 */
export async function GET(context: APIContext) {
  const siteUrl = (context.site ?? new URL('https://www.barnabites.org')).href;
  const events = await getCalendarEvents();

  const body = toIcs(events, {
    now: new Date(),
    siteUrl,
    calendarName: site.name,
  });

  return new Response(body, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'inline; filename="st-barnabas-ealing.ics"',
    },
  });
}
