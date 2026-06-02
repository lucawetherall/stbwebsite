export const site = {
  name: 'St Barnabas Church, Ealing',
  shortName: 'St Barnabas, Ealing',
  locality: 'Pitshanger Lane, London W5 1QG',
  tagline: 'The Church of England parish church of Pitshanger',
  url: 'https://www.barnabites.org',
  address: { street: 'Pitshanger Lane', area: 'Ealing', city: 'London', postcode: 'W5 1QG' },
  geo: { lat: 51.52708621708429, lng: -0.3115046840361693 },
  phone: '020 8998 4079',
  phoneIntl: '+44 20 8998 4079',
  emails: {
    office: 'parish.office@barnabites.org',
    vicar: 'vicar@barnabites.org',
    // The live music page uses music@barnabites.org for music enquiries (the brief's
    // site.ts said directorofmusic@ — confirm with the parish; see DECISIONS.md).
    music: 'music@barnabites.org',
    safeguarding: 'safeguarding@barnabites.org',
    childrensChampion: 'childrens.champion@barnabites.org',
  },
  people: {
    vicar: 'Mother Sarah Howard-Jones',
    directorOfMusic: 'Luca Wetherall',
    organist: 'Hugh Mather',
  },
  social: {
    facebook: 'https://www.facebook.com/barnabites/',
    instagram: 'https://www.instagram.com/ealingbarnabites',
    youtube: 'https://www.youtube.com/@stbarnabasealing2270',
  },
  giving:
    'https://www.parishgiving.org.uk/donors/find-your-parish/ealing-st-barnabas-ealing/',
  newsletterArchive:
    'https://app.churchdesk.com/public/newsletter/6b44359c-38fc-4441-812f-3a62e1fce3c2',
  diocesanSafeguardingPolicy:
    'https://www.london.anglican.org/wp-content/uploads/2025/07/Diocese-of-London-Safeguarding-policy-v10.3.pdf',
  churchdeskOrgId: 1901,
  affiliations: [
    { name: 'Inclusive Church', url: 'https://www.inclusive-church.org/' },
    { name: 'Church of England', url: 'https://www.churchofengland.org/' },
  ],
  safeguardingLeads: [
    { role: 'Parish Safeguarding Officer', name: 'Pat Chapman', email: 'safeguarding@barnabites.org' },
    { role: "Children's Champion", name: 'Helen Ward', email: 'childrens.champion@barnabites.org' },
    { role: 'Diocesan Safeguarding Advisor', name: 'Angela Colman', email: 'angela.colman@london.anglican.org' },
  ],
  // Google Maps embed (reuse exact place)
  mapEmbed:
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2482.2438991924796!2d-0.3115046840361693!3d51.52708621708429!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x4876126d1066d097%3A0xdfc50a4e636cce59!2sSt+Barnabas+Church!5e0!3m2!1sen!2suk!4v1498738937601',
} as const;

export type Site = typeof site;
