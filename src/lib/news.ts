/**
 * Shaping the news archive.
 *
 * There are ~129 posts, going back to 2018, and until now they were presented as one
 * undifferentiated list at `/news` — the only route to any of them. Every post therefore had
 * exactly one inbound link, which is poor for a reader looking for something from a particular
 * year and poor for a crawler working out which posts matter.
 *
 * These helpers do two things: group the archive by year so it can be skimmed, and give each
 * post neighbours to link to. Both are pure functions over the sorted post list, so they are
 * unit-tested rather than eyeballed in the browser.
 */

/** The shape we need from a `news` collection entry — kept structural so tests need no fixtures. */
export interface NewsLike {
  id: string;
  data: { title: string; date: Date; category?: string };
}

/** Newest first — the order the archive is read in. */
export function sortNewest<T extends NewsLike>(posts: T[]): T[] {
  return [...posts].sort((a, b) => +b.data.date - +a.data.date);
}

export interface YearGroup<T> {
  year: number;
  posts: T[];
}

/**
 * The archive grouped by calendar year, newest year first and newest post first within a year.
 * Years with no posts simply do not appear — the parish published nothing that year, and an
 * empty heading would say nothing useful.
 */
export function groupByYear<T extends NewsLike>(posts: T[]): YearGroup<T>[] {
  const groups = new Map<number, T[]>();
  for (const post of sortNewest(posts)) {
    // getUTCFullYear, not getFullYear: dates are authored as bare `YYYY-MM-DD` and parsed as
    // UTC midnight, so a local timezone west of Greenwich would otherwise shift a 1 January
    // post into the previous year.
    const year = post.data.date.getUTCFullYear();
    const bucket = groups.get(year);
    if (bucket) bucket.push(post);
    else groups.set(year, [post]);
  }
  return [...groups.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([year, yearPosts]) => ({ year, posts: yearPosts }));
}

export interface Neighbours<T> {
  /** The post published immediately before this one. */
  previous: T | null;
  /** The post published immediately after this one. */
  next: T | null;
  /** Nearest in time, excluding the post itself and its immediate neighbours. */
  related: T[];
}

/**
 * Neighbours for a single post. "Related" is nearest-in-time rather than same-category: 126 of
 * the 129 posts carry the category "News", so category would group everything with everything.
 * Posts published around the same time are genuinely the parish's news of that season.
 */
export function neighboursOf<T extends NewsLike>(
  posts: T[],
  id: string,
  relatedCount = 3
): Neighbours<T> {
  const ordered = sortNewest(posts);
  const index = ordered.findIndex((p) => p.id === id);
  if (index === -1) return { previous: null, next: null, related: [] };

  // `ordered` is newest first, so the *next* post in publication order sits at a lower index.
  const next = ordered[index - 1] ?? null;
  const previous = ordered[index + 1] ?? null;

  const excluded = new Set([id, next?.id, previous?.id].filter(Boolean) as string[]);
  const related = ordered
    .filter((p) => !excluded.has(p.id))
    .map((p) => ({ post: p, distance: Math.abs(+p.data.date - +ordered[index].data.date) }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, relatedCount)
    .map((x) => x.post);

  return { previous, next, related };
}
