import { describe, it, expect } from 'vitest';
import { easter, getLiturgicalDay, liturgicalDates, seasonLine } from './liturgy';

const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

describe('easter() — Western Computus', () => {
  // Known Gregorian Easter Sundays
  const known: Record<number, string> = {
    2000: '2000-04-23',
    2008: '2008-03-23', // very early
    2011: '2011-04-24', // very late
    2024: '2024-03-31',
    2025: '2025-04-20',
    2026: '2026-04-05',
    2027: '2027-03-28',
    2030: '2030-04-21',
    2038: '2038-04-25', // latest possible date window
  };
  for (const [year, date] of Object.entries(known)) {
    it(`Easter ${year} = ${date}`, () => {
      expect(iso(easter(Number(year)))).toBe(date);
    });
  }
});

describe('getLiturgicalDay() — season classification (2026)', () => {
  const cases: [string, Date, string][] = [
    ['New Year is Christmastide', new Date(2026, 0, 1), 'Christmastide'],
    ['Epiphany (6 Jan)', new Date(2026, 0, 6), 'Epiphany'],
    ['Mid-Jan is Epiphany season', new Date(2026, 0, 20), 'Epiphany'],
    ['Shrove Tuesday still Epiphany', new Date(2026, 1, 17), 'Epiphany'],
    ['Ash Wednesday starts Lent', new Date(2026, 1, 18), 'Lent'],
    ['Mid-Lent', new Date(2026, 2, 15), 'Lent'],
    ['Palm Sunday is Holy Week', new Date(2026, 2, 29), 'Holy Week'],
    ['Holy Saturday is Holy Week', new Date(2026, 3, 4), 'Holy Week'],
    ['Easter Sunday is Eastertide', new Date(2026, 3, 5), 'Eastertide'],
    ['Eastertide weekday', new Date(2026, 4, 1), 'Eastertide'],
    ['Day before Pentecost still Eastertide', new Date(2026, 4, 23), 'Eastertide'],
    ['Pentecost', new Date(2026, 4, 24), 'Pentecost'],
    ['After Pentecost is Ordinary Time', new Date(2026, 4, 25), 'Ordinary Time'],
    ['Today (1 Jun 2026) is Ordinary Time', new Date(2026, 5, 1), 'Ordinary Time'],
    ['Advent Sunday (29 Nov 2026)', new Date(2026, 10, 29), 'Advent'],
    ['Christmas Eve is Advent', new Date(2026, 11, 24), 'Advent'],
    ['Christmas Day is Christmastide', new Date(2026, 11, 25), 'Christmastide'],
    ['New Year Eve is Christmastide', new Date(2026, 11, 31), 'Christmastide'],
    // Christmas on a Monday: Advent 4 is Sunday 24 December, so Advent Sunday
    // is 3 December — a week later than a naive four-Sundays walk that skips
    // the 24th would give (regression test for the off-by-one fixed Aug 2026).
    ['26 Nov 2028 is not yet Advent', new Date(2028, 10, 26), 'Ordinary Time'],
    ['Advent Sunday (3 Dec 2028, Christmas on a Monday)', new Date(2028, 11, 3), 'Advent'],
    ['Advent 4 on Christmas Eve 2028 is Advent', new Date(2028, 11, 24), 'Advent'],
    // Christmas on a Sunday: Advent Sunday is 27 November.
    ['Advent Sunday (27 Nov 2033, Christmas on a Sunday)', new Date(2033, 10, 27), 'Advent'],
    ['26 Nov 2033 is not yet Advent', new Date(2033, 10, 26), 'Ordinary Time'],
  ];
  for (const [label, date, season] of cases) {
    it(label, () => {
      expect(getLiturgicalDay(date).season).toBe(season);
    });
  }
});

describe('getLiturgicalDay() — principal feasts override', () => {
  it('Ascension Day (14 May 2026)', () => {
    const d = getLiturgicalDay(new Date(2026, 4, 14));
    expect(d.feast).toBe('Ascension Day');
    expect(d.season).toBe('Eastertide');
  });
  it('Trinity Sunday (31 May 2026)', () => {
    expect(getLiturgicalDay(new Date(2026, 4, 31)).feast).toBe('Trinity Sunday');
  });
  it('St Barnabas patronal (11 Jun)', () => {
    const d = getLiturgicalDay(new Date(2026, 5, 11));
    // Renamed to the parish's printed usage (was 'Feast of St Barnabas').
    expect(d.feast).toBe('St Barnabas the Apostle');
    expect(d.key).toBe('st-barnabas-the-apostle');
  });
  it("All Saints' Day (1 Nov)", () => {
    expect(getLiturgicalDay(new Date(2026, 10, 1)).feast).toBe("All Saints' Day");
  });
});

