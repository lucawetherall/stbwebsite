import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { activeFeature } from './seasons';
import type { SheetLike } from './services';

// ---------------------------------------------------------------- fixtures

/** A sheet with the given offices, dated as a UTC-midnight instant like the collection. */
const sheet = (date: string, feast: string, ...offices: [string, string][]): SheetLike => ({
  date: new Date(`${date}T00:00:00Z`),
  feast,
  offices: offices.map(([time, name]) => ({ time, name, items: [] })),
});

/** Noon London on a civil date — an unremarkable moment of that day. */
const at = (date: string) => new Date(`${date}T12:00:00Z`);

/**
 * The real collection: every music sheet in the repo. The derivation must hold against
 * what the Director of Music actually writes, not just against fixtures.
 */
const realSheets: SheetLike[] = readdirSync(join(__dirname, '../content/services'))
  .filter((f) => f.endsWith('.json'))
  .map((f) => {
    const d = JSON.parse(readFileSync(join(__dirname, '../content/services', f), 'utf8'));
    return {
      date: new Date(`${d.date}T00:00:00Z`),
      feast: d.feast,
      offices: (d.offices ?? []).map((o: { time: string; name: string }) => ({
        time: o.time,
        name: o.name,
        items: [],
      })),
    };
  });

// ---------------------------------------------------------------- the real collection

describe('activeFeature() over the real music list', () => {
  it('never throws on any day of the whole choir year', () => {
    for (let d = new Date(Date.UTC(2026, 5, 1)); d <= new Date(Date.UTC(2027, 6, 31)); d.setUTCDate(d.getUTCDate() + 1)) {
      expect(() => activeFeature(realSheets, new Date(+d + 12 * 3600_000))).not.toThrow();
    }
  });

  it('Advent Sunday 2026 opens the Christmas feature, in the Advent register', () => {
    const f = activeFeature(realSheets, at('2026-11-29'));
    expect(f?.key).toBe('christmas');
    expect(f?.title).toBe('Advent & Christmas at St Barnabas');
    expect(f?.noticeLead).toBe('The First Week of Advent');
  });

  it('the day before Advent Sunday there is no Christmas feature', () => {
    expect(activeFeature(realSheets, at('2026-11-28'))?.key).not.toBe('christmas');
  });

  it('the Christmas card carries Nine Lessons & Carols, Midnight Mass and Christmas Day', () => {
    const f = activeFeature(realSheets, at('2026-12-01'));
    const names = f!.services.map((s) => s.name);
    expect(names).toContain('A Festival of Nine Lessons & Carols');
    expect(names).toContain('Midnight Mass');
    expect(names).toContain('Sung Mass of Christmas Day'); // a principal day, feast carried
    // …and no ordinary Advent Sunday morning Mass.
    const dates = f!.services.filter((s) => /^Sung Mass/.test(s.name)).map((s) => s.date);
    expect(dates).toEqual(['2026-12-25']);
  });

  it('by Christmas week the label has turned and the lead is Christmas on the Eve', () => {
    expect(activeFeature(realSheets, at('2026-12-20'))?.title).toBe('Christmas at St Barnabas');
    expect(activeFeature(realSheets, at('2026-12-24'))?.noticeLead).toBe('Christmas');
  });

  it('Nine Lessons & Carols drops out once sung: on 14 December it is gone', () => {
    const names = activeFeature(realSheets, at('2026-12-14'))!.services.map((s) => s.name);
    expect(names).not.toContain('A Festival of Nine Lessons & Carols');
  });

  it('after Christmas Day the feature closes; Epiphany Carols belongs to no feature', () => {
    expect(activeFeature(realSheets, at('2026-12-26'))).toBeNull();
    expect(activeFeature(realSheets, at('2026-12-28'))).toBeNull();
  });

  it("the Requiem is found on All Saints' Day, 1 November — the parish's own keeping", () => {
    const f = activeFeature(realSheets, at('2026-10-25'));
    expect(f?.key).toBe('requiem');
    expect(f?.services).toHaveLength(1);
    expect(f?.services[0].name).toBe('Solemn Requiem for the Faithful Departed');
    expect(f?.services[0].date).toBe('2026-11-01');
    expect(f?.notice).toBe(false); // never a banner
  });

  it('Ash Wednesday 2027: the card is live ten days out with the 7.00pm Mass', () => {
    const f = activeFeature(realSheets, at('2027-02-01'));
    expect(f?.key).toBe('ash-wednesday');
    expect(f?.services[0]).toMatchObject({ date: '2027-02-10', time: '7.00pm' });
  });

  it('Passiontide opens Holy Week; the full week is gathered', () => {
    const f = activeFeature(realSheets, at('2027-03-14'));
    expect(f?.key).toBe('holy-week');
    const names = f!.services.map((s) => s.name);
    expect(names).toContain('The Liturgy of Good Friday');
    expect(names).toContain('The Easter Vigil & First Mass of Easter');
    expect(f?.noticeLead).toBe('Passiontide');
  });

  it('on Good Friday, Palm Sunday has gone but the Triduum and Easter Day remain', () => {
    const f = activeFeature(realSheets, at('2027-03-26'));
    expect(f?.key).toBe('holy-week');
    expect(f?.noticeLead).toBe('Holy Week');
    const dates = f!.services.map((s) => s.date);
    expect(dates[0]).toBe('2027-03-26');
    expect(dates).toContain('2027-03-28'); // Easter Day
    expect(dates).not.toContain('2027-03-21');
  });

  it('the rolling Evensong nudge: a fortnight before the Ascensiontide Evensong', () => {
    const f = activeFeature(realSheets, at('2027-04-20'));
    expect(f?.key).toBe('evensong');
    expect(f?.services[0].name).toBe('Choral Evensong for Ascensiontide');
    expect(f?.services[0].when).toBe('Sunday 2 May · 6.00pm');
  });

  it('an ordinary summer day has no feature at all', () => {
    expect(activeFeature(realSheets, at('2026-08-20'))).toBeNull();
  });
});

