#!/bin/sh
# Builds Forge.exe (Windows) from this folder. Needs Go 1.24+ and llvm-windres (for the icon).
# Without llvm-windres, any tool that turns forge.rc into rsrc_windows_amd64.syso works (e.g. a small
# program using github.com/tc-hib/winres).
# 1. Make one HTML file from the editor (three.js is loaded by the launcher).
set -e
cd "$(dirname "$0")"
python3 ../../tools/build-single-file.py launcher forge.html
# 2. Icon and version info, then the program.
llvm-windres --target=pe-x86-64 -i forge.rc -o rsrc_windows_amd64.syso
GOOS=windows GOARCH=amd64 CGO_ENABLED=0 go build -trimpath -ldflags "-s -w -H windowsgui" -o Forge.exe .
echo "Built Forge.exe"
