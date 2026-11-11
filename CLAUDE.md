# Penko Skumov website: build handoff (CLAUDE.md for the Astro project)

Written 08.11.2026, updated 10.11.2026 (Designs 5) from the design work in `claude/penko-skumov-redesign.md` (sections 6 to 13). Reference canvas: the "Penko Skumov: wireframes and designs" artifact, page **Designs 5** (the current design; it holds the new About, Projects, series, Contact and 404 boards, and unchanged copies of the Home, viewer and menu boards of Designs 4, so every page is on it). Designs 4, Designs 3, Type, Designs 2, Designs and Wireframes are earlier versions; do not build from them except where this file says so.

Owner: Dimitar Slavchev (designer). Client: Penko Skumov (photographer). The site is an evolution of penkoskumov.com (Webflow): same content, white page, photographs only, every decision reconsidered. Editorial minimalism: no cards, borders, radii, shadows, gradients, accent colour, decoration, slogans.

## Decisions taken (08.11, Dimitar: "as you decide")
1. Typeface: **Satoshi**, weights 400 and 500. Licence for self-hosting is unconfirmed: check it before launch. Fallback: Instrument Sans (OFL), a one-token change (re-measure the optical offsets, they move 1 to 2 px). Satoshi's en dash is too long (0.93 em): set year ranges with a thin-spaced en dash or a shortened glyph via CSS if kept.
2. Home: **autoplay slideshow** with the rules below.
3. Phone menu: **list at the top** (as drawn in D5-Phone-Menu).
4. Headings (10.11, my decision for Dimitar to veto): section headings are the **Label** style (capitals, 14/20, 500, +0.16em); the display-size alternative is drawn on About only (D5-About-B) and is not built. Page titles are **Display** 56/56 at weight 400. The About quotation is 28/32 in ink on desktop.
5. Projects keeps the Designs 4 layout and its small grey headings (Dimitar, 11.11). Display and Label do not apply to it.
6. Defaults I chose (veto freely): the shelf stage (hung from the left margin, not centred); the quotation shown whole, held **36 s** (not the drawn 24 s: 133 words need about 32 to 40 s), so the round is **108 s**; quotation at slide 6; the burning car stays out of the Home edit; no footer on the Home.

## Decisions taken in the build (step 1, Dimitar: "you decide")
1. Underline offset: the **boards** win over this file. The rule sits at `bottom` 1 px (14/20), -1 px (12/16), 2 px (28/32) inside the line box, which is 2.2 to 3.4 px below the baseline and follows no single distance. "4 px below the text" above is superseded; it did not match any board.
2. Page titles: `Projects — Penko Skumov`, em dash, the Home just `Penko Skumov`.
3. Close on the menu sheet gets the hamburger's 64 x 48 hit area (the 44 px touch-target rule) with its ink still at top 22, right on the margin. The sheet also traps Tab, closes on Escape, returns focus to the hamburger and locks scroll behind it — beyond what the board draws, but what a full-screen sheet needs. Revisit at step 8.
4. Ink alignment is derived, never typed in: `scripts/font-metrics.py` writes `src/lib/satoshi-metrics.json`, `src/lib/ink.ts` does the arithmetic. Horizontal offsets truncate, vertical line-box tops round up; those two rules reproduce every offset on the boards. A typeface swap re-measures itself.
5. `font-display: block`, not swap: a fallback face would move every ink-aligned line 1 to 2 px under the reader.

## Decisions taken in the build (step 3, Dimitar: "decide the best")
6. Frame boxes are **derived, not fixed**: the photograph's own proportion snapped DOWN to a whole pixel, at whatever width the module comes out to. At 1440 that gives 440 x 293 and 325 x 487, where the boards draw 440 x 292 and 325 x 488. The boards are right about the intent -- an integer box, with the 0.45% of crop that costs -- but 292 is only correct at 1440. The grid is fluid with no maximum width, so at 1280 or 1600 the module is not 440 wide and the height has to follow it. A fixed number would be wrong at every width but one. `Frame.astro` takes a `boxHeight` override if a layout ever does need to fix one.

