import { getCollection } from 'astro:content';
import { fetchFeedEvents } from './events-feed';
import {
  addDays,
  collapseSeries,
  expandOccurrences,
  mergeEvents,
  isAnnounced,
  nextOccurrence,
  todayInLondon,
  upcomingEvents,
  type EventEntry,
  type SiteEvent,
} from './events';

/**
 * The one place events are loaded, merging the CMS collection with any configured calendar feed.
 *
 * Two consumers want two different shapes of the same data:
 *
 *  - **the diary** (`getDiaryEvents`) — one row per series, so a weekly Memory Café appears once
 *    with "Every Thursday" rather than fifty-two times ahead of the special services;
 *  - **the calendar feed** (`getCalendarEvents`) — every occurrence, including the recent past,
 *    because that is what someone subscribing in Apple Calendar expects to see.
 *
 * Both are derived from a single memoised load, so a build fetches the feed once rather than once
 * per consumer.
 */

/** How far back the published calendar reaches — enough to explain "what was that last month?". */
const PAST_DAYS = 90;
/** How far ahead everything looks. Long enough for next Christmas to be visible by Advent. */
const FUTURE_DAYS = 550;

interface LoadedEvents {
  today: string;
  cms: EventEntry[];
  feed: SiteEvent[];
  window: { from: string; to: string };
}

let cache: Promise<LoadedEvents> | null = null;

function load(now: Date): Promise<LoadedEvents> {
  cache ??= (async () => {
    const today = todayInLondon(now);
    const window = { from: addDays(today, -PAST_DAYS), to: addDays(today, FUTURE_DAYS) };
    const cms = await getCollection('events', ({ data }) => isAnnounced(data, today));
    const feed = await fetchFeedEvents(window);
    return { today, cms, feed, window };
  })();
  return cache;
}

/** Upcoming events for the What's On diary — one row per repeating series. */
export async function getDiaryEvents(now: Date = new Date()): Promise<SiteEvent[]> {
  const { today, cms, feed } = await load(now);

  const fromCms = cms
    .map((entry) => nextOccurrence(entry, today))
    .filter((e): e is SiteEvent => e !== undefined);

  const fromFeed = collapseSeries(upcomingEvents(feed, today));

  return mergeEvents(fromCms, fromFeed);
}

/** Every occurrence in the published window — what `/calendar.ics` is built from. */
export async function getCalendarEvents(now: Date = new Date()): Promise<SiteEvent[]> {
  const { cms, feed, window } = await load(now);
  const fromCms = cms.flatMap((entry) => expandOccurrences(entry, window));
  return mergeEvents(fromCms, feed);
}

/** Test seam: forget the memoised load. */
export function resetEventsCache(): void {
  cache = null;
}
