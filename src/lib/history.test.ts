import { describe, it, expect } from 'vitest';
import { chapterAnchor, prepareChapters } from './history';

describe('chapterAnchor', () => {
  it('strips the NN- order prefix', () => {
    expect(chapterAnchor('01-before-the-church')).toBe('before-the-church');
  });
  it('handles multi-digit prefixes', () => {
    expect(chapterAnchor('10-a-living-church-today')).toBe('a-living-church-today');
  });
});

describe('prepareChapters', () => {
  const make = (id: string, order: number) =>
    ({ id, data: { order, year: '', title: '' } }) as never;
  it('sorts by order and attaches a stable anchor', () => {
    const out = prepareChapters([make('03-c', 3), make('01-a', 1), make('02-b', 2)]);
    expect(out.map((c) => c.id)).toEqual(['01-a', '02-b', '03-c']);
    expect(out[0].anchor).toBe('a');
  });
});
