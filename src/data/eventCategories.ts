/**
 * The vocabulary of event categories, kept in a leaf module with no imports so that
 * `src/content.config.ts` and `src/lib/events.ts` can both use it without the content
 * config having to reach into a module that touches `astro:content`.
 *
 * Adding a category here means adding it to the `category` select in
 * `public/admin/config.yml` too — see the `cms-dual-write` skill.
 */
export const EVENT_CATEGORIES = [
  'Worship',
  'Music',
  'Community',
  'Families',
  'Talks & Learning',
] as const;

export type EventCategory = (typeof EVENT_CATEGORIES)[number];

export const DEFAULT_EVENT_CATEGORY: EventCategory = 'Worship';

/**
 * Best-effort mapping of a free-text category (an iCal CATEGORIES value, say) onto our
 * vocabulary. Anything unrecognised falls back to Worship rather than inventing a category.
 */
export function toEventCategory(value: string | undefined): EventCategory {
  if (!value) return DEFAULT_EVENT_CATEGORY;
  const first = value.split(',')[0].trim().toLowerCase();
  const exact = EVENT_CATEGORIES.find((c) => c.toLowerCase() === first);
  if (exact) return exact;
  if (/music|concert|recital|organ|choir|choral/.test(first)) return 'Music';
  if (/family|families|children|youth|child/.test(first)) return 'Families';
  if (/talk|lecture|course|study|learn/.test(first)) return 'Talks & Learning';
  if (/community|social|pantry|caf[eé]|cinema|hall/.test(first)) return 'Community';
  return DEFAULT_EVENT_CATEGORY;
}
