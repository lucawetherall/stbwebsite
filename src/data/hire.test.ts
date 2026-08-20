// src/data/hire.test.ts
import { describe, it, expect } from 'vitest';
import { assertHireSettings } from './hire';

const valid = {
  hub: { title: 'Hire' }, recordings: { title: 'R' }, concerts: { title: 'C' },
  halls: { title: 'H' }, churchHireRates: [{ item: 'Core', rate: '£85' }],
} as any;

describe('assertHireSettings', () => {
  it('passes a well-formed object', () => {
    expect(() => assertHireSettings(valid)).not.toThrow();
  });
  it('throws when a page title is empty', () => {
    expect(() => assertHireSettings({ ...valid, halls: { title: '' } })).toThrow(/halls\.title/);
  });
  it('throws when the church-hire rate card is empty', () => {
    expect(() => assertHireSettings({ ...valid, churchHireRates: [] })).toThrow(/churchHireRates/);
  });
});
