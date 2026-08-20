// src/lib/youtube.test.ts
import { describe, it, expect } from 'vitest';
import { youtubeId, youtubeEmbedUrl } from './youtube';

describe('youtubeId', () => {
  it('parses a standard watch URL', () => {
    expect(youtubeId('https://www.youtube.com/watch?v=x6XVNkIXqlU')).toBe('x6XVNkIXqlU');
  });
  it('parses a youtu.be short URL', () => {
    expect(youtubeId('https://youtu.be/tvX1nPE_fKc')).toBe('tvX1nPE_fKc');
  });
  it('throws on a non-YouTube URL', () => {
    expect(() => youtubeId('https://example.com/video')).toThrow();
  });
});

describe('youtubeEmbedUrl', () => {
  it('builds a privacy (nocookie) embed URL', () => {
    expect(youtubeEmbedUrl('https://www.youtube.com/watch?v=UIaTngP-l-4')).toBe(
      'https://www.youtube-nocookie.com/embed/UIaTngP-l-4'
    );
  });
});
