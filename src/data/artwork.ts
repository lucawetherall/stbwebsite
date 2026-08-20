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

  // ---- Feast days (engine keys from liturgy.ts). Drawn from the parish's seasonal
  // photography in /images/worship rather than recycling the four hero photos.
  // Feasts without a key here fall back to `default` deliberately (add-feast skill).
  'the-epiphany': {
    image: '/images/hero/procession.webp',
    alt: 'The Sunday procession through the nave',
    focal: 'center 40%',
  },
  candlemas: {
    image: '/images/worship/candlelit-mass.webp',
    alt: 'The Mass by candlelight at Candlemas',
    focal: 'center 45%',
  },
  'ash-wednesday': {
    image: '/images/worship/candlelit-mass.webp',
    alt: 'A candlelit Mass at the beginning of Lent',
    focal: 'center 45%',
  },
  'mothering-sunday': {
    image: '/images/hero/worship.webp',
    alt: 'The congregation gathered for worship',
    focal: 'center 40%',
  },
  'palm-sunday': {
    image: '/images/hero/procession.webp',
    alt: 'The procession through the nave on Palm Sunday',
    focal: 'center 40%',
  },
  'maundy-thursday': {
    image: '/images/worship/candlelit-mass.webp',
    alt: 'The Mass of the Last Supper by candlelight',
    focal: 'center 45%',
  },
  'good-friday': {
    image: '/images/hero/thurible.webp',
    alt: 'Incense rising in the stillness of Good Friday',
    focal: 'center 32%',
  },
  'holy-saturday': {
    image: '/images/worship/easter-eve.webp',
    alt: 'Lighting the new fire at the Easter Vigil',
    focal: 'center 40%',
  },
  'easter-day': {
    image: '/images/worship/easter-eve.webp',
    alt: 'The paschal candle burning at Easter',
    focal: 'center 40%',
  },
  'remembrance-sunday': {
    image: '/images/worship/remembrance.webp',
    alt: 'The act of remembrance at the war memorial',
    focal: 'center 40%',
  },
  'advent-sunday': {
    image: '/images/worship/carols.webp',
    alt: 'Carols by candlelight as the church waits for Christmas',
    focal: 'center 40%',
  },
  'christmas-eve': {
    image: '/images/worship/carols.webp',
    alt: 'The church by candlelight on Christmas Eve',
    focal: 'center 40%',
  },
  'christmas-day': {
    image: '/images/worship/carols.webp',
    alt: 'The church aglow with candles at Christmas',
    focal: 'center 40%',
  },
};

export function heroFor(key: string): Hero {
  return artwork[key] ?? artwork.default;
}
