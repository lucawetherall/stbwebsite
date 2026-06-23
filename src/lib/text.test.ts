import { describe, it, expect } from 'vitest';
import { firstSentence } from './text';

describe('firstSentence', () => {
  it('returns the first sentence up to and including its full stop', () => {
    const bio =
      'Luca is a conductor, singing teacher, pianist and musicologist. He is a Tutor in Music at the University of Oxford.';
    expect(firstSentence(bio)).toBe(
      'Luca is a conductor, singing teacher, pianist and musicologist.'
    );
  });

  it('returns the whole string when there is no sentence-ending punctuation', () => {
    expect(firstSentence('Organist and choir trainer')).toBe('Organist and choir trainer');
  });

  it('trims surrounding whitespace', () => {
    expect(firstSentence('  Hello there. More text.  ')).toBe('Hello there.');
  });

  it('handles a question or exclamation as a sentence end', () => {
    expect(firstSentence('Curious about singing? Come along.')).toBe('Curious about singing?');
  });
});
