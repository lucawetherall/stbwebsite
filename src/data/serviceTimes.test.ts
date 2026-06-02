import { describe, it, expect } from 'vitest';
import { serviceTimes } from './serviceTimes';

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
