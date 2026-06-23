export interface NavItem {
  label: string;
  href: string;
  children?: NavItem[];
  cta?: boolean;
}

export const nav: NavItem[] = [
  { label: 'Visit', href: '/visit' },
  {
    label: 'Worship',
    href: '/worship',
    children: [
      { label: 'Sundays', href: '/worship/sundays' },
      { label: 'Weekdays', href: '/worship/weekdays' },
      { label: 'Special Services', href: '/worship/special-services' },
      { label: 'Life Events', href: '/life-events' },
      { label: 'Worship Online', href: '/worship/online' },
    ],
  },
  {
    label: 'Music',
    href: '/worship/music',
    children: [
      { label: 'St Barnabas Organ', href: '/worship/st-barnabas-organ' },
    ],
  },
  {
    label: 'About',
    href: '/about-us',
    children: [
      { label: "Who's Who", href: '/about-us/whos-who' },
      { label: 'Our History', href: '/about-us/history' },
      { label: 'Pastoral Care', href: '/about-us/pastoral-care' },
      {
        label: 'Social Action',
        href: '/about-us/social-action',
        children: [
          { label: 'Winter Night Shelter', href: '/about-us/social-action/winter-night-shelter' },
        ],
      },
      { label: 'Curious about Christianity?', href: '/curious-about-christianity' },
      { label: 'Accessibility', href: '/about-us/accessibility' },
    ],
  },
  {
    label: 'Families',
    href: '/families-children',
    children: [
      { label: 'Noisy Mass', href: '/families-children/noisy' },
      { label: "Children's Church", href: '/families-children/childrens-church-ages-5-9' },
      { label: 'Youth Group', href: '/families-children/youth-group' },
    ],
  },
  {
    label: 'Community',
    href: '/community',
    children: [
      { label: 'Food Pantry', href: '/community/food-pantry-at-st-barnabas' },
      { label: 'Memory Café', href: '/community/memory-cafe' },
      { label: 'Pitshanger Pictures', href: '/community/pitshanger-pictures' },
    ],
  },
  { label: 'News', href: '/news' },
  { label: 'Give', href: '/give', cta: true },
];

// Utility links (footer / overflow)
export const utilityNav: NavItem[] = [
  { label: 'Contact', href: '/contact-us' },
  { label: 'Venue hire', href: '/venue-hire' },
  { label: 'Documents', href: '/documents' },
  { label: 'Safeguarding', href: '/safeguarding' },
];
