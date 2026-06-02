import { describe, it, expect } from 'vitest';
import type editable from '../content/settings/site.json';
import { site, assertSiteSettings } from './site';

type EditableSettings = typeof editable;

describe('site — hybrid settings merge', () => {
  it('exposes editor-owned fields from site.json', () => {
    expect(site.name).toBe('St Barnabas Church, Ealing');
    expect(site.phone).toBe('020 8998 4079');
    expect(site.emails.office).toBe('parish.office@barnabites.org');
    expect(site.people.vicar).toBe('Mother Sarah Howard-Jones');
  });

  it('keeps technical fields present at runtime (never in the CMS)', () => {
    expect(typeof site.geo.lat).toBe('number');
    expect(site.mapEmbed).toContain('google.com/maps/embed');
    expect(site.churchdeskOrgId).toBe(1901);
    expect(site.url).toBe('https://www.barnabites.org');
    expect(site.address.postcode).toBe('W5 1QG');
  });

  it('derives phoneIntl from the single editable phone', () => {
    expect(site.phoneIntl).toBe('+44 20 8998 4079');
  });
});

describe('assertSiteSettings — build guard', () => {
  const ok = { name: 'X', tagline: 'Y', phone: '020', emails: { office: 'a@b.c' } } as unknown as EditableSettings;

  it('passes when required fields are present', () => {
    expect(() => assertSiteSettings(ok)).not.toThrow();
  });

  it('throws when a required field is blank', () => {
    expect(() => assertSiteSettings({ ...ok, phone: '  ' })).toThrow(/phone/);
  });

  it('throws when emails.office is missing', () => {
    expect(() => assertSiteSettings({ ...ok, emails: {} as EditableSettings['emails'] })).toThrow(/emails\.office/);
  });
});
