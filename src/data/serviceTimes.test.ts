import { describe, it, expect } from 'vitest';
import { serviceTimes, assertServiceTimes } from './serviceTimes';

describe('serviceTimes — loaded from JSON', () => {
  it('has non-empty sundays and weekdays', () => {
    expect(serviceTimes.sundays.length).toBeGreaterThan(0);
    expect(serviceTimes.weekdays.length).toBeGreaterThan(0);
  });

  it('preserves the first Sunday service', () => {
    expect(serviceTimes.sundays[0]).toMatchObject({ time: '10.30am', name: 'Sung Mass' });
  });

  it('keeps optional fields where present', () => {
    const bcp = serviceTimes.sundays.find((s) => s.name === 'Said Mass (BCP)');
    expect(bcp?.when).toBe('first Sunday of the month');
  });
});

describe('assertServiceTimes — build guard', () => {
  const ok = { sundays: [{ time: '10.30am', name: 'Sung Mass' }], weekdays: [{ time: '9.30am', name: 'Morning Prayer' }] };

  it('passes for a valid schedule', () => {
    expect(() => assertServiceTimes(ok)).not.toThrow();
  });

  it('throws when a day list is empty', () => {
    expect(() => assertServiceTimes({ ...ok, sundays: [] })).toThrow(/Sunday/);
  });

  it('throws when a service is missing its time or name', () => {
    expect(() => assertServiceTimes({ ...ok, weekdays: [{ time: '', name: 'X' }] })).toThrow(/time and a name/);
  });
});
