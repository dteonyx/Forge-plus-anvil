# Marathon Tools Remake — Project Plan

A from-scratch, cross-platform remake of the classic Marathon editing tools:
a **Forge-style map editor** and an **Anvil-style shapes/physics editor**.
Built for learning first, and as a base for features the existing tools don't have.

Status: **Forge prototype v3.1**: Extraction map labels (MAP_CONVENTIONS v0.1) with checks and generator support; whole scenarios (many levels), doors/lifts, liquids, terminals, chapter screens and pictures, per-level physics, merged MacBinary export. Infinity's 57-level Map.sceA opens, and export → re-open → export is byte-identical. Anvil not started.

New chats: start with `claude/HANDOFF.md` (where everything lives and where we left off). Live status: the **Marathon Tools Tracker** artifact (claude.ai/artifact/4B4eeGvJH7DFTLs2KLafPk) shows where we are, what's next, and a milestone log. Claude updates it after each piece of work; this plan keeps the detail.

---

## Goals

- Open, edit and save real Marathon 2 / Infinity / Aleph One map files without corrupting them.
- Feel familiar to Forge users in workflow, with our own look (no Bungie art or branding).
- Run anywhere: built as a web app first, wrap as a desktop app later if wanted.
- Keep the code readable and well-commented so it's useful for learning.
- Leave room for our own ideas (see "Wish list" below).

## Non-goals (for now)

- Decompiling or reusing Bungie's original Forge/Anvil code.
- Writing the original Marathon 1 *map file* format. Marathon 1 levels are saved in the Durandal/Infinity format with Marathon 1 compatibility flags, the same way Weland does it.
- Replacing Aleph One itself; we test maps by playing them in Aleph One.

---

## Tech choices

| Area | Choice | Why |
|---|---|---|
| Prototype | One self-contained HTML page (claude.ai artifact) | Fastest way to get a usable editor; already working |
| Language (later) | TypeScript | Port the prototype into a proper repo when it grows |
| App | Web app (Vite) | Runs in any browser, instant reload while developing |
| 2D editor | HTML Canvas | Simple, fast enough for map editing |
| 3D preview | Three.js (r128 UMD) | Standard, well documented |
| Desktop (later) | Tauri or Electron | Optional wrapper for native file access |
| Tests | Vitest | Round-trip tests on real map files |

Reference for file formats: Aleph One's open-source code (GPL), Weland (GPL) and the Maraiah format docs.
Format facts confirmed while building are in "Format notes" below.

---

## Phases

### Phase 0 — Setup
- [ ] Project scaffold (Vite + TypeScript) — prototype is a single HTML file for now
- [ ] Folder structure, lint/format, test runner
- [ ] Collect a few sample map files for testing (from the free Marathon trilogy release)

### Phase 1 — Map file reader/writer (the foundation)
- [x] Read the WAD container (header, directory, levels, tagged chunks; MacBinary detected)
- [x] Parse every level chunk: points (PNTS/EPNT), lines, sides (incl. transparent textures, control panels), polygons, objects, lights, Minf, plat/PLAT, medi, ambi/bonk, NOTE, term, physics
- [x] Write a playable single-level map, CRC filled in; data version per game
- [x] Round-trip test on our own exports: export → import → export gives identical chunks (with painted textures too)
- [x] Round-trip on Bungie's Infinity Map.sceA: all 57 levels, 137 pictures, 5 color tables; second export byte-identical
- [x] 2D viewer

### Phase 2 — 2D map editor
- [x] Pan/zoom grid (wheel, pinch, space-drag), grid sizes 1/16–1 WU, snap
- [x] Draw lines (snap to points/grid, auto-split crossed lines), room rectangle tool, fill polygon from a closed loop
- [x] Move/merge points, move polygons and objects
- [x] Edit polygons: floor/ceiling heights, type, light %, textures; multi-select
- [x] View modes: Draw / Texture / Floor / Ceiling / Light / Type with legend and value labels
- [x] Undo/redo (150 steps), autosave in the browser
- [x] Validation with click-to-locate and one-click fixes
- [x] Real texture thumbnails and texture picker

