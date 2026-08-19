import { describe, it, expect } from 'vitest';
import ical from 'node-ical';
import { DEFAULT_FEED_URLS, eventsFromCalendar, feedUrls } from './events-feed';

const VTIMEZONE = `BEGIN:VTIMEZONE
TZID:Europe/London
BEGIN:DAYLIGHT
TZOFFSETFROM:+0000
TZOFFSETTO:+0100
TZNAME:BST
DTSTART:19700329T010000
RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU
END:DAYLIGHT
BEGIN:STANDARD
TZOFFSETFROM:+0100
TZOFFSETTO:+0000
TZNAME:GMT
DTSTART:19701025T020000
RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU
END:STANDARD
END:VTIMEZONE`;

const calendar = (...events: string[]) =>
  ical.parseICS(
    ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Test//EN', VTIMEZONE, ...events, 'END:VCALENDAR'].join(
      '\r\n'
    )
  );

const WINDOW = { from: '2026-07-01', to: '2026-12-31' };

describe('feedUrls', () => {
  it('splits on commas and newlines, and trims', () => {
    expect(feedUrls({ EVENTS_ICAL_URLS: ' https://a/x.ics , https://b/y.ics ' } as never)).toEqual([
      'https://a/x.ics',
      'https://b/y.ics',
    ]);
    expect(feedUrls({ EVENTS_ICAL_URLS: 'https://a/x.ics\nhttps://b/y.ics' } as never)).toHaveLength(2);
  });

  it('rewrites webcal:// to https://', () => {
    expect(feedUrls({ EVENTS_ICAL_URLS: 'webcal://a.example/x.ics' } as never)).toEqual([
      'https://a.example/x.ics',
    ]);
  });

  it('still honours the legacy variable', () => {
    expect(feedUrls({ CHURCHDESK_ICAL_URL: 'https://old/x.ics' } as never)).toEqual([
      'https://old/x.ics',
    ]);
  });

  it("falls back to the parish's own ChurchDesk feeds when nothing is set", () => {
    const urls = feedUrls({} as never);
    expect(urls).toEqual([...DEFAULT_FEED_URLS]);
    expect(urls.length).toBe(4);
  });

  it('treats an explicitly empty variable as "no feeds" — the off-switch', () => {
    expect(feedUrls({ EVENTS_ICAL_URLS: '' } as never)).toEqual([]);
  });
});

