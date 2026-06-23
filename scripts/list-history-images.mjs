// One-off: print every <img> URL on the relevant history archive pages, so we can
// choose the right source for each target image (then strip any -WxH size suffix).
const ORIGIN = 'https://barnabites.org.uk';
const PAGES = [
  '/history/apse-painting/',
  '/history/tinchurch/',
  '/history/construction/',
  '/history/shearmanchurches/',
  '/history/stained-glass/',
  '/history/lady-chapel/',
  '/history/organ2011/',
  '/history/photographs/',
];
for (const page of PAGES) {
  try {
    const html = await (await fetch(ORIGIN + page)).text();
    const urls = [...html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)].map((m) => m[1]);
    console.log(`\n# ${page}`);
    for (const u of [...new Set(urls)]) console.log(u);
  } catch (e) {
    console.log(`# ${page} — ERROR ${e.message}`);
  }
}
