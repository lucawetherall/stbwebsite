# Brand & Friendly-Up the Sveltia CMS Editor — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `/admin` look and feel like St Barnabas's own tool — window-mark logo, friendly title + emoji sidebar, a branded loading splash, and a website-styled preview pane — using only Sveltia's supported config + JS API.

**Architecture:** Three surfaces, all non-source: a new `public/admin/logo.svg`; top-level options + emoji labels + preview-enable in `public/admin/config.yml`; and a rebuilt `public/admin/index.html` that loads the pinned CDN bundle as a classic script and calls `CMS.registerPreviewStyle(css, { raw: true })`. No `sveltia-cms.js` is modified, so version bumps stay safe.

**Tech Stack:** Sveltia CMS 0.165.1 (Decap-compatible YAML + JS API), static HTML/SVG/CSS, brand fonts self-hosted at `/fonts/`.

**Spec:** `docs/superpowers/specs/2026-06-02-cms-branding-design.md`

**Note on testing:** This is static markup + config + a browser-only API. There is no unit-testable logic, so each task is verified by YAML/HTML parse, `npm run build`, and a live-browser check (dev server + Sveltia proxy). The live check is the source of truth and is the focus of Task 4.

---

## File Structure

**Create:**
- `public/admin/logo.svg` — the window mark on a rounded paper tile (header / login / favicon)

**Modify:**
- `public/admin/config.yml` — add `logo`, `app_title`, `logout_redirect_url`; emoji-prefix the 8 collection labels; remove `editor: { preview: false }` from `news` and `pages` to enable the branded preview
- `public/admin/index.html` — branded shell: title, favicon, theme-color, loading splash, classic bundle load, `registerPreviewStyle` with inline brand CSS

---

## Task 1: Create the branded admin logo asset

**Files:**
- Create: `public/admin/logo.svg` (by copying `public/favicon.svg` and rounding its corners)

The existing `public/favicon.svg` is already the window mark (burgundy `#6A1B2D` on paper `#F6F2EA`). Reuse it — do NOT hand-transcribe the path.

- [ ] **Step 1: Copy the favicon as the base**

Run: `cp public/favicon.svg public/admin/logo.svg`

- [ ] **Step 2: Round the tile corners**

In `public/admin/logo.svg`, find the opening rect:

```
<rect width="64" height="64" fill="#F6F2EA"/>
```

Replace with (adds rounded corners so it reads as an app icon in the header):

```
<rect width="64" height="64" rx="12" fill="#F6F2EA"/>
```

Leave the `<g transform=...>` and `<path .../>` exactly as they are.

- [ ] **Step 3: Verify it is valid SVG and renders**

Run: `node -e "const s=require('fs').readFileSync('public/admin/logo.svg','utf8'); if(!s.includes('rx=\"12\"')||!s.includes('viewBox=\"0 0 64 64\"')||!/<path /.test(s)) throw new Error('logo.svg malformed'); console.log('logo.svg ok')"`
Expected: `logo.svg ok`

- [ ] **Step 4: Commit**

```bash
git add public/admin/logo.svg
git commit -m "feat(cms): add branded admin logo (window mark, rounded tile)"
```

---

## Task 2: Add identity options, emoji labels, and enable the branded preview

**Files:**
- Modify: `public/admin/config.yml`

Read the current file first. Make these exact edits.

- [ ] **Step 1: Add the top-level identity options**

Find this block near the top:

```yaml
# Where uploaded images are stored / served from
media_folder: public/images/uploads
public_folder: /images/uploads
```

Insert immediately AFTER it:

```yaml

# ── Branding (St Barnabas) ───────────────────────────────────────────────────
# Window mark shown in the header, on the login screen, and as the tab favicon.
logo:
  src: /admin/logo.svg
  show_in_header: true
# Friendly title on the login screen and browser tab.
app_title: St Barnabas Content Manager
# MOCKUP value — revert to https://www.barnabites.org at go-live (like display_url/site_url).
logout_redirect_url: https://barnabites.pages.dev
```

- [ ] **Step 2: Emoji-prefix the 8 collection labels**

Make these exact replacements (match the existing label lines, including their curly apostrophes):

| Find | Replace |
|---|---|
| `    label: News` | `    label: 📰 News` |
| `    label: This Sunday’s Music` | `    label: 🎵 This Sunday’s Music` |
| `    label: Events` | `    label: 📅 Events` |
| `    label: Service times` | `    label: ⏰ Service times` |
| `    label: Who’s Who` | `    label: 👥 Who’s Who` |
| `    label: Documents` | `    label: 📄 Documents` |
| `    label: Main Pages` | `    label: 📖 Main Pages` |
| `    label: Site settings` | `    label: ⚙️ Site settings` |

