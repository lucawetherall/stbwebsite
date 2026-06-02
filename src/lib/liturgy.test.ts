import { describe, it, expect } from 'vitest';
import { easter, getLiturgicalDay, seasonLine } from './liturgy';

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
    expect(d.feast).toBe('Feast of St Barnabas');
    expect(d.key).toBe('feast-of-st-barnabas');
  });
  it('All Saints (1 Nov)', () => {
    expect(getLiturgicalDay(new Date(2026, 10, 1)).feast).toBe('All Saints');
  });
});

describe('keys are slugs', () => {
  it('Ordinary Time → ordinary-time', () => {
    expect(getLiturgicalDay(new Date(2026, 5, 1)).key).toBe('ordinary-time');
  });
  it('Christmastide → christmastide', () => {
    expect(getLiturgicalDay(new Date(2026, 11, 25)).key).toBe('christmastide');
  });
});

describe('seasonLine()', () => {
  it('formats date + season', () => {
    expect(seasonLine(new Date(2026, 5, 7))).toBe('Sunday, 7 June 2026 · Ordinary Time');
  });
  it('uses feast name when present', () => {
    expect(seasonLine(new Date(2026, 5, 11))).toContain('Feast of St Barnabas');
  });
});
