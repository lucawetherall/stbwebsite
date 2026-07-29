/**
 * Structured data for the site, assembled as a single JSON-LD `@graph`.
 *
 * Why a graph rather than a script tag per type: every page used to emit a standalone `Church`
 * node with no `@id`, so a crawler saw 170 unrelated churches and had no way to attach a
 * breadcrumb, an article or a service to the parish. Here every node carries a stable `@id`
 * (`https://www.barnabites.org/#church`, `…/#website`) and page-level nodes reference those ids,
 * so the whole site resolves to one organisation.
 *
 * The service nodes are the reason this file earns its keep: "mass times" is the single most
 * common search that brings a stranger to a parish website, and until now the times lived only
 * in prose. They are marked up as `Event`s with a `Schedule`, which is how a recurring service
 * with no fixed end date is expressed in schema.org.
 */
import { site } from '../data/site';
import { serviceTimes, type ServiceTime } from '../data/serviceTimes';

export const CHURCH_ID = `${site.url}/#church`;
export const WEBSITE_ID = `${site.url}/#website`;

/** Absolute URL for a site-relative path. Already-absolute URLs pass through untouched. */
export function abs(pathOrUrl: string): string {
  return /^https?:\/\//.test(pathOrUrl) ? pathOrUrl : new URL(pathOrUrl, site.url).href;
}

// ─── Times and recurrence ────────────────────────────────────────────────────────────────────

const DAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

const ORDINALS: Record<string, number> = { first: 1, second: 2, third: 3, fourth: 4, last: -1 };

/**
 * "10.30am" → "10:30", "6.00pm" → "18:00", "12.00pm" → "12:00", "12.30am" → "00:30".
 * Returns null for anything it cannot read confidently — a wrong time in structured data is
 * worse than none, because Google may show it.
 */
export function parseTime(input: string): string | null {
  const m = input.trim().toLowerCase().match(/^(\d{1,2})[.:](\d{2})\s*(am|pm)?$/);
  if (!m) return null;
  let hour = Number(m[1]);
  const minute = Number(m[2]);
  const meridiem = m[3];
  if (hour > 23 || minute > 59) return null;
  if (meridiem === 'pm' && hour < 12) hour += 12;
  if (meridiem === 'am' && hour === 12) hour = 0;
  if (!meridiem && hour > 23) return null;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

export interface Recurrence {
  /** schema.org day URLs, e.g. https://schema.org/Sunday */
  byDay: string[];
  /** Week of the month for "first Sunday of the month" patterns; -1 means "last". */
  byMonthWeek?: number;
  repeatFrequency: 'P1W' | 'P1M';
}

/**
 * Reads the editor-written `when` free text ("first Sunday of the month", "Wednesdays",
 * "Tuesday, Wednesday, and Thursday") into a recurrence.
 *
 * `when` is deliberately free text so the CMS stays friendly, which means this parser must be
 * conservative: it returns null unless it recognises at least one day name, and the caller then
 * omits the schedule rather than guessing. `defaultDay` covers the Sunday rows, whose `when` is
 * empty because "Sundays" is implied by the heading they sit under.
 */
export function parseWhen(when: string | undefined, defaultDay?: string): Recurrence | null {
  const text = (when ?? '').toLowerCase();

  const byDay = DAYS.filter((d) => text.includes(d.toLowerCase())).map((d) => `https://schema.org/${d}`);

  if (byDay.length === 0) {
    if (!defaultDay) return null;
    byDay.push(`https://schema.org/${defaultDay}`);
  }

  // "first Sunday of the month" / "last Thursday of the month"
  const ordinal = Object.keys(ORDINALS).find((word) => new RegExp(`\\b${word}\\b`).test(text));
  if (ordinal && /month/.test(text)) {
    return { byDay, byMonthWeek: ORDINALS[ordinal], repeatFrequency: 'P1M' };
  }

  return { byDay, repeatFrequency: 'P1W' };
}

// ─── Nodes ───────────────────────────────────────────────────────────────────────────────────

/** The parish itself — one node, referenced by `@id` from everything else. */
function churchNode(): Record<string, unknown> {
  return {
    '@type': 'Church',
    '@id': CHURCH_ID,
    name: site.name,
    alternateName: site.shortName,
    description: site.tagline,
    url: site.url,
    telephone: site.phoneIntl,
    email: site.emails.office,
    image: abs('/images/og-default.jpg'),
    logo: abs('/favicon.svg'),
    hasMap: `https://www.google.com/maps/search/?api=1&query=${site.geo.lat},${site.geo.lng}`,
    address: {
      '@type': 'PostalAddress',
      streetAddress: site.address.street,
      addressLocality: site.address.area,
      addressRegion: site.address.city,
      postalCode: site.address.postcode,
      addressCountry: 'GB',
    },
    geo: { '@type': 'GeoCoordinates', latitude: site.geo.lat, longitude: site.geo.lng },
    areaServed: [
      { '@type': 'Place', name: 'Pitshanger, Ealing' },
      { '@type': 'Place', name: 'Ealing, London' },
    ],
    parentOrganization: {
      '@type': 'Organization',
      name: 'Diocese of London',
      url: 'https://www.london.anglican.org/',
    },
    sameAs: [site.social.facebook, site.social.instagram, site.social.youtube].filter(Boolean),
    isAccessibleForFree: true,
    publicAccess: true,
  };
}

/** The site as a searchable thing, so a sitelinks search box has something to bind to. */
function websiteNode(): Record<string, unknown> {
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    url: site.url,
    name: site.name,
    inLanguage: 'en-GB',
    publisher: { '@id': CHURCH_ID },
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: `${site.url}/search/?q={search_term_string}` },
      'query-input': 'required name=search_term_string',
    },
  };
}

