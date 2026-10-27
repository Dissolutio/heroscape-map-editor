# Texture asset pipeline

The source images in `textures/` are read-only. Run `npm run textures:pack` to
decode them, repair side maps in memory, and write deterministic PNG strips and
`manifest.json` to `public/textures/`. BMP inputs are converted to RGBA in
OpenGL-oriented channel order; PNG inputs are decoded losslessly. PNG encoding
uses fixed filter and deflate settings, and the manifest has sorted keys with no
timestamps.

`scripts/textures/terrain-textures.config.mjs` is the mapping source. It lists
each terrain's diffuse images, ORM and normal templates, flat color, fluid
status, and random-rotation flag. The cap diffuse strips have one layer per
terrain with an image, in `manifest.terrainOrder`. The PBR cap strip uses the
same layer order and substitutes the AncientDark and WoodDark images. Side
diffuse layers are deduplicated by source image. `-1` in a manifest layer field
means that terrain has no corresponding image or map.

## Adding a terrain

1. Add the source cap and side image(s) to `textures/` (256×256 caps and
   128×32 sides). Do not edit existing source images.
2. Add one entry to `terrainTextures` in
   `scripts/textures/terrain-textures.config.mjs`, selecting existing cap/side
   ORM and normal templates and setting the fluid and rotation flags. A flat
   terrain can omit image paths and provide `flatColor`.
3. If a side image needs a different horizontal blend width, set its path in
   `sideRepair.edgeBlendOverrides`; the default is 8 columns on each edge.
4. Run `npm run textures:pack`, `npm run textures:check`, and `npm test`.

An alternate cap diffuse is optional; when present it occupies the same layer
index in `caps-diffuse-pbr.png`. A new ORM or normal template is separate from
adding a terrain and should be introduced only when its maps or constants differ
from the existing templates.

## Commands

- `npm run textures:pack` writes all runtime PNGs and the manifest.
- `npm run textures:check` recomputes outputs in memory and exits nonzero if
  any expected file is missing or differs byte-for-byte.
- `node scripts/pack-textures.mjs --no-side-repairs` packs without replacing
  the top side rows or blending side edges, for visual comparison. Required
  DirectX-to-OpenGL normal green-channel conversions still apply.
- `node scripts/pack-textures.mjs --contact-sheet` writes the comparison at
  `docs/evidence/texture-side-repairs.png`.

## Packed maps and color space

Cap and side ORM strips use RGBA channels in this order: AO, roughness,
metalness, and height. Solid cap roughness is baked as 74/255 (0.2902), solid
and flat-fluid side roughness as 72/255 (0.2824), metalness as 0, fluid AO as
1, and fluid height as 128/255 (0.502). Water and lava roughness use their
authored sparkle maps. Wood uses `cap-wood-roughness.png`.

Diffuse strips are marked `srgb`; ORM and normal strips are `data`. The cap
normal strip contains `sand`, `road`, and neutral `flat` layers. All fluids use
the flat cap normal. Side normals have `solid` and `fluid` layers. All packed
normals use the OpenGL green-up convention.

## Side repairs

Unless disabled with `--no-side-repairs`, all side diffuse, AO, roughness,
height, and normal inputs receive the same two repairs:

1. Rows 0 and 1 are replaced by row 2 to remove repeating top-edge highlights.
2. Per row, the target color is the mean of columns 0 and 127. The outer eight
   columns on either edge blend from their original value toward that target,
   with weight decreasing linearly from 1 at the edge to 1/8 at the inner edge.
   The matching edge pixels are rounded identically.

For side normal maps, vectors in the blended edge strip are renormalized after
blending. `cap-road-normal.bmp`, `side-solid-normal.bmp`, and
`side-fluid-normal.bmp` are flipped in green before packing; the inventory
identifies those as DirectX maps, while `cap-sand-normal.bmp` is already
OpenGL. Caps receive no pixel repairs.

## Source inventory notes

The mapping in `docs/textures-plan.md` is followed when it differs from older
notes in `docs/textures-inventory.md`: Ancient uses `Ancient.png` and
`AncientSide.png`, Road and WallWalk share Road images, and Lava uses
`Lava.png`. The inventory JSON records 57 images and says the Wood roughness is
missing, but the read-only source directory contains an unlisted
`cap-wood-roughness.png`; the pipeline uses it as the plan directs. No source
images were changed.
