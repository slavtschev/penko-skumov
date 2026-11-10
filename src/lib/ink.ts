import metrics from './satoshi-metrics.json';

/**
 * Ink alignment.
 *
 * "Pixel alignment is part of the design: text aligns by its ink (cap-top,
 * baseline, side bearing)" -- the handoff. A line box is taller than the
 * letters inside it and a glyph carries empty space on each side, so a
 * string set flush to the margin at `left: 40px` does not actually start
 * at 40px. Everything here measures that empty space from Satoshi's own
 * metrics (src/lib/satoshi-metrics.json, written by scripts/font-metrics.py)
 * so the offsets are derived rather than typed in by hand.
 *
 * Checked against the Designs 4 boards: these functions reproduce every
 * offset the boards use -- the name at `left: 39px`, the 28/32 menu words at
 * 18 / 20 / 19, the small grey labels at 39, the h1 at 38, cap-tops on 64.
 */

export type StyleName =
  | 'display'
  | 'displayXs'
  | 'name'
  | 'label'
  | 'ui'
  | 'caption'
  | 'title'
  | 'quote'
  | 'text';

interface TypeStyle {
  /** font-size in px */
  size: number;
  /** line-height in px */
  line: number;
  weight: 400 | 500;
  /** letter-spacing in em */
  tracking: number;
  /** set in capitals (the first and last glyph change with it) */
  caps: boolean;
  /**
   * Where the hover rule sits, as the boards place it: a `bottom` offset
   * inside the line box. Not derived -- the boards set it per size and the
   * three values do not follow one distance from the baseline.
   */
  underline: number;
}

export const styles: Record<StyleName, TypeStyle> = {
  /* Designs 5: the page title, the one h1 on a page. 400, not 500 --
     the weight-400 file, never a synthetic bold. */
  display: { size: 56, line: 56, weight: 400, tracking: -0.03, caps: false, underline: 1 },
  displayXs: { size: 36, line: 40, weight: 400, tracking: -0.02, caps: false, underline: 1 },
  /* Designs 5: section headings (h2). The same style as the site name. */
  label: { size: 14, line: 20, weight: 500, tracking: 0.16, caps: true, underline: 1 },
  name: { size: 14, line: 20, weight: 500, tracking: 0.16, caps: true, underline: 1 },
  ui: { size: 14, line: 20, weight: 400, tracking: 0, caps: false, underline: 1 },
  caption: { size: 12, line: 16, weight: 400, tracking: 0, caps: false, underline: -1 },
  title: { size: 28, line: 32, weight: 500, tracking: -0.01, caps: false, underline: 2 },
  /* Designs 5: the About quotation. The title's size and line at 400,
     which is a different face and different bearings. */
  quote: { size: 28, line: 32, weight: 400, tracking: -0.01, caps: false, underline: 2 },
  text: { size: 18, line: 28, weight: 400, tracking: 0, caps: false, underline: 1 },
};

const weightMetrics = (weight: 400 | 500) => metrics.weights[String(weight) as '400' | '500'];

/** Distance from the top of the line box down to the baseline, in px. */
export function baseline(name: StyleName): number {
  const { size, line, weight } = styles[name];
  const m = weightMetrics(weight);
  const content = ((m.ascent + m.descent) / m.unitsPerEm) * size;
  const halfLeading = (line - content) / 2;
  return halfLeading + (m.ascent / m.unitsPerEm) * size;
}

/** Distance from the top of the line box down to the cap-top, in px. */
export function capTop(name: StyleName): number {
  const { size, weight } = styles[name];
  const m = weightMetrics(weight);
  return baseline(name) - (m.capHeight / m.unitsPerEm) * size;
}

/** [left side bearing, right side bearing] in font units. */
const bearing = (char: string, weight: 400 | 500): [number, number] => {
  const table: Record<string, number[]> = weightMetrics(weight).bearings;
  const pair = table[char];
  return pair && pair.length === 2 ? [pair[0], pair[1]] : [0, 0];
};

/**
 * Whole pixels of empty space before the first glyph's ink. Shift a
 * left-aligned string left by this much and its ink starts on the margin.
 *
 * Truncated, not rounded: that is what the boards do (Contact's 0.60px and
 * Projects' 0.59px are both 0 there), and it keeps the ink a hair inside
 * the margin rather than a hair outside it.
 */
