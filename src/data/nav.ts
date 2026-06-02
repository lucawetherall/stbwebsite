export interface NavItem {
  label: string;
  href: string;
  children?: NavItem[];
}

export const nav: NavItem[] = [
  { label: 'Visit', href: '/visit' },
  {
    label: 'About Us',
    href: '/about-us',
    children: [
      { label: "Who's Who", href: '/about-us/whos-who' },
      { label: 'Accessibility', href: '/about-us/accessibility' },
      { label: 'Pastoral Care', href: '/about-us/pastoral-care' },
      {
        label: 'Social Action',
        href: '/about-us/social-action',
        children: [
          { label: 'Winter Night Shelter', href: '/about-us/social-action/winter-night-shelter' },
        ],
      },
    ],
  },
  {
    label: 'Worship',
    href: '/worship',
    children: [
      { label: 'Sundays', href: '/worship/sundays' },
      { label: 'Weekdays', href: '/worship/weekdays' },
      { label: 'Special Services', href: '/worship/special-services' },
      { label: 'Worship Online', href: '/worship/online' },
      { label: 'Music', href: '/worship/music' },
      { label: 'St Barnabas Organ', href: '/worship/st-barnabas-organ' },
    ],
  },
  {
    label: 'Community',
    href: '/community',
    children: [
      { label: 'Pitshanger Pictures', href: '/community/pitshanger-pictures' },
      { label: 'Food Pantry', href: '/community/food-pantry-at-st-barnabas' },
    ],
  },
  {
    label: 'Families & Children',
    href: '/families-children',
    children: [
      { label: 'Youth Group', href: '/families-children/youth-group' },
      { label: "Children's Church", href: '/families-children/childrens-church-ages-5-9' },
      { label: 'Noisy Mass', href: '/families-children/noisy' },
    ],
  },
  { label: 'Memory Café', href: '/memory-cafe' },
  { label: 'Venue Hire', href: '/venue-hire' },
  { label: 'Life Events', href: '/life-events' },
  { label: 'News', href: '/news' },
  { label: 'Give', href: '/give' },
];

// Utility links (footer / overflow)
export const utilityNav: NavItem[] = [
  { label: 'Contact Us', href: '/contact-us' },
  { label: 'Safeguarding', href: '/safeguarding' },
  { label: 'Curious about Christianity?', href: '/curious-about-christianity' },
  { label: 'Documents', href: '/documents' },
];
