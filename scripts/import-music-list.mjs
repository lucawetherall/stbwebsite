/**
 * Import a printed music list into the `services` collection.
 *
 * The Director of Music produces each term's music list as a self-contained HTML
 * document (masthead, month rules, one <article class="service"> per service).
 * This turns those documents into src/content/services/YYYY-MM-DD.json entries,
 * which is how the site shows "This Sunday" and the forward music list.
 *
 *   node scripts/import-music-list.mjs <file.html> [more.html ...]
 *
 * The conventions it applies come from
 * docs/superpowers/specs/2026-08-12-music-lists-design.md:
 *   - A service marked `said` (no choir) is not written. A date on which every
 *     service is said gets no file at all — the absence is the silence.
 *   - Several services in a day become one file with several `offices`.
 *   - Lectionary references ("Proper 18") are dropped; sub-titles are kept.
 *   - "Time tbc" must be resolved in TIMES below before a service can be written.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { basename } from 'node:path';
import * as cheerio from 'cheerio';

const OUT = 'src/content/services';

// Times confirmed by the Director of Music for services printed as "Time tbc".
const TIMES = {
  '2026-10-18': '6.30pm', '2026-11-01': '6.00pm', '2026-12-13': '6.00pm',
  '2026-12-24': '11.00pm', '2027-01-03': '6.00pm', '2027-02-10': '7.00pm',
  '2027-03-25': '7.00pm', '2027-03-26': '2.00pm', '2027-03-27': '7.30pm',
};

// The schema carries one feast per date, so where an evening service keeps a
// different feast from the morning it is named in full instead.
const NAMES = {
  '2026-10-18|6.30pm': 'Joint Choral Service for St Luke, at St John the Baptist, Holland Road',
  '2026-11-01|6.00pm': 'Solemn Requiem for the Faithful Departed',
  '2027-05-02|6.00pm': 'Choral Evensong for Ascensiontide',
  '2027-06-06|6.00pm': 'Choral Evensong for St Barnabas the Apostle',
  '2027-07-04|6.00pm': 'Choral Evensong for the End of the Choir Year',
};

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
  'August', 'September', 'October', 'November', 'December'];

const SUB = /@SUB@(.*?)@BUS@/g;

const decode = (html) =>
  cheerio.load(`<div>${html}</div>`)('div').text().replace(/\u00a0/g, ' ');

/** Inner HTML to plain text, marking sub-spans so they can be formatted after decoding. */
function flatten(html) {
  return decode(
    html
      .replace(/<span style="[^"]*">(.*?)<\/span>/g, '$1') // the Cambria flat-sign wrapper
      .replace(/<span class="sub">(.*?)<\/span>/g, '@SUB@$1@BUS@')
      .replace(/<\/?em>/g, '')
  ).replace(/\s+/g, ' ').trim();
}

/** A music value's sub-span becomes a roman annotation: "Plainsong" to "(plainsong)". */
function annotate(s) {
  return s.replace(SUB, (_, sub) => {
    const t = sub.trim();
    if (t.startsWith('(') || t.startsWith('—')) return ` ${t}`;
    return ` (${t.charAt(0).toLowerCase()}${t.slice(1)})`;
  }).replace(/\s+/g, ' ').trim();
}

/** A feast's sub-span: drop the lectionary reference, keep the rest as "(...)" or "— ...". */
function feastText(s) {
  return s.replace(SUB, (_, sub) => {
    let t = sub.replace(/\(Proper\s+\d+\)/g, '').trim();
    const dashed = t.startsWith('—');
    t = t.replace(/^—\s*/, '').trim();
    if (!t) return '';
    if (dashed) return ` — ${t}`;
    return t.startsWith('(') ? ` ${t}` : ` (${t})`;
  }).replace(/\s+/g, ' ').trim();
}

const byDate = new Map();

for (const file of process.argv.slice(2)) {
  const $ = cheerio.load(readFileSync(file, 'utf8'));
  const year = Number($('.doc-period').text().match(/(\d{4})/)[1]);

  $('article.service').each((_, el) => {
    const $s = $(el);
    const raw = $s.find('.service-date').text().trim(); // "Sunday 4th April"
    const m = raw.match(/(\d+)\w{2}\s+([A-Za-z]+)$/);
    if (!m) throw new Error(`Unreadable date "${raw}" in ${basename(file)}`);
    const date = `${year}-${String(MONTHS.indexOf(m[2]) + 1).padStart(2, '0')}-${m[1].padStart(2, '0')}`;

    const feast = feastText(flatten($s.find('.service-feast').html() ?? ''));
    if (!byDate.has(date)) byDate.set(date, { date, feast: '', offices: [] });
    const day = byDate.get(date);
    // The day's feast comes from the first service that names one — including a
    // said Mass, which is skipped below but still tells us what day it is.
    if (!day.feast && feast) day.feast = feast;

    if ($s.hasClass('said')) return;

    let time = $s.find('.service-time').text().trim();
    if (/tbc/i.test(time)) {
      if (!TIMES[date]) throw new Error(`${date} is still "Time tbc" — add it to TIMES`);
      time = TIMES[date];
    }

    const items = [];
    const $list = $s.find('.music-list').children();
    for (let i = 0; i < $list.length; i += 2) {
      const label = $($list[i]).text().trim();
      const values = ($($list[i + 1]).html() ?? '')
        .split(/<br\s*\/?>/)
        .flatMap((frag) => annotate(flatten(frag)).split('; '))
        .map((v) => v.trim())
        .filter(Boolean);
      if (label && values.length) items.push({ label, values });
    }

    day.offices.push({
      time,
      name: NAMES[`${date}|${time}`] ?? $s.find('.service-type').text().trim(),
      items,
    });
  });
}

let written = 0;
const silent = [];
for (const [date, day] of [...byDate].sort()) {
  if (!day.offices.length) { silent.push(date); continue; }
  if (!day.feast) throw new Error(`${date} has no feast`);
  const path = `${OUT}/${date}.json`;
  const existed = existsSync(path);
  writeFileSync(path, JSON.stringify(day, null, 2) + '\n');
  console.log(`${existed ? 'updated' : 'wrote  '} ${path}  ${day.offices.length} service(s)`);
  written++;
}
console.log(`\n${written} file(s); ${silent.length} silent date(s) skipped: ${silent.join(', ')}`);
