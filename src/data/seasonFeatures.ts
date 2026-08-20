/**
 * The seasonal features — the copy for each of the seasons the site lifts up.
 *
 * Developer-owned, like nav.ts and artwork.ts (the homepage "cornerstone" layer,
 * docs/AGENT-GUARDRAILS.md §A). The *services* each feature lists are not written here:
 * they are derived from the music list (src/content/services) by src/lib/seasons.ts,
 * gathered by liturgical date, so the wording of every service is the Director of
 * Music's own and the feature can never fall out of step with the printed list.
 *
 * `standfirst` is required, with no shared default, so a cheerful fallback can never
 * ship onto the Triduum. `notice: true` admits a feature to the site-wide notice line —
 * Christmas and Holy Week only: a banner is information when strangers are looking for
 * a church, and marketing the rest of the year. The Requiem in particular is never a
 * banner; it is an act of mercy, addressed quietly to the bereaved.
 */

export interface SeasonFeatureDef {
  key: 'holy-week' | 'christmas' | 'ash-wednesday' | 'requiem' | 'evensong';
  /** Tracked uppercase card label. */
  title: string;
  /** A later label, switched to close to the season's heart (Christmas only). */
  lateTitle?: string;
  /** One line beneath the label, Cormorant italic. Required — see above. */
  standfirst: string;
  ctaLabel: string;
  href: string;
  /** May this feature appear in the site-wide notice line? */
  notice: boolean;
  /** The notice line's link text (when `notice`). */
  noticeLabel?: string;
}

/** In priority order: the first with services to show wins. */
export const SEASON_FEATURES: SeasonFeatureDef[] = [
  {
    key: 'holy-week',
    title: 'Holy Week & Easter',
    standfirst:
      'From Palm Sunday to Easter Day, we walk with Christ through his Passion to the joy of the Resurrection.',
    ctaLabel: 'The services of Holy Week',
    href: '/worship/special-services',
    notice: true,
    noticeLabel: 'Our Holy Week and Easter services',
  },
  {
    key: 'christmas',
    title: 'Advent & Christmas at St Barnabas',
    lateTitle: 'Christmas at St Barnabas',
    standfirst:
      'Carols by candlelight, the Mass of midnight, and the joy of Christmas morning. Everyone is welcome — there is nothing to book.',
    ctaLabel: 'All our Christmas services',
    href: '/worship/special-services',
    notice: true,
    noticeLabel: 'Our Christmas services',
  },
  {
    key: 'ash-wednesday',
    title: 'Ash Wednesday · Lent begins',
    standfirst:
      'Lent begins with the sign of ashes — a quiet evening Mass of penitence and hope. All are welcome.',
    ctaLabel: 'Keeping Lent at St Barnabas',
    href: '/worship/special-services',
    notice: false,
  },
  {
    key: 'requiem',
    title: 'Remembering the departed',
    standfirst:
      'A Requiem Mass for those we love but see no longer. If you have been bereaved, whether recently or long ago, you are especially welcome.',
    ctaLabel: 'About this service',
    href: '/worship/special-services',
    notice: false,
  },
  {
    key: 'evensong',
    title: 'Choral Evensong',
    standfirst:
      'Sung psalms, canticles and prayer at the close of the day — come and sit, listen and rest.',
    ctaLabel: "This month's music",
    href: '/music',
    notice: false,
  },
];
