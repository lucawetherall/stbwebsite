# Newsletter email worker

Makes the Weekly News → news-post import fully automatic. An email address is
subscribed to the parish's ChurchDesk newsletter; when an edition arrives, this
Cloudflare Email Worker extracts its public share link and triggers the
`import-newsletter` GitHub workflow, which publishes the edition on `/news`.

Everything in this chain is on free tiers: Email Routing (including subdomains),
Workers, and GitHub `repository_dispatch`.

## One-time setup

Prerequisite: the `barnabites.org` DNS zone active in Cloudflare (part of the
go-live runbook — see DECISIONS.md). Parish mailboxes are untouched: the routing
address lives on a dedicated subdomain, so the apex MX records never change.

1. **Add the routing subdomain.** Cloudflare dashboard → the zone → Email →
   Email Routing → Settings → *Add subdomain* → `agents.barnabites.org`.
   Cloudflare adds the subdomain's MX/SPF records itself.
2. **Deploy this worker.** From this directory:

   ```
   npm i -g wrangler        # or use npx
   npx wrangler deploy
   npx wrangler secret put GITHUB_TOKEN
   ```

   The token is a GitHub fine-grained PAT scoped to this repository with
   **Contents: Read and write** (that is what `repository_dispatch` requires).
3. **Create the address** `newsletter@agents.barnabites.org` in Email Routing,
   initially with the action *Forward to* a real mailbox (e.g. the parish
   office), because the next step needs a human to click a link.
4. **Subscribe the address** to the newsletter with the sign-up form on the site
   (or add it in the ChurchDesk People module), and click the link in the
   double-opt-in confirmation email from the forwarding mailbox.
5. **Switch the address's action** to *Send to a Worker* → `newsletter-email`.
6. **Test end-to-end**: forward any past newsletter email to the address and
   check that the `Import Weekly News newsletter` workflow runs in GitHub
   Actions (an already-imported edition ends with "nothing to do", which still
   proves the chain).

## Safety

- The worker only reacts to emails whose From header matches `ALLOWED_FROM`
  (wrangler.toml) *and* which contain an `app.churchdesk.com/public/newsletter/…`
  share link; anything else is logged and dropped.
- The import script it ultimately triggers is idempotent (deduped by message
  uuid), so duplicate or forwarded emails cannot double-post.
