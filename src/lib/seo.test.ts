import { describe, expect, it } from 'vitest';
import {
  CHURCH_ID,
  WEBSITE_ID,
  abs,
  breadcrumbListNode,
  parseTime,
  parseWhen,
  serviceEventNodes,
  siteJsonLd,
} from './seo';

describe('parseTime', () => {
  it('reads the house time format', () => {
    expect(parseTime('10.30am')).toBe('10:30');
    expect(parseTime('8.00am')).toBe('08:00');
    expect(parseTime('6.00pm')).toBe('18:00');
    expect(parseTime('9.30am')).toBe('09:30');
  });

  it('handles the midday and midnight edges', () => {
    expect(parseTime('12.00pm')).toBe('12:00');
    expect(parseTime('12.30am')).toBe('00:30');
  });

  it('tolerates a colon and stray spacing', () => {
    expect(parseTime(' 10:30 am ')).toBe('10:30');
  });

  it('returns null rather than guess at anything unreadable', () => {
    expect(parseTime('after the Memory Café')).toBeNull();
    expect(parseTime('10.30')).toBe('10:30'); // 24-hour, unambiguous
    expect(parseTime('25.00')).toBeNull();
    expect(parseTime('10.75am')).toBeNull();
    expect(parseTime('')).toBeNull();
  });
});

describe('parseWhen', () => {
  it('reads a weekly day name', () => {
    expect(parseWhen('Wednesdays')).toEqual({
      byDay: ['https://schema.org/Wednesday'],
      repeatFrequency: 'P1W',
    });
  });

  it('reads several day names in one phrase', () => {
    expect(parseWhen('Tuesday, Wednesday, and Thursday')?.byDay).toEqual([
      'https://schema.org/Tuesday',
      'https://schema.org/Wednesday',
      'https://schema.org/Thursday',
    ]);
  });

  it('reads a monthly ordinal', () => {
    expect(parseWhen('first Sunday of the month')).toEqual({
      byDay: ['https://schema.org/Sunday'],
      byMonthWeek: 1,
      repeatFrequency: 'P1M',
    });
  });

  it('reads "last … of the month" as -1', () => {
    expect(parseWhen('last Thursday of the month')?.byMonthWeek).toBe(-1);
  });

  it('uses the default day when the editor left `when` blank', () => {
    expect(parseWhen('', 'Sunday')).toEqual({
      byDay: ['https://schema.org/Sunday'],
      repeatFrequency: 'P1W',
    });
    expect(parseWhen(undefined, 'Sunday')?.byDay).toEqual(['https://schema.org/Sunday']);
  });

  it('returns null when there is no day to be found and no default', () => {
    expect(parseWhen('by arrangement')).toBeNull();
    expect(parseWhen('')).toBeNull();
  });

  it('does not treat an ordinal without "month" as monthly', () => {
    expect(parseWhen('first Wednesday after Easter')?.repeatFrequency).toBe('P1W');
  });
});

describe('serviceEventNodes', () => {
  const nodes = serviceEventNodes();

  it('marks up every standing service in serviceTimes.json', () => {
    expect(nodes.length).toBeGreaterThanOrEqual(6);
  });

  it('gives the Sung Mass a weekly Sunday schedule at 10:30 London time', () => {
    const mass = nodes.find((n) => n.name === 'Sung Mass');
    expect(mass?.eventSchedule).toMatchObject({
      '@type': 'Schedule',
      byDay: ['https://schema.org/Sunday'],
      repeatFrequency: 'P1W',
      startTime: '10:30',
      scheduleTimezone: 'Europe/London',
    });
  });

  it('marks Choral Evensong as the first Sunday of the month', () => {
    const evensong = nodes.find((n) => n.name === 'Choral Evensong');
    expect(evensong?.eventSchedule).toMatchObject({ byMonthWeek: 1, repeatFrequency: 'P1M' });
  });

  it('points every service at the parish by @id rather than repeating the address', () => {
    for (const node of nodes) {
      expect(node.location).toEqual({ '@id': CHURCH_ID });
      expect(node.organizer).toEqual({ '@id': CHURCH_ID });
    }
  });

  it('gives each service a stable, unique @id', () => {
    const ids = nodes.map((n) => n['@id']);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain('https://www.barnabites.org/#service-sung-mass');
  });
});

describe('breadcrumbListNode', () => {
  it('emits nothing for a trail of one — a lone "Home" is not a breadcrumb', () => {
    expect(breadcrumbListNode([{ label: 'Home', href: '/' }])).toBeNull();
  });

  it('numbers positions from 1 and makes every item absolute', () => {
    const node = breadcrumbListNode([
      { label: 'Home', href: '/' },
      { label: 'Worship', href: '/worship' },
    ]);
    expect(node).toEqual({
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.barnabites.org/' },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Worship',
          item: 'https://www.barnabites.org/worship',
        },
      ],
    });
  });
});

describe('abs', () => {
  it('makes a site path absolute', () => {
    expect(abs('/images/og-default.jpg')).toBe('https://www.barnabites.org/images/og-default.jpg');
  });

  it('leaves an absolute URL alone', () => {
    expect(abs('https://example.org/a.png')).toBe('https://example.org/a.png');
  });
});

describe('siteJsonLd', () => {
  it('always carries the church and the website, linked by @id', () => {
    const graph = siteJsonLd()['@graph'] as Record<string, unknown>[];
    expect(graph.map((n) => n['@id'])).toEqual([CHURCH_ID, WEBSITE_ID]);
    expect(graph[1].publisher).toEqual({ '@id': CHURCH_ID });
  });

  it('omits service nodes unless the page asks for them', () => {
    const plain = siteJsonLd()['@graph'] as Record<string, unknown>[];
    const worship = siteJsonLd({ services: true })['@graph'] as Record<string, unknown>[];
    expect(plain.some((n) => n['@type'] === 'Event')).toBe(false);
    expect(worship.some((n) => n['@type'] === 'Event')).toBe(true);
  });

  it('folds breadcrumbs and page-specific nodes into the one graph', () => {
    const graph = siteJsonLd({
      crumbs: [
        { label: 'Home', href: '/' },
        { label: 'News', href: '/news' },
      ],
      extra: [{ '@type': 'BlogPosting', headline: 'Plant Sale' }],
    })['@graph'] as Record<string, unknown>[];
    expect(graph.map((n) => n['@type'])).toContain('BreadcrumbList');
    expect(graph.map((n) => n['@type'])).toContain('BlogPosting');
  });

  it('describes the parish once, with the details a local search needs', () => {
    const church = (siteJsonLd()['@graph'] as Record<string, unknown>[])[0];
    expect(church).toMatchObject({
      '@type': 'Church',
      name: 'St Barnabas Church, Ealing',
      email: 'parish.office@barnabites.org',
      telephone: '+44 20 8998 4079',
    });
    expect((church.parentOrganization as Record<string, unknown>).name).toBe('Diocese of London');
    expect(church.hasMap).toContain('google.com/maps');
  });
});
