# The Weekly News pipeline

How the ChurchDesk email newsletter becomes a post on `/news`, and how the
AgentMail inbox makes that fully automatic. Built August 2026; see the PR that
introduced it for the full design history.

## Moving parts

| Piece | Where | Job |
|---|---|---|
| Sign-up form | `src/components/NewsletterSignup.astro` | Native form on the homepage and `/news`; POSTs `{ name, email, peopleNewsletterListIds }` to ChurchDesk's public subscribe API (org 1901, list 32533). ChurchDesk double-opt-in and unsubscribe handle the rest. |
| Importer | `scripts/import-newsletter.mjs` | Converts one edition (a `app.churchdesk.com/public/newsletter/<uuid>` share link) into `src/content/news/weekly-news-<date>.md`: strips email chrome, hero image to frontmatter, images downloaded → WebP, body → Markdown. Idempotent — dedupes by the uuid marker it writes into each post. |
| Inbox poller | `scripts/check-newsletter-inbox.mjs` | Lists recent messages in the AgentMail inbox, extracts every share link, runs the importer for each. Stateless; skips itself when secrets are unset. |
| Workflow | `.github/workflows/import-newsletter.yml` | Runs both scripts. Triggers: Fri/Sat schedules, any edit to `settings/site.json` (the CMS newsletter link), `repository_dispatch` type `newsletter`, manual dispatch. Commits new posts to `main` → normal deploy. |
| Staleness alarm | inside the importer (`STALENESS_CHECK=1`, scheduled runs only) | Fails the run loudly if the newest imported edition is >14 days old, so a broken chain emails the repo owner instead of failing silently. |
| Cloudflare Email Worker | `workers/newsletter-email/` | Domain-based alternative for go-live, once the `barnabites.org` zone is on Cloudflare. Until then, AgentMail is the inbound-email route. |

## AgentMail setup (one-off, ~15 minutes)

Prerequisite: this branch merged to `main` — scheduled and dispatch triggers only
run from the default branch.

1. **Account.** Sign up at [agentmail.to](https://www.agentmail.to/) (free tier:
   3 inboxes, 3,000 emails/month — the newsletter uses ~4/month).
2. **Inbox.** In the console create an inbox, e.g. `stbarnabas@agentmail.to`.
   The address IS the inbox id.
3. **API key.** Console → API Keys → create one.
4. **Repo secrets.** GitHub → repo → Settings → Secrets and variables → Actions:
   - `AGENTMAIL_API_KEY` — the key from step 3
   - `AGENTMAIL_INBOX` — the address from step 2
5. **Subscribe the inbox.** Use the sign-up form on the site (name "News
   importer" or similar, email the inbox address). Then open the inbox in the
   AgentMail console, find ChurchDesk's confirmation email and click its
   confirmation link — ChurchDesk is double-opt-in, so this one human click is
   required.
6. **Test.** GitHub → Actions → "Import Weekly News newsletter" → Run workflow.
   The log should show `AgentMail: N message(s)…`; an already-imported edition
   ends "nothing to do", which still proves the chain. For a full end-to-end
   test, forward any past newsletter email to the inbox address and run again —
   a new edition would be committed and deployed within minutes.

From then on: ChurchDesk sends Friday → the scheduled Friday/Saturday runs find
the email in the inbox → the edition is imported, committed and deployed. No
human step. The CMS "Newsletter link (latest edition)" field is still worth
updating when convenient (it drives the "Read the latest newsletter" link on the
sign-up band), and pasting it also triggers an import — but the inbox makes that
optional rather than load-bearing.

## Failure modes

- **AgentMail down/dead or key revoked** — the poller step fails → the run fails
  → GitHub emails the repo owner. The CMS-link trigger and schedules still work
  meanwhile. The poller is ~70 lines against a generic inbox API; porting to
  another provider (AGmail, or the Cloudflare Worker at go-live) is small.
- **Nobody notices anything for two weeks** — the staleness alarm fails the
  scheduled runs with instructions.
- **Duplicate/forwarded emails, retried runs** — harmless; the importer's uuid
  dedupe makes every re-import a no-op.
- **An edition with an odd title** — dates parse from several formats, a missing
  year is inferred, and a completely dateless title falls back to today's date
  (dedupe still by uuid). A conversion producing a suspiciously short body
  aborts rather than publishing junk.
- **Imported post needs a tweak** — it is an ordinary news post; editors can
  edit or unpublish it in the CMS at `/admin` like anything else.
