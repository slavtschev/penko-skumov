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
  ['1440 h1 (ink-aligned, cap-top on 64)', 'about', 1440, 'main h1', (b) => [b.x, b.y], [40, 58]],
  ['1440 footer left', 'about', 1440, '.site-footer.at-page span:first-child', (b) => [b.x, b.y, b.bottom], [40, 744, 760]],
  ['1440 footer right', 'about', 1440, '.site-footer.at-page span:last-child', (b) => [b.right, b.y], [1400, 744]],
  // step 1 -- D4-Phone-Projects / D4-Phone-Menu (390)
  ['390 name', 'about', 390, '.site-header .name', (b) => [b.x, b.y], [19, 22]],
  ['390 hamburger rule 1', 'about', 390, '.burger i:nth-child(1)', (b) => [b.x, b.y, b.right], [348, 26, 370]],
  ['390 hamburger rule 2', 'about', 390, '.burger i:nth-child(2)', (b) => [b.x, b.y, b.right], [348, 31, 370]],
  ['390 hamburger rule 3', 'about', 390, '.burger i:nth-child(3)', (b) => [b.x, b.y, b.right], [348, 36, 370]],
  ['390 footer stacked', 'about', 390, '.site-footer.at-page span:last-child', (b) => [b.x, b.y, b.bottom], [20, 788, 804]],
  ['390 menu Projects', 'menu', 390, '.sheet-nav a:nth-child(1)', (b) => [b.x, b.y], [18, 58]],
  ['390 menu About', 'menu', 390, '.sheet-nav a:nth-child(2)', (b) => [b.x, b.y], [20, 106]],
  ['390 menu Contact', 'menu', 390, '.sheet-nav a:nth-child(3)', (b) => [b.x, b.y], [19, 154]],
  ['390 menu Close', 'menu', 390, '.sheet .close span', (b) => [b.right, b.y], [370, 22]],
];

const box = (page, selector, read) =>
  page.evaluate(
    ([s, fn]) => {
      const el = document.querySelector(s);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const b = { x: r.x, y: r.y, right: r.right, bottom: r.bottom, w: r.width, h: r.height };
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
  const height = width === 1440 ? 800 : 844;
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });

  for (const name of ['home', 'projects', 'about', 'contact']) {
    await page.goto(`http://localhost:${PORT}/${name === 'home' ? '' : name + '/'}`, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
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
