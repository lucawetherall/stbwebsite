// Poll an AgentMail inbox for newly arrived ChurchDesk newsletters and import them.
//
// The inbox (e.g. stbarnabas@agentmail.to) is subscribed to the parish's Weekly News.
// This script lists its recent messages via the AgentMail API, pulls each message's
// full body, extracts every ChurchDesk public share link, and runs
// scripts/import-newsletter.mjs for each one. It is stateless on purpose: nothing is
// marked as processed in AgentMail, because the importer dedupes by message uuid, so
// re-seeing an email is always a no-op.
//
// Run by .github/workflows/import-newsletter.yml. Requires:
//   AGENTMAIL_API_KEY — API key from the AgentMail console (repo secret)
//   AGENTMAIL_INBOX   — the inbox address, e.g. "stbarnabas@agentmail.to"
// Exits 0 quietly when unconfigured, so the workflow works with or without it.
import { execFileSync } from 'node:child_process';

const API = 'https://api.agentmail.to/v0';
const key = process.env.AGENTMAIL_API_KEY;
const inbox = process.env.AGENTMAIL_INBOX;

if (!key || !inbox) {
  console.log('AgentMail not configured (AGENTMAIL_API_KEY / AGENTMAIL_INBOX unset) — skipping inbox check.');
  process.exit(0);
}

const headers = { Authorization: `Bearer ${key}` };
const SHARE_LINK = /https:\/\/app\.churchdesk\.com\/public\/newsletter\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;

const after = new Date(Date.now() - 30 * 86400000).toISOString();
const listRes = await fetch(
  `${API}/inboxes/${encodeURIComponent(inbox)}/messages?limit=50&after=${encodeURIComponent(after)}`,
  { headers }
);
if (!listRes.ok) throw new Error(`AgentMail list messages failed: ${listRes.status} ${await listRes.text()}`);
const listing = await listRes.json();
const messages = listing.messages ?? listing.data ?? [];
console.log(`AgentMail: ${messages.length} message(s) in the last 30 days.`);

const shareUrls = new Set();
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

  // Bodies, plus any text-ish attachments — a bulk forward carries each original
  // newsletter as a message/rfc822 (.eml) attachment, so the share links live in
  // attachment content, not the covering email's body.
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

  // Quoted-printable soft breaks may survive in raw bodies; normalise before matching.
  const haystack = parts.join('\n').replace(/=\r?\n/g, '').replace(/=3D/gi, '=');
  const before = shareUrls.size;
  for (const m of haystack.matchAll(SHARE_LINK)) shareUrls.add(m[0].replace(/=$/, ''));

  // Emails as delivered use short.churchdesk.net click-tracking redirects rather than
  // bare share links; resolve each unique one and keep those landing on a share page.
  const SHORT_LINK = /https:\/\/short\.churchdesk\.net\/lnk\/[A-Za-z0-9_-]{20,}/g;
  const shorts = [...new Set([...haystack.matchAll(SHORT_LINK)].map((m) => m[0]))];
  if (shorts.length) console.log(`  resolving ${shorts.length} tracking link(s)…`);
  for (const short of shorts) {
    try {
      const r = await fetch(short, { redirect: 'follow' });
      r.body?.cancel();
      const m = r.url.match(SHARE_LINK);
      if (m) shareUrls.add(m[0]);
    } catch (e) {
      console.warn(`  could not resolve ${short.slice(0, 60)}…: ${e.message}`);
    }
  }
  if (process.env.DEBUG_INBOX === '1') {
    console.log(
      `  msg ${id}: subject=${JSON.stringify(msg.subject ?? '')} from=${JSON.stringify(msg.from ?? '')} ` +
        `bodyChars=${(msg.html ?? '').length + (msg.text ?? '').length} attachments=[${(msg.attachments ?? [])
          .map((a) => `${a.filename}:${a.content_type}`)
          .join(', ')}] newLinks=${shareUrls.size - before} ` +
        `churchdeskUrls=${JSON.stringify([...haystack.matchAll(/https?:\/\/[^\s"'<>]*churchdesk[^\s"'<>]*/gi)].map((m) => m[0].slice(0, 90)).slice(0, 12))}`
    );
  }
}

if (!shareUrls.size) {
  console.log('No ChurchDesk newsletter links found in the inbox.');
  process.exit(0);
}

let failures = 0;
for (const url of shareUrls) {
  console.log(`\n→ import ${url}`);
  try {
    execFileSync('node', ['scripts/import-newsletter.mjs', url], { stdio: 'inherit' });
  } catch {
    failures++;
  }
}
if (failures) process.exit(1);
