/**
 * Remove built assets that nothing in the build references.
 *
 * Astro emits the original of every photograph it processes, on top of the
 * AVIF, WebP and JPEG it generates from it. Nothing links to those
 * originals -- they are 1600px JPEGs the pages never ask for -- but they
 * are the bulk of dist: 123MB of the 133MB in the first build of the
 * series grid. This deletes a file in the assets directory only when its
 * name appears nowhere in the built HTML, CSS or JS.
 *
 * Used as an Astro integration on astro:build:done, so a plain
 * `npm run build` is already pruned.
 */
import { readdir, readFile, rm, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';

const walk = async (dir) => {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(path)));
    else out.push(path);
  }
  return out;
};

export async function pruneAssets(distDir, assetsDir = '_astro', log = console) {
  const all = await walk(distDir);
  const assets = all.filter((p) => relative(distDir, p).startsWith(assetsDir));
  const readable = all.filter((p) => /\.(html|css|js|json|xml|txt)$/i.test(p));

  // every asset name mentioned anywhere in the build
  const mentioned = new Set();
  for (const path of readable) {
    const text = await readFile(path, 'utf8');
    for (const m of text.matchAll(/[\w.-]+\.(?:avif|webp|jpe?g|png|gif|svg|woff2?|css|js|mp4)/gi)) {
      mentioned.add(m[0]);
    }
  }

  let removed = 0;
  let bytes = 0;
  for (const path of assets) {
    const name = path.slice(path.lastIndexOf('/') + 1);
    if (mentioned.has(name)) continue;
    bytes += (await stat(path)).size;
    await rm(path);
    removed++;
  }

  if (removed) {
    log.info(`pruned ${removed} unreferenced asset(s), ${(bytes / 1e6).toFixed(1)}MB`);
  }
  return { removed, bytes };
}

/** @type {() => import('astro').AstroIntegration} */
export const prune = () => ({
  name: 'prune-unreferenced-assets',
  hooks: {
    'astro:build:done': async ({ dir, logger }) => {
      await pruneAssets(dir.pathname, '_astro', logger);
    },
  },
});
