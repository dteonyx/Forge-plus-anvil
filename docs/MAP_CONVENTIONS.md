# Extraction Map Conventions

The shared contract between the **Forge/Anvil remake** (which makes maps) and the
**Extraction mode** (which plays them). Both projects follow this file.

Status: **v0.4.** Extraction v0.6 reads all of these labels. Maps without labels still
work through automatic placement. Labels are hidden from the overhead map once read.

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
| `DEPLOY` | Hub: the deploy pad | The squad stands here to start the next raid. Otherwise placed automatically. |
| `STASH` | Hub: a stash locker | Players must be within 4 WU of a `STASH` label to store or take gear (from the map/inventory screen). With no `STASH` labels, the stash works anywhere in the hub. |
| `VAULT` | Raid: a guarded high-value room | Always gets a weapon, rolled with vault odds (Rare 55%, Legendary 45%). Use sparingly, 1–2 per map. |
| `GATE <cost> <NAME>` | Hub: a locked area, e.g. `GATE 4 MAP ROOM` | Put it inside the **door platform** polygon. The door stays locked until the squad has banked `<cost>` chip points, then opens for good. `MAP ROOM` is the first unlock and turns on deep raids. |
| `DEPLOY DEEP` | Hub: the deep-raid pad | Like `DEPLOY`, but starts a harder, richer DEEP raid. Only works once the MAP ROOM is unlocked; put it inside the map room. Otherwise placed automatically. |
| `UPLINK` | Reserved | Not used yet. Saved for a later hub feature; don't use it for anything else. |

## Hub maps

The hub is a level in the same map file as the raids. The script's `HUB_LEVEL` setting
says which one, and `RAID_LEVELS` lists the levels a deploy can pick from. A hub needs
player starts, a `DEPLOY` label and ideally a few `STASH` labels. The script removes its
monsters and stops its items respawning.

The **Armory** (where raids start and end) is always open: put the player starts, the
`STASH` labels and the `DEPLOY` pad there. Extra rooms sit behind `GATE` doors and open
as the squad banks data chips. A good first layout:

```
 [ ARMORY ]──(GATE 4 MAP ROOM door)──[ MAP ROOM ]
  starts, STASH, DEPLOY                DEPLOY DEEP
```

`DEEP_RAID_LEVELS` in the script lists the levels a deep deploy can pick from.

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

v0.2: added DEPLOY, STASH and hub maps.
v0.3: added VAULT, GATE <cost> <NAME>, DEPLOY DEEP; reserved UPLINK.
v0.4: STASH now marks stash lockers (the stash is no longer laid out on the floor).

Bump this file's version when labels change. Old labels keep working where possible.
