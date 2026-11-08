#!/usr/bin/env python3
"""Generate src/lib/satoshi-metrics.json from the shipped Satoshi TTFs.

Ink alignment needs the font's own numbers: cap height, the ascent that
fixes the baseline inside a line box, and the left/right side bearing of
every glyph we set. Run this again if the typeface changes (the handoff
names Instrument Sans as the fallback) -- the offsets move 1 to 2 px.

Needs fonttools, and brotli to read the woff2 the site ships:
    pip install fonttools brotli
Usage (the default reads public/fonts):
    python3 scripts/font-metrics.py [font-dir]
"""
import json
import sys
from pathlib import Path

from fontTools.pens.boundsPen import BoundsPen
from fontTools.ttLib import TTFont

# Every character the site sets in a position that is aligned by its ink.
CHARS = (
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    "abcdefghijklmnopqrstuvwxyz"
    "0123456789"
    " .,:;!?'\"()[]/&@#%+*=_|<>$"
    "©–—‘’“”…×·"
    "АБВГДЕЖЗИКЛ"
    "МНОПРСТУФХЦ"
    "ЧШЩЪЬЮЯ"
)

WEIGHTS = {"400": "Satoshi-Regular", "500": "Satoshi-Medium"}
# The site ships woff2; a .ttf beside it is read just as happily.
SUFFIXES = (".woff2", ".ttf", ".otf")


def measure(path: Path) -> dict:
    font = TTFont(str(path))
    os2, hhea, head = font["OS/2"], font["hhea"], font["head"]
    glyphs = font.getGlyphSet()
    cmap = font.getBestCmap()

    bearings = {}
    for char in CHARS:
        code = ord(char)
        if code not in cmap:
            continue
        glyph = glyphs[cmap[code]]
        pen = BoundsPen(glyphs)
        glyph.draw(pen)
        if pen.bounds is None:  # space and friends have no ink
            bearings[char] = [0, 0]
            continue
        x_min, _, x_max, _ = pen.bounds
        bearings[char] = [round(x_min, 1), round(glyph.width - x_max, 1)]

    return {
        "unitsPerEm": head.unitsPerEm,
        # The browser builds the line box from hhea on this font, so the
        # baseline sits `ascent` below the content-box top and the content
        # box is (ascent + descent) tall.
        "ascent": hhea.ascent,
        "descent": -hhea.descent,
        "lineGap": hhea.lineGap,
        "capHeight": os2.sCapHeight,
        "xHeight": os2.sxHeight,
        "bearings": bearings,
    }


def main() -> None:
    src = Path(sys.argv[1] if len(sys.argv) > 1 else "public/fonts")
    out = {"family": "Satoshi", "weights": {}}
    for weight, stem in WEIGHTS.items():
        found = next((src / (stem + s) for s in SUFFIXES if (src / (stem + s)).exists()), None)
        if found is None:
            sys.exit(f"no {stem}{SUFFIXES} in {src} -- point this script at the font files")
        out["weights"][weight] = measure(found)
        print(f"  {weight} from {found.name}")

    target = Path("src/lib/satoshi-metrics.json")
    target.write_text(json.dumps(out, ensure_ascii=False, indent=1) + "\n")
    print(f"wrote {target}")


if __name__ == "__main__":
    main()
