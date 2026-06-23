import type { CollectionEntry } from 'astro:content';

export type HistoryChapter = CollectionEntry<'history'>;
export type PreparedChapter = HistoryChapter & { anchor: string };

/**
 * In-page anchor for a chapter: the collection-entry id with its leading "NN-"
 * order prefix removed. e.g. "01-before-the-church" → "before-the-church".
 * (Same approach as staffSlug in src/lib/staff.ts.)
 */
export function chapterAnchor(id: string): string {
  return id.replace(/^\d+-/, '');
}

/**
 * Chapters sorted by `order` (missing → last), each augmented with its anchor.
 * Pure: takes already-loaded entries so it can be unit-tested without astro:content.
 * The page loads the entries with getCollection() and passes them here.
 */
export function prepareChapters(entries: HistoryChapter[]): PreparedChapter[] {
  return [...entries]
    .sort((a, b) => (a.data.order ?? 99) - (b.data.order ?? 99))
    .map((entry) => ({ ...entry, anchor: chapterAnchor(entry.id) }));
}
