/**
 * The static server the checks run against: dist/ over http, nothing else.
 * Shared by scripts/verify.mjs and scripts/overlaps.mjs.
 */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const DIST = new URL('../dist/', import.meta.url).pathname;

const TYPES = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript',
  '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.avif': 'image/avif', '.webp': 'image/webp',
  '.ico': 'image/x-icon', '.xml': 'application/xml', '.txt': 'text/plain',
};

export const serveDist = (port) =>
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
    server.listen(port, () => resolve(server));
  });

/**
 * A browser. Playwright's own download is used where it is there; where the
 * machine already has one, point CHROMIUM at it:
 *   CHROMIUM=/path/to/chrome npm run verify
 */
export const launchOptions = () =>
  process.env.CHROMIUM
    ? { executablePath: process.env.CHROMIUM, args: ['--no-sandbox'] }
    : {};
