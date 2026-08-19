import { describe, it, expect } from 'vitest';
import { mergeCalendarEvents, parseIcsEvents, type CalendarEvent } from './events-client';

/** Wrap VEVENT bodies in a calendar envelope (the parser accepts LF and CRLF alike). */
const ics = (...events: string[]) =>
  [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'X-WR-TIMEZONE:Europe/London',
    ...events.flatMap((e) => ['BEGIN:VEVENT', e, 'END:VEVENT']),
    'END:VCALENDAR',
  ].join('\n');

describe('parseIcsEvents', () => {
  it('reads a timed UTC event into London civil date and time (summer)', () => {
    const out = parseIcsEvents(
      ics('UID:1\nDTSTART:20260621T093000Z\nDTEND:20260621T104500Z\nSUMMARY:Sunday Mass')
    );
    expect(out).toEqual([
      {
        date: '2026-06-21',
        endDate: undefined,
        time: '10:30',
        endTime: '11:45',
        allDay: false,
        title: 'Sunday Mass',
        category: 'Worship',
        location: undefined,
        url: undefined,
        source: 'feed',
      },
    ]);
  });

  it('unfolds continuation lines and unescapes text', () => {
    const out = parseIcsEvents(
      ics(
        'UID:2\nDTSTART:20261129T160000Z\nSUMMARY:Choral Evensong\nLOCATION:St Barnabas Chur\r\n ch\\, Pitshanger Lane'
      )
    );
    expect(out[0].location).toBe('St Barnabas Church, Pitshanger Lane');
  });

  it('reads an all-day event, stepping the exclusive DTEND back a day', () => {
    const out = parseIcsEvents(
      ics('UID:3\nDTSTART;VALUE=DATE:20260904\nDTEND;VALUE=DATE:20260907\nSUMMARY:Flower Festival')
    );
    expect(out[0]).toMatchObject({
      date: '2026-09-04',
      endDate: '2026-09-06',
      allDay: true,
      time: undefined,
    });
  });

  it('reads a TZID-local stamp as London civil time directly', () => {
    const out = parseIcsEvents(
      ics('UID:4\nDTSTART;TZID=Europe/London:20260912T193000\nSUMMARY:Organ recital\nCATEGORIES:Concert')
    );
    expect(out[0]).toMatchObject({ date: '2026-09-12', time: '19:30', category: 'Music' });
  });

  it('skips cancelled events and anything without a start', () => {
    const out = parseIcsEvents(
      ics(
        'UID:5\nDTSTART:20260921T100000Z\nSTATUS:CANCELLED\nSUMMARY:Cancelled thing',
        'UID:6\nSUMMARY:No start',
        'UID:7\nDTSTART:20260922T100000Z\nSTATUS:CONFIRMED\nSUMMARY:Kept'
      )
    );
    expect(out.map((e) => e.title)).toEqual(['Kept']);
  });

  it('refuses a document with RRULE series rather than losing their repeats', () => {
    expect(() =>
      parseIcsEvents(
        ics('UID:9\nDTSTART:20260903T140000Z\nRRULE:FREQ=WEEKLY;BYDAY=TH\nSUMMARY:Memory Café')
      )
    ).toThrow(/recurring/);
    // The VTIMEZONE block's own RRULEs must not trip the guard.
    expect(
      parseIcsEvents(
        'BEGIN:VCALENDAR\nBEGIN:VTIMEZONE\nRRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU\nEND:VTIMEZONE\n' +
          'BEGIN:VEVENT\nUID:10\nDTSTART:20260903T140000Z\nSUMMARY:One-off\nEND:VEVENT\nEND:VCALENDAR'
      )
    ).toHaveLength(1);
  });

  it('keeps only http(s) URLs', () => {
    const out = parseIcsEvents(
      ics('UID:8\nDTSTART:20260922T100000Z\nSUMMARY:X\nURL:https://www.barnabites.org/b/x-8')
    );
    expect(out[0].url).toBe('https://www.barnabites.org/b/x-8');
  });
});

describe('mergeCalendarEvents', () => {
  const ev = (over: Partial<CalendarEvent>): CalendarEvent => ({
    date: '2026-09-12',
    allDay: false,
    title: 'Organ recital',
    category: 'Music',
    source: 'feed',
    ...over,
  });

  it('lets a CMS event win over a feed event of the same title on the same day', () => {
    const cms = [ev({ source: 'cms', url: '/news/recital', time: '19:30' })];
    const feed = [ev({ time: '19:30' }), ev({ date: '2026-10-01', time: '19:30' })];
    const out = mergeCalendarEvents(cms, feed);
    expect(out).toHaveLength(2);
    expect(out[0].source).toBe('cms');
  });

  it('sorts by date, then time, then title', () => {
    const out = mergeCalendarEvents(
      [],
      [
        ev({ date: '2026-09-13', time: '08:00', title: 'B' }),
        ev({ date: '2026-09-12', time: '19:30' }),
        ev({ date: '2026-09-13', time: '08:00', title: 'A' }),
      ]
    );
    expect(out.map((e) => `${e.date} ${e.title}`)).toEqual([
      '2026-09-12 Organ recital',
      '2026-09-13 A',
      '2026-09-13 B',
    ]);
  });
});