export function inkLeft(text: string, name: StyleName): number {
  const style = styles[name];
  const source = style.caps ? text.toUpperCase() : text;
  const first = source.trimStart()[0];
  if (!first) return 0;
  const upem = weightMetrics(style.weight).unitsPerEm;
  return Math.floor((bearing(first, style.weight)[0] / upem) * style.size);
}

/**
 * Whole pixels of empty space after the last glyph's ink, letter-spacing
 * included -- tracking is added after every character, the last one too.
 * Shift a right-aligned string right by this much to set it on the margin.
 */
export function inkRight(text: string, name: StyleName): number {
  const style = styles[name];
  const source = style.caps ? text.toUpperCase() : text;
  const trimmed = source.trimEnd();
  const last = trimmed[trimmed.length - 1];
  if (!last) return 0;
  const upem = weightMetrics(style.weight).unitsPerEm;
  const side = (bearing(last, style.weight)[1] / upem) * style.size;
  return Math.floor(side + style.tracking * style.size);
}

/**
 * The `:root` custom properties the stylesheet reads for vertical ink
 * alignment, emitted from the metrics above so the CSS and the TypeScript
 * cannot drift apart. Swapping the typeface regenerates both.
 */
export function inkTokens(): string {
  const emitted = (Object.keys(styles) as StyleName[]).filter((n) => n !== 'displayXs');
  const lines = emitted.flatMap((name) => [
    `--cap-${name}: ${capTop(name).toFixed(3)}px;`,
    `--base-${name}: ${baseline(name).toFixed(3)}px;`,
    // whole pixels, so a line pulled onto a cap-top keeps its box on an
    // integer: what the boards do (28/32 on a cap-top of 64 sits at 58).
    `--cap-int-${name}: ${Math.floor(capTop(name))}px;`,
  ]);
  // how far a 12/16 caption's box sits below a 14/20 line sharing its
  // baseline -- the viewer's bottom row is set that way
  lines.push(`--caption-drop: ${Math.ceil(baseline('ui') - baseline('caption'))}px;`);

  /* The Display style is 56/56 on the page and 36/40 on the phone, so its
     ink offsets change with the tier. One name, two values. */
  const xs = [
    `--cap-display: ${capTop('displayXs').toFixed(3)}px;`,
    `--base-display: ${baseline('displayXs').toFixed(3)}px;`,
    `--cap-int-display: ${Math.floor(capTop('displayXs'))}px;`,
  ].join('');

  return `:root{${lines.join('')}}@media (max-width:767px){:root{${xs}}}`;
}

/** The space under the baseline inside the line box, in px. */
export function descent(name: StyleName): number {
  return styles[name].line - baseline(name);
}

/**
 * The gap to set between two stacked boxes so that `gap` separates the
 * first's baseline from the second's cap-top -- which is how the Designs 5
 * boards space a list from the heading of the next section.
 */
export function capGapAfterBaseline(from: StyleName, to: StyleName, gap: number): number {
  return Math.ceil(gap - descent(from) - capTop(to));
}

/** How much lower `a`'s box sits than `b`'s when their cap-tops align. */
export function capOffset(a: StyleName, b: StyleName): number {
  return Math.round(capTop(a) - capTop(b));
}

/**
 * The `top` for a line box so that the cap-top lands on `capTarget`.
 *
 * Rounded up, which is what the boards do: the 28/32 menu words want a
 * cap-top at 64 / 112 / 160 and sit at 58 / 106 / 154, not 57 / 105 / 153.
 * Rounding up puts the ink on or a fraction below the line it is aligned
 * to, never above it -- the same way inkLeft truncates so the ink falls a
 * fraction inside the margin, never outside.
 *
 * Reproduces the boards: 28/32 title on 64 -> 58, 18/28 text on 64 -> 56,
 * 12/16 caption on 64 -> 60.
 */
export function boxTopForCap(name: StyleName, capTarget: number): number {
  return Math.ceil(capTarget - capTop(name));
}

/**
 * The `top` for a line box whose cap ink is centred in a box `height` tall.
 * The header is 64 and both the name and the nav sit at 22 on the boards.
 */
export function inkCentreTop(name: StyleName, height: number): number {
  const { size, weight } = styles[name];
  const m = weightMetrics(weight);
  const capHeight = (m.capHeight / m.unitsPerEm) * size;
  return boxTopForCap(name, height / 2 - capHeight / 2);
}
