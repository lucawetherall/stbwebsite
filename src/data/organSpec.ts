// The Nicholson & Co. specification of the St Barnabas organ — fixed scholarly data,
// developer-owned and version-controlled (NOT editor-facing via the CMS).
// Pitch values are display strings using the prime mark ′ (U+2032) and unicode fractions.
// `pipes` is recorded for completeness but intentionally not displayed.

export interface Stop {
  /** Official stop number 1–45 (Pedal 1–7, Choir 8–15, Great 16–30, Swell 31–45). */
  n: number;
  name: string;
  /** Display pitch, e.g. "8′", "2⅔′"; omitted for mixtures. */
  feet?: string;
  /** Number of ranks, for mixtures (rendered as Roman numerals: III, II). */
  ranks?: number;
  /** Mixture composition, e.g. "15.19.22". */
  composition?: string;
  /** Pipe count — kept as a faithful record; not rendered. */
  pipes: number;
  /** Short scholarly remark, e.g. "from C13". */
  note?: string;
  /** Marks an editorial [sic] — preserves a curiosity in the source faithfully. */
  sic?: boolean;
}

export interface Division {
  /** "Great Organ", "Swell Organ", … */
  name: string;
  /** Compass as a display string, e.g. "C–g³" / "C–f¹". */
  compass: string;
  /** Number of notes in the compass (56 manuals, 30 pedals). */
  compassNotes: number;
  stops: Stop[];
  /** Couplers / playing notes printed under the stop list, in italic. */
  couplers?: string[];
}

export interface MechanismGroup {
  label: string;
  items: string[];
}

export interface OrganSpec {
  summary: { manuals: string; stops: string; builder: string; rebuild: string };
  /** Concise builder credit shown beneath the spec heading. */
  attribution: string;
  divisions: Division[];
  mechanism: MechanismGroup[];
}

const ROMAN: Record<number, string> = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V' };
export const toRoman = (n: number): string => ROMAN[n] ?? String(n);

