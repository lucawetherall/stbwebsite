/**
 * Deriving the seasonal feature — "what is the parish keeping next?" — from the music list.
 *
 * Everything here is **pure**: it takes already-loaded sheet data and a "now", like
 * services.ts and events.ts, so it is unit-testable without the Astro runtime.
 *
 * ## How a feature is found
 *
 * Each feature is a **civil-date window anchored on the liturgical calendar**
 * (liturgicalDates in liturgy.ts), and its services are gathered from the sheets **by date
 * containment — never by matching the Director of Music's wording**. The music list names
 * its offices richly ("A Festival of Nine Lessons & Carols", "Solemn Requiem for the
 * Faithful Departed"), and any attempt to recognise those names by pattern breaks silently
 * the year the wording changes. The window supplies the meaning; the sheet supplies the
 * words, verbatim.
 *
 * Windows are computed for three years (last, this, next) and selected by containment, so
 * the year boundary can never misfire: on 30 December the Christmas window of *this* year
 * has closed and next year's Holy Week has not opened, whatever `getFullYear()` says.
 *
 * ## What absence means
 *
 * A missing sheet is the choir's silence, not an error (see services.ts). A principal
 * window (Christmas, Holy Week) open with nothing to show logs a build warning and renders
 * nothing — never a throwing guard, because a CMS Publish triggers the production deploy
 * and an editor must not be able to break it (docs/AGENT-GUARDRAILS.md §A). The unit tests
 * run the gatherers over the real collection, so a broken derivation fails CI instead.
 *
 * ## Dates are civil strings
 *
 * liturgy.ts builds local Dates; the sheets are UTC-midnight instants; "today" is the
 * Europe/London civil date. Only `YYYY-MM-DD` strings cross those boundaries, compared
 * lexicographically — the same discipline as events.ts.
 */

import { liturgicalDates } from './liturgy';
import { addDays, civilFromDateOnly, formatCivilDate, todayInLondon } from './events';
import type { SheetLike } from './services';
import { SEASON_FEATURES, type SeasonFeatureDef } from '../data/seasonFeatures';

export interface SeasonService {
  /** Civil date, `YYYY-MM-DD`. */
  date: string;
  /** "Sunday 13 December · 6.00pm" — day name always generated from the date. */
  when: string;
  time: string;
  /** The office name, the sheet's own wording verbatim. */
  name: string;
}

export interface SeasonFeature {
  key: SeasonFeatureDef['key'];
  title: string;
  standfirst: string;
  ctaLabel: string;
  href: string;
  notice: boolean;
  noticeLabel?: string;
  /** A quiet calendar phrase for the notice line — "The Second Sunday of Advent". */
  noticeLead?: string;
  services: SeasonService[];
}

interface Office {
  date: string;
  time: string;
  name: string;
  feast: string;
}

const ORDINALS = ['First', 'Second', 'Third', 'Fourth'];