(These are the collection-level `label:` lines — 4-space indent. Do NOT touch `label_singular`, field labels, or the file-entry label "Service times"/"Site settings" under `files:` that have 8-space indent.)

- [ ] **Step 3: Enable the preview pane for the two prose collections**

In the `news` collection, find and DELETE these two lines:

```yaml
    editor:
      preview: false
```

In the `pages` collection, find and DELETE its identical two lines:

```yaml
    editor:
      preview: false
```

(Leave every other collection untouched.)

- [ ] **Step 4: Verify YAML still parses and the edits landed**

Run:
```
node -e "const y=require('yaml');const fs=require('fs');const c=y.parse(fs.readFileSync('public/admin/config.yml','utf8'));if(!c.logo||c.logo.src!=='/admin/logo.svg')throw new Error('logo missing');if(c.app_title!=='St Barnabas Content Manager')throw new Error('app_title missing');if(!c.logout_redirect_url)throw new Error('logout missing');const news=c.collections.find(x=>x.name==='news');const pages=c.collections.find(x=>x.name==='pages');if(news.editor&&news.editor.preview===false)throw new Error('news preview still disabled');if(pages.editor&&pages.editor.preview===false)throw new Error('pages preview still disabled');const labels=c.collections.filter(x=>x.name).map(x=>x.label);console.log('ok',JSON.stringify(labels));"
```
Expected: prints `ok` followed by the 8 labels, each starting with an emoji (e.g. `["📰 News","🎵 This Sunday’s Music",...]`). No thrown error.

- [ ] **Step 5: Commit**

```bash
git add public/admin/config.yml
git commit -m "feat(cms): add logo/app_title/logout, emoji sidebar labels, enable branded preview"
```

---

## Task 3: Rebuild the admin shell (splash + preview styling)

**Files:**
- Modify: `public/admin/index.html`

- [ ] **Step 1: Replace `public/admin/index.html` in full**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="robots" content="noindex" />
    <meta name="theme-color" content="#6A1B2D" />
    <link rel="icon" href="/admin/logo.svg" />
    <title>St Barnabas Content Manager</title>
    <style>
      /* Brand splash shown until Sveltia mounts and replaces the body. */
      @font-face {
        font-family: 'Cormorant Garamond'; font-style: normal; font-weight: 500;
        font-display: swap;
        src: url('/fonts/cormorant-garamond-500-normal-latin.woff2') format('woff2');
      }
      #stb-splash {
        position: fixed; inset: 0; z-index: 9999;
        display: grid; place-items: center;
        background: #F6F2EA; color: #6A1B2D;
        font-family: 'Cormorant Garamond', Garamond, 'Times New Roman', serif;
      }
      #stb-splash .stb-splash__inner { text-align: center; }
      #stb-splash img { width: 76px; height: 76px; }
      #stb-splash p { margin-top: 1rem; font-size: 1.45rem; letter-spacing: .01em; }
    </style>
  </head>
  <body>
    <!-- Removed automatically when Sveltia CMS mounts into <body>. -->
    <div id="stb-splash">
      <div class="stb-splash__inner">
        <img src="/admin/logo.svg" alt="St Barnabas" width="76" height="76" />
        <p>Preparing the editor…</p>
      </div>
    </div>

    <!-- Sveltia CMS — pinned for stability. Loaded as a CLASSIC script (no type=module)
         so the global `CMS` exists synchronously for registerPreviewStyle below.
         To update, bump the version and check the changelog:
         https://github.com/sveltia/sveltia-cms/releases -->
    <script src="https://unpkg.com/@sveltia/cms@0.165.1/dist/sveltia-cms.js"></script>
    <script>
      // Brand the editor's preview pane so a News post / page previews like the live site.
      CMS.registerPreviewStyle(
        `
        @font-face { font-family:'Cormorant Garamond'; font-style:normal; font-weight:500;
          src:url('/fonts/cormorant-garamond-500-normal-latin.woff2') format('woff2'); }
        @font-face { font-family:'Source Serif 4'; font-style:normal; font-weight:400;
          src:url('/fonts/source-serif-4-400-normal-latin.woff2') format('woff2'); }
        @font-face { font-family:'Source Serif 4'; font-style:normal; font-weight:600;
          src:url('/fonts/source-serif-4-600-normal-latin.woff2') format('woff2'); }
        body { background:#F6F2EA; color:#1A1611; line-height:1.6;
          font-family:'Source Serif 4', Georgia, serif;
          padding:2rem clamp(1rem,4vw,3rem); }
        h1,h2,h3,h4 { font-family:'Cormorant Garamond', Garamond, serif; color:#6A1B2D;
          font-weight:500; line-height:1.1; margin:1.6rem 0 .6rem; }
        h1 { font-size:2.4rem; } h2 { font-size:1.8rem; } h3 { font-size:1.4rem; }
        a { color:#6A1B2D; }
        p, li { max-width:66ch; }
        blockquote { border-left:3px solid #6A1B2D; margin:1.2rem 0; padding:.2rem 0 .2rem 1.1rem;
          color:#6A6051; font-style:italic; }
        img { max-width:100%; height:auto; border-radius:4px; }
        hr { border:0; border-top:1px solid rgba(26,22,17,.2); margin:2rem 0; }
        `,
        { raw: true }
      );
    </script>
  </body>
