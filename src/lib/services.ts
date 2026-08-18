/**
 * Choosing and typesetting the music list.
 *
 * Everything here is **pure** — it takes already-loaded sheet data and a "now", so it can be
 * unit-tested without the Astro runtime (the same approach as `history.ts` and `events.ts`).
 *
 * ## Which sheet is "now"
 *
 * The rule is: **the earliest sheet dated between today and the coming Sunday inclusive.**
 *
 * That single sentence does three jobs. It shows the coming Sunday's music through the week
 * before it; it lets a weekday feast (Ash Wednesday, Maundy Thursday) take precedence while it
 * is still ahead of us; and it renders *nothing* on a Sunday the choir does not sing, because
 * the next sheet then lies beyond the coming Sunday and is not yet due.
 *
 * That last part matters. Said/no-choir Sundays are represented by the **absence** of a file, so
 * an earlier "or any sheet within the next fortnight" fallback would quietly reach past the
 * silence and print the following week's music a fortnight early — on precisely the Sunday that
 * was meant to be blank.
 *
 * ## Dates are civil, not instants
 *
 * Sheet dates are authored as bare `YYYY-MM-DD` and parsed as UTC midnight, so "today" is
 * normalised the same way: the local calendar date lifted onto a UTC-midnight instant. Comparing
 * two UTC-midnight instants can never be off by one, whatever the reader's timezone.
 */

/** The shape we need from a `services` entry — structural, so tests need no fixtures. */
export interface SheetLike {
  date: Date;
  feast: string;
  offices: {
    time: string;
    name: string;
    items: { label: string; values: string[] }[];
  }[];
}

const DAY = 86_400_000;

/** Ascending by date — the order the choir year is read in. */
export function sortByDate<T extends SheetLike>(sheets: T[]): T[] {
  return [...sheets].sort((a, b) => +a.date - +b.date);
}

/** The local calendar date of `now`, lifted onto a UTC-midnight instant. */
export function startOfDay(now: Date): Date {
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

/** The coming Sunday — today, when today is itself a Sunday. */
export function comingSunday(startOfToday: Date): Date {
  return new Date(+startOfToday + ((7 - startOfToday.getUTCDay()) % 7) * DAY);
}

/**
 * The sheet to show now, or `null` when the choir is not singing between today and Sunday.
 * A caller that gets `null` should render nothing at all rather than a placeholder — the
 * standing service times already say what happens on an ordinary Sunday, and saying it twice,
 * less well, helps nobody.
 */
export function currentSheet<T extends SheetLike>(sheets: T[], now: Date): T | null {
  const today = startOfDay(now);
  const sunday = comingSunday(today);
  return (
    sortByDate(sheets).find((s) => +s.date >= +today && +s.date <= +sunday) ?? null
  );
}

/** Every sheet from today onwards, ascending. Past Sundays simply fall off the list. */
export function upcomingSheets<T extends SheetLike>(sheets: T[], now: Date): T[] {
  const today = startOfDay(now);
  return sortByDate(sheets).filter((s) => +s.date >= +today);
}

export interface MonthGroup<T> {
  /** `2026-09` — stable, and usable as an anchor id. */
  key: string;
  /** `September` — the month rule prints the name alone, as the printed lists do. */
  label: string;
  year: number;
  sheets: T[];
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** Sheets grouped under month headings, in date order. Months with nothing in them do not appear. */
export function groupByMonth<T extends SheetLike>(sheets: T[]): MonthGroup<T>[] {
  const groups: MonthGroup<T>[] = [];
  for (const sheet of sortByDate(sheets)) {
    const year = sheet.date.getUTCFullYear();
    const month = sheet.date.getUTCMonth();
    const key = `${year}-${String(month + 1).padStart(2, '0')}`;
    const last = groups[groups.length - 1];
    if (last?.key === key) last.sheets.push(sheet);
    else groups.push({ key, label: MONTHS[month], year, sheets: [sheet] });
  }
  return groups;
}

/* ── typesetting a music value ───────────────────────────────────────────────────────────── */

/**
 * A music value, split for setting: `lead` and `tail` are roman, `title` is italic.
 *
 * Values are plain strings and stay that way, because an editor typing
 * `Mozart, Ave verum corpus` must keep getting exactly what they expect. But "italicise
 * everything after the first comma" is too blunt for a real music list: it would set
 * *Riu, riu, chiu* as a composer named Riu, leave *Missa de Angelis* roman for want of a comma,
 * and italicise the key in *Sumsion in G*. Hence the rules in `fmt`.
 */
export interface TypesetValue {
  /** The composer, with its separator — `Bairstow, ` — or empty. Roman. */
  lead: string;
  /** The work's title. Italic. */
  title: string;
  /** Trailing rubric — ` (plainsong)`, ` (Gloria omitted)`, ` — after communion`. Roman. */
  tail: string;
}

/** Labels whose values are never titles: psalm references, and bare composer names. */
const ROMAN_LABELS = new Set(['psalm', 'psalms', 'responses']);

/** Lowercase words allowed inside a composer's name. */
const PARTICLES = new Set(['of', 'van', 'von', 'de', 'du', 'da', 'della', 'la', 'le']);

/** A final `(…)` group or `— …` clause: a rubric about the music, not part of its title. */
const TRAILING_RUBRIC = /(\s*\([^()]*\)|\s+—\s+[^—]*)$/;

/** `Darke in A minor`, `Ireland in C` — a setting known by its key, not a title. */
const KNOWN_BY_KEY = /\bin\s+[A-G][♭♯#b]?(\s+(minor|major))?$/;

/** Every word capitalised, an initial, or a particle — `S. S. Wesley`, `King John IV of Portugal`. */
function composerShaped(s: string): boolean {
  const words = s.split(/\s+/).filter(Boolean);
  return (
    words.length > 0 &&
    words.every(
      (w) => /^\p{Lu}/u.test(w) || /^\p{L}\.$/u.test(w) || PARTICLES.has(w.toLowerCase())
    )
  );
}

/**
 * Split a music value for setting. Applied in order:
 *
 * 1. `Psalm` / `Responses` values are all roman.
 * 2. Trailing rubrics come off and stay roman.
 * 3. What remains, if it ends in a key, is all roman.
 * 4. Otherwise `Composer, Title` splits — but only when the part before the comma is
 *    composer-shaped *and* the part after it opens with a capital. Both guards are load-bearing:
 *    the first keeps *We have received thy mercy, O God* whole, the second keeps
 *    *Riu, riu, chiu* and *Magdalen, cease from sobs and sighs* whole.
 * 5. Anything left is a title, and is italic.
 */
export function fmt(label: string, value: string): TypesetValue {
  const roman = (s: string): TypesetValue => ({ lead: s, title: '', tail: '' });

  if (ROMAN_LABELS.has(label.trim().toLowerCase())) return roman(value);

  let body = value;
  let tail = '';
  for (let m = body.match(TRAILING_RUBRIC); m; m = body.match(TRAILING_RUBRIC)) {
    tail = m[0] + tail;
    body = body.slice(0, body.length - m[0].length);
  }
  body = body.trim();

  if (KNOWN_BY_KEY.test(body)) return { lead: body + tail, title: '', tail: '' };

  const i = body.indexOf(', ');
  if (i > 0) {
    const composer = body.slice(0, i);
    const rest = body.slice(i + 2);
    if (composerShaped(composer) && /^\p{Lu}/u.test(rest)) {
      return { lead: body.slice(0, i + 2), title: rest, tail };
    }
  }
  return { lead: '', title: body, tail };
}
