#!/bin/sh
# Builds Forge.exe (Windows) from this folder. Needs Go 1.24+ and llvm-windres (for the icon).
# 1. Make one HTML file from the editor (three.js is loaded by the launcher).
set -e
cd "$(dirname "$0")"
python3 - <<'PY'
s = open("../forge/index.html").read(); js = open("../forge/src/forge.js").read()
tag = '<script type="module" src="./src/main.js"></script>'
assert tag in s and "</script" not in js.lower()
s = s.replace(tag, '<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>\n<script>\n' + js + '\n</script>')
open("forge.html", "w").write(s)
PY
# 2. Icon and version info, then the program.
llvm-windres --target=pe-x86-64 -i forge.rc -o rsrc_windows_amd64.syso
GOOS=windows GOARCH=amd64 CGO_ENABLED=0 go build -trimpath -ldflags "-s -w -H windowsgui" -o Forge.exe .
echo "Built Forge.exe"
