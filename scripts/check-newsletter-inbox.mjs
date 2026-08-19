// Poll an AgentMail inbox for ChurchDesk newsletters and import them as news posts.
//
// For each recent message from an allowed sender:
//   1. Prefer share links — direct app.churchdesk.com/public/newsletter/<uuid> URLs,
//      or short.churchdesk.net tracking links that still resolve to one. The share
//      API gives the cleanest content.
//   2. Otherwise, if the message body looks like a newsletter (the Unlayer markup
//      with the parish masthead), convert the HTML directly — delivered emails
//      wrap every link in tracking redirects and may carry no share link at all,
//      and a bulk forward of several editions inline is split and imported per date.
//
// Stateless: nothing is marked processed in AgentMail; the importer dedupes by
// uuid and by edition date, so re-seeing an email is always a no-op.
//
// Requires AGENTMAIL_API_KEY and AGENTMAIL_INBOX (skips quietly when unset).
// NEWSLETTER_ALLOWED_FROM overrides the default sender allowlist (comma-separated
// substrings matched against the From header).
import { execFileSync } from 'node:child_process';
import { writeFile, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const API = 'https://api.agentmail.to/v0';
const key = process.env.AGENTMAIL_API_KEY;
const inbox = process.env.AGENTMAIL_INBOX;
const DEBUG = process.env.DEBUG_INBOX === '1';

if (!key || !inbox) {
  console.log('AgentMail not configured (AGENTMAIL_API_KEY / AGENTMAIL_INBOX unset) — skipping inbox check.');
  process.exit(0);
}

const headers = { Authorization: `Bearer ${key}` };
const SHARE_LINK = /https:\/\/app\.churchdesk\.com\/public\/newsletter\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
const SHORT_LINK = /https:\/\/short\.churchdesk\.net\/lnk\/[A-Za-z0-9_-]{20,}/g;
const allowedFrom = (process.env.NEWSLETTER_ALLOWED_FROM || 'churchdesk,barnabites.org,lucawetherall@me.com')
  .split(',')
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

const after = new Date(Date.now() - 30 * 86400000).toISOString();
const listRes = await fetch(
  `${API}/inboxes/${encodeURIComponent(inbox)}/messages?limit=50&after=${encodeURIComponent(after)}`,
  { headers }
);
if (!listRes.ok) throw new Error(`AgentMail list messages failed: ${listRes.status} ${await listRes.text()}`);
const listing = await listRes.json();
const messages = listing.messages ?? listing.data ?? [];
console.log(`AgentMail: ${messages.length} message(s) in the last 30 days.`);

const tmp = await mkdtemp(join(tmpdir(), 'newsletter-'));
let failures = 0;

function runImporter(args, label) {
  console.log(`\n→ import ${label}`);
  try {
    execFileSync('node', ['scripts/import-newsletter.mjs', ...args], { stdio: 'inherit' });
  } catch {
    failures++;
  }
}

const importedShareUrls = new Set();
for (const summary of messages) {
  const id = summary.message_id ?? summary.id;
  const msgRes = await fetch(
    `${API}/inboxes/${encodeURIComponent(inbox)}/messages/${encodeURIComponent(id)}`,
    { headers }
  );
  if (!msgRes.ok) {
    console.warn(`  could not fetch message ${id}: ${msgRes.status}`);
    continue;
  }
  const msg = await msgRes.json();
  const from = (msg.from ?? '').toLowerCase();
  if (!allowedFrom.some((a) => from.includes(a))) {
    console.log(`  skipping message from unexpected sender: ${msg.from}`);
    continue;
  }

  // Bodies plus any text-ish attachments (a forward may carry the original as .eml).
  const parts = [`${msg.html ?? ''}\n${msg.text ?? ''}`];
  for (const att of msg.attachments ?? []) {
    const type = att.content_type ?? '';
    const name = att.filename ?? '';
    if (!/rfc822|message|text|html/i.test(type) && !/\.(eml|html?|txt)$/i.test(name)) continue;
    try {
      const metaRes = await fetch(
        `${API}/inboxes/${encodeURIComponent(inbox)}/messages/${encodeURIComponent(id)}/attachments/${encodeURIComponent(att.attachment_id)}`,
        { headers }
      );
      if (!metaRes.ok) throw new Error(`meta ${metaRes.status}`);
      const { download_url } = await metaRes.json();
      const fileRes = await fetch(download_url);
      if (!fileRes.ok) throw new Error(`download ${fileRes.status}`);
      parts.push(await fileRes.text());
    } catch (e) {
      console.warn(`  could not read attachment "${name}" of ${id}: ${e.message}`);
    }
  }

  // Normalise quoted-printable remnants before matching.
  const haystack = parts.join('\n').replace(/=\r?\n/g, '').replace(/=3D/gi, '=');

  // 1) share links: direct, then via still-working tracking redirects.
  const shareUrls = new Set([...haystack.matchAll(SHARE_LINK)].map((m) => m[0]));
  for (const short of new Set([...haystack.matchAll(SHORT_LINK)].map((m) => m[0]))) {
    try {
      const r = await fetch(short, { redirect: 'follow' });
      r.body?.cancel();
      const m = r.url.match(SHARE_LINK);
      if (m) shareUrls.add(m[0]);
      if (DEBUG) console.log(`    tracker → ${r.status} ${r.url.slice(0, 100)}`);
    } catch (e) {
      if (DEBUG) console.log(`    tracker failed: ${e.message}`);
    }
  }

  const looksLikeNewsletter =
    /u-row-container/.test(haystack) &&
    (/st\.barnabas\.logo/i.test(haystack) || /your weekly newsletter from st barnabas/i.test(haystack));
  if (DEBUG) {
    console.log(
      `  msg ${id}: from=${JSON.stringify(msg.from ?? '')} subject=${JSON.stringify(msg.subject ?? '')} ` +
        `chars=${haystack.length} shareLinks=${shareUrls.size} newsletterHtml=${looksLikeNewsletter}`
    );
  }

  if (shareUrls.size) {
    for (const url of shareUrls) {
      if (importedShareUrls.has(url)) continue;
      importedShareUrls.add(url);
      runImporter([url], url);
    }
  } else if (looksLikeNewsletter) {
    // 2) no usable share link — convert the email's own HTML.
    const file = join(tmp, `${String(id).replace(/[^\w.-]/g, '_')}.html`);
    await writeFile(file, haystack);
    runImporter(['--html', file, '--title', msg.subject ?? ''], `HTML of "${msg.subject ?? id}"`);
  } else {
    console.log(`  no newsletter content in message ${id} — ignoring.`);
  }
}

if (failures) process.exit(1);
