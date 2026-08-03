import { describe, it, expect } from 'vitest';
import ical from 'node-ical';
import {
  civilFromDateOnly,
  utcMidnightOfDateOnly,
  collapseSeries,
  describeRepeat,
  describeWhen,
  expandOccurrences,
  foldIcsLine,
  formatCivilRange,
  formatClockTime,
  groupByMonth,
  mergeEvents,
  nextOccurrence,
  parseClockTime,
  toIcs,
  toLondonCivil,
  upcomingEvents,
  type EventEntry,
  type SiteEvent,
} from './events';

/** A minimal events collection entry, in the style of history.test.ts. */
const entry = (id: string, data: Record<string, unknown>): EventEntry =>
  ({
    id,
    data: {
      category: 'Worship',
      repeat: 'none',
      featured: false,
      draft: false,
      ...data,
      start: new Date(`${data.start}T00:00:00Z`),
      ...(data.end ? { end: new Date(`${data.end}T00:00:00Z`) } : {}),
      ...(data.repeatUntil ? { repeatUntil: new Date(`${data.repeatUntil}T00:00:00Z`) } : {}),
    },
  }) as never;

const event = (over: Partial<SiteEvent> = {}): SiteEvent => ({
  id: over.id ?? 'e',
  seriesId: over.seriesId ?? over.id ?? 'e',
  title: 'An event',
  start: new Date('2026-06-07T00:00:00Z'),
  date: '2026-06-07',
  allDay: true,
  category: 'Worship',
  featured: false,
  source: 'cms',
  ...over,
});

describe('civil dates', () => {
  it('reads a date-only field from its UTC parts', () => {
    expect(civilFromDateOnly(new Date('2026-06-07T00:00:00Z'))).toBe('2026-06-07');
  });

  it('re-stamps a local-midnight date-only value without losing a day', () => {
    // What node-ical hands back for DTSTART;VALUE=DATE:20260904 under Europe/London in BST:
    // local midnight, which is 23:00Z on the 3rd. Reading UTC parts directly would say the 3rd.
    const localMidnight = new Date(2026, 8, 4, 0, 0, 0);
    expect(civilFromDateOnly(utcMidnightOfDateOnly(localMidnight))).toBe('2026-09-04');
    // Already at UTC midnight in a UTC-or-behind zone: must pass through unchanged.
    expect(utcMidnightOfDateOnly(new Date(2026, 8, 4)).toISOString()).toBe(
      '2026-09-04T00:00:00.000Z'
    );
  });

  it('files a late-evening summer instant on the London day, not the UTC one', () => {
    // 2026-08-15 23:30 BST is 22:30Z — still the 15th here, the 15th in UTC too.
    expect(toLondonCivil(new Date('2026-08-15T22:30:00Z')).date).toBe('2026-08-15');
    // 2026-08-15 00:30 BST is 2026-08-14 23:30Z — UTC would wrongly say the 14th.
    const late = toLondonCivil(new Date('2026-08-14T23:30:00Z'));
    expect(late.date).toBe('2026-08-15');
    expect(late.time).toBe('00:30');
  });

  it('keeps winter instants on the same day', () => {
    expect(toLondonCivil(new Date('2026-01-15T23:30:00Z'))).toEqual({
      date: '2026-01-15',
      time: '23:30',
    });
  });

  it('formats a range within a month compactly, and across months in full', () => {
    expect(formatCivilRange('2026-09-04', '2026-09-06')).toBe('4–6 September');
    expect(formatCivilRange('2026-09-30', '2026-10-02')).toBe('30 September – 2 October');
    expect(formatCivilRange('2026-09-04', '2026-09-04')).toBe('4 September');
  });
});

