/**
 * The grid, as one table.
 *
 * The stylesheet's tier tokens and the `sizes` attribute on every
 * photograph are both generated from TIERS below. They have to agree: if
 * the CSS said one gutter and `sizes` assumed another, the browser would
 * quietly pick the wrong file for every frame on the page and nothing
 * would look broken.
 */

export interface Tier {
  /** XL, L, M, S, XS -- the handoff's names */
  name: string;
  /** min-width in px; XS is the base tier and has none */
  from: number | null;
  columns: number;
  margin: number;
  gutter: number;
}

/** Widest first, which is the order a `sizes` list has to be read in. */
export const TIERS: Tier[] = [
  { name: 'XL', from: 1680, columns: 12, margin: 56, gutter: 24 },
  { name: 'L', from: 1280, columns: 12, margin: 40, gutter: 20 },
  { name: 'M', from: 1024, columns: 12, margin: 32, gutter: 16 },
  { name: 'S', from: 768, columns: 8, margin: 28, gutter: 16 },
  { name: 'XS', from: null, columns: 4, margin: 20, gutter: 12 },
];

/** Narrowest first, which is the order CSS min-width queries have to be in. */
const ascending = [...TIERS].reverse();

/**
 * How wide a module of `span` columns is at this tier, as a CSS length.
 * A module is n columns plus the n-1 gutters between them, and a column is
 * what is left of the viewport once the two margins and every gutter are
 * taken out.
 */
export function moduleWidth(tier: Tier, span: number): string {
  const columns = Math.min(span, tier.columns);
  const fixed = 2 * tier.margin + (tier.columns - 1) * tier.gutter;
  const share = columns / tier.columns;
  const gutters = (columns - 1) * tier.gutter;
  // (100vw - fixed) * share + gutters, with the constants folded together
  return `calc((100vw - ${fixed}px) * ${+share.toFixed(6)} + ${gutters}px)`;
}

/**
 * The `sizes` attribute for a frame that occupies `span` columns.
 *
 * Never `100vw`: at the L tier a nine-column plate is 1015px of a 1440px
 * window, so `100vw` would have the browser fetch a file 40% wider than
 * the frame can ever display.
 *
 * `spans` overrides the span at named tiers, for the modules the handoff
 * reduces on the way down -- the Home plate is 9 columns but 7 at S.
 */
export function sizesFor(span: number, spans: Partial<Record<string, number>> = {}): string {
  const parts: string[] = [];
  for (const tier of TIERS) {
    const width = moduleWidth(tier, spans[tier.name] ?? span);
    parts.push(tier.from === null ? width : `(min-width: ${tier.from}px) ${width}`);
  }
  return parts.join(', ');
}

/**
 * The widths to render each photograph at. Capped at the source's own
 * width -- upscaling a 1600px scan to 3200 adds bytes and no detail.
 * The handoff asks for 640 to 3200; once Penko supplies originals of
 * 2560px and wider, the upper rungs start being used with no change here.
 */
export const WIDTH_LADDER = [640, 960, 1280, 1600, 2048, 2560, 3200];

export function widthsFor(sourceWidth: number): number[] {
  const widths = WIDTH_LADDER.filter((w) => w <= sourceWidth);
  if (!widths.includes(sourceWidth)) widths.push(sourceWidth);
  return widths;
}

/** The tier tokens, emitted so the CSS and the `sizes` above cannot drift. */
export function gridTokens(): string {
  // --grid-template carries the whole track list, because repeat() wants a
  // literal count: `repeat(var(--cols), 1fr)` is invalid and silently
  // leaves the element with one implicit column.
  const vars = (t: Tier) =>
    `--cols:${t.columns};--margin:${t.margin}px;--gutter:${t.gutter}px;` +
    `--grid-template:repeat(${t.columns},1fr);`;
  const base = ascending[0];
  const root = `:root{${vars(base)}}`;
  const queries = ascending
    .slice(1)
    .map((t) => `@media (min-width:${t.from}px){:root{${vars(t)}}}`)
    .join('');
  return root + queries;
}
