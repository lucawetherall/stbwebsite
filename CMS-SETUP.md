# Content editing — Sveltia CMS

The parish website has a built-in editor at **`https://www.barnabites.org/admin`**.
Editors log in with GitHub, change content in simple forms, and click **Publish** —
which saves to the repository and rebuilds the live site automatically (about a minute).

There are two parts: a **one-time technical setup** (done once, ~15 minutes), and then
**everyday editing** (no technical knowledge needed).

---

## Current status — temporary mockup is LIVE

A working mockup is deployed at **<https://barnabites.pages.dev/admin>** (the real
`barnabites.org` domain is **not** touched yet). The one-time setup in Part 1 has already been
done *for the mockup*, so editors can skip straight to **Part 2** on that URL.

How the mockup is wired (for whoever maintains it):

- **Hosting:** Cloudflare Pages project `barnabites` on the `luca.wetherall@barnabites.org`
  Cloudflare account.
- **Login helper:** the `sveltia-cms-auth` Worker is deployed at
  `https://sveltia-cms-auth.luca-wetherall.workers.dev`. Its GitHub OAuth credentials and
  `ALLOWED_DOMAINS` are stored as **Worker variables/secrets** (`GITHUB_CLIENT_ID`,
  `GITHUB_CLIENT_SECRET`, `ALLOWED_DOMAINS`) — not in this repo.
- **Auto-rebuild on Publish:** instead of Cloudflare's native Git integration, a GitHub Action
  (`.github/workflows/deploy.yml`) builds and deploys on every push to `main`. It reads two
  **repository secrets** by name: `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`. (We used
  the Action because the GitHub account was already linked to a different Cloudflare account,
  which blocked the native connector.)
- `public/admin/config.yml` `base_url` points at the Worker above; `display_url`/`site_url`
  point at the mockup URL (both flagged in-file to revert at go-live).

### Before this becomes more than a mockup (go-live checklist)

- **Rotate the shared credentials.** The GitHub OAuth **client secret** and the Cloudflare
  **API token** were shared in plain text during setup — regenerate both and re-store them
  (`wrangler secret put GITHUB_CLIENT_SECRET` for the Worker; the repo secret
  `CLOUDFLARE_API_TOKEN` via GitHub → Settings → Secrets). Never commit either value.
- **Re-own under the church.** Move the Cloudflare account to a role mailbox (e.g. `office@`),
  move the repo into a church GitHub org, and re-create the OAuth app there.
- **Attach the real domain** to the same Pages project and run the DNS cutover (see
  `DECISIONS.md` §6).
- **Revert the mockup URLs:** set `display_url`/`site_url` back to `https://www.barnabites.org`,
  and update `ALLOWED_DOMAINS` + the OAuth app's Homepage/Callback to the real domain.

The rest of this document describes that one-time setup from scratch (useful if the church
rebuilds it under its own accounts at go-live).

---

## Part 1 — One-time setup (do this once)

This connects the editor to GitHub so people can sign in. You only do it once.

### Step 1 — Deploy the free login helper (Cloudflare Worker)

1. Open the **sveltia-cms-auth** project: <https://github.com/sveltia/sveltia-cms-auth>
2. Click the **“Deploy to Cloudflare Workers”** button in its README and follow the prompts
   (sign in to Cloudflare — the same account hosting the site — and deploy).
3. When it finishes, copy the Worker’s URL. It looks like:
   `https://sveltia-cms-auth.<your-name>.workers.dev`

### Step 2 — Create a GitHub OAuth app

1. Go to <https://github.com/settings/applications/new>
2. Fill in:
   - **Application name:** `St Barnabas Website CMS`
   - **Homepage URL:** `https://www.barnabites.org`
   - **Authorization callback URL:** `<YOUR-WORKER-URL>/callback`
     (the Worker URL from Step 1, with `/callback` on the end)
3. Click **Register application**, then **Generate a new client secret**.
4. Copy the **Client ID** and **Client Secret** (you’ll need them next).