describe('parseClockTime', () => {
  it('reads the ways an editor writes a time', () => {
    expect(parseClockTime('10.30am')).toEqual({ h: 10, m: 30 });
    expect(parseClockTime('6pm')).toEqual({ h: 18, m: 0 });
    expect(parseClockTime('12.30pm')).toEqual({ h: 12, m: 30 });
    expect(parseClockTime('12am')).toEqual({ h: 0, m: 0 });
    expect(parseClockTime('12pm')).toEqual({ h: 12, m: 0 });
    expect(parseClockTime('18:00')).toEqual({ h: 18, m: 0 });
    expect(parseClockTime(' 7.30 PM ')).toEqual({ h: 19, m: 30 });
  });

  it('gives up rather than guessing', () => {
    for (const bad of [undefined, '', 'teatime', 'after the Mass', '25:00', '10.75am', '13pm']) {
      expect(parseClockTime(bad)).toBeUndefined();
    }
  });

  it('round-trips back to house style', () => {
    expect(formatClockTime('10:30')).toBe('10.30am');
    expect(formatClockTime('18:00')).toBe('6pm');
    expect(formatClockTime('00:00')).toBe('12am');
  });
});

describe('describeRepeat', () => {
  const start = new Date('2026-08-11T00:00:00Z'); // the second Tuesday of August 2026

  it('says nothing for a one-off', () => {
    expect(describeRepeat({ start, repeat: 'none' })).toBeUndefined();
    expect(describeRepeat({ start })).toBeUndefined();
  });

  it('describes each pattern in plain English', () => {
    expect(describeRepeat({ start, repeat: 'weekly' })).toBe('Every Tuesday');
    expect(describeRepeat({ start, repeat: 'fortnightly' })).toBe('Every other Tuesday');
    expect(describeRepeat({ start, repeat: 'monthly' })).toBe(
      'The second Tuesday of the month'
    );
  });

  it('adds the end date when there is one', () => {
    expect(
      describeRepeat({ start, repeat: 'weekly', repeatUntil: new Date('2026-12-17T00:00:00Z') })
    ).toBe('Every Tuesday, until 17 December');
  });
});

describe('expandOccurrences', () => {
  const window = { from: '2026-07-01', to: '2026-12-31' };

  it('returns a single date for a one-off', () => {
    const out = expandOccurrences(entry('one', { title: 'Feast', start: '2026-08-15' }), window);
    expect(out.map((e) => e.date)).toEqual(['2026-08-15']);
    // A one-off keeps a clean id, not a dated one.
    expect(out[0].id).toBe('one');
  });

  it('steps weekly and fortnightly, stopping at repeatUntil', () => {
    const weekly = expandOccurrences(
      entry('w', { title: 'Pantry', start: '2026-07-02', repeat: 'weekly', repeatUntil: '2026-07-30' }),
      window
    );
    expect(weekly.map((e) => e.date)).toEqual([
      '2026-07-02',
      '2026-07-09',
      '2026-07-16',
      '2026-07-23',
      '2026-07-30',
    ]);

    const fortnightly = expandOccurrences(
      entry('f', { title: 'Group', start: '2026-07-02', repeat: 'fortnightly', repeatUntil: '2026-08-01' }),
      window
    );
    expect(fortnightly.map((e) => e.date)).toEqual(['2026-07-02', '2026-07-16', '2026-07-30']);
  });

  it('keeps the weekday and its ordinal for a monthly repeat', () => {
    const out = expandOccurrences(
      entry('m', { title: 'Café', start: '2026-08-11', repeat: 'monthly' }),
      { from: '2026-08-01', to: '2027-01-31' }
    );
    // The second Tuesday of each month.
    expect(out.map((e) => e.date)).toEqual([
      '2026-08-11',
      '2026-09-08',
      '2026-10-13',
      '2026-11-10',
      '2026-12-08',
      '2027-01-12',
    ]);
  });

  it('skips months with no fifth occurrence of the weekday', () => {
    // 29 July 2026 is the fifth Wednesday. September 2026 has only four.
    const out = expandOccurrences(
      entry('m5', { title: 'Fifth', start: '2026-07-29', repeat: 'monthly' }),
      { from: '2026-07-01', to: '2026-10-31' }
    );
    expect(out.map((e) => e.date)).toEqual(['2026-07-29', '2026-09-30']);
  });

  it('fills the window for an open-ended series rather than truncating it', () => {
    const out = expandOccurrences(
      entry('open', { title: 'Ongoing', start: '2026-07-02', repeat: 'weekly' }),
      { from: '2026-07-01', to: '2026-08-31' }
    );
    expect(out).toHaveLength(9);
    expect(out.at(-1)!.date).toBe('2026-08-27');
  });

  it('carries a multi-day span onto every occurrence, and drops ones before the window', () => {
    const out = expandOccurrences(
      entry('span', { title: 'Retreat', start: '2026-07-03', end: '2026-07-05', repeat: 'weekly', repeatUntil: '2026-07-17' }),
      { from: '2026-07-10', to: '2026-12-31' }
    );
    expect(out.map((e) => [e.date, e.endDate])).toEqual([
      ['2026-07-10', '2026-07-12'],
      ['2026-07-17', '2026-07-19'],
    ]);
  });
});

