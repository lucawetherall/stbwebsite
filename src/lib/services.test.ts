import { describe, expect, it } from 'vitest';
import {
  comingSunday,
  currentSheet,
  fmt,
  groupByMonth,
  sortByDate,
  startOfDay,
  upcomingSheets,
  type SheetLike,
} from './services';

const sheet = (date: string, feast = date): SheetLike => ({
  date: new Date(date),
  feast,
  offices: [{ time: '10.30am', name: 'Sung Mass', items: [] }],
});

/**
 * A slice of the real 2026–27 choir year, including its awkward parts: Christmas week (where
 * 27 December is silent), Ash Wednesday falling mid-week, and Holy Week's three weekday
 * liturgies. Deliberately unsorted — the collection is not guaranteed to arrive in order.
 */
const year = [
  sheet('2026-12-20', 'The Fourth Sunday of Advent'),
  sheet('2026-12-24', 'The First Eucharist of Christmas'),
  sheet('2026-12-25', 'Christmas Day'),
  // no 2026-12-27 — said Mass, no choir
  sheet('2027-01-03', 'The Epiphany'),
  sheet('2027-02-07', 'The Sunday next before Lent'),
  sheet('2027-02-10', 'Ash Wednesday'),
  sheet('2027-02-14', 'The First Sunday of Lent'),
  sheet('2027-03-21', 'Palm Sunday'),
  sheet('2027-03-25', 'Maundy Thursday'),
  sheet('2027-03-26', 'Good Friday'),
  sheet('2027-03-27', 'Holy Saturday'),
  sheet('2027-03-28', 'Easter Day'),
  sheet('2027-07-25', 'St Mary Magdalene'),
];

const on = (date: string) => currentSheet(year, new Date(`${date}T09:00:00`))?.feast ?? null;

describe('sortByDate', () => {
  it('orders earliest first', () => {
    expect(sortByDate([sheet('2027-01-03'), sheet('2026-12-20')]).map((s) => s.feast)).toEqual([
      '2026-12-20',
      '2027-01-03',
    ]);
  });

  it('does not mutate the input', () => {
    const input = [sheet('2027-01-03'), sheet('2026-12-20')];
    sortByDate(input);
    expect(input.map((s) => s.feast)).toEqual(['2027-01-03', '2026-12-20']);
  });
});

describe('comingSunday', () => {
  it('finds the Sunday ahead', () => {
    expect(comingSunday(startOfDay(new Date('2026-12-22T09:00:00'))).toISOString())
      .toBe('2026-12-27T00:00:00.000Z');
  });

  it('returns today when today is a Sunday', () => {
    expect(comingSunday(startOfDay(new Date('2026-12-27T09:00:00'))).toISOString())
      .toBe('2026-12-27T00:00:00.000Z');
  });
});

describe('currentSheet', () => {
  it('shows the coming Sunday through the week before it', () => {
    expect(on('2026-12-14')).toBe('The Fourth Sunday of Advent');
    expect(on('2026-12-18')).toBe('The Fourth Sunday of Advent');
  });

  it('still shows the sheet on the day itself', () => {
    expect(on('2026-12-20')).toBe('The Fourth Sunday of Advent');
    expect(on('2027-03-28')).toBe('Easter Day');
  });

  it('prefers a weekday feast that falls before the coming Sunday', () => {
    // Ash Wednesday is the 10th; the coming Sunday on the 8th is the 14th.
    expect(on('2027-02-08')).toBe('Ash Wednesday');
    expect(on('2027-02-10')).toBe('Ash Wednesday');
    // Once it has passed, the coming Sunday takes over again.
    expect(on('2027-02-11')).toBe('The First Sunday of Lent');
  });

  it('walks through Holy Week one liturgy at a time', () => {
    expect(on('2027-03-22')).toBe('Maundy Thursday');
    expect(on('2027-03-25')).toBe('Maundy Thursday');
    expect(on('2027-03-26')).toBe('Good Friday');
    expect(on('2027-03-27')).toBe('Holy Saturday');
    expect(on('2027-03-28')).toBe('Easter Day');
  });

  // The reason the picker exists in this form. A said Sunday has no sheet, and the next one
  // must not be dragged forward to fill the gap.
  it('shows nothing on a Sunday the choir does not sing', () => {
    expect(on('2026-12-26')).toBeNull();
    expect(on('2026-12-27')).toBeNull();
  });

  it('shows the next sheet again from the Monday after a silent Sunday', () => {
    expect(on('2026-12-28')).toBe('The Epiphany');
  });

  it('shows nothing once the choir year has ended', () => {
    expect(on('2027-07-26')).toBeNull();
    expect(on('2027-08-30')).toBeNull();
  });

  it('shows nothing across a long gap between sheets', () => {
    expect(on('2027-05-10')).toBeNull();
  });

  it('copes with an empty collection', () => {
    expect(currentSheet([], new Date('2026-12-22T09:00:00'))).toBeNull();
  });
});