## Decisions taken in the build (step 5)
7. Series ordering for the way on follows the Projects list, skipping any series with no frames, and wraps round. Vertical Summer's next is therefore Read Between the Lines, not Days at Sea as D4-Series-Vertical draws it; the board only had the one other series page to point at.
8. An epigraph that opens with a quotation mark is set flush to the margin, not ink-shifted -- you do not align a measure on a quote mark. One that opens with a letter is ink-aligned as usual. Both boards do this.
9. **Overtaken by Designs 5 (see 31).** The frames sit 75 px under the SIDE column on desktop, not under the tallest of the three modules: on D4-Series-Days the statement ends at 308 and the frames begin at 352, which is 75 under the attribution. The statement is therefore taken out of the row's height. On the phone the gap is 52, under the text.
10. **Overtaken by Designs 5**: the epigraph no longer follows the years on the page. The gap between the years and the epigraph, 115 px on desktop and 27 on the phone, is taken from the boards; it follows no rule I could derive.
11. **Overtaken by Designs 5**: the statement is one column now. Statement line breaks differ from D4-Series-Days. The text, measure, font and `text-wrap: pretty` are identical, but the board's own rendering breaks earlier (346 px into a 440 px measure) and runs to four lines where this runs to three. Line breaking is a rendering outcome, not a drawn decision.

## Decisions taken in the build (step 6)
12. The viewer is a page per frame, not an overlay: the handoff asks for a URL per frame and for Back to close, which a page gives for nothing. It carries no site header -- the counter and Close are its top row, as all four boards draw it -- so `Page.astro` gained a `header` prop beside `footer`.
13. **Done, in 28.** Focus to Close on open, a focus trap, and locking the page behind are overlay behaviours and were not in at step 6. On a page of its own the keys work wherever focus is, Close is already first in tab order, and focusing it on load rings it for everyone who arrived with a mouse. They belong with step 9, when the viewer can open over the series page; the same goes for the 600 ms dissolve between frames, which needs a router.
14. The caption reads "<place>, <year>" and carries the series link beside it. Where the place is unknown -- every frame, until Penko supplies them -- it falls back to "<series>, <years>" and the link is left off, because the caption already says the name. That is what D4-Viewer-2 draws for Vertical Summer.
15. On the phone the photograph goes full bleed, as D4-Phone-Viewer-1 draws it, rather than 100vw less the margins: a margin there costs a third of the picture.

## Decisions taken in the build (step 7)
16. Five of the thirteen Home slides are named on the board only by the picture, so the edit has no file for them. Each takes the next unused frame from the series the board names, rather than being dropped: dropping them would have cost the 13-slide shape and the 108-second round. They are stand-ins and the import's report lists them for Penko.
17. The nine-column plate needs a `+1px` in its height cap. Frame floors the box height, so a width W fits an available height H whenever `floor(W / ratio) <= H`, which admits anything below `(H + 1) * ratio`. Without it the cap bites a fraction early and the plate comes out 1013 where the board draws 1015.
18. The Contact frame and mat are sized in `cqw` against the wall, not in percentages of the frame. A percentage resolves against the frame's own width, which gave the portrait print a 29px mat where the board has 40 on both orientations.
19. A bare `/` between two `{...}` expressions in an Astro template makes the language server read the rest of the file as TypeScript -- 75 phantom errors, in the CSS and the script. The build is unaffected. Written as one expression instead.

