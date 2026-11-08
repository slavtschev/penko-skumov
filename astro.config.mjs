// @ts-check
import { defineConfig } from 'astro/config';

import { prune } from './scripts/prune-assets.mjs';

export default defineConfig({
  // Clean URLs: /, /projects/, /about/, /contact/
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory' },
  devToolbar: { enabled: false },
  // Astro emits each photograph's original alongside the variants it makes
  // from it; nothing links to them. See scripts/prune-assets.mjs.
  integrations: [prune()],
});
