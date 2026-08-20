import { getCollection, type CollectionEntry } from 'astro:content';

/**
 * Clean URL slug for a staff member: the collection-entry id with its leading
 * "NN-" order prefix removed.  e.g. "01-sarah-howard-jones" → "sarah-howard-jones".
 * CMS-created files (slug template "{{order}}-{{name}}", e.g. "8-john-smith")
 * resolve the same way, so links stay stable as editors add people.
 */
export function staffSlug(id: string): string {
  return id.replace(/^\d+-/, '');
}

const HONORIFIC = /^(?:the\s+)?(?:mother|mtr|father|fr|rev'?d?|reverend|canon|dr|mr|mrs|ms|miss)\.?\s+/i;

/**
 * Monogram initials for a person without a photo: first + last name initial,
 * with any leading honorific (Mother, Mtr, Fr…) stripped first.
 * "Mother Sarah Howard-Jones" → "SH", "Hugh Mather" → "HM".
 */
export function staffInitials(name: string): string {
  const parts = name.replace(HONORIFIC, '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  const first = parts[0][0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] ?? '' : '';
  return (first + last).toUpperCase();
}

/** First name with any honorific stripped: "Mother Sarah Howard-Jones" → "Sarah". */
export function staffFirstName(name: string): string {
  return name.replace(HONORIFIC, '').trim().split(/\s+/)[0] ?? '';
}

export type RosterMember = CollectionEntry<'staff'> & { slug: string };

/**
 * The Who's Who roster, sorted by `order` (missing → last), each augmented with
 * its URL slug. Single source of truth shared by StaffGrid and the [person]
 * detail route so their links can never drift apart.
 */
export async function getRoster(): Promise<RosterMember[]> {
  const people = await getCollection('staff');
  const roster = people
    .sort((a, b) => (a.data.order ?? 99) - (b.data.order ?? 99))
    .map((person) => ({ ...person, slug: staffSlug(person.id) }));
  // Two files like "3-john-smith" and "13-john-smith" would collapse to one URL and
  // silently build a single page for two people — fail the build with a clear message
  // instead, so whoever added the duplicate can rename the file.
  const seen = new Map<string, string>();
  for (const person of roster) {
    const other = seen.get(person.slug);
    if (other) {
      throw new Error(
        `Who's Who: "${person.id}" and "${other}" both resolve to the URL slug "${person.slug}". ` +
          'Rename one file (the part after the number must be unique) so each person gets their own page.'
      );
    }
    seen.set(person.slug, person.id);
  }
  return roster;
}
