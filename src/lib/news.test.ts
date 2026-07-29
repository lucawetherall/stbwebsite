import { describe, expect, it } from 'vitest';
import { groupByYear, neighboursOf, sortNewest, type NewsLike } from './news';

const post = (id: string, date: string, title = id): NewsLike => ({
  id,
  data: { title, date: new Date(date) },
});

// Deliberately out of order — the collection is not guaranteed to arrive sorted.
const posts = [
  post('c', '2019-03-04'),
  post('a', '2024-03-19'),
  post('e', '2018-01-01'),
  post('b', '2019-12-31'),
  post('d', '2019-02-01'),
];

describe('sortNewest', () => {
  it('orders newest first', () => {
    expect(sortNewest(posts).map((p) => p.id)).toEqual(['a', 'b', 'c', 'd', 'e']);
  });

  it('does not mutate the input', () => {
    const before = posts.map((p) => p.id);
    sortNewest(posts);
    expect(posts.map((p) => p.id)).toEqual(before);
  });
});

describe('groupByYear', () => {
  it('groups newest year first, newest post first within a year', () => {
    expect(groupByYear(posts)).toEqual([
      { year: 2024, posts: [posts[1]] },
      { year: 2019, posts: [posts[3], posts[0], posts[4]] },
      { year: 2018, posts: [posts[2]] },
    ]);
  });

  it('omits years with nothing in them rather than showing an empty heading', () => {
    expect(groupByYear(posts).map((g) => g.year)).not.toContain(2020);
  });

  it('reads a bare YYYY-MM-DD date as UTC, so 1 January stays in its own year', () => {
    // `new Date('2019-01-01')` is UTC midnight; a local-time read west of Greenwich gives 2018.
    expect(groupByYear([post('n', '2019-01-01')])[0].year).toBe(2019);
  });

  it('handles an empty archive', () => {
    expect(groupByYear([])).toEqual([]);
  });
});

describe('neighboursOf', () => {
  it('walks the archive in publication order', () => {
    const { previous, next } = neighboursOf(posts, 'c');
    expect(next?.id).toBe('b'); // published after c
    expect(previous?.id).toBe('d'); // published before c
  });

  it('has no next for the newest post and no previous for the oldest', () => {
    expect(neighboursOf(posts, 'a').next).toBeNull();
    expect(neighboursOf(posts, 'e').previous).toBeNull();
  });

  it('offers the nearest posts in time, excluding the post and its neighbours', () => {
    const { related } = neighboursOf(posts, 'c');
    expect(related.map((p) => p.id)).toEqual(['e', 'a']);
    expect(related.map((p) => p.id)).not.toContain('c');
    expect(related.map((p) => p.id)).not.toContain('b');
    expect(related.map((p) => p.id)).not.toContain('d');
  });

  it('respects the requested number of related posts', () => {
    expect(neighboursOf(posts, 'c', 1).related).toHaveLength(1);
  });

  it('returns empty neighbours for an unknown id rather than throwing', () => {
    expect(neighboursOf(posts, 'nope')).toEqual({ previous: null, next: null, related: [] });
  });

  it('copes with an archive of one', () => {
    const only = [post('solo', '2020-05-05')];
    expect(neighboursOf(only, 'solo')).toEqual({ previous: null, next: null, related: [] });
  });
});
