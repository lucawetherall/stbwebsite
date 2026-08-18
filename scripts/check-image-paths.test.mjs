// scripts/check-image-paths.test.mjs
import { describe, it, expect } from 'vitest';
import { findMissingImages } from './check-image-paths.mjs';

describe('findMissingImages', () => {
  it('returns paths that do not exist', () => {
    const refs = ['/images/a.webp', '/images/b.webp'];
    const exists = (p) => p.endsWith('a.webp'); // only a exists
    expect(findMissingImages(refs, exists)).toEqual(['/images/b.webp']);
  });
  it('returns empty when all exist', () => {
    expect(findMissingImages(['/images/a.webp'], () => true)).toEqual([]);
  });
  it('de-duplicates references', () => {
    expect(findMissingImages(['/images/x.webp', '/images/x.webp'], () => false)).toEqual(['/images/x.webp']);
  });
});