describe('getLiturgicalDay() — added feasts (verified against published calendars, two years)', () => {
  // [label, Date, expected feast, expected season]. Movable feasts are checked in both
  // 2026 (Easter 5 Apr) and 2027 (Easter 28 Mar) per the add-feast skill.
  const cases: [string, Date, string, string][] = [
    ['Ash Wednesday 2026', new Date(2026, 1, 18), 'Ash Wednesday', 'Lent'],
    ['Ash Wednesday 2027', new Date(2027, 1, 10), 'Ash Wednesday', 'Lent'],
    ['Mothering Sunday 2026', new Date(2026, 2, 15), 'Mothering Sunday', 'Lent'],
    ['Mothering Sunday 2027', new Date(2027, 2, 7), 'Mothering Sunday', 'Lent'],
    ['Palm Sunday 2026', new Date(2026, 2, 29), 'Palm Sunday', 'Holy Week'],
    ['Palm Sunday 2027', new Date(2027, 2, 21), 'Palm Sunday', 'Holy Week'],
    ['Maundy Thursday 2026', new Date(2026, 3, 2), 'Maundy Thursday', 'Holy Week'],
    ['Maundy Thursday 2027', new Date(2027, 2, 25), 'Maundy Thursday', 'Holy Week'],
    ['Good Friday 2026', new Date(2026, 3, 3), 'Good Friday', 'Holy Week'],
    ['Good Friday 2027', new Date(2027, 2, 26), 'Good Friday', 'Holy Week'],
    ['Holy Saturday 2026', new Date(2026, 3, 4), 'Holy Saturday', 'Holy Week'],
    ['Holy Saturday 2027', new Date(2027, 2, 27), 'Holy Saturday', 'Holy Week'],
    ['Easter Day 2026', new Date(2026, 3, 5), 'Easter Day', 'Eastertide'],
    ['Easter Day 2027', new Date(2027, 2, 28), 'Easter Day', 'Eastertide'],
    ['Corpus Christi 2026 (Thu after Trinity)', new Date(2026, 5, 4), 'Corpus Christi', 'Ordinary Time'],
    ['Corpus Christi 2027', new Date(2027, 4, 27), 'Corpus Christi', 'Ordinary Time'],
    ['The Commemoration of the Faithful Departed (2 Nov)', new Date(2026, 10, 2), 'The Commemoration of the Faithful Departed', 'Ordinary Time'],
    // 11 Nov 2026 is a Wednesday → Remembrance Sunday 8 Nov (matches the parish sheet);
    // 11 Nov 2027 is a Thursday → 14 Nov.
    ['Remembrance Sunday 2026', new Date(2026, 10, 8), 'Remembrance Sunday', 'Ordinary Time'],
    ['Remembrance Sunday 2027', new Date(2027, 10, 14), 'Remembrance Sunday', 'Ordinary Time'],
    ['Christ the King 2026', new Date(2026, 10, 22), 'Christ the King', 'Ordinary Time'],
    ['Christ the King 2027', new Date(2027, 10, 21), 'Christ the King', 'Ordinary Time'],
    ['Advent Sunday 2026', new Date(2026, 10, 29), 'Advent Sunday', 'Advent'],
    ['Advent Sunday 2027', new Date(2027, 10, 28), 'Advent Sunday', 'Advent'],
    ['Christmas Eve', new Date(2026, 11, 24), 'Christmas Eve', 'Advent'],
    ['Christmas Day', new Date(2026, 11, 25), 'Christmas Day', 'Christmastide'],
    ['The Epiphany (6 Jan)', new Date(2027, 0, 6), 'The Epiphany', 'Epiphany'],
    ['Candlemas (2 Feb)', new Date(2027, 1, 2), 'Candlemas', 'Epiphany'],
  ];
  for (const [label, date, feast, season] of cases) {
    it(label, () => {
      const d = getLiturgicalDay(date);
      expect(d.feast).toBe(feast);
      expect(d.season).toBe(season);
    });
  }
  it('the day after Ash Wednesday carries no feast', () => {
    expect(getLiturgicalDay(new Date(2026, 1, 19)).feast).toBeUndefined();
  });
});

describe('liturgicalDates()', () => {
  it('2026 boundary dates as civil strings', () => {
    expect(liturgicalDates(2026)).toEqual({
      ash: '2026-02-18',
      passiontide: '2026-03-22',
      palm: '2026-03-29',
      easter: '2026-04-05',
      ascension: '2026-05-14',
      pentecost: '2026-05-24',
      trinity: '2026-05-31',
      adventStart: '2026-11-29',
      christmas: '2026-12-25',
    });
  });
  it('2027 boundary dates as civil strings', () => {
    expect(liturgicalDates(2027)).toEqual({
      ash: '2027-02-10',
      passiontide: '2027-03-14',
      palm: '2027-03-21',
      easter: '2027-03-28',
      ascension: '2027-05-06',
      pentecost: '2027-05-16',
      trinity: '2027-05-23',
      adventStart: '2027-11-28',
      christmas: '2027-12-25',
    });
  });
  it('Christmas-on-a-Monday year: Advent Sunday 3 Dec 2028', () => {
    expect(liturgicalDates(2028).adventStart).toBe('2028-12-03');
  });
});

describe('keys are slugs', () => {
  it('Ordinary Time → ordinary-time', () => {
    expect(getLiturgicalDay(new Date(2026, 5, 1)).key).toBe('ordinary-time');
  });
  it('Christmastide → christmastide (a non-feast day of the season)', () => {
    // 25 Dec itself now carries the Christmas Day feast key.
    expect(getLiturgicalDay(new Date(2026, 11, 28)).key).toBe('christmastide');
  });
  it('Christmas Day → christmas-day', () => {
    expect(getLiturgicalDay(new Date(2026, 11, 25)).key).toBe('christmas-day');
  });
});

describe('seasonLine()', () => {
  it('formats date + season', () => {
    expect(seasonLine(new Date(2026, 5, 7))).toBe('Sunday, 7 June 2026 · Ordinary Time');
  });
  it('uses feast name when present', () => {
    expect(seasonLine(new Date(2026, 5, 11))).toContain('St Barnabas the Apostle');
  });
});
