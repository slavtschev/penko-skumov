// @ts-check
import { defineConfig } from 'astro/config';

import { prune } from './scripts/prune-assets.mjs';
import { redirects } from './scripts/write-redirects.mjs';
import { siteFiles } from './scripts/write-site-files.mjs';

export default defineConfig({
  // Where this build is going. The site is deployed to a test URL before
  // the real domain, so it comes from the environment. See src/lib/site.ts.
  site: (process.env.SITE_URL ?? process.env.URL ?? 'http://localhost:4321').replace(/\/$/, ''),
  // Clean URLs: /, /projects/, /about/, /contact/
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory' },
  devToolbar: { enabled: false },
  // Astro emits each photograph's original alongside the variants it makes
  // from it; nothing links to them. See scripts/prune-assets.mjs.
  integrations: [prune(), redirects(), siteFiles()],
});
