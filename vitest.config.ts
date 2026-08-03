import { defineConfig } from 'vitest/config';

/**
 * The test suite runs in **Europe/London**, not in whatever zone the machine happens to be in.
 *
 * This is a parish website: every civil date it computes is a London date (`toLondonCivil`,
 * `todayInLondon`), so London is the honest place to test it. It is also the only setting that
 * catches a whole class of bug. Date-only handling is invisible in UTC and in zones behind UTC,
 * and CI runs on `ubuntu-latest`, which is UTC — so a real off-by-one in all-day event parsing
 * (node-ical returns `VALUE=DATE` at local midnight; see `utcMidnightOfDateOnly`) passed CI and
 * only ever failed on a maintainer's machine in British Summer Time.
 *
 * Pinning it here means the suite behaves identically for every contributor and on CI, and that
 * the summer/winter offset difference is exercised rather than assumed away.
 */
export default defineConfig({
  test: {
    env: { TZ: 'Europe/London' },
  },
});
