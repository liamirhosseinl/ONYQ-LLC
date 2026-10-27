#!/usr/bin/env python3
"""Convert a project's images into the site's case format.

Usage:  python3 scripts/prepare-case-images.py <source-folder> <slug>
Writes public/work/<slug>/01.webp, 02.webp … (2000 px wide max, quality 82) in the
alphabetical order of the source files and prints the width/height of each one,
ready to paste into data/cases.ts.  Requires Pillow (pip install pillow).
"""
import sys
from pathlib import Path
from PIL import Image

src, slug = Path(sys.argv[1]), sys.argv[2]
out = Path(__file__).resolve().parent.parent / "public" / "work" / slug
out.mkdir(parents=True, exist_ok=True)
files = sorted(p for p in src.iterdir() if p.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp"})
for i, f in enumerate(files, 1):
    im = Image.open(f).convert("RGB")
    if im.width > 2000:
        im = im.resize((2000, round(im.height * 2000 / im.width)), Image.LANCZOS)
    name = f"{i:02d}.webp"
    im.save(out / name, "WEBP", quality=82, method=6)
    print(f'img("{slug}", "{i:02d}", {im.width}, {im.height}, "altKey")   # from {f.name}')
