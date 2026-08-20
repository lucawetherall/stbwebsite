import { describe, expect, it } from 'vitest';
import sharp from 'sharp';
import { imageSibling, imageSrcset, webpWidth } from './images';

// Real committed assets, so the tests exercise the same files the build serves.
const HERO = '/images/hero/altar.webp';
const HERO_FILE = 'public/images/hero/altar.webp';

describe('webpWidth', () => {
  it('reads the same width sharp does, from the header alone', async () => {
    const meta = await sharp(HERO_FILE).metadata();
    expect(webpWidth(HERO_FILE)).toBe(meta.width);
  });

  it('is undefined for a missing or non-WebP file', () => {
    expect(webpWidth('public/images/no-such-file.webp')).toBeUndefined();
    expect(webpWidth('public/favicon.svg')).toBeUndefined();
  });
});

describe('imageSibling', () => {
  it('finds a sibling that exists on disk', () => {
    expect(imageSibling(HERO, 1280)).toBe('/images/hero/altar-1280.webp');
  });

  it('returns undefined for a sibling nobody has generated', () => {
    expect(imageSibling(HERO, 3200)).toBeUndefined();
  });

  it('returns undefined outside the house convention, rather than inventing a file', () => {
    // (a non-/images path, so the build's check-image-paths guard ignores the fixture)
    expect(imageSibling('/media/legacy-photo.jpeg', 800)).toBeUndefined();
    expect(imageSibling('https://example.org/pic.webp', 800)).toBeUndefined();
  });
});

describe('imageSrcset', () => {
  it('offers only siblings that exist, with measured widths, narrowest first', async () => {
    const srcset = imageSrcset(HERO);
    expect(srcset).toBeDefined();
    const entries = srcset!.split(', ');
    // every candidate names a real file and its real pixel width
    for (const entry of entries) {
      const [url, w] = entry.split(' ');
      const meta = await sharp(`public${url}`).metadata();
      expect(`${meta.width}w`).toBe(w);
    }
    // ascending order
    const widths = entries.map((e) => Number(e.split(' ')[1].replace('w', '')));
    expect([...widths].sort((a, b) => a - b)).toEqual(widths);
  });

  it('is undefined when no sibling exists — plain src serves instead', () => {
    // a CMS upload with no prep-script siblings must not advertise 404 candidates
    expect(imageSrcset('/images/og-default.jpg')).toBeUndefined();
  });
});
