# Brand & friendly-up the Sveltia CMS editor — design

**Date:** 2026-06-02
**Goal:** Make the `/admin` editor feel like St Barnabas's own well-crafted tool — warm, branded, unmistakably the parish's — using ONLY Sveltia's supported configuration and JavaScript API. **Never modify Sveltia's source** (`sveltia-cms.js`), so future version bumps can't break us. Verified against the Sveltia customization + API docs (<https://sveltiacms.app/en/docs/customization>, `/api`, `/api/preview-styles`) on 2026-06-02.

## Decisions (locked)

- All branding via: `config.yml` options, our own `public/admin/index.html`, a new logo asset, and the documented `CMS.registerPreviewStyle()` API. No source edits, no forks, no patched bundle.
- Pinned Sveltia version stays `0.165.1` (unchanged).
- Honest limit (Sveltia's own note): `app_title`/`logo` are "not a white-label solution — the name of Sveltia CMS will remain visible in some places." Accepted; we brand everything we're allowed to.

## What the docs confirm we can use (and what we can't)

| Lever | Status | Used for |
|---|---|---|
| `logo: { src, show_in_header }` | ✅ supported (legacy `logo_url` deprecated) | Window mark in header, login page, favicon |
| `app_title` | ✅ supported | Friendly title on login + browser tab |
| `logout_redirect_url` | ✅ supported | Send editors back to the site after logout |
| `CMS.registerPreviewStyle(css, { raw: true })` | ✅ supported (raw CSS string) | Brand the editor preview pane |
| Our `public/admin/index.html` (title, favicon, splash) | ✅ ours to edit (not Sveltia source) | Loading splash, meta, script setup |
| Emoji/free text in collection `label` / `description` | ✅ arbitrary strings | Friendly sidebar |
| Custom CSS theming of editor chrome, accent colour, dark/light toggle | ❌ NOT supported | — (don't attempt) |
| Editing `sveltia-cms.js` | 🚫 forbidden by constraint | — |

## Brand assets (already in the repo)

- **Window mark:** [favicon.svg](../../../public/favicon.svg) (burgundy `#6A1B2D` mark on paper `#F6F2EA`), and the same path in [Logo.astro](../../../src/components/Logo.astro).
- **Colours:** burgundy `#6A1B2D`, burgundy-deep `#551521`, ink `#1A1611`, ink-soft `#6A6051`, paper `#F6F2EA`, line `rgba(26,22,17,.20)`.
- **Fonts (self-hosted, served from `/fonts/`):** Cormorant Garamond (display) + Source Serif 4 (body).

## Component A — Identity (`public/admin/config.yml`)

Add three top-level options:

```yaml
logo:
  src: /admin/logo.svg
  show_in_header: true
app_title: St Barnabas Content Manager
# MOCKUP value — revert to https://www.barnabites.org at go-live (like display_url/site_url).
logout_redirect_url: https://barnabites.pages.dev
```

A new asset **`public/admin/logo.svg`** holds the window mark on a **rounded paper tile** (so it always has contrast regardless of Sveltia's light/dark chrome — a deliberately robust, app-icon-like treatment). Built from the existing window-mark path; no new artwork invented.

## Component B — Polished shell (`public/admin/index.html`)

This file is ours (it merely loads the CDN bundle). Upgrade it to:

- A branded `<title>` ("St Barnabas Content Manager", matching `app_title`), `<link rel="icon" href="/admin/logo.svg">`, `<meta name="theme-color" content="#6A1B2D">`, keep `noindex`.
- A **branded loading splash** in `<body>`: paper background, centred window mark, "Preparing the editor…" in the brand serif — shown while the bundle boots (Sveltia replaces the body on mount, so the splash naturally disappears). No blank white flash.
- Load the bundle as a **classic script** (not `type="module"`) so the global `CMS` is available synchronously, then a second classic `<script>` registers the preview style (Component D). Classic-script ordering guarantees `CMS` exists before we call it.

## Component C — Friendly sidebar (`config.yml` labels)

Prefix each collection `label` with one tasteful emoji (the parish asked for emojis), and keep the warm one-line `description`s:

| Collection | Label |
|---|---|
| news | 📰 News |
| services | 🎵 This Sunday's Music |
| events | 📅 Events |
| service_times | ⏰ Service times |
| staff | 👥 Who's Who |
| documents | 📄 Documents |
| pages | 📖 Main Pages |
| site_settings | ⚙️ Site settings |

(Emoji go only in the display `label`; the collection `name` slugs are unchanged, so nothing in the data layer is affected.)

## Component D — Branded preview pane (JS API)

So an editor writing a News post or a page sees it rendered like the real website:

- In `index.html`, after the bundle loads, call `CMS.registerPreviewStyle(css, { raw: true })` with an inline CSS string that: `@font-face`s the two brand fonts from `/fonts/…woff2`, sets a paper background + ink body text in Source Serif 4, and styles headings in Cormorant Garamond burgundy with a readable measure (~66ch). Raw string (not a file URL) avoids any fetch-path fragility.
- Enable the preview for the two prose collections by removing `editor: { preview: false }` from **news** and **pages** in `config.yml`. Leave structured collections (services, events, staff, documents, site_settings, service_times) as they are — a styled preview adds nothing there, and the brand CSS is harmless if shown.

**Risk + fallback (the one uncertain piece):** the docs don't confirm whether `registerPreviewStyle` applies when the bundle auto-initialises from `config.yml`. Mitigation: classic-script ordering (B) puts the call right after the global `CMS` exists, matching the canonical Decap pattern. If live testing shows the style doesn't apply (or the preview pane is unwanted), Component D is self-contained and can be dropped — re-add `editor: { preview: false }` and remove the registration — without touching A/B/C. The brand identity stands on its own.

## Verification

This is browser-only behaviour. Verify on the running site (dev server + Sveltia proxy, or the deployed mockup):
- `/admin` login screen shows the window mark + "St Barnabas Content Manager".
- The loading splash appears briefly (no white flash), favicon is the mark.
- Sidebar shows emoji labels in the three divider groups.
- Opening a News post shows a preview pane styled in the brand fonts/colours.
- Screenshot the login + an editor-with-preview as proof.

## Out of scope (YAGNI / unsupported)

- Custom theming of Sveltia's editor chrome / accent colour / dark-mode toggle (unsupported — don't attempt).
- Custom widgets, preview templates, custom field types (overkill for branding).
- The `#nc-root` embedded-mount layout (not needed).
- Any change to the content model or the data layer (this is presentation only).
