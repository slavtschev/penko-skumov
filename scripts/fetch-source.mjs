/**
 * Mirror the existing penkoskumov.com into source/ so the import runs
 * offline and repeatably.
 *
 * The handoff names the Webflow export on Dimitar's machine as the source.
 * This fetches the live site instead, which is the same content and newer:
 * the June 2025 export has no Flat World page. If you do have the export,
 * skip this script -- point import-webflow.mjs at the export folder, which
 * has the same page names and an images/ folder.
 *
 * Photographs are not downloaded. The import only needs each one's
 * intrinsic size, so this reads the JPEG header over a range request --
 * a couple of KB per file instead of ~200MB of photographs.
 *
 *   node scripts/fetch-source.mjs
 *
 * Behind an HTTP proxy (a cloud session is), let Node see it:
 *   NODE_USE_ENV_PROXY=1 node scripts/fetch-source.mjs
 */
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { FILE_FIXES } from './source-fixes.mjs';

const ORIGIN = 'https://penkoskumov.com';
const OUT = new URL('../source/', import.meta.url).pathname;
const PAGES = [
  'index', 'projects', 'archive', 'about', 'contact',
  'days-at-sea', 'six-days-on-an-island', 'tabula-rasa', 'sense-of-freedom',
  'the-festival', 'coincidence', 'flat-world', 'vertical-summer',
  'read-between-the-lines', 'saints', 'lith-prints',
];

/** width and height out of a JPEG's SOF marker, or a PNG's IHDR. */
function imageSize(buf) {
  if (buf[0] === 0x89 && buf[1] === 0x50) {
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  }
  if (!(buf[0] === 0xff && buf[1] === 0xd8)) return null;
  let i = 2;
  while (i < buf.length - 9) {
    if (buf[i] !== 0xff) { i++; continue; }
    const marker = buf[i + 1];
    // SOF0..SOF15, skipping the four that are not frame headers
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc, 0xd8].includes(marker)) {
      return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
    }
    i += 2 + buf.readUInt16BE(i + 2);
  }
  return null;
}

const get = async (url, headers = {}) => {
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const res = await fetch(url, { headers, redirect: 'follow' });
      if (res.ok || res.status === 206) return res;
      if (res.status === 404) return null;
    } catch (err) {
      if (attempt === 3) throw err;
    }
    await new Promise((r) => setTimeout(r, 2 ** attempt * 1000));
  }
  return null;
};

await mkdir(join(OUT, 'pages'), { recursive: true });

for (const name of PAGES) {
  const target = join(OUT, 'pages', `${name}.html`);
  if (existsSync(target)) continue;
  const res = await get(`${ORIGIN}/${name}.html`);
  if (!res) { console.warn(`  missing  ${name}.html`); continue; }
  await writeFile(target, await res.text());
  console.log(`  page     ${name}.html`);
}

// every photograph referenced across the pages
const files = new Set();
for (const name of PAGES) {
  const target = join(OUT, 'pages', `${name}.html`);
  if (!existsSync(target)) continue;
  const html = await readFile(target, 'utf8');
  for (const m of html.matchAll(/src="images\/([^"]+\.(?:jpg|jpeg|png))"/gi)) files.add(FILE_FIXES[m[1]] ?? m[1]);
}

const cachePath = join(OUT, 'dimensions.json');
const cache = existsSync(cachePath) ? JSON.parse(await readFile(cachePath, 'utf8')) : {};
let read = 0;
for (const file of [...files].sort()) {
  if (cache[file]?.width) continue;
  const res = await get(`${ORIGIN}/images/${encodeURIComponent(file)}`, { Range: 'bytes=0-131071' });
  if (!res) { console.warn(`  missing  images/${file}`); continue; }
  const size = imageSize(Buffer.from(await res.arrayBuffer()));
  if (!size) { console.warn(`  no size  images/${file}`); continue; }
  cache[file] = size;
  if (++read % 25 === 0) {
    await writeFile(cachePath, JSON.stringify(cache, null, 1) + '\n');
    console.log(`  sizes    ${read} read`);
  }
}
const sorted = Object.fromEntries(Object.entries(cache).sort(([a], [b]) => a.localeCompare(b)));
await writeFile(cachePath, JSON.stringify(sorted, null, 1) + '\n');
console.log(`\n${PAGES.length} pages, ${Object.keys(cache).length} photographs sized (${read} newly read)`);
