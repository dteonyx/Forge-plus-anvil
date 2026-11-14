# Export to Unreal

**Export to Unreal…** (top bar) saves the level you're editing as a `.glb` file: a glTF 2.0 3D model with the textures inside. Unreal Engine 5 imports glTF without plugins.

## Importing it

1. In Unreal, open your level and choose **File → Import Into Level**. Pick the `.glb` and press **Import**. (Dragging it into the Content Browser also works; that makes the assets without placing them.)
2. To walk on it, open the imported static mesh, find **Collision Complexity** under Collision, and set it to **Use Complex Collision As Simple**. Save.
3. Add a Player Start and some lights. The level has no lighting of its own in Unreal.

## What's in the file

- Floors, ceilings and walls, including the step walls between rooms of different heights, with each surface's texture, offsets and see-through side textures (as masked materials).
- One material and one PNG texture per Marathon texture, named like `T17_5` (collection 17, texture 5). Textures use nearest filtering, so they keep the pixel look.
- Liquid surfaces as a separate mesh named "… liquids" with a see-through tinted material (can be turned off in the dialog).
- Doors and lifts in the position they start in.

Not included: objects (monsters, items, player starts), lights, sounds, terminals, platform movement and the sky (landscape surfaces come out with their texture, not as a sky).

## Size and axes

glTF uses metres with Y up. Unreal converts that to centimetres with Z up when it imports. The layout matches Forge's 3D view and the 2D map seen from above.

By default **1 World Unit = 225 cm**, so Marathon's player (0.8 WU tall) is 1.8 m, the height of Unreal's mannequin, and doorways fit. Change it in the export dialog if you want a different scale.

Without a Shapes file loaded, the export carries Forge's numbered stand-in textures. Load your own Shapes first for the real ones; they're your copy and stay out of this repo.
