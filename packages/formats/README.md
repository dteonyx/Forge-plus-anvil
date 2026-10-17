# formats (planned)

Shared Marathon file-format code for Forge and Anvil: wad files (maps, physics), Shapes, PICT, Mac resource forks, MacBinary / AppleSingle, terminals.

Today this code lives inside `apps/forge/src/forge.js`. It moves here piece by piece, each step keeping the Forge tests green (including the Infinity map round trip).