</html>
```

- [ ] **Step 2: Sanity-check the markup**

Run:
```
node -e "const s=require('fs').readFileSync('public/admin/index.html','utf8'); for(const t of ['/admin/logo.svg','sveltia-cms@0.165.1/dist/sveltia-cms.js','registerPreviewStyle','{ raw: true }','stb-splash','St Barnabas Content Manager']) if(!s.includes(t)) throw new Error('missing: '+t); if(s.includes('type=\"module\"')) throw new Error('bundle must be a classic script, not a module'); console.log('index.html ok');"
```
Expected: `index.html ok` (and crucially, no `type="module"` on the bundle — that would break the registration timing).

- [ ] **Step 3: Confirm the production build still emits the admin unchanged-in-spirit**

Run: `npm run build`
Expected: build succeeds. `public/admin/*` is copied verbatim to `dist/admin/` (Astro treats `public/` as static), so confirm:
Run: `test -f dist/admin/logo.svg && grep -q registerPreviewStyle dist/admin/index.html && echo "admin assets emitted"`
Expected: `admin assets emitted`

- [ ] **Step 4: Commit**

```bash
git add public/admin/index.html
git commit -m "feat(cms): branded admin shell — splash, favicon, brand-styled preview pane"
```

---

## Task 4: Live verification + fix issues

**Files:** none (verification; fixes applied where needed)

This is the source of truth — the previous tasks only proved the files are well-formed. The CMS is a browser SPA; it must be exercised live.

- [ ] **Step 1: Start the dev server and the Sveltia local-backend proxy**

```bash
npx @sveltia/cms-proxy-server   # terminal 1 (local backend; lets the CMS load without GitHub)
npm run dev                     # terminal 2
```

- [ ] **Step 2: Open and verify the login screen**

Open `http://localhost:4321/admin`. Confirm:
- The window-mark logo is visible and has good contrast.
- The title reads "St Barnabas Content Manager".
- The browser tab favicon is the window mark.
- No blank white flash on load — the paper splash shows briefly first.
- Check the browser console: no errors (especially none mentioning `CMS` is undefined or `registerPreviewStyle`).

- [ ] **Step 3: Verify the branded sidebar + preview**

Sign in via the local backend (or "Work with Local Repository"). Confirm:
- The sidebar shows the 8 emoji labels in the three divider groups.
- Open a 📰 News entry: a **preview pane** appears, with headings in Cormorant Garamond burgundy and body in Source Serif 4 on paper — i.e. it looks like the website.
- Open a 📖 Main Pages entry (e.g. Worship): same branded preview; the body shows as plain prose.

- [ ] **Step 4: Fix any issues found**

- If the preview pane shows but is **unstyled** (registration didn't apply): confirm the bundle is a classic script and the registration `<script>` is classic and AFTER it. If it still doesn't apply with auto-init, fall back per the spec — re-add `editor: { preview: false }` to `news` and `pages` and remove the registration block (Component D is optional; A–C stand). Commit that as a documented fallback.
- If the logo has poor contrast on the header in dark mode: it's on a paper tile, so this should not happen; if it does, that's the tile doing its job — leave as-is.
- Re-run Steps 2–3 after any fix.

- [ ] **Step 5: Capture proof + commit any fixes**

Screenshot the login screen and an editor-with-preview for the record. If Step 4 made changes:

```bash
git add -A
git commit -m "fix(cms): branding adjustments from live verification"
```

---

## Self-Review (completed by plan author)

- **Spec coverage:** Component A identity → Task 2 Step 1 + Task 1 (logo asset) ✓; Component B shell/splash → Task 3 ✓; Component C emoji sidebar → Task 2 Step 2 ✓; Component D branded preview → Task 2 Step 3 (enable) + Task 3 registerPreviewStyle ✓; verification → Task 4 ✓; documented fallback for D → Task 4 Step 4 ✓.
- **Placeholder scan:** none — full file contents and exact edits provided.
- **Consistency:** `app_title` and `<title>` both "St Barnabas Content Manager"; logo path `/admin/logo.svg` consistent across config `logo.src`, favicon link, splash `<img>`; font filenames match the real files in `public/fonts/`; classic-script requirement stated in both Task 3 code and its check.
- **Risk:** the registerPreviewStyle-with-auto-init timing is the one unknown; Task 4 verifies it live and gives a clean, self-contained fallback that preserves A–C.
