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
```

## What is here (build step 1)

Fonts, tokens, the base layout, the header -- with the phone hamburger and
menu sheet -- and the footer, plus placeholder pages for Projects, About and
Contact so the header links work. Nothing else: the real pages arrive at
steps 4 onwards.

```
public/fonts/        Satoshi 400 and 500, woff2, self-hosted
scripts/             font-metrics.py, which writes the metrics table below
src/styles/
  tokens.css         grid tiers, type sizes, colour, motion durations
  base.css           @font-face, reset, state, type styles, grid utilities
src/lib/
  satoshi-metrics.json   generated: cap height, ascent, side bearings
  ink.ts                 cap-top, baseline and side-bearing arithmetic
  nav.ts                 Projects, About, Contact
src/layouts/Page.astro
src/components/        Header.astro, Footer.astro
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
