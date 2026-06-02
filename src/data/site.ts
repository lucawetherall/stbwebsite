import editable from '../content/settings/site.json';

// Technical / structural fields — NEVER exposed to CMS editors. Edit in code only.
const technical = {
  url: 'https://www.barnabites.org',
  address: { street: 'Pitshanger Lane', area: 'Ealing', city: 'London', postcode: 'W5 1QG' },
  geo: { lat: 51.52708621708429, lng: -0.3115046840361693 },
  mapEmbed:
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2482.2438991924796!2d-0.3115046840361693!3d51.52708621708429!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x4876126d1066d097%3A0xdfc50a4e636cce59!2sSt+Barnabas+Church!5e0!3m2!1sen!2suk!4v1498738937601',
  churchdeskOrgId: 1901,
} as const;

/** Throws (failing the build) if the editor has emptied a field the site depends on. */
export function assertSiteSettings(s: typeof editable): void {
  const required: Array<[string, unknown]> = [
    ['name', s.name],
    ['tagline', s.tagline],
    ['phone', s.phone],
    ['emails.office', s.emails?.office],
  ];
  const missing = required.filter(([, v]) => !v || String(v).trim() === '').map(([k]) => k);
  if (missing.length) {
    throw new Error(
      `site.json is missing required field(s): ${missing.join(', ')}. ` +
        'Refusing to build with broken site settings.'
    );
  }
}

assertSiteSettings(editable);

// International phone derived from the single editable `phone`, tolerant of however an
// editor types it — "020 8998 4079", "+44 20 8998 4079" or "0044 …" all yield "+44 20 …".
// Strip non-digit/space chars, then drop the international/trunk prefix; the rest keeps
// its spacing. (Avoids "+44 +44 …" when someone enters the number already in +44 form.)
const phoneIntl =
  '+44 ' +
  editable.phone
    .replace(/[^\d ]/g, '')
    .trim()
    .replace(/^(?:0044|44|0)\s*/, '');

// `technical` is spread LAST so developer-only constants always win over the
// editor-owned JSON — a CMS editor must never be able to override url/geo/mapEmbed/etc.
export const site = { ...editable, ...technical, phoneIntl } as const;

export type Site = typeof site;
