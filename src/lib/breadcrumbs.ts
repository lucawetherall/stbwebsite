/**
 * Breadcrumb trails derived from the navigation tree.
 *
 * The site is three levels deep in places (`/about-us/social-action/winter-night-shelter/`) and
 * gave a visitor no way to see where they were or climb back out. Rather than hand-write a trail
 * per page, we read it from `src/data/nav.ts`, which is already the single description of the
 * site's shape — so a trail can never drift from the menu.
 *
 * Two things the URL alone cannot tell us, and the tree can: that "Curious about Christianity?"
 * belongs under About despite sitting at the root, and what a section is actually *called*
 * ("About", not "about-us").
 */
import { nav, utilityNav, type NavItem } from '../data/nav';
import type { Crumb } from './seo';

export type { Crumb };

const HOME: Crumb = { label: 'Home', href: '/' };

const normalise = (p: string): string => {
  const trimmed = p.replace(/\/+$/, '');
  return trimmed === '' ? '/' : trimmed;
};

/** The chain of nav items ending at `href`, or null if this href is not in the tree. */
function chainTo(items: NavItem[], href: string, trail: NavItem[] = []): NavItem[] | null {
  for (const item of items) {
    const next = [...trail, item];
    if (normalise(item.href) === href) return next;
    const deeper = item.children ? chainTo(item.children, href, next) : null;
    if (deeper) return deeper;
  }
  return null;
}

/** The deepest nav item whose href is a URL ancestor of `href`, with its own chain. */
function chainToAncestor(href: string): NavItem[] | null {
  let best: NavItem[] | null = null;
  const walk = (items: NavItem[], trail: NavItem[]): void => {
    for (const item of items) {
      const next = [...trail, item];
      const itemHref = normalise(item.href);
      if (itemHref !== '/' && href.startsWith(itemHref + '/')) {
        if (!best || itemHref.length > normalise(best[best.length - 1].href).length) best = next;
      }
      if (item.children) walk(item.children, next);
    }
  };
  walk([...nav, ...utilityNav], []);
  return best;
}

export interface CrumbOptions {
  /** Title for the current page when it is not itself a nav entry (a news post, a person). */
  title?: string;
}

/**
 * The trail for a pathname, always starting at Home and ending at the current page.
 * A single-item result (the homepage) means "render nothing" — see Breadcrumbs.astro.
 */
export function crumbsFor(pathname: string, { title }: CrumbOptions = {}): Crumb[] {
  const path = normalise(pathname);
  if (path === '/') return [HOME];

  const toCrumbs = (chain: NavItem[]): Crumb[] =>
    chain.map((item) => ({ label: item.label, href: normalise(item.href) }));

  // The page is itself a nav entry: the tree gives the whole trail, labels included.
  const exact = chainTo([...nav, ...utilityNav], path);
  if (exact) return [HOME, ...toCrumbs(exact)];

  // Otherwise hang it off the deepest section that contains it.
  const ancestor = chainToAncestor(path);
  const leaf: Crumb = { label: title ?? labelFromPath(path), href: path };
  if (ancestor) return [HOME, ...toCrumbs(ancestor), leaf];

  return [HOME, leaf];
}

/** Last-resort label: "/venue-hire" → "Venue hire". Only used for pages outside the nav tree. */
function labelFromPath(path: string): string {
  const last = path.split('/').filter(Boolean).pop() ?? '';
  const words = last.replace(/-/g, ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}
