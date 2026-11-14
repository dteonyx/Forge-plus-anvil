# Forge+ launcher (Windows)

A small program that turns the editor into `Forge.exe`, built without GitHub.

- The editor page is built into the program. It runs a tiny web server on `127.0.0.1` (port 47811) and opens it in its own Edge window (or Chrome); closing the window quits.
- three.js (for the 3D view) is downloaded from cdnjs on first use and kept in `%LOCALAPPDATA%\ForgePlus`, so the 3D view works offline after that. The 2D editor works without it.
- The window has its own profile in `%LOCALAPPDATA%\ForgePlus\Window`, set to ask where to save each exported map. Loaded Shapes and settings stay between runs.
- A log is kept in `%LOCALAPPDATA%\ForgePlus\forge.log`.

Build: `./build.sh` (Go 1.24+ and `llvm-windres`). This is a stopgap until the Tauri desktop build.
