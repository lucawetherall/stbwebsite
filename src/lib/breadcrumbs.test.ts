import { describe, expect, it } from 'vitest';
import { crumbsFor } from './breadcrumbs';

const labels = (path: string, title?: string) =>
  crumbsFor(path, { title }).map((c) => c.label);

describe('crumbsFor', () => {
  it('returns Home alone for the homepage, so nothing is rendered', () => {
    expect(crumbsFor('/')).toEqual([{ label: 'Home', href: '/' }]);
  });

  it('builds a trail for a nav child', () => {
    expect(labels('/worship/sundays')).toEqual(['Home', 'Worship', 'Sundays']);
  });

  it('is insensitive to the trailing slash Astro emits', () => {
    expect(labels('/worship/sundays/')).toEqual(labels('/worship/sundays'));
  });

  it('follows the nav tree rather than the URL, so a root-level page keeps its section', () => {
    // /curious-about-christianity sits at the root but belongs under About in the menu.
    expect(labels('/curious-about-christianity')).toEqual([
      'Home',
      'About',
      'Curious about Christianity?',
    ]);
  });

  it('handles a three-deep section page', () => {
    expect(labels('/about-us/social-action/winter-night-shelter')).toEqual([
      'Home',
      'Community',
      'Winter Night Shelter',
    ]);
  });

  it('files the visiting page under About, where the menu puts it', () => {
    // Guards a silent failure: if this page ever falls out of nav.ts, chainToAncestor +
    // labelFromPath still produce a plausible-looking "Home › About › Visiting" with no error.
    expect(labels('/about-us/visiting')).toEqual(['Home', 'About', 'Visiting Us']);
  });

  it('hangs a news post off the News section, using its title', () => {
    expect(labels('/news/plant-sale', 'Plant Sale')).toEqual(['Home', 'News', 'Plant Sale']);
  });

  it('hangs a person off Who’s Who', () => {
    expect(labels('/about-us/whos-who/nick-barnes', 'Nick Barnes')).toEqual([
      'Home',
      'About',
      "Who's Who",
      'Nick Barnes',
    ]);
  });

  it('picks up utility pages that are not in the primary menu', () => {
    expect(labels('/venue-hire')).toEqual(['Home', 'Venue hire']);
  });

  it('falls back to a readable label for a page outside the nav tree entirely', () => {
    expect(labels('/some-new-page')).toEqual(['Home', 'Some new page']);
  });

  it('gives every crumb an absolute-from-root href ending without a trailing slash', () => {
    const crumbs = crumbsFor('/worship/sundays/');
    expect(crumbs.map((c) => c.href)).toEqual(['/', '/worship', '/worship/sundays']);
  });
});