describe('nextOccurrence', () => {
  it('picks the first occurrence that has not finished', () => {
    const series = entry('s', { title: 'Café', start: '2026-07-02', repeat: 'weekly' });
    expect(nextOccurrence(series, '2026-07-20')!.date).toBe('2026-07-23');
    expect(nextOccurrence(series, '2026-07-23')!.date).toBe('2026-07-23');
  });

  it('returns undefined once a series has ended', () => {
    const ended = entry('e', {
      title: 'Course',
      start: '2026-01-06',
      repeat: 'weekly',
      repeatUntil: '2026-02-10',
    });
    expect(nextOccurrence(ended, '2026-07-26')).toBeUndefined();
  });

  it('tags a repeating occurrence with its recurrence wording, a one-off with none', () => {
    const series = entry('s', { title: 'Café', start: '2026-07-02', repeat: 'weekly' });
    expect(nextOccurrence(series, '2026-07-01')!.recurrenceText).toBe('Every Thursday');
    const once = entry('o', { title: 'Feast', start: '2026-08-15' });
    expect(nextOccurrence(once, '2026-07-01')!.recurrenceText).toBeUndefined();
  });
});

describe('mergeEvents', () => {
  it('drops a feed event the CMS already describes, and keeps the editor version', () => {
    const cms = [event({ id: 'c', title: 'Corpus Christi', description: 'Sung Mass at 10.30am.' })];
    const feed = [event({ id: 'f', title: 'corpus christi!', source: 'feed' })];
    const merged = mergeEvents(cms, feed);
    expect(merged).toHaveLength(1);
    expect(merged[0].source).toBe('cms');
    expect(merged[0].description).toBe('Sung Mass at 10.30am.');
  });

  it('keeps a feed event that only looks similar', () => {
    const cms = [event({ id: 'c', title: 'Corpus Christi' })];
    const feed = [event({ id: 'f', title: 'Corpus Christi Procession', source: 'feed' })];
    expect(mergeEvents(cms, feed)).toHaveLength(2);
  });

  it('keeps the same title on a different day', () => {
    const cms = [event({ id: 'c', title: 'Said Mass', date: '2026-06-07' })];
    const feed = [event({ id: 'f', title: 'Said Mass', date: '2026-06-14', source: 'feed' })];
    expect(mergeEvents(cms, feed)).toHaveLength(2);
  });

  it('sorts by date, then by time within the day', () => {
    const merged = mergeEvents(
      [
        event({ id: 'b', title: 'Evensong', date: '2026-06-14', time: '18:00' }),
        event({ id: 'a', title: 'Corpus Christi', date: '2026-06-07' }),
      ],
      [event({ id: 'c', title: 'Sung Mass', date: '2026-06-14', time: '10:30', source: 'feed' })]
    );
    expect(merged.map((e) => e.id)).toEqual(['a', 'c', 'b']);
  });
});