// ---------------------------------------------------------------- edges

describe('activeFeature() edges', () => {
  it('a deliberate silence: window open, no sheets → nothing, with a build warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(activeFeature([], at('2026-12-10'))).toBeNull();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('christmas'));
    warn.mockRestore();
  });

  it('year boundary: 30 Dec, 1 Jan, 2 Jan and 5 Jan are all quiet', () => {
    for (const d of ['2026-12-30', '2027-01-01', '2027-01-02', '2027-01-05']) {
      expect(activeFeature(realSheets, at(d))).toBeNull();
    }
  });

  it('late evening London on a window boundary still counts as that civil day', () => {
    // 23:30 London on Christmas Day (GMT, so 23:30Z): the window is still open.
    const f = activeFeature(realSheets, new Date('2026-12-25T23:30:00Z'));
    expect(f?.key).toBe('christmas');
    // …and 23:30 London the day before Advent Sunday is still not Advent.
    expect(
      activeFeature(realSheets, new Date('2026-11-28T23:30:00Z'))?.key
    ).not.toBe('christmas');
  });

  it('BST: a late-March evening instant lands on the right London day', () => {
    // 23:30 London on Maundy Thursday 2027 = 22:30Z (BST). Holy Week, not yet Good Friday.
    const f = activeFeature(realSheets, new Date('2027-03-25T22:30:00Z'));
    expect(f?.services[0].date).toBe('2027-03-25');
  });

  it('two Evensongs inside one fortnight: the sooner is shown', () => {
    const sheets = [
      sheet('2030-06-02', 'Trinity', ['6.00pm', 'Choral Evensong']),
      sheet('2030-06-09', 'Trinity 1', ['6.00pm', 'Choral Evensong']),
    ];
    const f = activeFeature(sheets, at('2030-05-30'));
    expect(f?.key).toBe('evensong');
    expect(f?.services[0].date).toBe('2030-06-02');
  });

  it('the Requiem window needs a matching office — otherwise no feature', () => {
    const sheets = [sheet('2030-11-03', 'All Saints', ['10.30am', 'Sung Mass'])];
    expect(activeFeature(sheets, at('2030-10-25'))).toBeNull();
  });

  it('day names are generated from the sheet date, never hand-written', () => {
    const f = activeFeature(realSheets, at('2026-12-01'));
    const midnight = f!.services.find((s) => s.name === 'Midnight Mass')!;
    expect(midnight.when).toBe('Thursday 24 December · 11.00pm');
  });
});