## Decisions taken on the first live look (09.11, Dimitar's notes on the preview)
20. Motion is halved. `--dissolve` 600 -> 300, `--dissolve-load` 1000 -> 600, and a slide brought on by hand arrives in 300. The ladder keeps its shape (0 / 300 / 600) and nothing moves or scales; what changed is how long a dissolve lasts, because at 600 and 1000 every photograph arrived slowly enough to notice the arriving. The slide **holds** are untouched -- 4.8 s a photograph, 34.8 s the quotation -- so the Home round is 100.2 s, not the handoff's 108. If the pacing should also quicken, the holds are two numbers in `src/lib/home-slideshow.ts`.
21. A photograph already decoded when the page's script runs -- from the cache, a prerender, a step back -- is **cut** in, not dissolved. It did not arrive, so there is nothing to dissolve, and without this every return to a page faded in again.
22. The viewer's plate dissolves over 300, not 600: opening a photograph is a step the reader took, not a page settling.
23. Opening a photograph is prerendered. `Speculate.astro` emits a speculation rule (`prerender`, eagerness `moderate` = on hover) for `/projects/*` on the series page and in the viewer, beside Astro's `data-astro-prefetch`. The prefetch fetches the document; the prerender renders the page with its images, so the step is a cut. Chromium only; Safari and Firefox fall back to the prefetch. Measured locally: the viewer comes up in about 150 ms, cut, where it used to be a document fetch, a full-window image and a 600 ms fade.
24. **Overtaken by Designs 5 (see 31).** The statement is back in the head row's height, so the frames sit 75 px under the **tallest** of the three modules, not under the side column. This supersedes decision 9. On Days at Sea the statement runs 3 px lower than the attribution, so the frames begin at 355 where the board draws 352; on the long statements (Six Days on an Island, Sense of Freedom) the old rule ran the text straight over the first row of photographs.
25. The way on takes a frame's height. The cell holds an inner box whose height is derived exactly as `Frame` derives one (the series' proportion, snapped down to a whole pixel) -- an inner box because a container query unit cannot resolve against the element that declares the container, and an `aspect-ratio` on the cell leaves the row, and the link on its edge, on a fraction. The box is `display: flow-root`, or the first line's negative ink offset collapses through and carries it 4 px up the row. The frames grid carries 28 px of padding under it on desktop, because "Back to Projects" hangs 5 px below the grid and landed on the footer.
26. About: the name under the portrait is gone (Dimitar, 09.11). **See 32**: Designs 5 draws it again, and it is still left out.
27. Checked with a sweep rather than by eye: `scripts/verify.mjs` asserts the board positions, and a leaf-element overlap scan over every page at 1440 and 390 asserts that no two pieces of ink sit on top of each other. Both are clean.


