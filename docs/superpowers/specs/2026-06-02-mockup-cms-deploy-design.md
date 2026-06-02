# Temporary mockup + Sveltia CMS on Cloudflare Pages — design & runbook

**Date:** 2026-06-02
**Goal:** Stand up a working mockup of the St Barnabas (barnabites.org) Astro site on a free
`*.pages.dev` URL, with a *fully working* Sveltia CMS at `/admin` (GitHub login, Publish →
auto-rebuild), without touching the real `barnabites.org` domain.

## Decisions (locked)

- **Approach:** Git-connected Cloudflare Pages project (not direct-upload). Publish → commit to
  `main` → Cloudflare auto-rebuilds → `.pages.dev` updates. The mockup *is* the future production
  project; go-live = attach the custom domain to the same project.
- **CMS login:** Fully working GitHub OAuth (auth Worker + GitHub OAuth app).
- **CMS writes to:** `main` (the real branch) — realistic production behaviour.
- **Cloudflare account email:** personal *church* email for now (flagged to migrate to a role
  mailbox at go-live).

## Architecture

```
Editor → /admin (Sveltia CMS, served from Pages)
       → "Sign in with GitHub" → sveltia-cms-auth Worker (OAuth dance) → GitHub
       → "Publish" → commit to lucawetherall/stbwebsite @ main
       → Cloudflare Pages (Git integration) auto-builds `npm run build`
       → site live at <project>.pages.dev (~1 min)
```

Three deployed things:
1. **Pages project** — Git-connected to `lucawetherall/stbwebsite`, branch `main`,
   build `npm run build`, output `dist`, `NODE_VERSION=20`. URL: `<project>.pages.dev`.
2. **sveltia-cms-auth Worker** — from <https://github.com/sveltia/sveltia-cms-auth>, deployed via
   wrangler. URL: `https://sveltia-cms-auth.<sub>.workers.dev`. Vars: `GITHUB_CLIENT_ID`,
   `GITHUB_CLIENT_SECRET` (secret), `ALLOWED_DOMAINS` (= the `.pages.dev` host).
3. **GitHub OAuth app** — Homepage = `.pages.dev` URL; Callback = `<worker-url>/callback`.

## Build order (each step's output feeds the next)

1. **Cloudflare auth** — `wrangler login` (browser), account created with church email. *(user)*
2. **Pages project**, Git-connected, `main` → get stable `<project>.pages.dev`. *(dashboard, user; I prep settings)*
3. **Deploy auth Worker** → get Worker URL. *(me, CLI)*
4. **Create GitHub OAuth app** (Homepage = pages.dev, Callback = worker/callback) → Client ID + Secret. *(user, browser)*
5. **Set Worker vars** `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `ALLOWED_DOMAINS`. *(me for non-secret; secret entered by user)*
6. **Edit `public/admin/config.yml`** `base_url` = Worker URL; commit to `main` → rebuild. *(me)*
7. **Test** `/admin` login + a test Publish rebuilds the site. *(both)*

## Who does what

- **Autonomous (CLI):** deploy Worker, set non-secret Worker vars, edit + commit `config.yml`,
  build, verification checks.
- **User (browser — no CLI exists):** `wrangler login` + Cloudflare signup; connect repo to Pages
  in dashboard; create GitHub OAuth app; enter the OAuth **Client Secret**.

## Flagged for go-live (NOT blocking the mockup)

- Migrate Cloudflare account: personal church email → **role mailbox** (e.g. `office@`/`web@`).
- Move repo into a **church GitHub org**; re-own the OAuth app there. (Changes `repo:` in
  `config.yml`, `ALLOWED_DOMAINS`, OAuth callback.)
- Attach `barnabites.org` to this Pages project + DNS cutover — see `DECISIONS.md` §6.
- Update `ALLOWED_DOMAINS`, OAuth Homepage/Callback, and `config.yml display_url/site_url` to the
  real domain at cutover.

## Notes / gotchas

- `config.yml` already has `local_backend: true` — local editing via
  `npx @sveltia/cms-proxy-server` keeps working independently of the OAuth setup.
- Use the **stable** `<project>.pages.dev` alias in `ALLOWED_DOMAINS`, not the per-deploy hashed
  preview subdomains.
- `/admin` is `noindex` + disallowed in robots.txt already — safe to expose on the temp URL.
- Sveltia CMS version is pinned in `public/admin/index.html` (currently `@0.165.1`).
