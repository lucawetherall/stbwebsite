import data from '../content/settings/serviceTimes.json';

export interface ServiceTime {
  time: string;
  name: string;
  when?: string;
  note?: string;
  description?: string;
}

// Standing service pattern — editor-owned via Sveltia (src/content/settings/serviceTimes.json).
// Used by /worship/sundays, /worship/weekdays and as the ThisSunday fallback.
export const serviceTimes: { sundays: ServiceTime[]; weekdays: ServiceTime[] } =
  data as { sundays: ServiceTime[]; weekdays: ServiceTime[] };
