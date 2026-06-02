export type Season =
  | 'Advent'
  | 'Christmastide'
  | 'Epiphany'
  | 'Ordinary Time'
  | 'Lent'
  | 'Holy Week'
  | 'Eastertide'
  | 'Pentecost';

export interface LiturgicalDay {
  season: Season;
  feast?: string;
  key: string;
}

// Western Computus (Anonymous Gregorian algorithm) → Easter Sunday
export function easter(y: number): Date {
  const a = y % 19,
    b = Math.floor(y / 100),
    c = y % 100,
    d = Math.floor(b / 4),
    e = b % 4,
    f = Math.floor((b + 8) / 25),
    g = Math.floor((b - f + 1) / 3),
    h = (19 * a + b - d - g + 15) % 30,
    i = Math.floor(c / 4),
    k = c % 4,
    l = (32 + 2 * e + 2 * i - h - k) % 7,
    m = Math.floor((a + 11 * h + 22 * l) / 451),
    mo = Math.floor((h + l - 7 * m + 114) / 31),
    da = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(y, mo - 1, da);
}

const D = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};
const add = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};
const eq = (a: Date, b: Date) => +D(a) === +D(b);
const slug = (x: string) =>
  x
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

export function getLiturgicalDay(today = new Date()): LiturgicalDay {
  const y = today.getFullYear();
  const e = easter(y);
  const ash = add(e, -46),
    palm = add(e, -7),
    ascension = add(e, 39),
    pentecost = add(e, 49),
    trinity = add(e, 56);
  const adventStart = (() => {
    const x = D(new Date(y, 11, 25));
    let s = add(x, -1),
      n = 0;
    while (n < 4) {
      s = add(s, -1);
      if (s.getDay() === 0) n++;
    }
    return s;
  })();
  const t = D(today);

  // Principal feasts (override season for hero/text). Extend as needed.
  const feasts: [Date, string, Season][] = [
    [new Date(y, 5, 11), 'Feast of St Barnabas', 'Ordinary Time'], // patronal, 11 Jun
    [new Date(y, 7, 15), 'The Blessed Virgin Mary', 'Ordinary Time'], // 15 Aug
    [new Date(y, 10, 1), 'All Saints', 'Ordinary Time'], // 1 Nov
    [ascension, 'Ascension Day', 'Eastertide'],
    [trinity, 'Trinity Sunday', 'Ordinary Time'],
  ];
  for (const [d, name, season] of feasts) if (eq(t, d)) return { season, feast: name, key: slug(name) };

  if (t >= D(new Date(y, 11, 25)) || t < D(new Date(y, 0, 6))) return s('Christmastide');
  if (t >= adventStart) return s('Advent');
  if (t >= palm && t < e) return s('Holy Week');
  if (t >= ash && t < palm) return s('Lent');
  if (eq(t, e) || (t > e && t < pentecost)) return s('Eastertide');
  if (eq(t, pentecost)) return s('Pentecost');
  if (t >= D(new Date(y, 0, 6)) && t < ash) return s('Epiphany');
  return s('Ordinary Time');

  function s(season: Season): LiturgicalDay {
    return { season, key: slug(season) };
  }
}

/** A quiet monochrome line, e.g. "Sunday, 7 June 2026 · Corpus Christi". */
export function seasonLine(today = new Date()): string {
  const day = getLiturgicalDay(today);
  const dateStr = today.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  return `${dateStr} · ${day.feast ?? day.season}`;
}