### Phase 3 — Objects and level properties
- [x] Place monsters, items, scenery, player starts, goals, sounds; facing, height, monster flags
- [x] Platforms (doors, lifts): presets, all 28 flags, auto/explicit limits computed like Aleph One, 3D start/open states
- [x] Liquids: type, surface/tides, current; shared records like Bungie's
- [~] Lights: imported light tables kept (switches, strobes, tides work); new surfaces use Forge's 21-step table. No light editor yet
- [ ] Landscape (sky) textures on walls/ceilings
- [x] Level settings: name, game, environment, landscape, game types, environment flags, mission flags, Marathon 1 compatibility flags
- [x] Terminals: script editor (#LOGON/#PICT/…; $B/$I/$U/$C codes) with live preview; reads and writes Bungie's format

### Phase 4 — 3D preview
- [x] Render the level in 3D with the real textures (numbered stand-ins when no Shapes file is loaded)
- [x] Walk mode (steps, gravity, headroom, solid lines) and fly mode; touch d-pad
- [x] Paint mode (visual mode): click to paint walls/floors/ceilings, Shift+click paints a whole room, eyedropper, J/L/I/K texture offsets, +/− light, undo

### Phase 5 — Anvil-style tools
- [~] Shapes reading: wall collections decoded for Marathon 1 (resource fork; MacBinary/AppleSingle) and Durandal/Infinity; sprites and sequences not yet
- [ ] Shapes file viewer (collections, bitmaps, color tables, frames/sequences)
- [ ] Import/export bitmaps
- [ ] Physics editor (monsters, weapons, projectiles, effects)
- [ ] Sounds viewer/importer

### Phase 6 — Polish and packaging
- [ ] Desktop app build
- [ ] Docs / help pages
- [ ] Launch the current map directly in Aleph One for testing

---

### Scenario builder ("map compiling")
- [x] Levels tab: many levels per scenario, reorder/duplicate/remove, open whole map files or add single levels
- [x] Pictures: library with chapter screens (1500 + level), logon screens, terminal pictures; PICT decode (8/16/32-bit, JPEG) and encode (32-bit PackBits); add your own images
- [x] Physics: load .phyA files, embed per level, or keep a level's own
- [x] Export the whole scenario as one MacBinary map (wad v4, 74-byte level overlays, resource fork with PICT + clut)

### Extraction mode support (follows claude/MAP_CONVENTIONS.md, draft v0.1)
- [x] Labels tool (N): place, move and edit map notes, with quick buttons for EXTRACT, LOOT, LOOT FAR, CHIP, SPAWN, NOSPAWN; labels are coloured tags shown at every zoom; plain notes stay italic text
- [x] Labels are saved as ordinary NOTE annotations with their polygon index (round trip checked)
- [x] Checks (run when "Extraction" is ticked in the Level tab or any label is on the map): label not uppercase, outside the map, on a door/lift/liquid/damage floor; Co-op not ticked; fewer than 4 starts; no monsters; fewer than 2 EXTRACT; labels not reachable on foot; EXTRACT too close to the starts. One-click fixes for co-op, extra starts and EXTRACT placement
- [x] Reachability = walking graph between polygons: shared non-solid line, step up ≤ 0.3 WU, ≥ 0.75 WU headroom; doors/lifts always connect; teleporters jump to their target. Distances are walking distances from the player-start polygons
- [x] Generate dialog: "Extraction (co-op)" mode for random and Claude layouts: 4 starts in the first room, monsters, labels placed by walking distance (2 EXTRACT far apart, NOSPAWN on the start room, LOOT, LOOT FAR, CHIP, SPAWN), and a `GEN seed=… gen=0.1 size=…` note in the start room. Claude layouts get `src=ai` added because they can't be rebuilt from the seed
- [x] GEN_VERSION is 0.2 (textures from curated palettes changed the output for the same seed). Bump it whenever that happens again

### Texture palettes for generated levels
- [x] Every wall set (Marathon 3, Durandal 4, Infinity 5) sorted by eye into wall / floor / ceiling / light-fixture lists plus "special" bitmaps the generator never uses: switches (0–1), rechargers (2–3), terminals (4), liquid surfaces (water 19, lava 12, sewage 13, Jjaro goo 13, Pfhor goo 5), doors, starfields, hazard stripes and loud neon/blue panels
- [x] Generated levels pick a theme (3 walls, 2 floors, 2 ceilings) per level; corridors use the main set; about 1 room in 6 gets a light-fixture ceiling
- [x] Texture picker labels special bitmaps (e.g. "4 · terminal")
- [ ] Refine the lists from play-testing (first pass, picked from thumbnails)
- [ ] Generator variety: rooms are all similar boxes; needs varied sizes/shapes, big halls, height play (user feedback; parked for now)

## Wish list (our own additions)

- [x] AI level generation: describe a level, Claude lays out rooms/heights/lights/monsters/items (in the app)
- [x] Offline random layout generator (seeded rooms + corridors + stairs, varied textures)
- [x] Retro (1-bit System 7) and Modern UI looks, light/dark
- [x] First-launch Shapes setup for all three games, with "Add later"
- [ ] AI "edit selection" (e.g. "turn this hall into a lava pit with ledges")
- [ ] AI picks textures by name (needs texture descriptions)
- [ ] Non-rectangular rooms from the AI generator
- [ ] Auto-align wall textures across neighbouring walls
- [ ] _(your ideas)_

---

## Format notes (verified against Weland + Aleph One source and the user's Shapes files)

- Wad header 128 bytes: version 2, data version (1 = Marathon 2, 2 = Infinity), filename 64, checksum (CRC-32 of whole file with field zeroed) at byte 68, directory offset, count, app-specific dir size (0 for single level, 74 for multi-level overlays), entry header 16, dir entry base 10.
- We write data version 1 for all games (Bungie's own Infinity map is data version 1). Marathon 1 levels also set M1 compatibility env flags (activation range 0x0200 and weapons 0x0400 by default; glue 0x10, ouch 0x20, rebellion 0x40, song index 0x80, terminals stop time 0x100 optional).
- Chunk header: tag, next-offset (relative to entry start, 0 = last), length, 0.
- Write PNTS (plain points), not EPNT: Aleph One then recomputes endpoint/line/polygon redundant data on load.
- `polygon.line_indexes[i]` joins `endpoint_indexes[i]` → `[i+1]`; polygons are clockwise on screen (y down). A polygon is a line's *clockwise owner* when walking ep0→ep1 goes clockwise around it.
- Max 8 vertices per polygon; polygons must be convex.
- Sides follow Forge/Weland "pave": a side only where there's a visible wall; type Full/High/Low/Split from neighbour heights. Painted textures are stored per side and part (full/upper/lower); Split uses primary = upper, secondary = lower.
- Wall collection = environment + 17. Default bitmaps: wall 5, floor 6, ceiling 7.
- Sizes: line 32, side 64, polygon 128, light 100, object 16, Minf 88, plac 12 × 128. Polygon floor/ceiling origins at +108/+112.
- Shapes, Durandal/Infinity: data fork, 32 collection headers × 32 bytes (8-bit offset at +4, 16-bit at +12). Wall shape index → low-level shape → bitmap. Wall bitmaps are column-order 128×128 with one color table.
- Shapes, Marathon 1: resource fork, one `.256` resource per collection (id 128 + collection), same collection layout, different RLE. The user's copy is MacBinary II.
- Wall sets present: Marathon 17–19 (3 sets); Durandal 17, 18, 19, 21 (no Jjaro); Infinity 17–21. Landscapes are 27–30.
- Bungie's Shapes files are free to download but not open source, so the editor never bundles them; each user loads their own copy (kept in the browser's IndexedDB).
- The artifact can't save `.sceA` directly (download allowlist), so export is a zip containing `<Name>.sceA` + README.

## What Bungie's Infinity map taught us (Map.sceA, Aleph One 2025-08-29 release)

- The file is MacBinary-wrapped: data fork = a merged wad ("Merged Map Files"), wad version 4, **data version 1** (even for Infinity), 57 levels, 74-byte per-level overlay in the directory (mission/env/entry flags + name).
- Levels are **preprocessed** ("compiled"): EPNT endpoints, `iidx` map indices and `PLAT` (dynamic platform state, 140 bytes each) instead of the editor-side `plat`. 1,073 platforms (doors/lifts) = polygon type 5.
- **Per-level physics**: 35 levels embed MNpx, FXpx, PRpx, PXpx, WPpx (same five sections as Physics Models/Standard.phyA). Two levels have modified physics (larger MNpx/WPpx). This is "map compiling".
- **Terminals** (`term`): 102 terminals in 33 levels. Header 10 bytes (total length, flags, lines/page, group count, font-change count), groups 12 bytes each (flags, type, permutation, start, length, max lines), font changes 6 bytes, then text. Text is lightly scrambled when flag 1 is set (XOR 0xFE/0xED on bytes 3–4 of every 4, 0xFE on the tail). Group types: logon, unfinished, success, failure, information, end, interlevel teleport, intralevel teleport, checkpoint, sound, movie, track, pict, logoff, camera, static, tag.
- **Pictures** live in the map's **resource fork** as PICT resources (137): chapter screens = 1500 + level index (shown before that level), logon/logoff screens ~1600s, terminal pictures 10000+, alternates 20000+. Encodings: PackBitsRect (8-bit + color table) and DirectBitsRect (16/32-bit); one uses QuickTime JPEG. Decoder prototype handles 134 of 137.
- Images.imgA is MacBinary with only a resource fork: 17 interface PICTs/cluts (menus), not level pictures.
- Usage across the game: 210 liquids, 145 ambient sounds, 48 random sounds, 36 map annotations; polygon types incl. 1,462 zone borders, 1,549 monster-impassable, 179 teleporters.
- Checks fixed after testing all 57 levels: crossing lines are legal (overlapping "5D" space), ceiling-below-floor and low polygons are normal for doors/platforms. All 57 levels now import with zero errors.

## Open questions

- Platforms + media are the next most-needed features.
- Name for the project? (The prototype is titled "Forge Remake"; the plan says no Bungie branding — rename?)
- Desktop wrapper: Tauri vs Electron (decide in Phase 6).