describe('upcomingEvents', () => {
  it('keeps an event that is still running today', () => {
    const running = event({ id: 'r', date: '2026-07-24', endDate: '2026-07-28' });
    expect(upcomingEvents([running], '2026-07-26')).toHaveLength(1);
  });

  it('keeps today, drops yesterday', () => {
    const events = [event({ id: 'today', date: '2026-07-26' }), event({ id: 'past', date: '2026-07-25' })];
    expect(upcomingEvents(events, '2026-07-26').map((e) => e.id)).toEqual(['today']);
  });
});

describe('collapseSeries', () => {
  it('keeps only the first occurrence of each series', () => {
    const events = [
      event({ id: 'a@1', seriesId: 'a', date: '2026-07-02' }),
      event({ id: 'b@1', seriesId: 'b', date: '2026-07-03' }),
      event({ id: 'a@2', seriesId: 'a', date: '2026-07-09' }),
    ];
    expect(collapseSeries(events).map((e) => e.id)).toEqual(['a@1', 'b@1']);
  });
});

describe('groupByMonth', () => {
  it('groups under UK month headings, in order', () => {
    const groups = groupByMonth([
      event({ id: 'a', date: '2026-07-30' }),
      event({ id: 'b', date: '2026-08-11' }),
      event({ id: 'c', date: '2026-08-15' }),
      event({ id: 'd', date: '2027-01-06' }),
    ]);
    expect(groups.map((g) => g.label)).toEqual(['July 2026', 'August 2026', 'January 2027']);
    expect(groups.map((g) => g.key)).toEqual(['2026-07', '2026-08', '2027-01']);
    expect(groups[1].events.map((e) => e.id)).toEqual(['b', 'c']);
  });
});

describe('describeWhen', () => {
  it('reads as the parish would say it', () => {
    expect(
      describeWhen(event({ time: '19:30', endTime: '21:00', location: 'St Barnabas Church' }))
    ).toBe('7.30pm – 9pm · St Barnabas Church');
    expect(describeWhen(event({ time: '10:30' }))).toBe('10.30am');
    expect(describeWhen(event({ location: 'The small hall' }))).toBe('The small hall');
  });

  it('prefixes a multi-day range, unless the date is shown alongside', () => {
    const retreat = event({ date: '2026-09-04', endDate: '2026-09-06', location: 'Church' });
    expect(describeWhen(retreat)).toBe('4–6 September · Church');
    expect(describeWhen(retreat, { includeDate: false })).toBe('Church');
  });
});

describe('foldIcsLine', () => {
  it('leaves a short line alone', () => {
    expect(foldIcsLine('SUMMARY:Corpus Christi')).toBe('SUMMARY:Corpus Christi');
  });

  it('folds at 75 octets with a leading space on continuations', () => {
    const folded = foldIcsLine(`SUMMARY:${'a'.repeat(200)}`);
    const lines = folded.split('\r\n');
    expect(lines.length).toBeGreaterThan(1);
    expect(Buffer.from(lines[0], 'utf8').length).toBe(75);
    for (const line of lines.slice(1)) {
      expect(line.startsWith(' ')).toBe(true);
      expect(Buffer.from(line, 'utf8').length).toBeLessThanOrEqual(75);
    }
    expect(folded.replace(/\r\n /g, '')).toBe(`SUMMARY:${'a'.repeat(200)}`);
  });

  it('never splits a multi-byte character', () => {
    const folded = foldIcsLine(`SUMMARY:${'é'.repeat(80)}`);
    expect(folded.replace(/\r\n /g, '')).toBe(`SUMMARY:${'é'.repeat(80)}`);
    expect(folded).not.toContain('�');
  });
});