describe('eventsFromCalendar', () => {
  it('reads a timed event into London civil date and time', () => {
    const out = eventsFromCalendar(
      calendar(
        `BEGIN:VEVENT
UID:recital@example.org
DTSTART;TZID=Europe/London:20260912T193000
DTEND;TZID=Europe/London:20260912T210000
SUMMARY:Organ recital
LOCATION:St Barnabas Church
CATEGORIES:Music
END:VEVENT`
      ),
      WINDOW
    );

    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({
      title: 'Organ recital',
      date: '2026-09-12',
      time: '19:30',
      endTime: '21:00',
      allDay: false,
      category: 'Music',
      location: 'St Barnabas Church',
      source: 'feed',
    });
  });

  it('reads an all-day event and steps back its exclusive DTEND', () => {
    const out = eventsFromCalendar(
      calendar(
        `BEGIN:VEVENT
UID:retreat@example.org
DTSTART;VALUE=DATE:20260904
DTEND;VALUE=DATE:20260907
SUMMARY:Parish retreat
END:VEVENT`
      ),
      WINDOW
    );

    expect(out[0].allDay).toBe(true);
    expect(out[0].date).toBe('2026-09-04');
    // DTEND 7 September is exclusive — the retreat's last day is the 6th.
    expect(out[0].endDate).toBe('2026-09-06');
  });

  it('expands a repeating series and honours EXDATE', () => {
    const out = eventsFromCalendar(
      calendar(
        `BEGIN:VEVENT
UID:cafe@example.org
DTSTART;TZID=Europe/London:20260806T140000
DTEND;TZID=Europe/London:20260806T160000
RRULE:FREQ=WEEKLY;BYDAY=TH;UNTIL=20260903T235959Z
EXDATE;TZID=Europe/London:20260820T140000
SUMMARY:Memory Café
END:VEVENT`
      ),
      WINDOW
    );

    expect(out.map((e) => e.date)).toEqual([
      '2026-08-06',
      '2026-08-13',
      '2026-08-27',
      '2026-09-03',
    ]);
  });

  it('keeps the duration on every occurrence, not just the first', () => {
    const out = eventsFromCalendar(
      calendar(
        `BEGIN:VEVENT
UID:cafe@example.org
DTSTART;TZID=Europe/London:20260806T140000
DTEND;TZID=Europe/London:20260806T160000
RRULE:FREQ=WEEKLY;BYDAY=TH;UNTIL=20260820T235959Z
SUMMARY:Memory Café
END:VEVENT`
      ),
      WINDOW
    );

    for (const occurrence of out) {
      expect(occurrence.time).toBe('14:00');
      expect(occurrence.endTime).toBe('16:00');
    }
  });

  it('describes the pattern in British English, not node-ical house style', () => {
    const weekly = eventsFromCalendar(
      calendar(
        `BEGIN:VEVENT
UID:w@example.org
DTSTART;TZID=Europe/London:20260806T140000
RRULE:FREQ=WEEKLY;BYDAY=TH;UNTIL=20261217T235959Z
SUMMARY:Weekly
END:VEVENT`
      ),
      WINDOW
    );
    expect(weekly[0].recurrenceText).toBe('Every Thursday, until 17 December');

    const fortnightly = eventsFromCalendar(
      calendar(
        `BEGIN:VEVENT
UID:f@example.org
DTSTART;TZID=Europe/London:20260806T140000
RRULE:FREQ=WEEKLY;INTERVAL=2;BYDAY=TH
SUMMARY:Fortnightly
END:VEVENT`
      ),
      WINDOW
    );
    expect(fortnightly[0].recurrenceText).toBe('Every other Thursday');

    const multiDay = eventsFromCalendar(
      calendar(
        `BEGIN:VEVENT
UID:m@example.org
DTSTART;TZID=Europe/London:20260803T140000
RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR
SUMMARY:Multi-day
END:VEVENT`
      ),
      WINDOW
    );
    expect(multiDay[0].recurrenceText).toBe('Every Monday, Wednesday and Friday');

    const monthly = eventsFromCalendar(
      calendar(
        `BEGIN:VEVENT
UID:m@example.org
DTSTART;TZID=Europe/London:20260811T100000
RRULE:FREQ=MONTHLY;BYDAY=2TU
SUMMARY:Monthly
END:VEVENT`
      ),
      WINDOW
    );
    expect(monthly[0].recurrenceText).toBe('The second Tuesday of the month');
  });

  it('gives each occurrence a distinct id but a shared series id', () => {
    const out = eventsFromCalendar(
      calendar(
        `BEGIN:VEVENT
UID:cafe@example.org
DTSTART;TZID=Europe/London:20260806T140000
RRULE:FREQ=WEEKLY;BYDAY=TH;UNTIL=20260813T235959Z
SUMMARY:Memory Café
END:VEVENT`
      ),
      WINDOW
    );
    expect(new Set(out.map((e) => e.seriesId)).size).toBe(1);
    expect(new Set(out.map((e) => e.id)).size).toBe(out.length);
  });

  it('drops occurrences outside the window', () => {
    const out = eventsFromCalendar(
      calendar(
        `BEGIN:VEVENT
UID:cafe@example.org
DTSTART;TZID=Europe/London:20260101T140000
RRULE:FREQ=WEEKLY;BYDAY=TH
SUMMARY:Memory Café
END:VEVENT`
      ),
      { from: '2026-07-01', to: '2026-07-31' }
    );
    expect(out).toHaveLength(5);
    for (const occurrence of out) {
      expect(occurrence.date >= '2026-07-01').toBe(true);
      expect(occurrence.date <= '2026-07-31').toBe(true);
    }
  });

  it('maps unfamiliar categories onto Worship rather than inventing one', () => {
    const out = eventsFromCalendar(
      calendar(
        `BEGIN:VEVENT
UID:x@example.org
DTSTART;VALUE=DATE:20260904
SUMMARY:Something
CATEGORIES:Parish Notices
END:VEVENT`
      ),
      WINDOW
    );
    expect(out[0].category).toBe('Worship');
  });

  it('tidies ChurchDesk machinery out of the description', () => {
    const out = eventsFromCalendar(
      calendar(
        `BEGIN:VEVENT
UID:mass@example.org
DTSTART:20260927T093000Z
DTEND:20260927T104500Z
SUMMARY:Sunday Mass
DESCRIPTION:Event URL: https://example.org/b/sunday-mass-1\\n\\n\\nRotas:\\nRea
 ders : 1st Reading: A Parishioner\\n
END:VEVENT`
      ),
      WINDOW
    );
    expect(out).toHaveLength(1);
    expect(out[0].description).toBeUndefined();
  });

  it('ignores non-event components', () => {
    const out = eventsFromCalendar(
      calendar(
        `BEGIN:VTODO
UID:t@example.org
SUMMARY:Not an event
END:VTODO`
      ),
      WINDOW
    );
    expect(out).toEqual([]);
  });
});
