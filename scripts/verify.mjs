/**
 * Check the built pages against the Designs 4 boards.
 *
 * The handoff asks for every step to be checked against its board with
 * Playwright screenshots at 1440 and 390 before moving on. This does that:
 * it screenshots the pages into shots/ and asserts the positions read off
 * the boards. Add a row to CHECKS as each step lands.
 *
 *   npm run build && npm run verify
 *
 * Needs a browser once:  npx playwright install chromium
 * Where one is already on the machine, point CHROMIUM at it instead:
 *   CHROMIUM=/path/to/chrome npm run verify
 */
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { mkdir } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const DIST = new URL('../dist/', import.meta.url).pathname;
const SHOTS = new URL('../shots/', import.meta.url).pathname;
const PORT = 4399;

const TYPES = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript',
  '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.avif': 'image/avif', '.webp': 'image/webp',
};

const serve = () =>
  new Promise((resolve) => {
    const server = createServer(async (req, res) => {
      let p = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname));
      if (p.endsWith('/')) p += 'index.html';
      try {
        const body = await readFile(join(DIST, p));
        res.writeHead(200, { 'content-type': TYPES[extname(p)] ?? 'application/octet-stream' });
        res.end(body);
      } catch {
        res.writeHead(404).end('not found');
      }
    });
    server.listen(PORT, () => resolve(server));
  });

/** Board positions. [what, selector, what to read, expected] */
const CHECKS = [
  // step 1 -- D4-404 / D4-Projects (1440)
  ['1440 name', 'about', 1440, '.site-header .name', (b) => [b.x, b.y], [39, 22]],
  ['1440 nav right edge', 'about', 1440, '.nav', (b) => [b.right, b.y], [1400, 22]],
  ['1440 footer left, 40 above the page bottom', 'about', 1440, '.site-footer.at-page span:first-child', (b) => [b.x, b.gap], [40, 40]],
  ['1440 footer right', 'about', 1440, '.site-footer.at-page span:last-child', (b) => [b.right, b.gap], [1400, 40]],
  // step 1 -- D4-Phone-Projects / D4-Phone-Menu (390)
  ['390 name', 'about', 390, '.site-header .name', (b) => [b.x, b.y], [19, 22]],
  ['390 hamburger rule 1', 'about', 390, '.burger i:nth-child(1)', (b) => [b.x, b.y, b.right], [348, 26, 370]],
  ['390 hamburger rule 2', 'about', 390, '.burger i:nth-child(2)', (b) => [b.x, b.y, b.right], [348, 31, 370]],
  ['390 hamburger rule 3', 'about', 390, '.burger i:nth-child(3)', (b) => [b.x, b.y, b.right], [348, 36, 370]],
  ['390 footer stacked, 40 above the page bottom', 'about', 390, '.site-footer.at-page span:last-child', (b) => [b.x, b.gap], [20, 40]],
  ['390 menu Projects', 'menu', 390, '.sheet-nav a:nth-child(1)', (b) => [b.x, b.y], [18, 58]],
  ['390 menu About', 'menu', 390, '.sheet-nav a:nth-child(2)', (b) => [b.x, b.y], [20, 106]],
  ['390 menu Contact', 'menu', 390, '.sheet-nav a:nth-child(3)', (b) => [b.x, b.y], [19, 154]],
  ['390 menu Close', 'menu', 390, '.sheet .close span', (b) => [b.right, b.y], [370, 22]],

  /* step 4 -- D4-Projects */
  ['1440 Projects label', 'projects', 1440, '.label', (b) => [b.x, b.y], [39, 60]],
  ['1440 Archive label', 'projects', 1440, '.list + .list .label', (b) => [b.x, b.y], [500, 60]],
  ['1440 first series title', 'projects', 1440, '.title', (b) => [b.x, b.y], [153, 94]],
  ['1440 first series year', 'projects', 1440, '.year', (b) => [b.x, b.y], [40, 108]],
  ['1440 preview slot', 'projects', 1440, '.previews', (b) => [b.x, b.w], [960, 440]],
  // the board draws 440x292; the box is derived, so 293 (see CLAUDE.md)
  ['1440 preview frame', 'projects', 1440, '.preview[data-first] .box', (b) => [b.w, b.h], [440, 293]],
  ['390 Projects label', 'projects', 390, '.label', (b) => [b.x, b.y], [19, 60]],
  ['390 first series title', 'projects', 390, '.title', (b) => [b.x, b.y], [18, 94]],
  ['390 first series year', 'projects', 390, '.year', (b) => [b.x, b.y], [20, 131]],
  ['390 Archive label', 'projects', 390, '.list + .list .label', (b) => [b.x, b.y], [20, 644]],

  /* step 4 -- D4-About. Everything below the portrait sits 2px above the
     board, which is the portrait's own derived box: 562 where the board
     draws 564. */
  ['1440 portrait', 'about', 1440, '.portrait .box', (b) => [b.x, b.y, b.w, b.h], [40, 64, 440, 562]],
  ['1440 portrait caption', 'about', 1440, '.portrait-caption', (b) => [b.x, b.y], [39, 634]],
  ['1440 affiliations', 'about', 1440, '.affiliations', (b) => [b.x, b.y], [40, 688]],
  ['1440 About h1', 'about', 1440, 'h1', (b) => [b.x, b.y], [500, 58]],
  ['1440 bio', 'about', 1440, '.bio', (b) => [b.x, b.y, b.w], [500, 112, 440]],
  ['1440 quotation', 'about', 1440, '.quotation', (b) => [b.x, b.y, b.w], [960, 56, 440]],
  ['1440 exhibitions label', 'about', 1440, '.label', (b) => [b.x, b.y], [39, 890]],
  ['1440 exhibitions list', 'about', 1440, '.list', (b) => [b.x, b.y, b.w], [40, 925, 900]],

  /* step 4 -- D4-Contact */
  ['1440 wall', 'contact', 1440, '.wall', (b) => [b.x, b.y, b.w, b.h], [40, 64, 900, 700]],
  ['1440 print frame', 'contact', 1440, '.fr', (b) => [Math.round(b.x), Math.round(b.y), Math.round(b.w)], [198, 202, 584]],
  ['1440 plaque', 'contact', 1440, '.plaque', (b) => [b.x, Math.round(b.y)], [59, 733]],
  ['1440 wall caption', 'contact', 1440, '.wallcap', (b) => [b.x, Math.round(b.y)], [40, 772]],
  ['1440 Contact h1', 'contact', 1440, 'h1', (b) => [b.x, b.y], [959, 58]],
  ['1440 first row value', 'contact', 1440, '.row .value a', (b) => [b.x, Math.round(b.y)], [1075, 642]],

  /* step 4 -- D4-404 */
  ['1440 404 h1', '404', 1440, 'h1', (b) => [b.x, b.y], [38, 58]],
  ['1440 404 sentence', '404', 1440, '.aside p', (b) => [b.x, b.y, b.w], [500, 56, 440]],
  ['1440 404 first link', '404', 1440, '.links a', (b) => [b.x, b.y], [499, 146]],
  ['390 404 h1', '404', 390, 'h1', (b) => [b.x, b.y], [18, 58]],
  ['390 404 sentence', '404', 390, '.aside p', (b) => [b.x, b.y, b.w], [20, 112, 350]],
  ['390 404 first link', '404', 390, '.links a', (b) => [b.x, b.y], [19, 202]],
];