export const organSpec: OrganSpec = {
  summary: {
    manuals: 'Three manuals & pedals',
    stops: '45 speaking stops',
    builder: 'William Hill & Son, London, 1877',
    rebuild: 'rebuilt by Nicholson & Co., Malvern, 2011',
  },
  attribution:
    'William Hill & Son, London, 1877 (action renewed 1912); rebuilt & restored by ' +
    'Nicholson & Co., Malvern, 2011. Incorporating Gerard Smith’s organ of 1851, ' +
    'formerly at St Jude’s Church, Southsea. Manual compass C–g³ (56 notes); ' +
    'pedal compass C–f¹ (30 notes). Pitch A = 440 Hz.',

  divisions: [
    {
      name: 'Great Organ',
      compass: 'C–g³',
      compassNotes: 56,
      stops: [
        { n: 16, name: 'Double Diapason', feet: '16′', pipes: 56 },
        { n: 17, name: 'Open Diapason I', feet: '8′', pipes: 56 },
        { n: 18, name: 'Open Diapason II', feet: '8′', pipes: 56 },
        { n: 19, name: 'Gamba', feet: '8′', pipes: 56 },
        { n: 20, name: 'Claribel', feet: '8′', pipes: 56 },
        { n: 21, name: 'Stopped Diapason', feet: '8′', pipes: 56 },
        { n: 22, name: 'Principal', feet: '4′', pipes: 56 },
        { n: 23, name: 'Harmonic Flute', feet: '4′', pipes: 56 },
        { n: 24, name: 'Twelfth', feet: '2⅔′', pipes: 56 },
        { n: 25, name: 'Fifteenth', feet: '2′', pipes: 56 },
        { n: 26, name: 'Mixture', ranks: 3, composition: '15.19.22', pipes: 168 },
        { n: 27, name: 'Mixture', ranks: 2, composition: '26.29', pipes: 112 },
        { n: 28, name: 'Posaune', feet: '8′', pipes: 56 },
        { n: 29, name: 'Trumpet', feet: '8′', pipes: 56 },
        { n: 30, name: 'Clarion', feet: '4′', pipes: 56 },
      ],
      couplers: ['Swell to Great'],
    },
    {
      name: 'Swell Organ',
      compass: 'C–g³',
      compassNotes: 56,
      stops: [
        { n: 31, name: 'Bourdon', feet: '16′', pipes: 56 },
        { n: 32, name: 'Open Diapason', feet: '8′', pipes: 56 },
        { n: 33, name: 'Stopped Diapason', feet: '8′', pipes: 56 },
        { n: 34, name: 'Keraulophon', feet: '8′', pipes: 56 },
        { n: 35, name: 'Salicional', feet: '8′', pipes: 56 },
        { n: 36, name: 'Vox Angelica', feet: '8′', pipes: 44, note: 'from C13' },
        { n: 37, name: 'Principal', feet: '4′', pipes: 56 },
        { n: 38, name: 'Fifteenth', feet: '2′', pipes: 56 },
        { n: 39, name: 'Piccolo', feet: '2′', pipes: 56 },
        { n: 40, name: 'Mixture', ranks: 3, composition: '15.19.22', pipes: 168 },
        { n: 41, name: 'Double Trumpet', feet: '16′', pipes: 56 },
        { n: 42, name: 'Cornopean', feet: '8′', pipes: 56 },
        { n: 43, name: 'Oboe', feet: '8′', pipes: 56 },
        { n: 44, name: 'Vox Humana', feet: '8′', pipes: 56 },
        { n: 45, name: 'Clarion', feet: '4′', pipes: 56 },
      ],
      couplers: ['Tremulant', 'Sub Octave', 'Octave'],
    },
    {
      name: 'Choir Organ',
      compass: 'C–g³',
      compassNotes: 56,
      stops: [
        { n: 8, name: 'Lieblich Bourdon', feet: '16′', pipes: 56 },
        { n: 9, name: 'Gamba', feet: '8′', pipes: 56 },
        { n: 10, name: 'Lieblich Gedeckt', feet: '8′', pipes: 56 },
        { n: 11, name: 'Dulciana', feet: '8′', pipes: 56 },
        { n: 12, name: 'Gemshorn', feet: '4′', pipes: 56 },
        { n: 13, name: 'Suabe Flute', feet: '4′', pipes: 56 },
        { n: 14, name: 'Flageolet', feet: '2′', pipes: 56 },
        { n: 15, name: 'Clarinet', feet: '8′', pipes: 56 },
      ],
      couplers: ['Great Reeds on Choir', 'Swell to Choir'],
    },
    {
      name: 'Pedal Organ',
      compass: 'C–f¹',
      compassNotes: 30,
      stops: [
        { n: 1, name: 'Open Diapason', feet: '16′', pipes: 30 },
        { n: 2, name: 'Violone', feet: '16′', pipes: 30 },
        { n: 3, name: 'Bourdon', feet: '16′', pipes: 30 },
        { n: 4, name: 'Quint', feet: '12′', pipes: 30, sic: true },
        { n: 5, name: 'Principal', feet: '8′', pipes: 30 },
        { n: 6, name: 'Bass Flute', feet: '8′', pipes: 30 },
        { n: 7, name: 'Trombone', feet: '16′', pipes: 30 },
      ],
      couplers: ['Choir to Pedal', 'Great to Pedal', 'Swell to Pedal'],
    },
  ],

  mechanism: [
    {
      label: 'Actions',
      items: ['Manuals and pedals — electro-pneumatic', 'Sliders — electric solenoid'],
    },
    {
      label: 'Accessories',
      items: [
        'Balanced expression pedal to Swell',
        '6 toe levers to Pedal',
        '6 thumb pistons each to Choir and Great',
        '6 toe levers and thumb pistons to Swell',
        '8 general thumb pistons',
        'Setter thumb piston',
        'General cancel thumb piston',
        'Reversible toe levers: Great to Pedal, Swell to Great',
        'Reversible thumb pistons: Choir to Pedal, Great to Pedal, Swell to Pedal, Swell to Choir, Swell to Great',
        'Combination couplers: Great Pistons to Pedal',
        '16 divisional memory levels',
        '96 general memory levels',
      ],
    },
    {
      label: 'Wind pressures',
      items: ['All on 80 mm, except:', 'Great Organ reeds — 140 mm', 'Trombone 16′ — 140 / 160 mm'],
    },
    {
      label: 'Pitch',
      items: ['A = 440 Hz'],
    },
  ],
};