## Decisions taken on the Designs 5 handoff (10.11)
28. **The viewer opens over the series page.** Every photograph keeps its own page -- a direct link, a shared link and a reader without JavaScript all get it -- but a click in the grid no longer leaves the page. `src/lib/viewer-overlay.ts` fetches the frame's own page, lifts its `.viewer` out and shows it over the grid, and moves the address bar to match, so Back still closes and the URL is still one per frame. The grid's thumbnail, already decoded, goes up at full size underneath while the full-size photograph arrives, so the step is a cut, not a wait. This is what Dimitar asked for twice ("the lightbox opens very slow"; "feels like I am opening a new page"), and it brings in what decision 13 left out: focus to Close, a focus trap, Escape, and the page behind held still. The viewer's CSS moved out of the page into `src/styles/viewer.css` -- a global sheet, because the same markup is now styled in two documents -- and every rule in it is scoped under `.viewer`, since `.plate`, `.stage` and `.caption` are names the Home and Contact use too.
29. **The Pause control and the counter are gone from the Home slideshow** (Dimitar, 10.11). Previous and Next stay; the pointer over the stage still holds the frame, and so does focus on a control. There is now no way to stop the slideshow on a phone -- the Pause word was it. The phone keeps the controls on the second line, as the board draws them, with the caption alone on the first.
30. **The Display style sits a pixel below the boards.** The boards' own cap-top and side bearing for 56/56 are a pixel coarser than the ones measured from Satoshi, so every page title lands at y 55 where the board draws 54, and 1px right of its drawn x. The rule that produces it -- vertical tops round up, horizontal offsets truncate, both erring inward (decision 4) -- reproduces every other position on the Designs 5 boards exactly, including all three of the smaller styles. Changing it for the h1 alone would put the title a hair outside the margin while everything under it sat a hair inside.
31. **The Designs 5 vertical rules**, derived from the boards and checked against them:
    - the years' cap-top sits 64 under the title's on the page and 46 on the phone (the boards'; no rule I could derive);
    - the epigraph's source sits one rhythm under the epigraph's last baseline and the statement two under the source -- 9 and 31 between the boxes on the page, 9 and 27 on the phone;
    - the frames begin 80 under the last baseline of the text, 52 on the phone, or under the years where a series has no text (Vertical Summer: 216, exactly as drawn);
    - the way on's Label has its cap-top on the row's top edge and its title one rhythm under its box;
    - About: the biography's last baseline stands on the foot of the portrait, the quotation's cap-top 144 under the foot of the portrait caption's line box, the first section 144 under the quotation's last baseline and each later one 114 under the last baseline above it (the handoff says 112; the board draws 114). On the phone: 98 throughout, and the label 16 above its list.
32. **The name under the portrait stays off About**, although D5-About and D5-Phone-About both draw it: Dimitar asked for it to go on 09.11 and the Designs 5 boards look like they were carried over from Designs 4 before that. The space it held is kept, so the quotation and everything under it start where the board puts them. **Confirm.**
33. The About quotation is set flush on the axis, not shifted by the side bearing of its quote mark, which is decision 8 -- although D5-About shifts it 2px and D5-Series-Days leaves the epigraph flush. The two boards disagree; the rule does not.
34. **The phone Contact wall is square.** D5-Phone-Contact draws a 350 x 350 wall with the print at 76% of its width and the handoff's own 8 and 20 for the moulding and the mat, where the build had been scaling the page's 900 x 700 wall and its 12 and 40. The plaque carries the size alone there, 7 off the foot of the wall.
35. Each section label on About is sticky for the length of its list, which the handoff asks for and no board draws.
36. Every viewer page carries a visually hidden h1 ("<series>, photograph n of N"), which closes the one-h1-per-page gap on the 157 of them.
37. `npm run verify` asserts 92 positions off the boards at 1440 and 390, and `npm run overlaps` asserts that no two pieces of ink on any page sit on top of each other. Both are clean. The boards themselves can be rendered with real Satoshi to measure what a drawn page actually does, which is how every number above was read.
38. **Projects went back to Designs 4** (Dimitar, 11.11): the two lists in columns 1-4 and 5-8 under their 12/16 grey captions, the preview in 9-12. The Designs 5 version of the page -- one list on the axis under a Display title, which was built and measured against D5-Projects -- is dropped. The rules it was built on are still here in 31 if it ever comes back: rows 48 apart, the Archive list 96 under the last project's baseline, its label's cap-top on its first title's. Display and Label now appear on About, Series, Contact and 404 only, and `t-title` carries the names in the Projects lists as it always did.


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
| display | 56/56 (phone 36/40) | 400 | -0.03em (phone -0.02em). The page title, the one h1. Use the weight-400 file; no synthetic bold |
| label | 14/20 | 500 | capitals via `text-transform`, +0.16em. Section headings (h2) on About and the series "Next" cell; not on Projects. The same style as the site name, which is `name` |
| name | 14/20 | 500 | capitals, +0.16em |
| ui | 14/20 | 400 | nav, Previous, Pause, Next, Close |
| caption | 12/16 | 400 | grey, tabular figures |
| title | 28/32 | 500 | -0.01em. A name in a list only: a project, "Next", a menu item |
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

## Pages (reference boards in Designs 5, desktop then phone)
Header on every page: name (home link) at the left; Projects, About, Contact at the right. 64 high, no rule, not sticky. Phone: name left, hamburger right (three 1 px rules, 22 wide, 5 apart, hit area 64 x 48), menu = white sheet, Close where the rules were, the three words set 28/32 with cap-tops at 64, 112, 160, footer lines at the bottom.
**The axis** (new in Designs 5): content starts on column 5 (x = 500 at L). The left margin carries only what names the content: a page title (Display), a label (Label) or a portrait. A title or label stands with its cap-top on the cap-top of the first line it names. Text is one column at a time; do not put two text columns side by side. On XS there is no room to hang, so labels stand above their lists.

Footer on every page except Home: "© 2026 Penko Skumov" left, "Web design Dimitar Slavchev" right (stacked on phone); year generated at build.

- **Home** (D5-Home, D5-Home-1/2/Q, D5-Home-Rules; D5-Phone-Home*; unchanged from Designs 4): slideshow, see below. The Home has no visible heading; keep a visually hidden h1.
- **Projects** (D4-Projects; D4-Phone-Projects: Designs 4 layout, kept on purpose, the Designs 5 version was dropped): Projects list (8) in columns 1-4, Archive (4) in 5-8, a 440 x 292 slot in 9-12 showing the opening frame of the series under the pointer (first row by default; off on touch). The words "Projects" and "Archive" are 12/16 grey captions, not Display or Label. Phone: two lists in one column.
- **Series** (D5-Series-Days, D5-Series-Vertical; D5-Phone-Series): h1 (Display) and years (caption) at the left; one text column on the axis, 440 wide, its first line level with the h1 cap-top: the epigraph (grey, 18/28), its source (caption, 28 under), the statement (paragraphs 28 apart, 56 under the source); no text for Vertical Summer. Frames start 80 under the end of the text; then bare frames (no numbers, no captions) in 3 columns (440 x 292) for landscape series or 4 columns (325 x 488) for portrait series, 20 px apart. The last cell is the way on: a Label "Next", the next series title (28/32) and years, and "Back to Projects" on the cell's bottom edge. Phone: one column, 350 wide, frames 12 apart. Other series follow these two; non-3:2 series keep their own ratio, uncropped.
- **Viewer** (D5-Viewer-1/2; D5-Phone-Viewer-1/2): white. Photograph fits 100vw minus margins by 100svh minus 144 at natural proportions. Top row: counter ("06 / 20") left, Close right. Bottom row: caption and series link left (series link on column 3), Previous and Next right. Keys: left, right, Escape; click = next; swipe on phone. A URL per frame (Back closes). Preload neighbours. Focus to Close on open, trapped, returned on close. Page behind does not scroll. No wrap.
- **About** (D5-About; D5-Phone-About): portrait 440 x 564 at columns 1-4, top 64. h1 "About" (Display) at column 5, cap-top 64. Biography 18/28, 440 wide, its last baseline on the foot of the portrait (y = 627). Quotation whole, 28/32 at 400, -0.01em, ink, 7 columns (785) from column 5, cap-top 144 under the portrait caption; no source (none in the data). Then three sections 112 apart (last baseline of a list to the next cap-top): Affiliations, Exhibitions and awards (27 rows), Publications (11 rows). Each is an h2 Label on the left margin with its cap-top on the cap-top of the first row, and a list on the axis: year (caption, shown once per run of the same year) in a 115 px column, entry 14/20 785 wide, rows 12 apart. No date range in the labels. Make each label sticky for the length of its list (not drawn). Phone: one column in the same order, labels above lists, the quotation 18/28 grey.
- **Contact** (D5-Contact; D5-Phone-Contact): framed-print slideshow on a wall (#EBEBEA, columns 1-8, 900 x 700; black frame 8, mat 20, soft shadow is the one exception to "no shadows") plus h1 "Contact" (Display) at column 9, cap-top 64, the sentence under it (cap-top 160), rows Email, Instagram, Facebook, Phone (the last baseline on the wall's bottom edge). Email is a mailto link, phone a tel link. Prints: Days at Sea 1, Sense of Freedom 1, The Festival 1, Six Days on an Island 1, Vertical Summer 4. Sizes and frame finish are placeholders ("45 x 30 cm", "30 x 45 cm") until Penko confirms. Keep the phone number? Confirm.
- **404**: h1 "Page not found" (Display) at the left, the sentence on the axis, two links.
- **Menu** (phone): D5-Phone-Menu.

## Home slideshow (the one component with real behaviour)
13 slides, fixed order, never shuffled: Sunny Beach 2020; Vertical Summer (portrait); Pomorie 2021; London 2019 (Six Days on an Island); Rhodope Mountains 2019; **the quotation**; Sofia 2019; Bucharest 2019; Sofia 2020; Pomorie 2017; Vertical Summer (portrait); Days at Sea ×2 (Pomorie, 2018-2020). The edit is a list of frame ids in content, not hardcoded.

Layout: every slide hangs from the left margin and stands on one line (desktop y = 740 at 800 high; phone y = 769 at 844). One baseline below it carries caption (left), counter "06 / 13" (column 10; phone: right, first line) and Previous / Pause / Next (right; phone: second line). Series link at column 3 where the photograph belongs to a series.
- Landscape plate 9 columns (1015 x 676, 3:2), top flush with the header (64). Portrait 4 columns (440 x 660). Quotation 28/32 in 7 columns, last baseline on the line. Phone: 350 wide on the margin (232 or 524 high); quotation 18/28.
- Stage = the window: plate is the largest 3:2 or 2:3 that fits between the header and the caption line, hung from the left margin. Nothing scrolls.

Timing: slide 6 s = 600 ms in, 4.8 s on, 600 ms out, linear. Quotation 36 s. The next slide starts when this one has gone (the page is bare for an instant). Round 108 s then slide 1.
Behaviour (script, not CSS keyframes): first image dissolves in over 1000 ms; the clock starts when it has decoded; preload the next. Next/Previous by hand (button, click on the photograph, arrow keys, swipe): current leaves in 300 ms, next arrives in 600 ms, clock restarts. Pointer over the stage or focus on a control holds the frame. The Pause word toggles to Play and holds until pressed (the only way to stop on a phone). Reduced motion: no autoplay, first image shown, controls cut in 0 ms. Accessibility: stage not announced on change (no aria-live), each photograph's alt = its caption, counter and controls are real text, controls are buttons with visible focus. The board `D5-Home` uses CSS keyframes only to draw the idea.

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

## Change set: Designs 5 on top of an existing build (11.11.2026)
Reference boards: page Designs 5 of the canvas. Do these in order; check each against its board at 1440 and 390.
1. Tokens: add `display` (56/56, 400, -0.03em; XS 36/40, -0.02em) and `label` (14/20, 500, uppercase, +0.16em). `title` stays for list names only.
2. Page titles (h1) become `display` on About, Series, Contact and 404. Projects and Home keep what they have (Projects heading stays the 12/16 grey caption).
3. Axis: on About, Series, Contact and 404 content starts on column 5 (x = 500 at L); the left margin holds only the title, a label or the portrait.
4. About: rebuild as D5-About (portrait, h1, bio standing on the portrait's foot, quotation 28/32, then Affiliations, Exhibitions and awards, Publications, each a `label` h2 on the left margin with its list on the axis). Labels sticky for the length of their list. XS: one column, labels above lists, quotation 18/28 grey.
5. Series: h1 and years left; one text column on the axis (epigraph grey, source, statement); frames 80 below the text; the "Next" cell opens with a `label`.
6. Contact: h1 at column 9 above the sentence; 404: h1 left, sentence on the axis.
7. Do not touch Projects, Home, viewer, menu.
