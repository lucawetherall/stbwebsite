// src/data/hire.ts
import data from '../content/settings/hire.json';

export interface HireImage { image: string; alt: string; }
export interface GalleryImage { src: string; alt: string; }
export interface HireFilm { youtubeUrl: string; title: string; ensemble: string; poster: string; posterAlt: string; }
export interface HallRate { space: string; size: string; capacity: string; day: string; eve: string; }
export interface RateLine { item: string; rate: string; }

export interface HirePageBase { kicker: string; title: string; intro: string; description: string; hero: HireImage; body: string[]; }
export interface HireRecordings extends HirePageBase { films: HireFilm[]; gallery: GalleryImage[]; }
export interface HireConcerts extends HirePageBase { capacity: string; gallery: GalleryImage[]; }
export interface HireHalls extends HirePageBase { rates: HallRate[]; ratesNote: string; gallery: GalleryImage[]; }

export interface HireSettings {
  hub: HirePageBase;
  recordings: HireRecordings;
  concerts: HireConcerts;
  halls: HireHalls;
  churchHireRates: RateLine[];
  churchHireNote: string;
}

/** Throws (failing the build) if the editor has emptied a field a Hire page depends on. */
export function assertHireSettings(h: HireSettings): void {
  const required: Array<[string, unknown]> = [
    ['hub.title', h.hub?.title],
    ['recordings.title', h.recordings?.title],
    ['concerts.title', h.concerts?.title],
    ['halls.title', h.halls?.title],
    ['churchHireRates', h.churchHireRates?.length],
  ];
  const missing = required.filter(([, v]) => !v || String(v).trim() === '').map(([k]) => k);
  if (missing.length) {
    throw new Error(
      `hire.json is missing required field(s): ${missing.join(', ')}. ` +
        'Refusing to build with a broken Hire section.'
    );
  }
}

assertHireSettings(data as HireSettings);

export const hire: HireSettings = data as HireSettings;