describe('upcomingSheets', () => {
  it('keeps today and drops what has passed', () => {
    const rest = upcomingSheets(year, new Date('2027-03-26T09:00:00'));
    expect(rest.map((s) => s.feast)).toEqual([
      'Good Friday',
      'Holy Saturday',
      'Easter Day',
      'St Mary Magdalene',
    ]);
  });

  it('includes a silent Sunday as no entry at all', () => {
    const rest = upcomingSheets(year, new Date('2026-12-25T09:00:00'));
    expect(rest.map((s) => s.feast)).not.toContain('The First Sunday of Christmas');
  });
});

describe('groupByMonth', () => {
  it('groups in date order, naming the month and keeping the year', () => {
    const groups = groupByMonth(year);
    expect(groups.map((g) => `${g.key} ${g.label}`)).toEqual([
      '2026-12 December',
      '2027-01 January',
      '2027-02 February',
      '2027-03 March',
      '2027-07 July',
    ]);
    expect(groups[0].year).toBe(2026);
    expect(groups[0].sheets).toHaveLength(3);
  });

  it('returns nothing for nothing', () => {
    expect(groupByMonth([])).toEqual([]);
  });
});

describe('fmt', () => {
  const set = (label: string, value: string) => {
    const { lead, title, tail } = fmt(label, value);
    return title ? `${lead}*${title}*${tail}` : `${lead}${title}${tail}`;
  };

  it('sets composer roman and title italic', () => {
    expect(set('Anthem', 'Bairstow, I sat down under his shadow'))
      .toBe('Bairstow, *I sat down under his shadow*');
    expect(set('Setting', 'Byrd, Mass for Four Voices')).toBe('Byrd, *Mass for Four Voices*');
  });

  it('leaves psalm references and bare composer names roman', () => {
    expect(set('Psalm', '119. 33–40 (plainsong)')).toBe('119. 33–40 (plainsong)');
    expect(set('Psalm', '96. 1–9[10–13]')).toBe('96. 1–9[10–13]');
    expect(set('Responses', 'Ayleward')).toBe('Ayleward');
    expect(set('Responses', 'Forbes L’Estrange')).toBe('Forbes L’Estrange');
  });

  it('leaves a setting known by its key roman', () => {
    expect(set('Setting', 'Darke in A minor')).toBe('Darke in A minor');
    expect(set('Canticles', 'Sumsion in G')).toBe('Sumsion in G');
    expect(set('Setting', 'Schubert in G (Gloria)')).toBe('Schubert in G (Gloria)');
  });

  it('italicises a title that has no composer in front of it', () => {
    expect(set('Setting', 'Missa de Angelis')).toBe('*Missa de Angelis*');
    expect(set('Introit', 'Sweet Sacrament divine')).toBe('*Sweet Sacrament divine*');
  });

  it('keeps a trailing rubric roman', () => {
    expect(set('Setting', 'Missa de Angelis (Gloria omitted)'))
      .toBe('*Missa de Angelis* (Gloria omitted)');
    expect(set('Setting', 'Rheinberger, Missa (Crux fidelis)'))
      .toBe('Rheinberger, *Missa* (Crux fidelis)');
    expect(set('Anthem', 'Deep River (arr. Luboff)')).toBe('*Deep River* (arr. Luboff)');
    expect(set('Anthems', 'A. L’Estrange, Nunc dimittis (New College Service) — after communion'))
      .toBe('A. L’Estrange, *Nunc dimittis* (New College Service) — after communion');
  });

  // The cases that defeat "italicise everything after the first comma".
  it('does not mistake a comma inside a title for a composer', () => {
    expect(set('Introit', 'Riu, riu, chiu')).toBe('*Riu, riu, chiu*');
    expect(set('Introit', 'Magdalen, cease from sobs and sighs (arr. Peter Hurford)'))
      .toBe('*Magdalen, cease from sobs and sighs* (arr. Peter Hurford)');
    expect(set('Introit', 'We have received thy mercy, O God (plainsong)'))
      .toBe('*We have received thy mercy, O God* (plainsong)');
  });

  it('allows particles and initials in a composer name', () => {
    expect(set('Anthem', 'King John IV of Portugal, Crux fidelis'))
      .toBe('King John IV of Portugal, *Crux fidelis*');
    expect(set('Anthem', 'S. S. Wesley, Blessed be the God and Father'))
      .toBe('S. S. Wesley, *Blessed be the God and Father*');
    expect(set('Anthem', 'Hildegard of Bingen, Caritas abundat in omnia'))
      .toBe('Hildegard of Bingen, *Caritas abundat in omnia*');
    expect(set('Setting', 'Fauré, Requiem')).toBe('Fauré, *Requiem*');
  });

  it('keeps a title whose own commas follow the composer', () => {
    expect(set('Introit', 'Farrant, Lord, for thy tender mercy’s sake'))
      .toBe('Farrant, *Lord, for thy tender mercy’s sake*');
    expect(set('Anthem', 'Bach, Erbarme dich, mein Gott'))
      .toBe('Bach, *Erbarme dich, mein Gott*');
  });
});
