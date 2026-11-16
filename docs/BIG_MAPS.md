# Big maps: the FP32 chunk (Forge+ levels made for the Unreal remake)

For the Unreal remake's map reader. Forge+ writes this; Aleph One and Weland ignore it.

## Why

A Marathon map file (`.sceA`) stores positions and heights as signed 16-bit numbers, with 1024 units per World Unit (WU). So a level ends at about ±32 WU from the centre, up and down too. The Unreal remake has no size limit, so in Forge+ a level can be set to **Made for: Unreal remake** (Level tab) and then go past that edge.

The file is still a normal `.sceA`. Every usual chunk is there (PNTS, LINS, SIDS, POLY, OBJS, NOTE, plat, medi, Minf, term, …), but any value that doesn't fit in 16 bits is **clamped** to -32768…32767 there. The real values are in one extra chunk per level, tag **`FP32`**.

- `FP32` is only written when something in the level goes past the edge. A level without it fits in 16 bits, and the normal chunks are exact.
- When the remake reads a level: if `FP32` is there, use its values in place of the clamped ones. Everything else (textures, sides, lights, types, flags, terminals) comes from the normal chunks as usual.
- Units are the same as the normal chunks: 1024 per WU, x/y in map space, z up.

## Layout

Big-endian, like the rest of the file.

```
i16  version   = 1
i16  reserved  = 0
then seven lists, in this order. Each is:
  i32  count
  count × (n × i32)
```

| # | List | n | Values per entry | Matches |
|---|---|---|---|---|
| 1 | points | 2 | x, y | PNTS entries, same order |
| 2 | polygons | 4 | floor height, ceiling height, centre x, centre y | POLY entries, same order |
| 3 | lines | 3 | length, highest adjacent floor, lowest adjacent ceiling | LINS entries, same order |
| 4 | objects | 3 | x, y, z | OBJS entries, same order |
| 5 | notes | 2 | x, y | NOTE entries, same order |
| 6 | platforms | 2 | maximum height, minimum height (-1 = automatic) | plat entries, same order |
| 7 | liquids | 2 | low height, high height | medi entries, same order |

Each list has exactly as many entries as its chunk. If the version isn't 1 or the sizes don't add up, ignore the chunk and use the normal chunks.

## Reading it (sketch)

```
fp = level.chunks["FP32"]
if fp and i16(fp,0) == 1:
    o = 4
    for (name, n) in [("points",2),("polygons",4),("lines",3),("objects",3),("notes",2),("platforms",2),("liquids",2)]:
        count = i32(fp,o); o += 4
        big[name] = [[i32(fp, o + 4*(i*n + j)) for j in range(n)] for i in range(count)]
        o += 4*n*count
    endpoint[i].x, endpoint[i].y         = big.points[i]
    polygon[i].floor, .ceiling, .center = big.polygons[i]
    line[i].length, .highest_floor, .lowest_ceiling = big.lines[i]
    object[i].x, .y, .z                  = big.objects[i]
    ...
```

Forge+'s own reader is `bigCoordsRead` in `apps/forge/src/forge.js`. The writer is in `buildMapChunks` (search `FP32`).

## What Forge+ does with it

- **Made for: Aleph One / Alpha One** (default): anything past the edge is an error in Checks, and export is blocked until it's moved back or the level is switched to the Unreal remake.
- **Made for: Unreal remake**: no size limit (up to about ±1950 WU in the editor). If the level goes past the edge, Checks warns that it won't play in Aleph One or Alpha One. Until it does, the file has no FP32 and still plays in Aleph One.
- Opening a file with FP32 restores the full values and sets Made for to the Unreal remake.
- Levels that fit, Bungie's included, save byte-identical to before.

Polygons still have at most 8 corners, and counts still follow the normal chunks (16-bit indexes).
