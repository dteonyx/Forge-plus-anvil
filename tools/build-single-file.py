#!/usr/bin/env python3
"""Builds the one-file versions of Forge from apps/forge (the source of truth).

  python3 tools/build-single-file.py claude-ai OUT.html   -> page for the claude.ai artifact
  python3 tools/build-single-file.py launcher  OUT.html   -> page embedded in Forge.exe

Both load three.js r128 from cdnjs (the launcher swaps that for its cached copy).
The claude.ai page leaves out <html>/<head>/<body>, because the artifact adds its own.
Keep all three versions in step: website (GitHub Pages, from main), Forge.exe
(apps/launcher/build.sh) and the claude.ai artifact (this script + publish).
"""
import re, sys, pathlib

root = pathlib.Path(__file__).resolve().parent.parent
kind, out = sys.argv[1], sys.argv[2]
s = (root / "apps/forge/index.html").read_text()
# the version number lives in apps/launcher/forge.rc (Forge.exe's version too); the editor shows it top right
m = re.search(r'VALUE "ProductVersion", "([^"]+)"', (root / "apps/launcher/forge.rc").read_text())
version = m.group(1) if m else "dev"
s = s.replace("<title>Forge Remake</title>", '<title>Forge Remake</title>\n<meta name="forge-version" content="' + version + '">', 1)
js = (root / "apps/forge/src/forge.js").read_text()
tag = '<script type="module" src="./src/main.js"></script>'
assert tag in s and "</script" not in js.lower()
inline = '<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>\n<script>\n' + js + "\n</script>"
if kind == "launcher":
    page = s.replace(tag, inline)
elif kind == "claude-ai":
    head = s[s.index("<head>") + 6 : s.index("</head>")]
    body = s[s.index("<body>") + 6 : s.index("</body>")]
    head = re.sub(r'\s*<meta charset="utf-8">\s*', "\n", head)
    head = re.sub(r'\s*<meta name="viewport"[^>]*>\s*', "\n", head)
    page = head.strip() + '\n<meta name="claude:viewport-fit-sides" content="cover">\n' + body.replace(tag, inline).strip() + "\n"
    assert page.find("<title>") < 8000, "the artifact title must be in the first 8 KB"
else:
    sys.exit("kind must be claude-ai or launcher")
pathlib.Path(out).write_text(page)
print(f"wrote {out} ({len(page):,} bytes)")
