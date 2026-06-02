export interface Hero {
  image: string;
  alt: string;
  credit?: string;
  focal?: string;
}

// Maps a liturgical feast/season `key` (from liturgy.ts) → a hero artwork.
// Default = the parish's own liturgy photography. Seeded with the three
// images the brief calls out; the remaining seasons spread across the same
// parish photos until curated public-domain feast paintings are added.
// (Flagged in DECISIONS.md — eventual direction is Old Master religious
// paintings depicting each feast's subject.)
export const artwork: Record<string, Hero> = {
  default: {
    image: '/images/hero/thurible.webp',
    alt: 'Incense rising from the thurible at the Sung Mass',
    focal: 'center 32%',
  },
  'ordinary-time': {
    image: '/images/hero/procession.webp',
    alt: 'The Sunday procession through the nave',
    focal: 'center 40%',
  },
  eastertide: {
    image: '/images/hero/altar.webp',
    alt: 'The high altar dressed for the Eastertide liturgy',
    focal: 'center 38%',
  },
  pentecost: {
    image: '/images/hero/thurible.webp',
    alt: 'Incense rising at the Sung Mass',
    focal: 'center 32%',
  },
  advent: {
    image: '/images/hero/worship.webp',
    alt: 'The congregation gathered for worship',
    focal: 'center 40%',
  },
  christmastide: {
    image: '/images/hero/altar.webp',
    alt: 'The high altar of St Barnabas',
    focal: 'center 38%',
  },
  epiphany: {
    image: '/images/hero/procession.webp',
    alt: 'The Sunday procession through the nave',
    focal: 'center 40%',
  },
  lent: {
    image: '/images/hero/thurible.webp',
    alt: 'Incense rising from the thurible',
    focal: 'center 32%',
  },
  'holy-week': {
    image: '/images/hero/altar.webp',
    alt: 'The high altar of St Barnabas',
    focal: 'center 38%',
  },
};

export function heroFor(key: string): Hero {
  return artwork[key] ?? artwork.default;
}
