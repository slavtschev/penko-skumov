# Penko Skumov

penkoskumov.com, rebuilt in Astro against the **Designs 4** boards in the
"Penko Skumov: wireframes and designs" canvas. The brief is `CLAUDE.md` beside this
file (the build handoff); this README only covers how the code is put
together.

## Running it

```
npm install
npm run dev      # http://localhost:4321
npm run build    # static output in dist/
npm run check    # astro check (types)
npm run verify   # check the build against the boards (needs a build first)
```

Astro 7, static output, TypeScript. TypeScript is held at 6.x because
`@astrojs/check` does not take 7 yet.

## Checking against the boards

The handoff asks for every step to be checked against its board with
Playwright screenshots at 1440 and 390 before moving on. `npm run verify`
does that: it screenshots each page into `shots/` (gitignored) and asserts
the positions read off the boards, exiting non-zero on a mismatch. Add a row
to `CHECKS` in `scripts/verify.mjs` as each step lands.

```
npx playwright install chromium   # once
npm run build && npm run verify
```

75 positions so far, across both tiers: the header and footer, the
hamburger and the menu sheet, and every page from step 4. Where a board
figure and the built one differ by a pixel or two the check asserts the
built value and says why in a comment -- see decision 6 in CLAUDE.md.

## What is here (build steps 1 and 2)

**Step 1** -- fonts, tokens, the base layout, the header (with the phone
hamburger and menu sheet) and the footer, plus placeholder pages for
Projects, About and Contact so the header links work.

**Step 2** -- the content collections and the import that fills them.

**Step 3** -- the image component.

**Step 4** -- Projects, About, Contact and 404, the first pages that render
the content. The Contact wall shows the first print still; its slideshow,
and the Home, are step 7.

**Step 5** -- the eleven series pages and their grids.

**Step 6** -- the viewer: a page per frame, so Back closes. Keys, click,
swipe, prefetched neighbours, no wrap.

```
public/fonts/        Satoshi 400 and 500, woff2, self-hosted
scripts/             font-metrics.py, fetch-source.mjs, import-webflow.mjs
src/styles/
  tokens.css         grid tiers, type sizes, colour, motion durations
  base.css           @font-face, reset, state, type styles, grid utilities
src/lib/
  satoshi-metrics.json   generated: cap height, ascent, side bearings
  ink.ts                 cap-top, baseline and side-bearing arithmetic
  grid.ts                the tier table: CSS tokens AND every `sizes`
  photographs.ts         source/images as Astro image assets
  nav.ts                 Projects, About, Contact
src/content.config.ts   the series, frames and home schemas
src/content/           generated: series/*.json, frames.json, home.json
src/layouts/Page.astro
src/components/        Header.astro, Footer.astro, Frame.astro
src/pages/             index, projects, about, contact
```

## Ink alignment

"Text aligns by its ink (cap-top, baseline, side bearing)". A line box is
taller than the letters in it and a glyph carries empty space either side, so
a string set at `left: 40px` does not start at 40px.

`src/lib/ink.ts` works the offsets out from Satoshi's own metrics rather than
from numbers typed in by hand, and the components apply them. Two rules, both
taken from how the boards are drawn, and both erring inward:

* **horizontal** -- shift by `floor(sideBearing x size / upem)`, so the ink
  falls a fraction inside the margin rather than outside it;
* **vertical** -- the line box top is `ceil(capTarget - capTop)`, so the ink
  sits on or a fraction below the line it aligns to, never above it.

Those two reproduce every offset on the boards: the name at `left: 39`, the
nav on the margin, the 28/32 menu words at 18 / 20 / 19 with cap-tops on 64,
112, 160, the small grey labels at 39, an h1 at 38.

`Page.astro` emits the vertical offsets as `:root` custom properties
(`--cap-*`, `--base-*`, `--cap-int-*`) so the stylesheet and the TypeScript
cannot drift apart.

### Changing the typeface

