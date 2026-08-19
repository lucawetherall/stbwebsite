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
  // Quoted-printable soft breaks may survive in raw bodies; normalise before matching.
  const haystack = `${msg.html ?? ''}\n${msg.text ?? ''}`.replace(/=\r?\n/g, '').replace(/=3D/gi, '=');
  for (const m of haystack.matchAll(SHARE_LINK)) shareUrls.add(m[0]);
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
