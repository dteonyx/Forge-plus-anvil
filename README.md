# Forge-plus-anvil
I used to love making maps for the original marathon game I used to suck at it so messing with vibe coding a amazing thing happened the tools have been revived with more features and Qol updates

---

Remakes of Bungie's Marathon editing tools for [Aleph One](https://alephone.lhowon.org/): **Forge** (maps) now, **Anvil** (shapes, physics, sounds) next. They're built from scratch: same workflow, plus modern features.

**Try it:** https://dteonyx.github.io/Forge-plus-anvil/ (web version, published from `main`). Desktop apps for Windows, Mac and Linux are coming.

## Forge

- Draw and edit levels in 2D: rooms, lines, polygons, heights, lights, textures, objects.
- See and walk the level in 3D, and paint walls, floors and ceilings while walking.
- Real textures from **your own** Shapes files for Marathon, Durandal and Infinity (Aleph One Shapes work too).
- Doors, lifts, liquids, terminals with pictures, chapter screens, per-level physics, whole scenarios.
- Opens Bungie's maps. Export → re-open → export of Infinity's 57-level map is byte-identical.
- Random level generator, and AI level generation: Claude built in on claude.ai, or on the web version with your own API key: **Gemini** (Google, has a free tier: get a key at aistudio.google.com) or **Claude** (Anthropic). The key stays in your browser.
- Extraction mode support: map labels, co-op checks, labelled generated maps (see `docs/MAP_CONVENTIONS.md`).
- Retro (System 7) or modern look, light or dark.

Exports are `.sceA` map files for Aleph One. Put one in your scenario folder and pick it as the map in Preferences → Environment.

## No game data here

Bungie's Shapes, maps, sounds and physics are not in this repo and never get bundled. Each user loads their own copy, and the editor keeps it in the browser.

## Working on it

```sh
npm install
npm run dev      # Forge at http://localhost:5173
npm run build    # web build in apps/forge/dist
npm test         # headless browser tests
```

To also test against Bungie's Infinity map, point `MARATHON_MAP` at your copy:

```sh
MARATHON_MAP="/path/to/Marathon Infinity/Map.sceA" npm test
```

## Layout

| Folder | What |
|---|---|
| `apps/forge` | The map editor (web app) |
| `apps/anvil` | Shapes / physics / sounds editor (next) |
| `packages/formats` | Shared file-format code, moving out of Forge step by step |
| `docs/` | Plan, format notes and the Extraction map conventions |

## License

GNU General Public License v3 or later, the same license as Aleph One. See `LICENSE`.

## Credits

File formats were worked out from the open-source [Aleph One](https://github.com/Aleph-One-Marathon/alephone) and [Weland](https://github.com/treellama/weland) projects (both GPL), and checked against Bungie's released files. Marathon is a trademark of Bungie. This project isn't affiliated with Bungie.