/** Every office on every sheet, flattened to civil dates, ascending. */
function offices(sheets: SheetLike[]): Office[] {
  const out: Office[] = [];
  for (const sheet of sheets) {
    const date = civilFromDateOnly(sheet.date);
    for (const office of sheet.offices) {
      out.push({ date, time: office.time, name: office.name, feast: sheet.feast });
    }
  }
  return out.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

function toService(o: Office): SeasonService {
  // A bare "Sung Mass" kept on a principal day carries its feast — "Sung Mass of
  // Christmas Day" — since on the card the office name is doing the drawing. The feast
  // is the sheet's own wording, with any bracketed gloss trimmed for length.
  const name = isOrdinarySundayMass(o)
    ? `Sung Mass of ${o.feast.replace(/\s*\(.*$/, '')}`
    : o.name;
  return {
    date: o.date,
    when: `${formatCivilDate(o.date, { weekday: true, year: false })} · ${o.time}`,
    time: o.time,
    name,
  };
}

/**
 * The ordinary Sunday morning Mass, which every sheet carries. Inside a gather range it is
 * *excluded* unless the day itself is principal — the one negative rule, matched on the
 * standing name from serviceTimes.json rather than anything richer.
 */
const isOrdinarySundayMass = (o: Office) => /^sung mass$/i.test(o.name.trim());

interface Candidate {
  def: SeasonFeatureDef;
  open: string;
  close: string;
  services: Office[];
  /** True when an empty result deserves a build warning (Christmas, Holy Week). */
  principal: boolean;
  noticeLead?: string;
}

/** The candidate windows for one calendar year (undefined when the data gives none). */
function candidatesFor(
  y: number,
  all: Office[],
  today: string
): Candidate[] {
  const dates = liturgicalDates(y);
  const out: Candidate[] = [];
  const def = (key: SeasonFeatureDef['key']) =>
    SEASON_FEATURES.find((f) => f.key === key)!;

  // Holy Week & Easter — Passiontide opens the window; every day Palm Sunday → Easter Day
  // is principal, so everything on those sheets is kept (the Triduum must never be folded).
  out.push({
    def: def('holy-week'),
    open: dates.passiontide,
    close: dates.easter,
    principal: true,
    services: all.filter((o) => o.date >= dates.palm && o.date <= dates.easter),
    noticeLead:
      today >= dates.palm ? 'Holy Week' : 'Passiontide',
  });

  // Advent & Christmas — opens on Advent Sunday, not before: the parish keeps Advent.
  // Principal days are Christmas Eve and Christmas Day; on other days in the range only
  // the *additional* offices (carol services, evening services) are gathered.
  const christmasEve = addDays(dates.christmas, -1);
  const adventServices = all.filter(
    (o) =>
      o.date >= dates.adventStart &&
      o.date <= dates.christmas &&
      (o.date >= christmasEve || !isOrdinarySundayMass(o))
  );
  // The label turns from "Advent & Christmas" to "Christmas" a week before the first
  // gathered service (or 18 December, whichever is sooner).
  const first = adventServices[0]?.date;
  const lateFrom = first ? min(addDays(first, -7), `${y}-12-18`) : `${y}-12-18`;
  const advent = SEASON_FEATURES.find((f) => f.key === 'christmas')!;
  const week = Math.floor(daysAfter(dates.adventStart, today) / 7);
  out.push({
    def: advent,
    open: dates.adventStart,
    close: dates.christmas,
    principal: true,
    services: adventServices,
    noticeLead:
      today >= christmasEve
        ? 'Christmas'
        : week >= 0 && week < 4
          ? `The ${ORDINALS[week]} Week of Advent`
          : 'Advent',
  });
  // Stash the label switch date on the def lookup via closure — handled in activeFeature.
  (out[out.length - 1] as Candidate & { lateFrom?: string }).lateFrom = lateFrom;

  // Ash Wednesday — the sheet's own offices, ten days out.
  out.push({
    def: def('ash-wednesday'),
    open: addDays(dates.ash, -10),
    close: dates.ash,
    principal: false,
    services: all.filter((o) => o.date === dates.ash),
  });

  // The Requiem — this parish keeps it on All Saints' Day evening (1 Nov 2026), not the
  // kalendar's 2 Nov, so the date is taken from the sheet: the office matching /requiem/i
  // on any sheet in late October – early November. No sheet, no feature.
  const requiem = all.find(
    (o) => o.date >= `${y}-10-25` && o.date <= `${y}-11-08` && /requiem/i.test(o.name)
  );
  if (requiem) {
    out.push({
      def: def('requiem'),
      open: `${y}-10-21`,
      close: requiem.date,
      principal: false,
      services: [requiem],
    });
  }

  return out;
}

const min = (a: string, b: string) => (a < b ? a : b);
const daysAfter = (from: string, to: string) => {
  const t = (s: string) => {
    const [y, m, d] = s.split('-').map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((t(to) - t(from)) / 86_400_000);
};

/**
 * The feature live today, or `null` — in which case every caller renders nothing at all
 * (the ThisSunday precedent: the standing pattern already says what an ordinary week
 * holds, and saying it twice, less well, helps nobody).
 */
export function activeFeature(sheets: SheetLike[], now: Date = new Date()): SeasonFeature | null {
  const today = todayInLondon(now);
  const y = Number(today.slice(0, 4));
  const all = offices(sheets);

  const candidates: (Candidate & { lateFrom?: string })[] = [];
  for (const year of [y - 1, y, y + 1]) candidates.push(...candidatesFor(year, all, today));

  for (const def of SEASON_FEATURES) {
    for (const c of candidates) {
      if (c.def.key !== def.key) continue;
      if (today < c.open || today > c.close) continue;
      // Past services drop out mid-window: on Good Friday, Palm Sunday has gone.
      const upcoming = c.services.filter((o) => o.date >= today);
      if (upcoming.length === 0) {
        if (c.principal) {
          console.warn(
            `[seasons] the ${c.def.key} window is open (${c.open}–${c.close}) but the music ` +
              'list has nothing to show — check src/content/services.'
          );
        }
        continue;
      }
      const title =
        c.def.lateTitle && c.lateFrom && today >= c.lateFrom ? c.def.lateTitle : c.def.title;
      return {
        key: c.def.key,
        title,
        standfirst: c.def.standfirst,
        ctaLabel: c.def.ctaLabel,
        href: c.def.href,
        notice: c.def.notice,
        noticeLabel: c.def.noticeLabel,
        noticeLead: c.noticeLead,
        services: upcoming.map(toService),
      };
    }
  }

  // The rolling Evensong nudge, lowest priority: the next office named Evensong within a
  // fortnight. The narrow name-match is deliberate and deliberately *not* "carol service" —
  // the Epiphany Carol Service belongs to no feature rather than to the wrong one.
  const evensong = all.find(
    (o) => o.date >= today && o.date <= addDays(today, 14) && /evensong/i.test(o.name)
  );
  if (evensong) {
    const def = SEASON_FEATURES.find((f) => f.key === 'evensong')!;
    return {
      key: def.key,
      title: def.title,
      standfirst: def.standfirst,
      ctaLabel: def.ctaLabel,
      href: def.href,
      notice: def.notice,
      services: [toService(evensong)],
    };
  }

  return null;
}
