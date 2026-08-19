// Cloudflare Email Worker: newsletter → GitHub import trigger.
//
// Bound to an Email Routing address (e.g. newsletter@agents.barnabites.org) that is
// subscribed to the parish's ChurchDesk Weekly News. When an edition arrives, this
// worker extracts the edition's public share link from the email body and fires the
// repository_dispatch hook that .github/workflows/import-newsletter.yml listens for,
// which imports the edition as a news post on /news.
//
// Secrets/vars (wrangler.toml + `npx wrangler secret put GITHUB_TOKEN`):
//   GITHUB_TOKEN — fine-grained PAT for the repo with "Contents: read & write"
//   GITHUB_REPO  — "owner/repo", set in wrangler.toml
//   ALLOWED_FROM — comma-separated substrings; the From header must contain one
//                  (guards against strangers mailing the address other share links)

const SHARE_LINK = /https:\/\/app\.churchdesk\.com\/public\/newsletter\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

export default {
  async email(message, env) {
    const from = message.headers.get('from') || '';
    const allowed = (env.ALLOWED_FROM || '')
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    if (allowed.length && !allowed.some((a) => from.toLowerCase().includes(a))) {
      console.log(`Ignoring email from unexpected sender: ${from}`);
      return;
    }

    // Decode quoted-printable soft line breaks and =XX escapes so a share URL
    // split across lines in the MIME body still matches.
    let raw = await new Response(message.raw).text();
    raw = raw.replace(/=\r?\n/g, '').replace(/=([0-9A-F]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));

    const m = raw.match(SHARE_LINK);
    if (!m) {
      console.log('No ChurchDesk share link found in the email — ignoring.');
      return;
    }

    const res = await fetch(`https://api.github.com/repos/${env.GITHUB_REPO}/dispatches`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.GITHUB_TOKEN}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'newsletter-email-worker',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ event_type: 'newsletter', client_payload: { share_url: m[0] } }),
    });
    if (res.status !== 204) {
      // Throwing marks the delivery as failed so the send is retried later.
      throw new Error(`GitHub dispatch failed: ${res.status} ${await res.text()}`);
    }
    console.log(`Dispatched newsletter import for ${m[0]}`);
  },
};