describe('toIcs', () => {
  const opts = { now: new Date('2026-07-26T09:00:00Z'), siteUrl: 'https://www.barnabites.org' };

  it('writes an all-day event with an exclusive DTEND', () => {
    const ics = toIcs([event({ id: 'corpus', date: '2026-06-07' })], opts);
    expect(ics).toContain('DTSTART;VALUE=DATE:20260607');
    expect(ics).toContain('DTEND;VALUE=DATE:20260608');
  });

  it('writes a timed event against Europe/London, with the timezone defined', () => {
    const ics = toIcs([event({ id: 't', date: '2026-08-15', time: '19:30', allDay: false })], opts);
    expect(ics).toContain('BEGIN:VTIMEZONE');
    expect(ics).toContain('TZID:Europe/London');
    expect(ics).toContain('DTSTART;TZID=Europe/London:20260815T193000');
    // No explicit finish time — default to an hour.
    expect(ics).toContain('DTEND;TZID=Europe/London:20260815T203000');
  });

  it('escapes commas, semicolons and newlines', () => {
    const ics = toIcs(
      [event({ id: 'e', title: 'Nine Lessons, and Carols', description: 'One;\ntwo' })],
      opts
    );
    expect(ics).toContain('SUMMARY:Nine Lessons\\, and Carols');
    expect(ics).toContain('DESCRIPTION:One\\;\\ntwo');
  });

  it('gives every occurrence a stable, distinct UID on the site host', () => {
    const ics = toIcs(
      [
        event({ id: 'cafe@2026-07-02', seriesId: 'cafe', date: '2026-07-02' }),
        event({ id: 'cafe@2026-07-09', seriesId: 'cafe', date: '2026-07-09' }),
      ],
      opts
    );
    const uids = [...ics.matchAll(/^UID:(.+)$/gm)].map((m) => m[1].trim());
    expect(uids).toEqual([
      'cafe@2026-07-02@www.barnabites.org',
      'cafe@2026-07-09@www.barnabites.org',
    ]);
    expect(new Set(uids).size).toBe(2);
  });

  it('makes a relative event link absolute', () => {
    const ics = toIcs([event({ id: 'e', url: '/news/carols/' })], opts);
    expect(ics).toContain('URL:https://www.barnabites.org/news/carols/');
  });

  it('produces a calendar node-ical can read back', () => {
    const ics = toIcs(
      [
        event({
          id: 'patronal',
          title: 'St Barnabas — Patronal Festival, with Evensong',
          date: '2026-06-11',
          time: '10:30',
          allDay: false,
          location: 'St Barnabas Church',
          description: 'We keep our patronal festival; all are welcome.',
          category: 'Worship',
        }),
        event({ id: 'corpus', title: 'Corpus Christi', date: '2026-06-07' }),
      ],
      opts
    );

    const parsed = ical.parseICS(ics);
    const events = Object.values(parsed).filter((v: any) => v.type === 'VEVENT') as any[];
    expect(events).toHaveLength(2);

    const patronal = events.find((e) => e.uid.startsWith('patronal'))!;
    expect(patronal.summary).toBe('St Barnabas — Patronal Festival, with Evensong');
    expect(patronal.location).toBe('St Barnabas Church');
    expect(patronal.description).toBe('We keep our patronal festival; all are welcome.');
    // 10.30 London in June is 09.30Z — the point of shipping a VTIMEZONE.
    expect(patronal.start.toISOString()).toBe('2026-06-11T09:30:00.000Z');

    const corpus = events.find((e) => e.uid.startsWith('corpus'))!;
    expect(corpus.datetype).toBe('date');
    // node-ical hands back VALUE=DATE at *local* midnight, so it must be re-stamped before
    // civilFromDateOnly reads UTC parts off it — see utcMidnightOfDateOnly.
    expect(civilFromDateOnly(utcMidnightOfDateOnly(corpus.start))).toBe('2026-06-07');
  });
});
