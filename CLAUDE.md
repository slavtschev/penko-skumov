# Penko Skumov website: build handoff (CLAUDE.md for the Astro project)

Written 08.11.2026 from the design work in `claude/penko-skumov-redesign.md` (sections 6 to 12). Reference canvas: the "Penko Skumov: wireframes and designs" artifact, page **Designs 4** (the current design). Designs 3, Type, Designs 2, Designs and Wireframes are earlier versions; do not build from them except where this file says so.

Owner: Dimitar Slavchev (designer). Client: Penko Skumov (photographer). The site is an evolution of penkoskumov.com (Webflow): same content, white page, photographs only, every decision reconsidered. Editorial minimalism: no cards, borders, radii, shadows, gradients, accent colour, decoration, slogans.

## Decisions taken (08.11, Dimitar: "as you decide")
1. Typeface: **Satoshi**, weights 400 and 500. Licence for self-hosting is unconfirmed: check it before launch. Fallback: Instrument Sans (OFL), a one-token change (re-measure the optical offsets, they move 1 to 2 px). Satoshi's en dash is too long (0.93 em): set year ranges with a thin-spaced en dash or a shortened glyph via CSS if kept.
2. Home: **autoplay slideshow** with the rules below.
3. Phone menu: **list at the top** (as drawn in D4-Phone-Menu).
4. Defaults I chose (veto freely): the shelf stage (hung from the left margin, not centred); the quotation shown whole, held **36 s** (not the drawn 24 s: 133 words need about 32 to 40 s), so the round is **108 s**; quotation at slide 6; the burning car stays out of the Home edit; no footer on the Home.

## Decisions taken in the build (step 1, Dimitar: "you decide")
1. Underline offset: the **boards** win over this file. The rule sits at `bottom` 1 px (14/20), -1 px (12/16), 2 px (28/32) inside the line box, which is 2.2 to 3.4 px below the baseline and follows no single distance. "4 px below the text" above is superseded; it did not match any board.
2. Page titles: `Projects — Penko Skumov`, em dash, the Home just `Penko Skumov`.
3. Close on the menu sheet gets the hamburger's 64 x 48 hit area (the 44 px touch-target rule) with its ink still at top 22, right on the margin. The sheet also traps Tab, closes on Escape, returns focus to the hamburger and locks scroll behind it — beyond what the board draws, but what a full-screen sheet needs. Revisit at step 8.
4. Ink alignment is derived, never typed in: `scripts/font-metrics.py` writes `src/lib/satoshi-metrics.json`, `src/lib/ink.ts` does the arithmetic. Horizontal offsets truncate, vertical line-box tops round up; those two rules reproduce every offset on the boards. A typeface swap re-measures itself.
5. `font-display: block`, not swap: a fallback face would move every ink-aligned line 1 to 2 px under the reader.

## Decisions taken in the build (step 3, Dimitar: "decide the best")
6. Frame boxes are **derived, not fixed**: the photograph's own proportion snapped DOWN to a whole pixel, at whatever width the module comes out to. At 1440 that gives 440 x 293 and 325 x 487, where the boards draw 440 x 292 and 325 x 488. The boards are right about the intent -- an integer box, with the 0.45% of crop that costs -- but 292 is only correct at 1440. The grid is fluid with no maximum width, so at 1280 or 1600 the module is not 440 wide and the height has to follow it. A fixed number would be wrong at every width but one. `Frame.astro` takes a `boxHeight` override if a layout ever does need to fix one.

