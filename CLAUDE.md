# Working on Forge-plus-anvil

Remakes of Bungie's Marathon tools for Aleph One: Forge (map editor, working) and Anvil (shapes/physics/sounds, next).
The owner is a hobbyist who tests in the real game on Windows. Keep explanations short and plain.

## Rules

- Never commit or bundle Bungie data (Shapes, maps, sounds, physics, images). `.gitignore` blocks the usual extensions.
- Don't decompile or copy Bungie's Forge/Anvil. Format knowledge comes from Aleph One and Weland (GPL) and from real files.
- No Bungie art or branding in the UI.
- Exports must keep working in Aleph One. The Infinity map round trip must stay byte-identical (apart from MacBinary dates).

## Layout and commands

- `apps/forge/index.html`: markup and CSS. `apps/forge/src/forge.js`: the whole editor (one big script, from the claude.ai prototype). `src/main.js` loads three.js (npm, pinned r128) as a global and then the editor.
- `npm run dev`, `npm run build`, `npm test` (Node test runner + Playwright, headless Chromium).
- Tests serve the source directly with an import map: the real three.js when installed, else `tests/support/three-stub.mjs`.
- `MARATHON_MAP=/path/Map.sceA npm test` adds the Bungie Infinity round-trip test.
- `window.__forge` exposes the main functions for tests.
- The editor also runs as a claude.ai artifact. There, saving uses the artifact `downloads` capability (exports go in a zip) and "Generate with Claude" uses `sample`. Elsewhere it uses browser downloads and saves `.sceA` directly.

## Docs

- `docs/PLAN.md`: phases, format notes, what Bungie's Infinity map taught us.
- `docs/MAP_CONVENTIONS.md`: the label contract with the Extraction game mode (owned jointly with that project).
- The claude.ai project "Marathon Tool remakes" has `claude/HANDOFF.md` with the current status. Keep it and `docs/PLAN.md` up to date after milestones.

## Next steps

1. Desktop builds (Tauri) through GitHub Actions releases.
2. Anvil: Shapes viewer first.
3. Move file-format code into `packages/formats`, keeping tests green.