/**
 * One `Event` per standing service. Services without a readable time or day are dropped rather
 * than emitted half-formed.
 */
export function serviceEventNodes(): Record<string, unknown>[] {
  const build = (s: ServiceTime, defaultDay?: string): Record<string, unknown> | null => {
    const startTime = parseTime(s.time);
    const recurrence = parseWhen(s.when, defaultDay);
    if (!startTime || !recurrence) return null;

    const detail = [s.when, s.note].filter(Boolean).join(' — ');
    return {
      '@type': 'Event',
      '@id': `${site.url}/#service-${slugify(s.name)}`,
      name: s.name,
      description: s.description ?? (detail || s.name),
      eventStatus: 'https://schema.org/EventScheduled',
      eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
      isAccessibleForFree: true,
      location: { '@id': CHURCH_ID },
      organizer: { '@id': CHURCH_ID },
      eventSchedule: {
        '@type': 'Schedule',
        byDay: recurrence.byDay,
        ...(recurrence.byMonthWeek !== undefined ? { byMonthWeek: recurrence.byMonthWeek } : {}),
        repeatFrequency: recurrence.repeatFrequency,
        startTime,
        scheduleTimezone: 'Europe/London',
      },
    };
  };

  return [
    ...serviceTimes.sundays.map((s) => build(s, 'Sunday')),
    ...serviceTimes.weekdays.map((s) => build(s)),
  ].filter((n): n is Record<string, unknown> => n !== null);
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// ─── Breadcrumbs ─────────────────────────────────────────────────────────────────────────────

export interface Crumb {
  label: string;
  href: string;
}

export function breadcrumbListNode(crumbs: Crumb[]): Record<string, unknown> | null {
  if (crumbs.length < 2) return null;
  return {
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.label,
      item: abs(c.href),
    })),
  };
}

// ─── The graph ───────────────────────────────────────────────────────────────────────────────

export interface GraphOptions {
  /** Emit the standing-service `Event` nodes — worship pages and the homepage only. */
  services?: boolean;
  crumbs?: Crumb[];
  /** Page-specific nodes (a BlogPosting, a list of one-off Events) to fold into the graph. */
  extra?: unknown[];
}

/**
 * The single `<script type="application/ld+json">` payload for a page. Everything lives in one
 * graph so the nodes can reference each other by `@id` instead of repeating the parish details.
 */
export function siteJsonLd({ services = false, crumbs = [], extra = [] }: GraphOptions = {}): Record<
  string,
  unknown
> {
  const graph: unknown[] = [churchNode(), websiteNode()];
  if (services) graph.push(...serviceEventNodes());
  const breadcrumbs = breadcrumbListNode(crumbs);
  if (breadcrumbs) graph.push(breadcrumbs);
  graph.push(...extra);
  return { '@context': 'https://schema.org', '@graph': graph };
}