## Stack and layout of the repo
- Astro, static output, TypeScript. No UI framework needed; small vanilla scripts for the slideshow, viewer and menu.
- Content in Astro content collections: `series/*` (title, years, epigraph, statement, group: projects or archive, order, cover) and `frames` (series, order, file, width, height, place, year, alt). Home edit = a list of frame ids. About, Contact as markdown or data.
- Generated from content: Projects list, captions, alt text, frame URLs, redirects, sitemap.
- Source material (on Dimitar's computer, in the project folder): the Webflow export `penko.skumov.website` (17 pages, css, js, fonts, images; June 2025 snapshot, no Flat World page) and the live site for anything newer. Images in the export are 1600 px wide. Originals of 2560 px or wider are needed for AVIF; until then derive from the 1600 px files.

## Tokens
Grid (fluid columns, fixed margin and gutter per tier; a module is n columns plus n-1 gutters; no maximum container width):

| Tier | Viewport | Columns | Margin | Gutter |
|---|---|---|---|---|
| XL | 1680+ | 12 | 56 | 24 |
| L | 1280-1679 | 12 | 40 | 20 |
| M | 1024-1279 | 12 | 32 | 16 |
| S | 768-1023 | 8 | 28 | 16 |
| XS | <768 | 4 | 20 | 12 |

The boards are drawn at L, 1440 (column 95, `x = 40 + 115 (k-1)`) and XS, 390 (margin 20).

Type, Satoshi only, ink and one grey:

| Style | Size/line | Weight | Notes |
|---|---|---|---|
| name | 14/20 | 500 | capitals, +0.16em |
| ui | 14/20 | 400 | nav, Previous, Pause, Next, Close |
| caption | 12/16 | 400 | grey, tabular figures |
| title | 28/32 | 500 | -0.01em |
| text | 18/28 | 400 | measure about 62 characters |

Colour: ground #FFFFFF, ink #111111, grey #6B6B6B, loading placeholder #F2F2F2. No accent. State never uses colour: hover = 1 px underline 4 px below the text (a cut, 0 ms); current page underlined; focus = 2 px ink outline, 4 px out.

Motion ("cut and dissolve"): linear only, opacity only, durations 0, 300, 600, 1000 ms. Nothing moves, scales or blurs.
- Load: frames dissolve in over 1000 ms when decoded (columns 150 ms apart).
- Frame hover: frame to 80%, caption to ink, 300 ms (pointer devices only).
- Page change: to white 300 ms, up from white 300 ms.
- Viewer previous/next: dissolve over the current frame, 600 ms.
- Projects preview: dissolve between series frames, 300 ms.
- Print slideshow (Contact): 6 s a print, 600 in, 4.8 s on, 600 out, 1 px progress line in six steps, pause on hover.
- Menu (phone): sheet dissolves in 600 ms, out 300 ms; items cut in 100 ms apart.
- prefers-reduced-motion: everything is a cut; slideshows show the first image and do not advance by themselves.

Vertical rhythm: body text on a 28 px baseline grid. Header 64. Caption 8 under the frame, then 24 to the next row.

## Pages (reference boards in Designs 4, desktop then phone)
Header on every page: name (home link) at the left; Projects, About, Contact at the right. 64 high, no rule, not sticky. Phone: name left, hamburger right (three 1 px rules, 22 wide, 5 apart, hit area 64 x 48), menu = white sheet, Close where the rules were, the three words set 28/32 with cap-tops at 64, 112, 160, footer lines at the bottom.
Footer on every page except Home: "© 2026 Penko Skumov" left, "Web design Dimitar Slavchev" right (stacked on phone); year generated at build.

- **Home** (D4-Home, D4-Home-1/2/Q, D4-Home-Rules; D4-Phone-Home*): slideshow, see below.
- **Projects** (D4-Projects; D4-Phone-Projects): Projects list (8) in columns 1-4, Archive (4) in 5-8, a 440 x 292 slot in 9-12 showing the opening frame of the series under the pointer (first row by default; off on touch). Phone: two lists in one column.
- **Series** (D4-Series-Days, D4-Series-Vertical; D4-Phone-Series): title, years, epigraph, statement in two text columns, then bare frames (no numbers, no captions) in 3 columns (440 x 292) for landscape series or 4 columns (325 x 488) for portrait series, 20 px apart. The last cell is the way on: next series title and years, and "Back to Projects" on the cell's bottom edge. Phone: one column, 350 wide, frames 12 apart. Other series follow these two; non-3:2 series keep their own ratio, uncropped.
- **Viewer** (D4-Viewer-1/2; D4-Phone-Viewer-1/2): white. Photograph fits 100vw minus margins by 100svh minus 144 at natural proportions. Top row: counter ("06 / 20") left, Close right. Bottom row: caption and series link left (series link on column 3), Previous and Next right. Keys: left, right, Escape; click = next; swipe on phone. A URL per frame (Back closes). Preload neighbours. Focus to Close on open, trapped, returned on close. Page behind does not scroll. No wrap.
- **About** (D4-About; D4-Phone-About): portrait, bio, quotation (whole), affiliations under the portrait caption; Exhibitions and Awards (2000-2025) in columns 1-8 with year in column 1; Publications (2005-2024) in columns 9-12 under the quotation. Phone: one column.
- **Contact** (D4-Contact; D4-Phone-Contact): framed-print slideshow on a wall (#EBEBEA, columns 1-8, 900 x 700; black frame 8, mat 20, soft shadow is the one exception to "no shadows") plus title, sentence, rows Email, Instagram, Facebook, Phone. Email is a mailto link, phone a tel link. Prints: Days at Sea 1, Sense of Freedom 1, The Festival 1, Six Days on an Island 1, Vertical Summer 4. Sizes and frame finish are placeholders ("45 x 30 cm", "30 x 45 cm") until Penko confirms. Keep the phone number? Confirm.
- **404**: title, one sentence, two links.
- **Menu** (phone): D4-Phone-Menu.

## Home slideshow (the one component with real behaviour)
13 slides, fixed order, never shuffled: Sunny Beach 2020; Vertical Summer (portrait); Pomorie 2021; London 2019 (Six Days on an Island); Rhodope Mountains 2019; **the quotation**; Sofia 2019; Bucharest 2019; Sofia 2020; Pomorie 2017; Vertical Summer (portrait); Days at Sea ×2 (Pomorie, 2018-2020). The edit is a list of frame ids in content, not hardcoded.

Layout: every slide hangs from the left margin and stands on one line (desktop y = 740 at 800 high; phone y = 769 at 844). One baseline below it carries caption (left), counter "06 / 13" (column 10; phone: right, first line) and Previous / Pause / Next (right; phone: second line). Series link at column 3 where the photograph belongs to a series.
- Landscape plate 9 columns (1015 x 676, 3:2), top flush with the header (64). Portrait 4 columns (440 x 660). Quotation 28/32 in 7 columns, last baseline on the line. Phone: 350 wide on the margin (232 or 524 high); quotation 18/28.
- Stage = the window: plate is the largest 3:2 or 2:3 that fits between the header and the caption line, hung from the left margin. Nothing scrolls.

Timing: slide 6 s = 600 ms in, 4.8 s on, 600 ms out, linear. Quotation 36 s. The next slide starts when this one has gone (the page is bare for an instant). Round 108 s then slide 1.
Behaviour (script, not CSS keyframes): first image dissolves in over 1000 ms; the clock starts when it has decoded; preload the next. Next/Previous by hand (button, click on the photograph, arrow keys, swipe): current leaves in 300 ms, next arrives in 600 ms, clock restarts. Pointer over the stage or focus on a control holds the frame. The Pause word toggles to Play and holds until pressed (the only way to stop on a phone). Reduced motion: no autoplay, first image shown, controls cut in 0 ms. Accessibility: stage not announced on change (no aria-live), each photograph's alt = its caption, counter and controls are real text, controls are buttons with visible focus. The board `D4-Home` uses CSS keyframes only to draw the idea.

## Images
- Natural proportions everywhere, never cropped except the integer-box rounding (0.45% on a 3:2 landscape). Reserve width and height; show #F2F2F2 until decoded.
- AVIF with WebP and JPEG fallback, widths 640 to 3200, `sizes` computed from the module and tier, never `100vw`. First Home image eager and high priority, rest lazy (preload the next only).
- Alt text per frame, short and literal, written by hand (empty on 163 of 190 photographs today). Needs content.

## Content and data still needed from Dimitar/Penko
- Place and year per frame (series frames have only series-level place/years; captions appear on the Home and in the viewer). Vertical Summer places and statement. Flat World frames (27) and page. CoinciDANCE dates (2019-2023 on the index, 2020-2021 on its page).
- Source of the quotation (none in the data; it reads as Penko's words). Portrait credit on About.
- Print sizes, frame finish, and whether to keep the phone number on Contact.
- Originals at 2560 px or wider. Satoshi self-hosting licence.

## Hygiene fixed by construction or to fix
lang on every page; one h1 per page; landmarks; page titles and series-name casing normalised ("Flat World", "CoinciDANCE", "Saints Are Here With Us", "Novi Sad"); date ranges one style ("2018 – 2020" with a proper en dash); Lith Prints is 1:1 and Read Between the Lines 1.42:1 (data said 3:2); Saints 07 image file name mismatch; Archive link `lith-prints.html.html`; email is a real mailto link; credit line no longer 8 px; touch targets 44 px.

## URLs and redirects
Clean URLs: `/`, `/projects/`, `/projects/<series>/`, `/projects/<series>/<n>/` (viewer), `/about/`, `/contact/`, `404`. Permanent redirects from every old `.html` address (index.html, projects.html, archive.html, about.html, contact.html, the 12 series pages including `lith-prints.html.html`). Archive series live under `/projects/` too, grouped as Archive on the list.

## Build order (check each step against the boards with Playwright screenshots at 1440 and 390 before moving on)
1. Repo, fonts (Satoshi woff2 self-hosted), CSS tokens and grid utilities, base layout, header, footer.
2. Content collections and the Webflow-export import script (texts, captions, image references, dimensions).
3. Image component (srcset/sizes/placeholder/decode-dissolve).
4. Projects, About, Contact (static first), 404.
5. Series page and the grid with the load dissolve.
6. Viewer with URLs, keys, focus handling.
7. Home slideshow (the rules above), then the Contact print slideshow (same engine).
8. Phone menu.
9. Page-change dip (View Transitions or a small router; 300 ms to white, 300 ms from white).
10. Redirects, sitemap, meta, 404; reduced-motion pass; accessibility audit (keyboard, focus, contrast 4.5:1+); Lighthouse/performance budget; XL and ultra-wide tests (not designed yet); tablet tier S (768, 8 columns) with module spans reduced (plate 7, inset 5, pair 4+4, portrait 3), not yet drawn.

## Rules for whoever builds
- Work one step at a time and show Dimitar each page against its board; do not add features, effects or components the boards do not show.
- Pixel alignment is part of the design: text aligns by its ink (cap-top, baseline, side bearing), frames sit on integer pixels. Compare with screenshots, not by eye.
- If a rule here conflicts with a board, the board shows the intent; ask.
