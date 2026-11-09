#!/usr/bin/env python3
"""Draw the favicon from Satoshi's own outlines.

The boards draw no mark, so this is the one piece of design not taken
from them: "PS" set in the site's typeface, at the site's tracking, in
the site's ink. Outlines rather than text, so it does not depend on the
font loading. Replace it the moment there is a real mark.

    pip install fonttools brotli
    python3 scripts/make-favicon.py
"""
import pathlib
import sys

from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.ttLib import TTFont

INK = "#111111"
GROUND = "#ffffff"
TRACKING = 0.0  # the wordmark tracks +0.16em, but at 16px that gap
                # separates two letters into two marks; set solid
BOX = 64  # the viewBox is square


def main() -> None:
    root = pathlib.Path(__file__).resolve().parent.parent
    font = TTFont(root / "public/fonts/Satoshi-Medium.woff2")
    glyphs = font.getGlyphSet()
    cmap = font.getBestCmap()
    upem = font["head"].unitsPerEm
    cap = font["OS/2"].sCapHeight

    # lay "PS" out with the wordmark's tracking, and measure the ink
    parts, pen_x, left, right = [], 0.0, None, None
    for i, ch in enumerate("PS"):
        glyph = glyphs[cmap[ord(ch)]]
        pen = SVGPathPen(glyphs)
        glyph.draw(pen)
        from fontTools.pens.boundsPen import BoundsPen

        bounds = BoundsPen(glyphs)
        glyph.draw(bounds)
        if bounds.bounds:
            x_min, _, x_max, _ = bounds.bounds
            left = pen_x + x_min if left is None else left
            right = pen_x + x_max
        parts.append((pen.getCommands(), pen_x))
        pen_x += glyph.width + (TRACKING * upem if i == 0 else 0)

    ink_w = right - left
    # fit the ink to 62% of the box, centred on both axes
    scale = (BOX * 0.68) / ink_w
    dx = (BOX - ink_w * scale) / 2 - left * scale
    dy = (BOX + cap * scale) / 2

    paths = "".join(
        f'<path d="{d}" transform="translate({dx + x * scale:.3f} {dy}) '
        f'scale({scale:.5f} {-scale:.5f})"/>'
        for d, x in parts
    )

    svg = (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {BOX} {BOX}">'
        f'<rect width="{BOX}" height="{BOX}" fill="{GROUND}"/>'
        f'<g fill="{INK}">{paths}</g>'
        f"</svg>\n"
    )
    out = root / "public/favicon.svg"
    out.write_text(svg)
    print(f"wrote {out} ({len(svg)} bytes)")


if __name__ == "__main__":
    sys.exit(main())
