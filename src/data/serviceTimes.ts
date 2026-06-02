import data from '../content/settings/serviceTimes.json';

export interface ServiceTime {
  time: string;
  name: string;
  when?: string;
  note?: string;
  description?: string;
}

/** Throws (failing the build) if an editor empties the schedule or omits a time/name. */
export function assertServiceTimes(d: { sundays?: ServiceTime[]; weekdays?: ServiceTime[] }): void {
  if (!Array.isArray(d.sundays) || !d.sundays.length || !Array.isArray(d.weekdays) || !d.weekdays.length) {
    throw new Error(
      'serviceTimes.json must list at least one Sunday and one weekday service. Refusing to build.'
    );
  }
  for (const s of [...d.sundays, ...d.weekdays]) {
    if (!s.time || !s.name) {
      throw new Error('Every service in serviceTimes.json needs a time and a name. Refusing to build.');
    }
  }
}

assertServiceTimes(data as { sundays: ServiceTime[]; weekdays: ServiceTime[] });

// Standing service pattern — editor-owned via Sveltia (src/content/settings/serviceTimes.json).
// Used by /worship/sundays, /worship/weekdays and as the ThisSunday fallback.
export const serviceTimes: { sundays: ServiceTime[]; weekdays: ServiceTime[] } =
  data as { sundays: ServiceTime[]; weekdays: ServiceTime[] };
