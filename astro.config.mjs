// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  // Clean URLs: /, /projects/, /about/, /contact/
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory' },
  devToolbar: { enabled: false },
});
