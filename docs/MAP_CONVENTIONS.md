# Extraction Map Conventions

The shared contract between the **Forge/Anvil remake** (which makes maps) and the
**Extraction mode** (which plays them). Both projects follow this file.

Status: **draft v0.1.** The Extraction script doesn't read these labels yet; that's
the next script update. Until then, maps without labels still work through automatic
placement.

---

## How labels work

Labels are ordinary **map annotations**: the text notes you can place on the overhead
map in Forge or Weland. Aleph One's Lua can read them with `Annotations()`, and each
annotation knows which polygon it sits in.

Rules:
- Labels are **UPPERCASE**, with optional settings after a space: `LOOT FAR`
- Put the label **inside** the polygon it refers to, ideally near the middle
- The polygon must be ordinary walkable floor (not a platform, liquid or damage floor)
- Anything that isn't one of the labels below is treated as a normal map note

## Labels

| Label | Meaning | Script behaviour |
|---|---|---|
| `EXTRACT` | A possible extraction point | At open time, picks one of these (far from the squad). If there are none, automatic placement is used. |
| `LOOT` | A loot cache spot | Places loot here first, before random spots. |
| `LOOT FAR` | High-tier loot spot | Always uses the far/high-tier loot table. |
| `CHIP` | Data chip spot | Data chips go here first. |
| `SPAWN` | Monster wave spawn point | Waves prefer these spots when they're a fair distance from players. |
| `NOSPAWN` | Keep this area clear | No loot, chips or waves placed here (safe rooms, the drop zone). |

## Map info the generator should save

Store these in the level's name or a top-of-map annotation, so a map can be rebuilt
or credited later:

```
GEN seed=123456 gen=0.1 size=medium
```

| Field | Meaning |
|---|---|
| `seed` | The seed that produced this map (same seed + same generator = same map) |
| `gen` | Generator version |
| `size` | small / medium / large |

## Requirements for generated maps

- At least 1 player start (co-op: 4 or more is better)
- At least 2 `EXTRACT` labels, well away from the player starts
- Some monster placements, or Extraction will have no monster types for waves
- Every labelled polygon reachable on foot from the player starts
- Game type flags include Cooperative so it shows up for co-op hosting

## Versioning

Bump this file's version when labels change. Old labels keep working where possible.
