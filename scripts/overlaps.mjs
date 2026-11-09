/**
 * Assert that no two pieces of ink sit on top of each other.
 *
 * "Pixel alignment is part of the design ... Compare with screenshots, not
 * by eye" -- but an overlap is the one fault a screenshot hides, because
 * white text over white space looks like nothing at all until the lines
 * are long enough to collide. This walks every page at 1440 and 390, takes
 * the leaf elements that actually paint (text and photographs), and reports
 * any pair whose boxes intersect by more than 2px in both directions.
 *
 *   npm run build && npm run overlaps
 *
 * Where a browser is already on the machine, point CHROMIUM at it:
 *   CHROMIUM=/path/to/chrome npm run overlaps
 */
import { chromium } from 'playwright';
import { readdir, readFile } from 'node:fs/promises';
import { launchOptions, serveDist } from './serve-dist.mjs';

const PORT = 4402;
const DIST = new URL('../dist/', import.meta.url).pathname;

/* Every series, so a long statement or a wide title is caught wherever it
   is, plus one viewer of each orientation. */
const seriesPaths = async () => {
  const entries = await readdir(new URL('../src/content/series/', import.meta.url));
  return entries
    .filter((f) => f.endsWith('.md') || f.endsWith('.yaml') || f.endsWith('.json'))
    .map((f) => `/projects/${f.replace(/\.(md|yaml|json)$/, '')}/`);
};

const PAGES = [
  '/', '/projects/', '/about/', '/contact/', '/404.html',
  ...(await seriesPaths()),
  '/projects/days-at-sea/6/', '/projects/vertical-summer/8/',
];

/* Runs in the page. Anything an ancestor hides -- the stacked slides of the
   slideshow, the Projects preview, the menu sheet -- is not ink. */
const scan = () => {
  const SEL = 'p, h1, h2, span, a, dd, dt, img, blockquote, figcaption';
  const paints = [];

  for (const el of document.querySelectorAll(SEL)) {
    let hidden = false;
    for (let a = el; a && a !== document.body; a = a.parentElement) {
      const s = getComputedStyle(a);
      if (s.display === 'none' || s.visibility === 'hidden' || s.opacity === '0' || a.hidden) {
        hidden = true;
        break;
      }
      if (s.position === 'fixed') { hidden = true; break; } // out of the flow by design
    }
    if (hidden) continue;

    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) continue;
    const text = (el.textContent || '').trim();
    if (el.tagName !== 'IMG' && !text) continue;
    /* leaves only, or a parent box counts as overlapping its own child */
    if (el.querySelector(SEL)) continue;

    paints.push({
      tag: el.tagName,
      cls: el.className?.toString().slice(0, 28) ?? '',
      t: text.slice(0, 34),
      r: { x: r.x, y: r.y, r: r.right, b: r.bottom },
    });
  }

  const bad = [];
  for (let i = 0; i < paints.length; i++) {
    for (let j = i + 1; j < paints.length; j++) {
      const a = paints[i].r, c = paints[j].r;
      const ox = Math.min(a.r, c.r) - Math.max(a.x, c.x);
      const oy = Math.min(a.b, c.b) - Math.max(a.y, c.y);
      if (ox > 2 && oy > 2) bad.push([paints[i], paints[j], Math.round(ox), Math.round(oy)]);
    }
  }
  return bad;
};

const server = await serveDist(PORT);
const browser = await chromium.launch(launchOptions());
let found = 0;

for (const width of [1440, 390]) {
  const page = await browser.newPage({ viewport: { width, height: 1000 } });
  for (const path of PAGES) {
    const res = await page.goto(`http://localhost:${PORT}${path}`, { waitUntil: 'load' });
    if (!res?.ok()) {
      console.log(`  --  ${path} has no page (a series with no frames)`);
      continue;
    }
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(250); // the load dissolve, so nothing is mid-fade
    const hits = await page.evaluate(scan);
    if (!hits.length) continue;
    found += hits.length;
    console.log(`\n${width}  ${path}`);
    for (const [a, c, ox, oy] of hits.slice(0, 4)) {
      console.log(`   ${a.tag}.${a.cls} "${a.t}"`);
      console.log(`   ${c.tag}.${c.cls} "${c.t}"   overlap ${ox}x${oy}px`);
    }
    if (hits.length > 4) console.log(`   ...and ${hits.length - 4} more`);
  }
  await page.close();
}

console.log(found ? `\n${found} OVERLAPPING PAIRS` : '\nNO OVERLAPS');
await browser.close();
server.close();
process.exit(found ? 1 : 0);