const box = (page, selector, read) =>
  page.evaluate(
    ([s, fn]) => {
      const el = document.querySelector(s);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const b = {
        x: r.x, y: r.y, right: r.right, bottom: r.bottom, w: r.width, h: r.height,
        // distance from this box's bottom to the bottom of the page
        gap: document.documentElement.scrollHeight - r.bottom,
      };
      return eval(`(${fn})`)(b).map((n) => +n.toFixed(2));
    },
    [selector, read.toString()],
  );

const server = await serve();
await mkdir(SHOTS, { recursive: true });
const browser = await chromium.launch(
  process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM, args: ['--no-sandbox'] } : {},
);
let failed = 0;

for (const width of [1440, 390]) {
  // tall enough that no page scrolls, which would narrow the content box
  const height = width === 1440 ? 2200 : 2600;
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });

  for (const name of ['home', 'projects', 'about', 'contact', '404']) {
    const path = name === 'home' ? '' : name === '404' ? '404.html' : `${name}/`;
    await page.goto(`http://localhost:${PORT}/${path}`, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    // photographs dissolve in; measure the settled page
    await page.waitForTimeout(1200);
    await page.screenshot({ path: join(SHOTS, `${name}-${width}.png`) });
    for (const [label, pageName, w, selector, read, want] of CHECKS) {
      if (pageName !== name || w !== width) continue;
      const got = await box(page, selector, read);
      const ok = got && JSON.stringify(got) === JSON.stringify(want);
      if (!ok) failed++;
      console.log(`${ok ? '  ok  ' : ' FAIL '} ${label.padEnd(38)} board ${JSON.stringify(want)}  built ${JSON.stringify(got)}`);
    }
  }

  // the menu sheet, open
  if (width === 390) {
    await page.goto(`http://localhost:${PORT}/projects/`, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    await page.click('.burger');
    await page.waitForTimeout(900);
    await page.screenshot({ path: join(SHOTS, `menu-${width}.png`) });
    for (const [label, pageName, w, selector, read, want] of CHECKS) {
      if (pageName !== 'menu' || w !== width) continue;
      const got = await box(page, selector, read);
      const ok = got && JSON.stringify(got) === JSON.stringify(want);
      if (!ok) failed++;
      console.log(`${ok ? '  ok  ' : ' FAIL '} ${label.padEnd(38)} board ${JSON.stringify(want)}  built ${JSON.stringify(got)}`);
    }
  }
  await page.close();
}

// the Home carries no footer
const page = await browser.newPage({ viewport: { width: 1440, height: 800 } });
await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'load' });
const homeFooter = await page.locator('.site-footer.at-page').count();
if (homeFooter !== 0) failed++;
console.log(`${homeFooter === 0 ? '  ok  ' : ' FAIL '} ${'Home has no footer'.padEnd(38)} board 0  built ${homeFooter}`);
await page.close();

await browser.close();
server.close();

console.log(`\n${failed === 0 ? 'ALL MATCH' : `${failed} MISMATCH`} — screenshots in shots/`);
process.exit(failed === 0 ? 0 : 1);
