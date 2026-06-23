import data from '../content/settings/historyPage.json';

export interface OnwardLink {
  label: string;
  href: string;
}
export interface HistoryHero {
  image: string;
  alt: string;
  caption: string;
}
export interface HistoryPage {
  kicker: string;
  title: string;
  intro: string;
  description: string;
  hero: HistoryHero;
  credits: string;
  onward: OnwardLink[];
}

/** Throws (failing the build) if the editor has emptied a field the History page depends on. */
export function assertHistoryPage(p: HistoryPage): void {
  const required: Array<[string, unknown]> = [
    ['title', p.title],
    ['intro', p.intro],
    ['hero.image', p.hero?.image],
    ['hero.alt', p.hero?.alt],
    ['credits', p.credits],
  ];
  const missing = required.filter(([, v]) => !v || String(v).trim() === '').map(([k]) => k);
  if (missing.length) {
    throw new Error(
      `historyPage.json is missing required field(s): ${missing.join(', ')}. ` +
        'Refusing to build with a broken History page.'
    );
  }
}

assertHistoryPage(data as HistoryPage);

export const historyPage = data as HistoryPage;