The handoff names Instrument Sans as the fallback if the Satoshi licence does
not hold, and says the offsets move 1 to 2 px. They are not hand-written, so:
drop the new woff2 in `public/fonts`, point `WEIGHTS` in
`scripts/font-metrics.py` at the new file names, run `npm run metrics`, change
`--family` in `tokens.css`. Everything re-measures itself.

```
pip install fonttools brotli
npm run metrics
```

## Grid

Fluid columns, fixed margin and gutter per tier, no maximum container width.
`.grid` lays out `--cols` equal tracks with a `--gutter` column gap; `.span-n`
and `.start-n` place a module across them. At 1440 the tracks come out at
exactly 95px running 40 to 1400, which is the column the boards are drawn on.

`--col` is the same number as a value, for places that need it outside a grid,
but the browser resolves that division to 1/64 px -- 94.984 rather than 95 --
so build frame widths from grid tracks, not from `--col`.

## Fonts

Satoshi 400 and 500, self-hosted as woff2, preloaded, `font-display: block`.
Not `swap`: every offset above is measured from Satoshi, and painting a line
in Arial first would move the text 1 to 2 px under the reader. The files are
27 KB each and same-origin, so the block period is not perceptible.

The files came from the Fontshare webfont bundle already in this repository
(`dist/Satoshi WEB/`). **The self-hosting licence is still unconfirmed** --
the handoff asks for it to be checked before launch.

## Content

`src/content/` is generated. Do not hand-edit it -- the import overwrites it.

```
npm run source   # mirror penkoskumov.com into source/  (once)
npm run import   # source/ -> src/content/
```

`fetch-source.mjs` mirrors the old site's 16 pages and reads each
photograph's intrinsic size from its JPEG header over a range request, a
couple of KB each rather than ~200MB of photographs. Behind a proxy, prefix
`NODE_USE_ENV_PROXY=1`.

The handoff names the Webflow export on Dimitar's machine as the source.
This uses the live site, which is the same content and newer -- the June
2025 export has no Flat World page. If you have the export, skip
`npm run source` and point the import at it: same page names, same
`images/` folder.

**The import never invents content.** Where the old site has no answer the
field is written as `null` and counted in the report it prints at the end.
That report is the list to take back to Penko.

Three things the import corrects, rather than carrying the old site's bugs
into the new one (`scripts/source-fixes.mjs`, and the series table at the
top of `import-webflow.mjs`):

* series titles and date ranges come from the boards, not the old pages,
  which disagree with themselves ("Days at sea", "2018 - 2020");
* `07_Saint.jpg` is really `07_Saints.jpg` -- the old reference 404s;
* the Archive's Lith Prints thumbnail points at a `.jpg.png` that 404s.

## Photographs

`Frame.astro` takes a frame from the content and a column span:

```astro
<Frame file={f.data.file} width={f.data.width} height={f.data.height}
       alt={f.data.alt} span={4} column={i} />
```

AVIF with WebP and a JPEG fallback, at the widths in `WIDTH_LADDER` that
the source can actually fill -- upscaling a 1600px scan to 3200 adds bytes
and no detail. When Penko's originals arrive the upper rungs start being
used with no change here.

`sizes` is computed from the module and the tier, never `100vw`: a
nine-column plate is 1015 of 1440px, so `100vw` would fetch a file 40%
wider than the frame can show. `span` is the column count; `spans` takes
per-tier overrides for the modules the handoff narrows on the way down.

The box is the photograph's own proportion snapped **down** to a whole
pixel, which is the "integer-box rounding (0.45% on a 3:2 landscape)" the
handoff allows; `object-fit: cover` spends it, half a pixel at each edge.
Pass `boxHeight` where the layout fixes one instead.

Opacity cascades as a custom property rather than through competing
selectors -- `.frame.in` would otherwise outrank `:hover` and the frame
would never dim.

### Build weight

Astro emits each photograph's original next to the variants it makes from
it, and nothing links to them: 123MB of the first 133MB build. The `prune`
integration in `astro.config.mjs` deletes any asset whose name appears
nowhere in the built HTML, CSS or JS, which brought that build to 10MB. It
reports what it removed on every build.