### Step 3 — Give the Worker its secrets

In the Cloudflare dashboard → **Workers & Pages** → `sveltia-cms-auth` → **Settings** →
**Variables**, add:

| Variable | Value |
|---|---|
| `GITHUB_CLIENT_ID` | the Client ID from Step 2 |
| `GITHUB_CLIENT_SECRET` | the Client Secret from Step 2 — click **Encrypt** |
| `ALLOWED_DOMAINS` | `www.barnabites.org, barnabites.org` |

Save and deploy.

### Step 4 — Point the CMS at your Worker

Edit **`public/admin/config.yml`** in this repo and replace the placeholder `base_url`
with your Worker URL from Step 1:

```yaml
backend:
  name: github
  repo: lucawetherall/stbwebsite
  branch: main
  base_url: https://sveltia-cms-auth.<your-name>.workers.dev   # ← your Worker URL
```

Commit that change (the CMS itself can do this once you’re signed in, or edit it in GitHub).

### Step 5 — Add the people who will edit

In GitHub → repo **Settings** → **Collaborators** → invite each editor by their GitHub
username (a free GitHub account is all they need). Give them **Write** access.

That’s it. The editor is now live at `https://www.barnabites.org/admin`.

---

## Part 2 — Everyday editing (for non-technical editors)

1. Go to **https://www.barnabites.org/admin**
2. Click **Sign in with GitHub** (accept the one-time permission prompt).
3. Pick what to edit from the sidebar, make your changes, and click **Publish**.
4. Wait about a minute, then refresh the live page to see it.

### What you can edit

| Section | What it controls |
|---|---|
| **News** | News posts / notices (newest shows first). |
| **This Sunday’s Music** | The music list in the “This Sunday” block — add a sheet per Sunday: pick the date, the feast, then each service (Sung Mass, Evensong…) and its lines (Setting, Psalm, Anthem…). |
| **Events** | Special services / events on Worship → Special Services. |
| **Who’s Who** | Clergy and people on About Us → Who’s Who. |
| **Documents** | PDFs and links on the Documents page (upload a PDF or paste a link). |
| **Main Pages** | The wording of the main pages (Visit, About Us, Worship, etc.). |

### A few tips
- **Photos:** use the image button in a News post to upload a picture; it’s stored with the site.
- **Drafts:** tick **Draft** to save something without putting it live yet.
- **Main Pages:** edit the wording freely, but leave anything inside `< >` or any line that
  starts with `import` exactly as it is — those are layout instructions, not text.

---

## Notes for whoever maintains the site

- **What’s deliberately *not* in the CMS:** the deeper sub-pages (e.g. Accessibility, the
  children’s pages, the organ history) and any page containing layout components (the Worship
  page’s photo gallery). These are edited in the repo. They could be added to the CMS later by
  converting those pages to an index-file layout.
- **Events** can alternatively be managed in **ChurchDesk** once the iCal feed is wired
  (`CHURCHDESK_ICAL_URL`, see `DECISIONS.md`) — then the `Events` collection becomes a manual
  fallback only.
- **Updating Sveltia CMS:** the version is pinned in `public/admin/index.html`. Bump it and
  check the [releases](https://github.com/sveltia/sveltia-cms/releases) when you want updates.
- **Editing locally without GitHub:** run `npm run dev`, open
  `http://localhost:4321/admin/index.html` (the dev server doesn’t serve the bare `/admin/`
  directory index — deployed hosts like Cloudflare Pages do), and click **“Work with Local
  Repository”** in a Chromium browser (Chrome/Edge). Sveltia edits the repo through the browser’s
  File System Access API — no proxy server or extra package needed. (`local_backend: true` is set.)
- **Security:** `/admin` is marked `noindex` and disallowed in `robots.txt`, and only invited
  GitHub collaborators can sign in. There is no database to maintain or patch.
- **No lock-in:** content stays as plain Markdown/JSON in the repo, and the config uses the
  Decap CMS format — so you can switch to Decap, Pages CMS, or hand-editing at any time.
