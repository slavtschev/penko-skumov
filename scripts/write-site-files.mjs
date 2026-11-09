/**
 * Write dist/sitemap.xml and dist/robots.txt after the build.
 *
 * Both depend on where the build is going, which is an environment
 * variable rather than a constant: the site is deployed to a test URL
 * first. Indexing is opt-in, so until INDEXABLE=true the robots file
 * refuses everything and the sitemap is not advertised.
 */
import { readdir, stat, writeFile } from 'node:fs/promises';
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

export async function writeSiteFiles(distDir, log = console) {
  const origin = (process.env.SITE_URL ?? process.env.URL ?? 'http://localhost:4321').replace(/\/$/, '');
  const indexable = process.env.INDEXABLE === 'true';

  const pages = (await walk(distDir))
    .filter((p) => p.endsWith('index.html'))
    .map((p) => '/' + relative(distDir, p).replace(/index\.html$/, ''))
    .filter((p) => !p.startsWith('/_'))
    .sort();

  const today = new Date().toISOString().slice(0, 10);
  const urls = pages
    .map((p) => `  <url><loc>${origin}${p}</loc><lastmod>${today}</lastmod></url>`)
    .join('\n');

  await writeFile(
    join(distDir, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
  );

  await writeFile(
    join(distDir, 'robots.txt'),
    indexable
      ? `User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`
      : `# Not the real site yet: nothing here should be indexed.\nUser-agent: *\nDisallow: /\n`,
  );

  log.info(
    `wrote sitemap.xml (${pages.length} urls) and robots.txt ` +
      `(${indexable ? 'indexable' : 'NOINDEX'}) for ${origin}`,
  );
}

/** @type {() => import('astro').AstroIntegration} */
export const siteFiles = () => ({
  name: 'write-site-files',
  hooks: {
    'astro:build:done': async ({ dir, logger }) => {
      await writeSiteFiles(dir.pathname, logger);
    },
  },
});
