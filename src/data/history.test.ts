import { describe, it, expect } from 'vitest';
import { assertHistoryPage, type HistoryPage } from './history';

const valid: HistoryPage = {
  kicker: 'About Us',
  title: 'The story of St Barnabas',
  intro: 'How our church came to be.',
  description: 'The history of St Barnabas Church, Ealing.',
  hero: { image: '/images/history/apse-painting.webp', alt: 'The apse painting.', caption: 'The apse painting.' },
  credits: 'Compiled by Hugh Mather.',
  onward: [],
};

describe('assertHistoryPage', () => {
  it('accepts a complete page', () => {
    expect(() => assertHistoryPage(valid)).not.toThrow();
  });
  it('throws naming the field when the title is blank', () => {
    expect(() => assertHistoryPage({ ...valid, title: '   ' })).toThrow(/title/);
  });
  it('throws when the hero image is missing', () => {
    expect(() => assertHistoryPage({ ...valid, hero: { ...valid.hero, image: '' } })).toThrow(/hero\.image/);
  });
  it('throws when the hero alt text is missing', () => {
    expect(() => assertHistoryPage({ ...valid, hero: { ...valid.hero, alt: '' } })).toThrow(/hero\.alt/);
  });
});
