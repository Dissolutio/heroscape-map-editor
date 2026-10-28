# Texture inventory (`textures/`, branch `textures`)

Generated 2026-10-27 from the 57 images under `textures/`. ImageMagick 7.1.2-34 decodes, rotates, compares and encodes. Statistics over the decoded pixels (`magick f -depth 8 rgba:-`) are aggregated with numpy. Values are 0-255 unless marked 0-1. RMSE is per-channel RGB(A) on the 0-255 scale unless marked. Full data, including per-pixel edge profiles and every pairwise RMSE, is in [textures-inventory.json](textures-inventory.json).

## Can be hard-coded

Flat means every channel has max - min <= 2/255. No image is near-flat (<= 8/255) without also being flat. Terrains are listed by the mapping in section D, including its assumptions.

| Map type | File | Value | Float (R, G, B) | Terrains using it |
|---|---|---|---|---|
| AO | `cap-fluid-ao.bmp` | #ffffff | 1.0000, 1.0000, 1.0000 | Water, ToxicWater, WellspringWater, Ice, Lava, SwampWater, Shadow |
| roughness | `cap-roughness.png` | #4a4a4a | 0.2902, 0.2902, 0.2902 | Ancient, Asphalt, Concrete, Dungeon, Grass, LavaField, Rock, Sand, Snow, Swamp, ToxicLand, Road, WallWalk, SwampWater |
| roughness | `side-roughness.bmp` | #484848 | 0.2824, 0.2824, 0.2824 | Ancient, Asphalt, Concrete, Dungeon, Grass, LavaField, Rock, Sand, Snow, Swamp, ToxicLand, Road, WallWalk, Wood, Lava, SwampWater |
| metalness | `side-metallic.bmp` | #000000 | 0.0000, 0.0000, 0.0000 | Ancient, Asphalt, Concrete, Dungeon, Grass, LavaField, Rock, Sand, Snow, Swamp, ToxicLand, Road, WallWalk, Wood, Water, ToxicWater, WellspringWater, Ice, Lava, SwampWater |
| height | `cap-fluid-height.bmp` | #808080 | 0.5020, 0.5020, 0.5020 | Water, ToxicWater, WellspringWater, Ice, Lava, SwampWater |
| normal | `cap-fluid-normal.bmp` | #8080ff | 0.5020, 0.5020, 1.0000 | Water, ToxicWater, WellspringWater, Ice, Lava, SwampWater, Shadow |
| cap diffuse | (none) |  |  |  |
| side diffuse | (none) |  |  |  |

Not flat by the rule, but close: `cap-metallic.bmp` is 0 except for 50 of 65 536 pixels (9 above 8/255, max 15/255, mean 0.0038/255), scattered inside x 145-255, y 6-241. Textures.md calls it a "black square". It is used by every terrain that has a cap. `side-metallic.bmp` counts as flat: 2 pixels are 1/255 and the rest are 0. Its listed value is the rounded mean, #000000.

`cap-fluid-normal.bmp` is exactly the neutral normal (128, 128, 255). All 21 terrains get metalness 0 in Textures.md (`allTerrainProperties`).

## A. File table

Every file is 8 bits per channel. "Ch" is what is stored. Alpha is "yes" when an alpha channel is stored. It is never meaningful: every pixel of every file has alpha 255.

| Path (under textures/) | Format | Size | Bits/ch | Ch | Alpha | Bytes | Role |
|---|---|---|---|---|---|---|---|
| `cap-fluid-ao.bmp` | BMP3 | 256x256 | 8 | RGBA | yes | 262198 | AO |
| `cap-fluid-height.bmp` | BMP3 | 256x256 | 8 | RGBA | yes | 262198 | height |
| `cap-fluid-normal.bmp` | BMP3 | 256x256 | 8 | RGBA | yes | 262198 | normal |
| `cap-lava-roughness.bmp` | BMP3 | 256x256 | 8 | RGBA | yes | 262198 | roughness |
| `cap-metallic.bmp` | BMP3 | 256x256 | 8 | RGBA | yes | 262198 | metalness |
| `cap-road-height.bmp` | BMP3 | 256x256 | 8 | RGBA | yes | 262198 | height |
| `cap-road-normal.bmp` | BMP3 | 256x256 | 8 | RGBA | yes | 262198 | normal |
| `cap-road_ao.bmp` | BMP3 | 256x256 | 8 | RGBA | yes | 262198 | AO |
| `cap-roughness.png` | PNG Truecolor | 256x256 | 8 | RGB | no | 678 | roughness |
| `cap-sand-ao.bmp` | BMP3 | 256x256 | 8 | RGBA | yes | 262198 | AO |
| `cap-sand-height.bmp` | BMP3 | 256x256 | 8 | RGBA | yes | 262198 | height |
| `cap-sand-normal.bmp` | BMP3 | 256x256 | 8 | RGBA | yes | 262198 | normal |
| `cap-water-roughness.bmp` | BMP3 | 256x256 | 8 | RGBA | yes | 262198 | roughness |
| `caps/Ancient.png` | PNG Truecolor | 256x256 | 8 | RGB | no | 134970 | cap diffuse |
| `caps/AncientDark.png` | PNG RGBA | 256x256 | 8 | RGBA | yes | 135582 | cap diffuse |
| `caps/Asphalt.png` | PNG Indexed | 256x256 | 8 | RGB | no | 45311 | cap diffuse |
| `caps/Concrete.png` | PNG Truecolor | 256x256 | 8 | RGB | no | 116334 | cap diffuse |
| `caps/Dungeon.png` | PNG Truecolor | 256x256 | 8 | RGB | no | 122439 | cap diffuse |
| `caps/Grass.png` | PNG Truecolor | 256x256 | 8 | RGB | no | 132144 | cap diffuse |
| `caps/Ice.png` | PNG Truecolor | 256x256 | 8 | RGB | no | 77519 | cap diffuse |
| `caps/Lava.png` | PNG Truecolor | 256x256 | 8 | RGB | no | 72744 | cap diffuse |
| `caps/LavaField.png` | PNG Truecolor | 256x256 | 8 | RGB | no | 117668 | cap diffuse |
| `caps/Road.png` | PNG Truecolor | 256x256 | 8 | RGB | no | 153145 | cap diffuse |
| `caps/Rock.png` | PNG Truecolor | 256x256 | 8 | RGB | no | 117668 | cap diffuse |
| `caps/Sand.png` | PNG Truecolor | 256x256 | 8 | RGB | no | 129209 | cap diffuse |
| `caps/Snow.png` | PNG Indexed | 256x256 | 8 | RGB | no | 40965 | cap diffuse |
| `caps/Swamp.png` | PNG Truecolor | 256x256 | 8 | RGB | no | 130661 | cap diffuse |
| `caps/ToxicLand.png` | PNG Truecolor | 256x256 | 8 | RGB | no | 131517 | cap diffuse |
| `caps/ToxicWater.png` | PNG Truecolor | 256x256 | 8 | RGB | no | 57124 | cap diffuse |
| `caps/Water.png` | PNG Truecolor | 256x256 | 8 | RGB | no | 128853 | cap diffuse |
| `caps/WellspringWater.png` | PNG Truecolor | 256x256 | 8 | RGB | no | 74103 | cap diffuse |
| `caps/Wood.png` | PNG RGBA | 256x256 | 8 | RGBA | yes | 114096 | cap diffuse |
| `caps/WoodDark.png` | PNG RGBA | 256x256 | 8 | RGBA | yes | 116560 | cap diffuse |
| `side-ao.bmp` | BMP3 | 128x32 | 8 | RGBA | yes | 16438 | AO |
| `side-fluid-height.bmp` | BMP3 | 128x32 | 8 | RGBA | yes | 16438 | height |
| `side-fluid-normal.bmp` | BMP3 | 128x32 | 8 | RGBA | yes | 16438 | normal |
| `side-metallic.bmp` | BMP3 | 128x32 | 8 | RGBA | yes | 16438 | metalness |
| `side-roughness.bmp` | BMP | 128x32 | 8 | RGBA | yes | 16522 | roughness |
| `side-solid-height.bmp` | BMP3 | 128x32 | 8 | RGBA | yes | 16438 | height |
| `side-solid-normal.bmp` | BMP3 | 128x32 | 8 | RGBA | yes | 16438 | normal |
| `side-water-roughness.bmp` | BMP3 | 128x32 | 8 | RGBA | yes | 16438 | roughness |
| `sides/AncientSide.png` | PNG RGBA | 128x32 | 8 | RGBA | yes | 5835 | side diffuse |
| `sides/AsphaltSide.png` | PNG Indexed | 128x32 | 8 | RGB | no | 2899 | side diffuse |
| `sides/ConcreteSide.png` | PNG Truecolor | 128x32 | 8 | RGB | no | 4705 | side diffuse |
| `sides/DungeonSide.png` | PNG Indexed | 128x32 | 8 | RGB | no | 3553 | side diffuse |
| `sides/GroundSide.png` | PNG Truecolor | 128x32 | 8 | RGB | no | 4736 | side diffuse |
| `sides/IceSide.png` | PNG Truecolor | 128x32 | 8 | RGB | no | 5932 | side diffuse |
| `sides/LavaFieldSide.png` | PNG Truecolor | 128x32 | 8 | RGB | no | 4122 | side diffuse |
| `sides/LavaSide.png` | PNG Indexed | 128x32 | 8 | RGB | no | 3536 | side diffuse |
| `sides/RoadSide.png` | PNG Truecolor | 128x32 | 8 | RGB | no | 4312 | side diffuse |
| `sides/SnowSide.png` | PNG Indexed | 128x32 | 8 | RGB | no | 3191 | side diffuse |
| `sides/SwampSide.png` | PNG Indexed | 128x32 | 8 | RGB | no | 3106 | side diffuse |
| `sides/ToxicLandSide.png` | PNG Truecolor | 128x32 | 8 | RGB | no | 4691 | side diffuse |
| `sides/ToxicWaterSide.png` | PNG Truecolor | 128x32 | 8 | RGB | no | 5536 | side diffuse |
| `sides/WaterSide.png` | PNG Truecolor | 128x32 | 8 | RGB | no | 8202 | side diffuse |
| `sides/WellspringSide.png` | PNG Truecolor | 128x32 | 8 | RGB | no | 5995 | side diffuse |
| `sides/WoodSide.png` | PNG Indexed | 128x32 | 8 | RGB | no | 2539 | side diffuse |

Role comes from the file name: `caps/` = cap diffuse, `sides/` = side diffuse, otherwise the `height` / `normal` / `ao` / `roughness` / `metallic` token. Each BMP is 32 bits per pixel. BMPs count as "stored alpha" because ImageMagick reads the 4th byte; for `BI_RGB` files that byte is officially unused. See G.

## B. Flat-colour detection

| File | Min R/G/B/A | Max R/G/B/A | Range | Status | Uniform value (hex RGBA, 0-1 floats) | Neutral normal? |
|---|---|---|---|---|---|---|
| `cap-fluid-ao.bmp` | 255/255/255/255 | 255/255/255/255 | 0/0/0/0 | FLAT | #ffffffff = (1.0000, 1.0000, 1.0000, 1.0000) |  |
| `cap-fluid-height.bmp` | 128/128/128/255 | 128/128/128/255 | 0/0/0/0 | FLAT | #808080ff = (0.5020, 0.5020, 0.5020, 1.0000) |  |
| `cap-fluid-normal.bmp` | 128/128/255/255 | 128/128/255/255 | 0/0/0/0 | FLAT | #8080ffff = (0.5020, 0.5020, 1.0000, 1.0000) | yes |
| `cap-lava-roughness.bmp` | 56/56/56/255 | 255/255/255/255 | 199/199/199/0 |  |  |  |
| `cap-metallic.bmp` | 0/0/0/255 | 15/15/15/255 | 15/15/15/0 |  |  |  |
| `cap-road-height.bmp` | 56/56/56/255 | 255/255/255/255 | 199/199/199/0 |  |  |  |
| `cap-road-normal.bmp` | 3/4/147/255 | 252/252/255/255 | 249/248/108/0 |  |  | no |
| `cap-road_ao.bmp` | 1/1/1/255 | 255/255/255/255 | 254/254/254/0 |  |  |  |
| `cap-roughness.png` | 74/74/74/255 | 74/74/74/255 | 0/0/0/0 | FLAT | #4a4a4aff = (0.2902, 0.2902, 0.2902, 1.0000) |  |
| `cap-sand-ao.bmp` | 27/27/27/255 | 255/255/255/255 | 228/228/228/0 |  |  |  |
| `cap-sand-height.bmp` | 0/0/0/255 | 214/214/214/255 | 214/214/214/0 |  |  |  |
| `cap-sand-normal.bmp` | 0/0/130/255 | 255/255/255/255 | 255/255/125/0 |  |  | no |
| `cap-water-roughness.bmp` | 89/89/89/255 | 151/151/151/255 | 62/62/62/0 |  |  |  |
| `caps/Ancient.png` | 2/24/22/255 | 189/206/215/255 | 187/182/193/0 |  |  |  |
| `caps/AncientDark.png` | 22/42/43/255 | 185/199/207/255 | 163/157/164/0 |  |  |  |
| `caps/Asphalt.png` | 2/2/2/255 | 73/73/73/255 | 71/71/71/0 |  |  |  |
| `caps/Concrete.png` | 86/81/64/255 | 237/239/241/255 | 151/158/177/0 |  |  |  |
| `caps/Dungeon.png` | 39/37/33/255 | 238/237/230/255 | 199/200/197/0 |  |  |  |
| `caps/Grass.png` | 46/33/0/255 | 237/209/161/255 | 191/176/161/0 |  |  |  |
| `caps/Ice.png` | 97/136/131/255 | 155/189/191/255 | 58/53/60/0 |  |  |  |
| `caps/Lava.png` | 58/0/0/255 | 254/154/143/255 | 196/154/143/0 |  |  |  |
| `caps/LavaField.png` | 25/0/0/255 | 222/128/126/255 | 197/128/126/0 |  |  |  |
| `caps/Road.png` | 19/15/9/255 | 255/255/255/255 | 236/240/246/0 |  |  |  |
| `caps/Rock.png` | 56/36/7/255 | 218/169/166/255 | 162/133/159/0 |  |  |  |
| `caps/Sand.png` | 62/27/3/255 | 252/248/203/255 | 190/221/200/0 |  |  |  |
| `caps/Snow.png` | 199/199/199/255 | 255/255/255/255 | 56/56/56/0 |  |  |  |
| `caps/Swamp.png` | 2/13/0/255 | 217/254/182/255 | 215/241/182/0 |  |  |  |
| `caps/ToxicLand.png` | 31/38/4/255 | 198/255/199/255 | 167/217/195/0 |  |  |  |
| `caps/ToxicWater.png` | 128/158/87/255 | 226/252/176/255 | 98/94/89/0 |  |  |  |
| `caps/Water.png` | 0/23/64/255 | 200/248/255/255 | 200/225/191/0 |  |  |  |
| `caps/WellspringWater.png` | 139/171/133/255 | 255/253/244/255 | 116/82/111/0 |  |  |  |
| `caps/Wood.png` | 3/2/2/255 | 208/187/175/255 | 205/185/173/0 |  |  |  |
| `caps/WoodDark.png` | 2/0/0/255 | 208/187/175/255 | 206/187/175/0 |  |  |  |
| `side-ao.bmp` | 197/197/197/255 | 255/255/255/255 | 58/58/58/0 |  |  |  |
| `side-fluid-height.bmp` | 34/34/34/255 | 255/255/255/255 | 221/221/221/0 |  |  |  |
| `side-fluid-normal.bmp` | 1/5/144/255 | 254/250/255/255 | 253/245/111/0 |  |  | no |
| `side-metallic.bmp` | 0/0/0/255 | 1/1/1/255 | 1/1/1/0 | FLAT | #000000ff = (0.0000, 0.0000, 0.0000, 1.0000) |  |
| `side-roughness.bmp` | 72/72/72/255 | 72/72/72/255 | 0/0/0/0 | FLAT | #484848ff = (0.2824, 0.2824, 0.2824, 1.0000) |  |
| `side-solid-height.bmp` | 57/57/57/255 | 239/239/239/255 | 182/182/182/0 |  |  |  |
| `side-solid-normal.bmp` | 17/25/190/255 | 238/230/255/255 | 221/205/65/0 |  |  | no |
| `side-water-roughness.bmp` | 88/88/88/255 | 180/180/180/255 | 92/92/92/0 |  |  |  |
| `sides/AncientSide.png` | 85/102/81/255 | 164/128/137/255 | 79/26/56/0 |  |  |  |
| `sides/AsphaltSide.png` | 4/4/4/255 | 126/137/137/255 | 122/133/133/0 |  |  |  |
| `sides/ConcreteSide.png` | 55/74/63/255 | 209/220/211/255 | 154/146/148/0 |  |  |  |
| `sides/DungeonSide.png` | 54/54/50/255 | 191/188/181/255 | 137/134/131/0 |  |  |  |
| `sides/GroundSide.png` | 108/62/35/255 | 166/122/86/255 | 58/60/51/0 |  |  |  |
| `sides/IceSide.png` | 162/166/160/255 | 222/227/220/255 | 60/61/60/0 |  |  |  |
| `sides/LavaFieldSide.png` | 102/11/0/255 | 154/56/22/255 | 52/45/22/0 |  |  |  |
| `sides/LavaSide.png` | 136/0/0/255 | 236/93/31/255 | 100/93/31/0 |  |  |  |
| `sides/RoadSide.png` | 96/102/93/255 | 169/171/162/255 | 73/69/69/0 |  |  |  |
| `sides/SnowSide.png` | 101/109/107/255 | 255/255/255/255 | 154/146/148/0 |  |  |  |
| `sides/SwampSide.png` | 8/16/0/255 | 162/162/115/255 | 154/146/115/0 |  |  |  |
| `sides/ToxicLandSide.png` | 62/126/54/255 | 216/255/202/255 | 154/129/148/0 |  |  |  |
| `sides/ToxicWaterSide.png` | 135/168/97/255 | 189/216/149/255 | 54/48/52/0 |  |  |  |
| `sides/WaterSide.png` | 0/94/139/255 | 104/216/248/255 | 104/122/109/0 |  |  |  |
| `sides/WellspringSide.png` | 142/158/141/255 | 235/223/230/255 | 93/65/89/0 |  |  |  |
| `sides/WoodSide.png` | 89/67/57/255 | 147/125/115/255 | 58/58/58/0 |  |  |  |

Near-flat but not flat (range 3-8/255): none. Closest outside the limit: `cap-metallic.bmp` (range 15) and `side-ao.bmp` (range 58, mean 242.7).

## C. Duplicates

Pixel hashes (`magick f -depth 8 rgba:- | sha256sum`): **all 57 are distinct**. No pair of same-size images has RMSE under 1/255. The closest pair is `side-fluid-normal.bmp` vs `side-solid-normal.bmp` at 0.0385.

| A | B | Pixel-identical | RMSE 0-1 (RGBA) | `magick compare -metric RMSE` |
|---|---|---|---|---|
| `caps/Rock.png` | `caps/LavaField.png` | no | 0.184 | 13887.1 (0.211904) |
| `caps/Ancient.png` | `caps/AncientDark.png` | no | 0.063 | 4793.46 (0.0731436) |
| `caps/Wood.png` | `caps/WoodDark.png` | no | 0.069 | 4549.5 (0.0694209) |

`Rock.png` and `LavaField.png` are both exactly 117 668 bytes, but their pixels differ (RMSE 0.18). They share the base drawing: their gradient-magnitude correlation is 0.47.

**Same drawing, different colour.** These are not duplicates, but they share structure. The figure is the Pearson correlation of luminance gradient magnitude, which ignores colour. Unrelated images score below 0.3 when they come from different families (for example a fluid cap against a solid cap).

| Images | Gradient correlation |
|---|---|
| `caps/Asphalt.png` / `caps/Snow.png` | 0.98 |
| `caps/Wood.png` / `caps/WoodDark.png` | 0.82 |
| `caps/Ancient.png` / `caps/AncientDark.png` | 0.72 |
| `sides/ConcreteSide` / `SnowSide` / `SwampSide` / `ToxicLandSide` | 0.99-1.00 |
| `sides/GroundSide` / `WoodSide` | 1.0 |
| `sides/GroundSide` / `RoadSide` | 0.98 |
| `sides/IceSide` / `ToxicWaterSide` / `WellspringSide` | 0.99-1.00 |
| `sides/LavaFieldSide` / `GroundSide` | 0.97 |

BMP pairs of the same size and role:

| A | B | Identical | RMSE 0-1 |
|---|---|---|---|
| `cap-fluid-height.bmp` | `cap-road-height.bmp` | no | 0.281 |
| `cap-fluid-height.bmp` | `cap-sand-height.bmp` | no | 0.284 |
| `cap-road-height.bmp` | `cap-sand-height.bmp` | no | 0.422 |
| `cap-fluid-normal.bmp` | `cap-road-normal.bmp` | no | 0.161 |
| `cap-fluid-normal.bmp` | `cap-sand-normal.bmp` | no | 0.201 |
| `cap-road-normal.bmp` | `cap-sand-normal.bmp` | no | 0.240 |
| `cap-fluid-ao.bmp` | `cap-road_ao.bmp` | no | 0.695 |
| `cap-fluid-ao.bmp` | `cap-sand-ao.bmp` | no | 0.270 |
| `cap-road_ao.bmp` | `cap-sand-ao.bmp` | no | 0.558 |
| `cap-lava-roughness.bmp` | `cap-water-roughness.bmp` | no | 0.048 |
| `cap-roughness.png` | `cap-water-roughness.bmp` | no | 0.136 |
| `cap-lava-roughness.bmp` | `cap-roughness.png` | no | 0.117 |
| `side-fluid-height.bmp` | `side-solid-height.bmp` | no | 0.119 |
| `side-fluid-normal.bmp` | `side-solid-normal.bmp` | no | 0.039 |
| `side-roughness.bmp` | `side-water-roughness.bmp` | no | 0.151 |

The RMSE between every pair of same-size BMPs is in the JSON (`duplicates.checks`).

## D. Terrain mapping

Your expected mapping, checked against the files and against `Textures.md`. "-" means no file. **Bold** marks a file that is missing or a choice the sources leave ambiguous; the flags below the table explain each one.

| Terrain | Cap diffuse | PBR alt | Side diffuse | Cap H | Cap N | Cap AO | Cap R | Cap M | Side H | Side N | Side AO | Side R | Side M |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Ancient | `Ancient` | `AncientDark` | `AncientSide` | `cap-sand-height` | `cap-sand-normal` | `cap-sand-ao` | **`cap-roughness`** | `cap-metallic` | `side-solid-height` | `side-solid-normal` | `side-ao` | `side-roughness` | `side-metallic` |
| Asphalt | `Asphalt` | - | `AsphaltSide` | `cap-sand-height` | `cap-sand-normal` | `cap-sand-ao` | **`cap-roughness`** | `cap-metallic` | `side-solid-height` | `side-solid-normal` | `side-ao` | `side-roughness` | `side-metallic` |
| Concrete | `Concrete` | - | `ConcreteSide` | `cap-sand-height` | `cap-sand-normal` | `cap-sand-ao` | **`cap-roughness`** | `cap-metallic` | `side-solid-height` | `side-solid-normal` | `side-ao` | `side-roughness` | `side-metallic` |
| Dungeon | `Dungeon` | - | `DungeonSide` | `cap-sand-height` | `cap-sand-normal` | `cap-sand-ao` | **`cap-roughness`** | `cap-metallic` | `side-solid-height` | `side-solid-normal` | `side-ao` | `side-roughness` | `side-metallic` |
| Grass | `Grass` | - | `GroundSide` | `cap-sand-height` | `cap-sand-normal` | `cap-sand-ao` | **`cap-roughness`** | `cap-metallic` | `side-solid-height` | `side-solid-normal` | `side-ao` | `side-roughness` | `side-metallic` |
| LavaField | `LavaField` | - | `LavaFieldSide` | `cap-sand-height` | `cap-sand-normal` | `cap-sand-ao` | **`cap-roughness`** | `cap-metallic` | `side-solid-height` | `side-solid-normal` | `side-ao` | `side-roughness` | `side-metallic` |
| Rock | `Rock` | - | `GroundSide` | `cap-sand-height` | `cap-sand-normal` | `cap-sand-ao` | **`cap-roughness`** | `cap-metallic` | `side-solid-height` | `side-solid-normal` | `side-ao` | `side-roughness` | `side-metallic` |
| Sand | `Sand` | - | `GroundSide` | `cap-sand-height` | `cap-sand-normal` | `cap-sand-ao` | **`cap-roughness`** | `cap-metallic` | `side-solid-height` | `side-solid-normal` | `side-ao` | `side-roughness` | `side-metallic` |
| Snow | `Snow` | - | `SnowSide` | `cap-sand-height` | `cap-sand-normal` | `cap-sand-ao` | **`cap-roughness`** | `cap-metallic` | `side-solid-height` | `side-solid-normal` | `side-ao` | `side-roughness` | `side-metallic` |
| Swamp | `Swamp` | - | `SwampSide` | `cap-sand-height` | `cap-sand-normal` | `cap-sand-ao` | **`cap-roughness`** | `cap-metallic` | `side-solid-height` | `side-solid-normal` | `side-ao` | `side-roughness` | `side-metallic` |
| ToxicLand | `ToxicLand` | - | `ToxicLandSide` | `cap-sand-height` | `cap-sand-normal` | `cap-sand-ao` | **`cap-roughness`** | `cap-metallic` | `side-solid-height` | `side-solid-normal` | `side-ao` | `side-roughness` | `side-metallic` |
| Road | `Road` | - | `RoadSide` | `cap-road-height` | `cap-road-normal` | `cap-road_ao` | **`cap-roughness`** | `cap-metallic` | `side-solid-height` | `side-solid-normal` | `side-ao` | `side-roughness` | `side-metallic` |
| WallWalk | `Road` | - | `RoadSide` | `cap-road-height` | `cap-road-normal` | `cap-road_ao` | **`cap-roughness`** | `cap-metallic` | `side-solid-height` | `side-solid-normal` | `side-ao` | `side-roughness` | `side-metallic` |
| Wood | `Wood` | `WoodDark` | `WoodSide` | `cap-sand-height` | `cap-sand-normal` | `cap-sand-ao` | **-** | `cap-metallic` | `side-solid-height` | `side-solid-normal` | `side-ao` | `side-roughness` | `side-metallic` |
| Water | `Water` | - | `WaterSide` | `cap-fluid-height` | `cap-fluid-normal` | `cap-fluid-ao` | `cap-water-roughness` | `cap-metallic` | `side-fluid-height` | `side-fluid-normal` | `side-ao` | `side-water-roughness` | `side-metallic` |
| ToxicWater | `ToxicWater` | - | `ToxicWaterSide` | `cap-fluid-height` | `cap-fluid-normal` | `cap-fluid-ao` | `cap-water-roughness` | `cap-metallic` | `side-fluid-height` | `side-fluid-normal` | `side-ao` | `side-water-roughness` | `side-metallic` |
| WellspringWater | `WellspringWater` | - | `WellspringSide` | `cap-fluid-height` | `cap-fluid-normal` | `cap-fluid-ao` | `cap-water-roughness` | `cap-metallic` | `side-fluid-height` | `side-fluid-normal` | `side-ao` | `side-water-roughness` | `side-metallic` |
| Ice | `Ice` | - | `IceSide` | `cap-fluid-height` | `cap-fluid-normal` | `cap-fluid-ao` | `cap-water-roughness` | `cap-metallic` | `side-fluid-height` | `side-fluid-normal` | `side-ao` | `side-water-roughness` | `side-metallic` |
| Lava | `Lava` | - | `LavaSide` | `cap-fluid-height` | `cap-fluid-normal` | `cap-fluid-ao` | `cap-lava-roughness` | `cap-metallic` | `side-fluid-height` | `side-fluid-normal` | `side-ao` | **`side-roughness`** | `side-metallic` |
| SwampWater | - | - | - | `cap-fluid-height` | `cap-fluid-normal` | `cap-fluid-ao` | **`cap-roughness`** | `cap-metallic` | `side-fluid-height` | `side-fluid-normal` | `side-ao` | **`side-roughness`** | `side-metallic` |
| Shadow | - | - | - | - | `cap-fluid-normal` | `cap-fluid-ao` | **-** | `cap-metallic` | - | - | - | - | - |

### Flags per terrain

- **Ancient**
  - cap roughness: no sand-specific roughness file exists; cap-roughness.png (flat #4a4a4a) is assumed because Textures.md calls the sand roughness a "gray square"
  - Textures.md ancientMaterial uses capsAtlas.sand and sidesAtlas.GroundSide, not Ancient.png / AncientSide.png (both exist)
  - cap-sand-height relief does not line up with this diffuse (gradient correlation 0.04; Sand.png is 0.96)
- **Asphalt**
  - cap roughness: no sand-specific roughness file exists; cap-roughness.png (flat #4a4a4a) is assumed because Textures.md calls the sand roughness a "gray square"
  - cap-sand-height relief does not line up with this diffuse (gradient correlation 0.18; Sand.png is 0.96)
- **Concrete**
  - cap roughness: no sand-specific roughness file exists; cap-roughness.png (flat #4a4a4a) is assumed because Textures.md calls the sand roughness a "gray square"
  - cap-sand-height relief does not line up with this diffuse (gradient correlation 0.31; Sand.png is 0.96)
- **Dungeon**
  - cap roughness: no sand-specific roughness file exists; cap-roughness.png (flat #4a4a4a) is assumed because Textures.md calls the sand roughness a "gray square"
  - cap-sand-height relief does not line up with this diffuse (gradient correlation 0.25; Sand.png is 0.96)
- **Grass**
  - cap roughness: no sand-specific roughness file exists; cap-roughness.png (flat #4a4a4a) is assumed because Textures.md calls the sand roughness a "gray square"
  - cap-sand-height relief does not line up with this diffuse (gradient correlation 0.44; Sand.png is 0.96)
- **LavaField**
  - cap roughness: no sand-specific roughness file exists; cap-roughness.png (flat #4a4a4a) is assumed because Textures.md calls the sand roughness a "gray square"
  - cap-sand-height relief does not line up with this diffuse (gradient correlation 0.36; Sand.png is 0.96)
- **Rock**
  - cap roughness: no sand-specific roughness file exists; cap-roughness.png (flat #4a4a4a) is assumed because Textures.md calls the sand roughness a "gray square"
  - cap-sand-height relief does not line up with this diffuse (gradient correlation 0.42; Sand.png is 0.96)
- **Sand**
  - cap roughness: no sand-specific roughness file exists; cap-roughness.png (flat #4a4a4a) is assumed because Textures.md calls the sand roughness a "gray square"
- **Snow**
  - cap roughness: no sand-specific roughness file exists; cap-roughness.png (flat #4a4a4a) is assumed because Textures.md calls the sand roughness a "gray square"
  - cap-sand-height relief does not line up with this diffuse (gradient correlation 0.19; Sand.png is 0.96)
- **Swamp**
  - cap roughness: no sand-specific roughness file exists; cap-roughness.png (flat #4a4a4a) is assumed because Textures.md calls the sand roughness a "gray square"
  - cap-sand-height relief does not line up with this diffuse (gradient correlation 0.16; Sand.png is 0.96)
- **ToxicLand**
  - cap roughness: no sand-specific roughness file exists; cap-roughness.png (flat #4a4a4a) is assumed because Textures.md calls the sand roughness a "gray square"
  - cap-sand-height relief does not line up with this diffuse (gradient correlation 0.32; Sand.png is 0.96)
- **Road**
  - cap roughness: no road roughness file exists (Textures.md says ormAtlas.road for roughness and metalness); cap-roughness.png assumed
  - AO file is named cap-road_ao.bmp (underscore), unlike every other map (hyphen)
- **WallWalk**
  - cap roughness: no road roughness file exists (Textures.md says ormAtlas.road for roughness and metalness); cap-roughness.png assumed
  - AO file is named cap-road_ao.bmp (underscore), unlike every other map (hyphen)
  - no WallWalk file anywhere; RoadSide.png and Road.png assumed (hexColors.ts gives wallWalk the same colour as road, "#a8a597 //same as road")
- **Wood**
  - MISSING: Wood-specific cap roughness ("ormAtlas.wood" in Textures.md); no such file in textures/
  - Textures.md: WoodDark is for high quality "and using the associated roughness map", which does not exist
  - cap-sand-height relief does not line up with Wood.png (gradient correlation 0.27)
- **Water**
  - side AO: only side-ao.bmp exists, so it is shared with the solids
- **ToxicWater**
  - side AO: only side-ao.bmp exists, so it is shared with the solids
  - cap-water-roughness was made from Water.png (gradient correlation 0.99); with this diffuse it is 0.21, so the sparkles do not follow this image
  - side-water-roughness was made from WaterSide.png (0.99); it does not follow this side image
- **WellspringWater**
  - side AO: only side-ao.bmp exists, so it is shared with the solids
  - cap-water-roughness was made from Water.png (gradient correlation 0.99); with this diffuse it is 0.18, so the sparkles do not follow this image
  - side-water-roughness was made from WaterSide.png (0.99); it does not follow this side image
  - side file is WellspringSide.png, not WellspringWaterSide.png
- **Ice**
  - side AO: only side-ao.bmp exists, so it is shared with the solids
  - cap-water-roughness was made from Water.png (gradient correlation 0.99); with this diffuse it is 0.15, so the sparkles do not follow this image
  - side-water-roughness was made from WaterSide.png (0.99); it does not follow this side image
- **Lava**
  - Textures.md lavaMaterial has map: capsAtlas.ice; Lava.png exists and cap-lava-roughness lines up with it (0.99)
  - AMBIGUOUS side roughness: your list gives side-water-roughness only to the sparkling fluids (so Lava would get side-roughness.bmp), but Textures.md gives Lava sidesOrmAtlas.water; side-roughness.bmp is shown here
  - side AO: only side-ao.bmp exists
- **SwampWater**
  - no cap or side image (hard-coded colour, see the average-colour table)
  - Textures.md swampWaterMaterial still names capsAtlas.swampWater and sidesAtlas.swampWater, which do not exist
  - roughness: Textures.md says ormAtlas.sand with the comment "textured large-sparkle lava"; the two disagree. cap-roughness.png / side-roughness.bmp shown
- **Shadow**
  - no cap or side image (Textures.md: map #000)
  - Textures.md: height none, normal = smooth fluid normal, AO/roughness/metalness = "fluid ORM" frame; cap-fluid-* shown, and which roughness is meant is not stated
  - Textures.md defines only a cap material for Shadow; sides unspecified

### Checks against your expected mapping

- Sand set for the 11 solids: correct as far as files go. But `cap-sand-height/normal/ao` were made from `Sand.png` (gradient correlation 0.96 height, 0.92 AO). With the other 10 solid caps it is 0.04-0.44, so their relief will not line up with their painted figures. The sand set has no roughness file of its own. `cap-roughness.png` is the only candidate.
- Road and WallWalk: the road height/normal/AO line up with `Road.png` (0.73 height gradient; 0.83 luminance against AO). There is no road roughness.
- Wood "with its own roughness": **no Wood roughness file exists**.
- Grass, Rock and Sand share `GroundSide.png`: the file exists, and no `GrassSide`, `RockSide` or `SandSide` exists. `WoodSide` and `RoadSide` are the same drawing as `GroundSide` (0.98-1.00).
- All solid sides share `side-solid-height`, `side-solid-normal`, `side-ao`, `side-roughness` and `side-metallic`: all five exist. Side diffuses follow `side-solid-height` with gradient correlation 0.54-0.72, except `AncientSide` 0.42, `AsphaltSide` 0.38, `WaterSide` 0.21 and `LavaSide` 0.16.
- Fluids: `cap-water-roughness`, `cap-lava-roughness`, `cap-fluid-height/normal/ao`, `side-fluid-height/normal` and `side-water-roughness` all exist. Side AO for fluids is not in your list; only `side-ao.bmp` exists. Side roughness for Lava is ambiguous (see Lava). `cap-water-roughness` was made from `Water.png` and `side-water-roughness` from `WaterSide.png` (0.99 each). For ToxicWater, Wellspring and Ice they are 0.15-0.29.
- WallWalk side: there is no WallWalk file. `RoadSide.png` is the only road-coloured side. The app already colours wallWalk the same as road (`src/world/maphex/hexColors.ts`). Whether RoadSide is *intended* is your call; nothing in `textures/` says so.
- **Unused files** (referenced by no terrain under this mapping): none. The mapping only uses `cap-roughness.png` by assumption. If you follow Textures.md literally, `caps/Ancient.png`, `sides/AncientSide.png` and `caps/Lava.png` are unused, because it maps Ancient to sand/GroundSide and Lava to the Ice cap.
- **Needed but missing**: Wood cap roughness; the WoodDark "associated roughness map"; a road roughness if one was meant (Textures.md `ormAtlas.road`); `capsAtlas.swampWater` / `sidesAtlas.swampWater` named by Textures.md; `/atlases/orm_atlas.png` named by Textures.md (there is no `atlases/` directory in `public/` or `textures/`). Shadow and SwampWater colour images are absent by design.

### Average colours for SwampWater and Shadow

"Hex interior" means the pixels inside the fitted hexagon from section E, shrunk by 3 px. Current app colours are taken from `src/world/maphex/hexColors.ts`.

| Image | Mean (whole image) | Mean (hex interior) | Median (hex interior) |
|---|---|---|---|
| `caps/Swamp.png` | #536b36 | #3d6c37 | #3a743b |
| `sides/SwampSide.png` | #706e35 |  |  |
| `caps/Water.png` | #0d80b5 | #0b83b9 | #0085bc |
| `sides/WaterSide.png` | #0589c0 |  |  |
| `caps/ToxicWater.png` | #bad68f | #b9d690 | #bcd791 |
| `caps/Asphalt.png` | #2f2f2f | #323232 | #363636 |
| `sides/AsphaltSide.png` | #3e4140 |  |  |
| `caps/Dungeon.png` | #8e8c86 | #a9a8a1 | #c3c1b9 |
| `caps/LavaField.png` | #632d21 | #4c423c | #4b4741 |
| `caps/ToxicLand.png` | #69835a | #4d5f4e | #44534f |

App colours today: SwampWater `#7a6c35` (hexTerrainColor), `#ACA521` and `rgb(222,210,42)` in other palettes. Shadow `#0f0f0d`; Textures.md says `#000`.

## E. Cap geometry

**How the hexagon was found.** No cap has transparency. Every pixel has alpha 255, and the whole square is painted, so "outermost opaque pixel" cannot be used. Instead a pointy-top hexagon (centre cx, cy; half-width W to the vertical edges; half-height H to the top/bottom vertices; side vertices at cy ± H/2) was fitted to maximise the mean luminance-gradient magnitude along its outline. Every fit was then checked by drawing it on the image. The outline that was fitted:

- Fluid caps (and the water/lava roughness maps): the thin jigsaw line that is painted on the image. A free fit matched it, and the outline touches all four sides of the square.
- Solid caps: the raised rim around the central figure. A free fit locked onto the central figure for Dungeon, Sand, LavaField, Wood, WoodDark and AncientDark. All solids were therefore refitted with W in 100-120 and H in 100-124. Sand, Wood and cap-sand-height stopped at the lower bound (W = H = 100), so their numbers are approximate. The real tile outline of a solid cap may be larger than its rim (closer to the full square, like the fluids), but it is not painted, so it could not be measured.

**Symmetry.** "Pixel" is your test: `-distort SRT θ` about the image centre (128, 128), with RMSE taken over the largest disc inside the fitted hex. Because the fitted hexes are about as wide as they are tall (ratio ≈ 1.0, not 0.866), a pixel-space rotation by 60° does not map the hexagon onto itself. So a second test, "de-stretched", rotates about the fitted centre after scaling x by k = 0.866·H/W, which makes the hex regular, then scales back. Its RMSE is taken over the inscribed ellipse. Each value is shown as RMSE (0-1) / ratio, where ratio = RMSE ÷ (√2 · interior std dev). A ratio near 1 is what two unrelated images give; near 0 means symmetric.

| Image | bbox x | bbox y | W×H px | W/H | Pixel 60° | Pixel 120° | Pixel 180° | De-stretched 60°; 120°; 180° | Outline |
|---|---|---|---|---|---|---|---|---|---|
| `caps/Ancient.png` | 15.5-238.5 | 16.5-239.5 | 223x223 | 1.000 | 0.097 / 0.99 | 0.100 / 1.03 | 0.099 / 1.02 | 0.104 / 0.98; 0.102 / 0.97; 0.105 / 0.99 | solid rim |
| `caps/AncientDark.png` | 17.5-242.5 | 13.5-247.5 | 225x234 | 0.962 | 0.103 / 1.00 | 0.105 / 1.03 | 0.102 / 1.00 | 0.102 / 0.99; 0.102 / 0.98; 0.105 / 1.01 | solid rim |
| `caps/Asphalt.png` | 16.0-236.0 | 17.5-237.5 | 220x220 | 1.000 | 0.059 / 0.94 | 0.060 / 0.96 | 0.059 / 0.95 | 0.060 / 0.93; 0.060 / 0.93; 0.060 / 0.93 | solid rim |
| `caps/Concrete.png` | 16.5-240.5 | 16.5-238.5 | 224x222 | 1.009 | 0.076 / 0.95 | 0.076 / 0.94 | 0.078 / 0.97 | 0.081 / 0.94; 0.082 / 0.94; 0.081 / 0.93 | solid rim |
| `caps/Dungeon.png` | 22.0-228.0 | 30.0-234.0 | 206x204 | 1.010 | 0.219 / 0.96 | 0.222 / 0.98 | 0.212 / 0.94 | 0.227 / 0.95; 0.231 / 0.97; 0.225 / 0.94 | solid rim |
| `caps/Grass.png` | 16.5-240.5 | 18.5-238.5 | 224x220 | 1.018 | 0.118 / 1.02 | 0.121 / 1.05 | 0.121 / 1.05 | 0.124 / 1.01; 0.120 / 0.98; 0.127 / 1.03 | solid rim |
| `caps/Ice.png` | 2.0-253.0 | -3.0-260.0 | 251x263 | 0.954 | 0.021 / 0.69 | 0.022 / 0.71 | 0.016 / 0.53 | 0.018 / 0.51; 0.020 / 0.55; 0.018 / 0.51 | fluid outline |
| `caps/Lava.png` | -2.5-258.5 | 1.5-256.5 | 261x255 | 1.024 | 0.039 / 0.95 | 0.042 / 1.04 | 0.042 / 1.03 | 0.044 / 0.85; 0.051 / 0.98; 0.054 / 1.05 | fluid outline |
| `caps/LavaField.png` | 26.5-235.5 | 22.0-228.0 | 209x206 | 1.015 | 0.086 / 0.94 | 0.092 / 1.00 | 0.095 / 1.03 | 0.100 / 0.92; 0.101 / 0.93; 0.106 / 0.97 | solid rim |
| `caps/Road.png` | 20.0-235.0 | 20.5-237.5 | 215x217 | 0.991 | 0.297 / 0.98 | 0.301 / 1.00 | 0.295 / 0.98 | 0.292 / 0.97; 0.291 / 0.97; 0.299 / 0.99 | solid rim |
| `caps/Rock.png` | 19.5-236.5 | 16.5-238.5 | 217x222 | 0.978 | 0.150 / 1.02 | 0.152 / 1.03 | 0.157 / 1.06 | 0.154 / 0.98; 0.152 / 0.97; 0.160 / 1.02 | solid rim |
| `caps/Sand.png` * | 28.5-228.5 | 26.5-226.5 | 200x200 | 1.000 | 0.221 / 0.94 | 0.229 / 0.97 | 0.229 / 0.97 | 0.232 / 0.95; 0.230 / 0.94; 0.235 / 0.97 | solid rim |
| `caps/Snow.png` | 16.0-236.0 | 17.5-237.5 | 220x220 | 1.000 | 0.055 / 0.94 | 0.056 / 0.96 | 0.056 / 0.95 | 0.057 / 0.93; 0.057 / 0.93; 0.057 / 0.93 | solid rim |
| `caps/Swamp.png` | 18.5-237.5 | 30.0-234.0 | 219x204 | 1.073 | 0.096 / 0.94 | 0.102 / 1.00 | 0.105 / 1.03 | 0.106 / 0.92; 0.113 / 0.98; 0.117 / 1.01 | solid rim |
| `caps/ToxicLand.png` | 16.0-241.0 | 19.0-237.0 | 225x218 | 1.032 | 0.098 / 0.95 | 0.101 / 0.98 | 0.101 / 0.99 | 0.110 / 0.93; 0.109 / 0.93; 0.113 / 0.96 | solid rim |
| `caps/ToxicWater.png` | -2.5-258.5 | 3.5-252.5 | 261x249 | 1.048 | 0.017 / 0.98 | 0.019 / 1.09 | 0.015 / 0.87 | 0.025 / 0.79; 0.026 / 0.83; 0.015 / 0.47 | fluid outline |
| `caps/Water.png` | -5.5-255.5 | -2.0-255.0 | 261x257 | 1.016 | 0.076 / 0.90 | 0.084 / 1.00 | 0.085 / 1.01 | 0.087 / 0.75; 0.104 / 0.90; 0.114 / 0.98 | fluid outline |
| `caps/WellspringWater.png` | 0.0-252.0 | -5.0-260.0 | 252x265 | 0.951 | 0.078 / 1.02 | 0.082 / 1.07 | 0.077 / 1.01 | 0.079 / 1.01; 0.084 / 1.07; 0.078 / 0.99 | fluid outline |
| `caps/Wood.png` * | 27.5-227.5 | 28.0-228.0 | 200x200 | 1.000 | 0.229 / 1.00 | 0.226 / 0.99 | 0.207 / 0.91 | 0.228 / 1.01; 0.225 / 0.99; 0.208 / 0.92 | solid rim |
| `caps/WoodDark.png` | 25.0-229.0 | 27.0-227.0 | 204x200 | 1.020 | 0.296 / 1.00 | 0.295 / 1.00 | 0.283 / 0.96 | 0.293 / 1.00; 0.294 / 1.00; 0.280 / 0.95 | solid rim |
| `cap-fluid-ao.bmp` | - | - | - | - | - | - | - | - | near-flat image, no hexagon to find |
| `cap-fluid-height.bmp` | - | - | - | - | - | - | - | - | near-flat image, no hexagon to find |
| `cap-fluid-normal.bmp` | - | - | - | - | - | - | - | - | near-flat image, no hexagon to find |
| `cap-lava-roughness.bmp` | -1.5-257.5 | 1.5-256.5 | 259x255 | 1.016 | 0.043 / 0.98 | 0.043 / 0.98 | 0.043 / 0.98 | 0.046 / 0.93; 0.050 / 0.99; 0.053 / 1.05 | fluid outline |
| `cap-metallic.bmp` | - | - | - | - | - | - | - | - | no hexagon outline (flat or not a cap image) |
| `cap-road-height.bmp` | 16.0-240.0 | 17.0-241.0 | 224x224 | 1.000 | 0.132 / 0.98 | 0.135 / 1.00 | 0.131 / 0.97 | 0.129 / 0.96; 0.128 / 0.96; 0.131 / 0.98 | solid rim |
| `cap-road-normal.bmp` | 14.0-243.0 | 16.0-242.0 | 229x226 | 1.013 | 0.230 / 1.05 | 0.229 / 1.04 | 0.239 / 1.09 | 0.227 / 1.02; 0.236 / 1.06; 0.243 / 1.10 | solid rim |
| `cap-road_ao.bmp` | 21.5-234.5 | 20.5-235.5 | 213x215 | 0.991 | 0.425 / 0.99 | 0.428 / 1.00 | 0.418 / 0.98 | 0.417 / 0.97; 0.415 / 0.97; 0.415 / 0.97 | solid rim |
| `cap-roughness.png` | - | - | - | - | - | - | - | - | near-flat image, no hexagon to find |
| `cap-sand-ao.bmp` | 26.5-226.5 | 21.5-226.5 | 200x205 | 0.976 | 0.396 / 0.95 | 0.407 / 0.98 | 0.390 / 0.94 | 0.402 / 0.99; 0.402 / 0.99; 0.410 / 1.01 | solid rim |
| `cap-sand-height.bmp` * | 28.5-228.5 | 26.5-226.5 | 200x200 | 1.000 | 0.188 / 0.86 | 0.211 / 0.97 | 0.212 / 0.97 | 0.204 / 0.84; 0.214 / 0.88; 0.227 / 0.94 | solid rim |
| `cap-sand-normal.bmp` | 12.5-241.5 | 20.0-237.0 | 229x217 | 1.055 | 0.303 / 0.95 | 0.328 / 1.03 | 0.347 / 1.09 | 0.310 / 0.95; 0.342 / 1.05; 0.363 / 1.11 | solid rim |
| `cap-water-roughness.bmp` | -5.5-255.5 | -2.0-255.0 | 261x257 | 1.016 | 0.019 / 0.95 | 0.019 / 0.95 | 0.020 / 0.99 | 0.028 / 1.19; 0.028 / 1.21; 0.033 / 1.41 | fluid outline |

\* fit stopped at the lower search bound, so the value is approximate.

**Verdicts:**

- Shape: every outline has W/H between 0.95 and 1.07. None is a regular pointy-top hexagon in pixel space (that would be 0.866). Each is a regular hex stretched about 1.15× horizontally, or squashed 0.866× vertically, to fill a square.
- **No cap is rotationally symmetric**, at 60°, 120° or 180°, by either test. Solid caps and solid maps score 0.84-1.11 on every test, which is what unrelated images give. Fluid caps and the two fluid roughness maps score 0.47-1.41. The low ones are Ice (0.51-0.71), ToxicWater at 180° (0.47 de-stretched) and Water at de-stretched 60° (0.75). In the de-stretched test the painted outline does map onto itself, which pulls the RMSE down; the interior content does not match. A randomly rotated solid cap would show its figure, rim shading and corner fragments in different places. In absolute terms the change is small only for the near-featureless images: Ice, ToxicWater and cap-water-roughness all have RMSE 0.015-0.033 (0-1). On Water, Lava and Wellspring it is 0.04-0.11, and the jigsaw notches move.
- Bounding-box values below 0 or above 256 mean the fitted outline runs slightly past the image edge.

**Border line, outside pixels and wrap.** Border: a profile is taken across the upper-right edge (-10 to +10 px, + is outward), averaged over two stretches of that edge that skip the jigsaw tab in the middle. A line is "detected" when the extreme pixel within ±5 px differs from the average of the two sides by 8 or more luminance levels, and by more than half the inside/outside step. Outside: pixels more than 3 px outside the fitted hex. Wrap: for each pair of opposite edges, pixels 2 px inside the edge are compared with the pixels 2 px inside the opposite edge, which is what sits across the seam when hexes are placed edge to edge (offsets (2W, 0) and (W, ±1.5H)). The figure given is that seam RMSE divided by the RMSE between pixels 4 px apart on the same side of the edge, i.e. ordinary continuous texture. A ratio of 1 or less means the seam is no worse than normal texture variation; well above 1 means a visible break.

| Image | Border line (auto) | Outside hex | Outside RGB std | Wrap ratio UR / R / LR |
|---|---|---|---|---|
| `caps/Ancient.png` | dark #5c5855, 3 px | image content | 23.5 | 1.81 / 0.91 / 1.03 |
| `caps/AncientDark.png` | light #777f83, 4 px | image content | 19.9 | 0.89 / 0.78 / 0.96 |
| `caps/Asphalt.png` | dark #242424, 2 px | image content | 10.9 | 1.16 / 1.47 / 0.83 |
| `caps/Concrete.png` | dark #808071, 3 px | image content | 15.8 | 0.88 / 1.09 / 1.04 |
| `caps/Dungeon.png` | none (step 177→126) | image content | 30.0 | 2.36 / 1.65 / 0.86 |
| `caps/Grass.png` | dark #7c4a2f, 3 px | image content | 19.5 | 1.26 / 0.96 / 0.90 |
| `caps/Ice.png` | none (step 149→151) | image content | 8.2 | 2.00 / 1.18 / 1.53 |
| `caps/Lava.png` | light #af161a, 1 px | image content | 12.2 | 4.54 / 0.96 / 1.29 |
| `caps/LavaField.png` | dark #6f1808, 4 px | image content | 16.7 | 1.42 / 1.49 / 1.72 |
| `caps/Road.png` | light #f9f8e8, 4 px | image content | 55.9 | 1.19 / 1.32 / 1.66 |
| `caps/Rock.png` | dark #7c4f31, 5 px | image content | 22.9 | 1.23 / 1.05 / 0.52 |
| `caps/Sand.png` | none (step 157→81) | image content | 15.9 | 1.22 / 1.19 / 1.11 |
| `caps/Snow.png` | dark #e9e9e9, 2 px | image content | 10.6 | 1.17 / 1.48 / 0.83 |
| `caps/Swamp.png` | none (step 103→119) | image content | 26.7 | 2.04 / 1.95 / 1.34 |
| `caps/ToxicLand.png` | light #90b573, 3 px | image content | 19.9 | 1.33 / 1.15 / 1.11 |
| `caps/ToxicWater.png` | none (step 201→206) | image content | 16.7 | 1.04 / 1.41 / 2.45 |
| `caps/Water.png` | dark #1f6593, 1 px | image content | 23.0 | 0.71 / 2.39 / 0.90 |
| `caps/WellspringWater.png` | none (step 216→214) | image content | 13.8 | 2.09 / 1.35 / 1.32 |
| `caps/Wood.png` | light #847166, 3 px | image content | 19.5 | 0.74 / 1.97 / 0.69 |
| `caps/WoodDark.png` | dark #5a4940, 3 px | image content | 20.4 | 0.74 / 2.95 / 0.54 |
| `cap-lava-roughness.bmp` | none (step 103→108) | image content | 11.8 | 3.82 / 1.08 / 1.26 |
| `cap-road-height.bmp` | dark #676767, 6 px | image content | 31.3 | 2.55 / 0.81 / 0.57 |
| `cap-road-normal.bmp` | light #5dc4da, 5 px | image content | 42.3 | 2.14 / 2.66 / 3.14 |
| `cap-road_ao.bmp` | light #e5e5e5, 4 px | image content | 66.3 | 0.73 / 1.05 / 1.81 |
| `cap-sand-ao.bmp` | dark #9f9f9f, 11 px | image content | 31.7 | 2.06 / 1.43 / 1.23 |
| `cap-sand-height.bmp` | none (step 141→26) | image content | 15.9 | 1.68 / 1.74 / 2.09 |
| `cap-sand-normal.bmp` | dark #6354ec, 4 px | image content | 40.2 | 2.46 / 0.80 / 1.53 |
| `cap-water-roughness.bmp` | none (step 114→114) | image content | 4.8 | 0.64 / 1.85 / 0.74 |

Visual check of zoomed edge crops, which is more reliable than the automatic column above:

- Fluid caps (Water, Lava, ToxicWater, WellspringWater, Ice) have a thin painted jigsaw outline, about 1-3 px, slightly darker than the fill: dark blue on Water, a dark shadow plus a light highlight on Lava, light grey on Wellspring, faint on ToxicWater, nearly invisible on Ice. It is drawn on the image edge. It runs along the square's border on the left and right sides and cuts the four corners.
- Solid caps have no single-colour border line. The edge is a sculpted rim, shaded in the terrain's own colours (often a dark 2-5 px groove on its inside). Outside the rim are 15-30 px of the tile edge and fragments of neighbouring tiles' figures.
- Outside the hex is **image content** on every cap: never transparent, never a flat fill.
- Wrap: **the caps do not tile edge to edge.** Every cap except two has at least one edge pair with a seam ratio of 1.22 or more, up to 4.54. The two exceptions are AncientDark (0.78-0.96) and Concrete (0.88-1.09). This test finds no break for them, but their opposite edges are not continuous by design either: the rim and neighbour fragments differ. A separate check looked for hex-lattice periodicity by shifting each cap against itself. Example: `Water.png` shifted by (128, 192) has RMSE 27.8, against a typical 36.4, and the best shift in the window was 27.3. The only clearly lower values were at the edge of the search window, where the overlap is a thin strip. So the neighbour fragments in the corners are not copies of the hex's own opposite side.

## F. Side checks (128×32)

LR = RMSE between column 0 and column 127; compare it with the median RMSE between neighbouring columns. TB = RMSE between row 0 and row 31; compare it with the median between neighbouring rows. Row 0 / 1 / 2-29 / 30 / 31 are mean luminances. Roll = RMSE of the image against itself shifted horizontally by 21 px (1/6 of the width) and 43 px (1/3).

| Image | LR | Adj col | TB | Adj row | Row lum 0/1/2-29/30/31 | Roll 1/6 / 1/3 | Std |
|---|---|---|---|---|---|---|---|
| `side-ao.bmp` | 0.0 | 0.56 | 13.38 | 0.34 | 241 / 241 / 243 / 245 / 245 | 25.3 / 20.4 | 15.48 |
| `side-fluid-height.bmp` | 7.73 | 1.71 | 34.98 | 1.79 | 126 / 126 / 130 / 137 / 137 | 91.2 / 103.4 | 68.77 |
| `side-fluid-normal.bmp` | 0.0 | 0.76 | 25.73 | 0.6 | 146 / 141 / 136 / 140 / 141 | 33.7 / 29.9 | 20.82 |
| `side-metallic.bmp` | 0.0 | 0.0 | 0.0 | 0.0 | 0 / 0 / 0 / 0 / 0 | 0.0 / 0.0 | 0.02 |
| `side-roughness.bmp` | 0.0 | 0.0 | 0.0 | 0.0 | 72 / 72 / 72 / 72 / 72 | 0.0 / 0.0 | 0.0 |
| `side-solid-height.bmp` | 24.62 | 2.33 | 27.67 | 1.4 | 156 / 154 / 154 / 159 / 159 | 67.1 / 80.7 | 52.28 |
| `side-solid-normal.bmp` | 26.36 | 5.06 | 24.05 | 3.08 | 136 / 141 / 137 / 136 / 138 | 22.4 / 21.2 | 14.16 |
| `side-water-roughness.bmp` | 22.22 | 7.84 | 11.79 | 8.93 | 114 / 114 / 116 / 117 / 115 | 12.8 / 12.7 | 8.79 |
| `sides/AncientSide.png` | 13.9 | 4.53 | 16.96 | 2.98 | 122 / 120 / 118 / 118 / 118 | 14.4 / 16.0 | 9.37 |
| `sides/AsphaltSide.png` | 63.36 | 10.48 | 37.95 | 6.63 | 85 / 78 / 63 / 68 / 68 | 28.9 / 27.3 | 21.41 |
| `sides/ConcreteSide.png` | 63.11 | 8.85 | 35.19 | 5.69 | 182 / 175 / 163 / 168 / 167 | 33.0 / 31.9 | 24.08 |
| `sides/DungeonSide.png` | 48.04 | 6.94 | 27.11 | 4.09 | 127 / 121 / 113 / 116 / 115 | 21.9 / 19.8 | 15.92 |
| `sides/GroundSide.png` | 15.96 | 2.39 | 11.64 | 1.48 | 114 / 112 / 109 / 110 / 110 | 11.7 / 12.0 | 8.46 |
| `sides/IceSide.png` | 17.96 | 3.04 | 12.75 | 2.98 | 206 / 208 / 207 / 208 / 208 | 14.0 / 15.3 | 10.76 |
| `sides/LavaFieldSide.png` | 11.98 | 1.99 | 9.03 | 1.22 | 60 / 59 / 57 / 57 / 57 | 8.8 / 9.1 | 5.85 |
| `sides/LavaSide.png` | 3.53 | 1.55 | 6.13 | 2.13 | 38 / 39 / 37 / 36 / 36 | 8.5 / 9.1 | 5.28 |
| `sides/RoadSide.png` | 24.38 | 2.87 | 13.42 | 1.74 | 150 / 148 / 145 / 146 / 146 | 13.8 / 14.1 | 10.34 |
| `sides/SnowSide.png` | 63.11 | 8.85 | 35.19 | 5.69 | 220 / 213 / 201 / 206 / 205 | 33.0 / 31.9 | 24.08 |
| `sides/SwampSide.png` | 63.11 | 8.85 | 34.83 | 5.66 | 123 / 117 / 105 / 109 / 109 | 32.0 / 31.0 | 23.26 |
| `sides/ToxicLandSide.png` | 62.95 | 8.46 | 33.99 | 5.68 | 218 / 212 / 201 / 206 / 205 | 32.8 / 31.7 | 23.89 |
| `sides/ToxicWaterSide.png` | 12.61 | 2.51 | 10.41 | 2.43 | 188 / 190 / 190 / 190 / 190 | 11.4 / 12.7 | 8.86 |
| `sides/WaterSide.png` | 25.84 | 9.52 | 14.82 | 10.77 | 112 / 111 / 113 / 115 / 113 | 17.8 / 19.4 | 12.67 |
| `sides/WellspringSide.png` | 27.44 | 3.17 | 16.08 | 3.12 | 199 / 202 / 201 / 202 / 202 | 16.9 / 19.8 | 13.22 |
| `sides/WoodSide.png` | 16.44 | 2.17 | 11.42 | 1.18 | 114 / 112 / 110 / 110 / 110 | 11.9 / 12.2 | 8.74 |

1. **Horizontal tiling.** Only `side-ao`, `side-fluid-normal` (LR 0.0) and the flat maps match exactly at left and right. `LavaSide` (3.5 against 1.6 for neighbouring columns) is nearly seamless. Every other side diffuse has LR 3-9× its neighbouring-column RMSE: Ancient 13.9, Ground 16.0, Road 24.4, Wellspring 27.4, and Asphalt / Concrete / Snow / Swamp / ToxicLand ~63. `side-solid-height` (24.6 against 2.3), `side-solid-normal` (26.4) and `side-fluid-height` (7.7) also do not match. Where six faces meet at the hex corners, each corner will show a seam.
2. **Vertical stacking.** TB is 6-38 on the diffuses, against 1-7 for neighbouring rows, so a seam shows where two levels stack. On the Asphalt, Concrete, Dungeon, Snow, Swamp and ToxicLand sides, row 0 is brighter than the body by 14-22 levels, and row 1 by 8-15. That is a highlight line along the top, which repeats at every level when stacked. The height maps differ top to bottom too: `side-fluid-height` rows 0-1 are 125 against rows 30-31 at 137; `side-solid-height` is about 155 against 159. Both normal maps have a distinct row 0 (row 0 vs row 1 RMSE ≈ 21).
3. **One face, not a ring.** Each image is one hex side. Evidence: (a) the 4:1 aspect is close to one face of the app's geometry (edge 1 : height 0.35 = 2.86:1); a six-face ring would be 17:1. (b) The height maps show one jigsaw tab (raised) and one slot (recessed) per image, not six repeats. (c) No 6-fold or 3-fold periodicity: the roll RMSE at 1/6 and 1/3 of the width is about the same as at a half-width shift (64 px, in the JSON) and several times the neighbouring-column RMSE.

## G. Colour space and format

- **sRGB (colour):** all 20 `caps/*.png` and 16 `sides/*.png`. **Linear data:** all 20 BMPs, plus `cap-roughness.png`.
- PNG colour tags: most PNGs carry `gAMA` 1/2.2 plus `cHRM`. `AncientDark`, `Snow`, `Wood`, `WoodDark`, `AncientSide`, `ConcreteSide` and `ToxicLandSide` also carry an `sRGB` chunk. `SwampSide`, `ToxicWaterSide` and `WellspringSide` carry none. `cap-roughness.png`, a data map, carries `gAMA` + `cHRM` + `sRGB`, so it is tagged as sRGB colour.
- **Normal-map convention: mixed.** Method: correlate each normal map's R and G with the slope of the matching height map (white = high). R goes with −dh/dx (x right). G goes with −dh/dy where y points *up* the image for OpenGL, and the opposite sign for DirectX.

| Normal | Height | corr R | corr G (OpenGL +) | Convention |
|---|---|---|---|---|
| `cap-sand-normal.bmp` | `cap-sand-height.bmp` | +0.66 | +0.66 | OpenGL (green up) |
| `cap-road-normal.bmp` | `cap-road-height.bmp` | +0.87 | -0.87 | DirectX (green down) |
| `side-solid-normal.bmp` | `side-solid-height.bmp` | +0.80 | -0.49 | DirectX (green down) |
| `side-fluid-normal.bmp` | `side-fluid-height.bmp` | +0.84 | -0.61 | DirectX (green down) |

  `cap-fluid-normal.bmp` is flat neutral, so it has no convention. The R correlation is positive for all four, which means both the x convention and the white-is-high reading of the heights are consistent. The disagreement is only in G: `cap-sand-normal` is green-up (OpenGL); `cap-road-normal`, `side-solid-normal` and `side-fluid-normal` are green-down (DirectX).
- **BMP pixel formats:**

| File | Pixel format | Alpha / 4th byte | R = G = B |
|---|---|---|---|
| `cap-fluid-ao.bmp` | BITMAPINFOHEADER, 32 bpp, BI_RGB | all 255 (not meaningful) | yes |
| `cap-fluid-height.bmp` | BITMAPINFOHEADER, 32 bpp, BI_RGB | all 255 (not meaningful) | yes |
| `cap-fluid-normal.bmp` | BITMAPINFOHEADER, 32 bpp, BI_RGB | all 255 (not meaningful) | no (spread up to 127) |
| `cap-lava-roughness.bmp` | BITMAPINFOHEADER, 32 bpp, BI_RGB | all 255 (not meaningful) | yes |
| `cap-metallic.bmp` | BITMAPINFOHEADER, 32 bpp, BI_RGB | all 255 (not meaningful) | yes |
| `cap-road-height.bmp` | BITMAPINFOHEADER, 32 bpp, BI_RGB | all 255 (not meaningful) | yes |
| `cap-road-normal.bmp` | BITMAPINFOHEADER, 32 bpp, BI_RGB | all 255 (not meaningful) | no (spread up to 181) |
| `cap-road_ao.bmp` | BITMAPINFOHEADER, 32 bpp, BI_RGB | all 255 (not meaningful) | yes |
| `cap-sand-ao.bmp` | BITMAPINFOHEADER, 32 bpp, BI_RGB | all 255 (not meaningful) | yes |
| `cap-sand-height.bmp` | BITMAPINFOHEADER, 32 bpp, BI_RGB | all 255 (not meaningful) | yes |
| `cap-sand-normal.bmp` | BITMAPINFOHEADER, 32 bpp, BI_RGB | all 255 (not meaningful) | no (spread up to 181) |
| `cap-water-roughness.bmp` | BITMAPINFOHEADER, 32 bpp, BI_RGB | all 255 (not meaningful) | yes |
| `side-ao.bmp` | BITMAPINFOHEADER, 32 bpp, BI_RGB | all 255 (not meaningful) | yes |
| `side-fluid-height.bmp` | BITMAPINFOHEADER, 32 bpp, BI_RGB | all 255 (not meaningful) | yes |
| `side-fluid-normal.bmp` | BITMAPINFOHEADER, 32 bpp, BI_RGB | all 255 (not meaningful) | no (spread up to 178) |
| `side-metallic.bmp` | BITMAPINFOHEADER, 32 bpp, BI_RGB | all 255 (not meaningful) | yes |
| `side-roughness.bmp` | BITMAPV5HEADER, 32 bpp, BI_BITFIELDS, masks 0x00ff0000/0x0000ff00/0x000000ff/0xff000000, colour space sRGB | all 255 (not meaningful) | yes |
| `side-solid-height.bmp` | BITMAPINFOHEADER, 32 bpp, BI_RGB | all 255 (not meaningful) | yes |
| `side-solid-normal.bmp` | BITMAPINFOHEADER, 32 bpp, BI_RGB | all 255 (not meaningful) | no (spread up to 180) |
| `side-water-roughness.bmp` | BITMAPINFOHEADER, 32 bpp, BI_RGB | all 255 (not meaningful) | yes |

  Every BMP is bottom-up. In the 19 `BI_RGB` files the 4th byte is officially unused; it is 255 in every pixel. `side-roughness.bmp` alone is a V5 BMP with an explicit alpha mask and an sRGB colour-space tag, again on a data map. Every map that should be single-channel (height, AO, roughness, metalness; BMP and `cap-roughness.png`) is a true grey: R = G = B in every pixel. The normal maps are the only BMPs with differing channels, as expected.
- **Height maps:**

| File | Min | Max | Mean |
|---|---|---|---|
| `cap-fluid-height.bmp` | 128 | 128 | 128.0 |
| `cap-road-height.bmp` | 56 | 255 | 188.2 |
| `cap-sand-height.bmp` | 0 | 214 | 76.7 |
| `side-fluid-height.bmp` | 34 | 255 | 130.6 |
| `side-solid-height.bmp` | 57 | 239 | 154.8 |

  Black = low, white = high: consistent with the normal maps (positive R correlation above) and with the images. The road cap's inner field is the white plateau, the sand cap's figure is bright and its grooves dark, and on the sides the jigsaw tab is white and the slot dark. `cap-fluid-height` is flat mid-grey (128). The ranges are not normalised: sand 0-214, road 56-255, side-solid 57-239, side-fluid 34-255.

## H. Proposed packed outputs (not created)

ORM+H per template: R = AO, G = roughness, B = metalness, A = height. Each was built in a temp directory only, to measure the sizes.

| Template | Size | R (AO) | G (rough) | B (metal) | A (height) | Flat channels (could be uniforms) | PNG | WebP q90 | WebP lossless |
|---|---|---|---|---|---|---|---|---|---|
| cap-sand | 256x256 | `cap-sand-ao.bmp` | `cap-roughness.png` | `cap-metallic.bmp` | `cap-sand-height.bmp` | G (cap-roughness.png) flat #4a4a4a; B (cap-metallic.bmp) range 15/255 (not flat by the 2/255 rule) | 99.5 KiB | 46.8 KiB | 64.7 KiB |
| cap-road | 256x256 | `cap-road_ao.bmp` | `cap-roughness.png` | `cap-metallic.bmp` | `cap-road-height.bmp` | G (cap-roughness.png) flat #4a4a4a; B (cap-metallic.bmp) range 15/255 (not flat by the 2/255 rule) | 110.7 KiB | 57.8 KiB | 83.9 KiB |
| cap-fluid-water-sparkle | 256x256 | `cap-fluid-ao.bmp` | `cap-water-roughness.bmp` | `cap-metallic.bmp` | `cap-fluid-height.bmp` | R (cap-fluid-ao.bmp) flat #ffffff; B (cap-metallic.bmp) range 15/255 (not flat by the 2/255 rule); A (cap-fluid-height.bmp) flat #808080 | 49.1 KiB | 6.1 KiB | 33.1 KiB |
| cap-fluid-lava | 256x256 | `cap-fluid-ao.bmp` | `cap-lava-roughness.bmp` | `cap-metallic.bmp` | `cap-fluid-height.bmp` | R (cap-fluid-ao.bmp) flat #ffffff; B (cap-metallic.bmp) range 15/255 (not flat by the 2/255 rule); A (cap-fluid-height.bmp) flat #808080 | 44.2 KiB | 6.4 KiB | 26.4 KiB |
| side-solid | 128x32 | `side-ao.bmp` | `side-roughness.bmp` | `side-metallic.bmp` | `side-solid-height.bmp` | G (side-roughness.bmp) flat #484848; B (side-metallic.bmp) flat #000000 | 3.1 KiB | 1.9 KiB | 2.0 KiB |
| side-fluid | 128x32 | `side-ao.bmp` | `side-roughness.bmp` | `side-metallic.bmp` | `side-fluid-height.bmp` | G (side-roughness.bmp) flat #484848; B (side-metallic.bmp) flat #000000 | 3.0 KiB | 1.7 KiB | 1.8 KiB |
| side-fluid-water-sparkle | 128x32 | `side-ao.bmp` | `side-water-roughness.bmp` | `side-metallic.bmp` | `side-fluid-height.bmp` | B (side-metallic.bmp) flat #000000 | 6.1 KiB | 2.5 KiB | 4.3 KiB |

Assumptions in the inputs: `cap-roughness.png` for sand and road (no dedicated files), and `side-roughness.bmp` for the non-sparkling `side-fluid` (Lava; ambiguous, see D). In the two fluid cap templates only roughness varies; AO (255), height (128) and metalness (≈0) are uniform. In the side-solid and side-fluid templates roughness and metalness are uniform. Metalness is uniform or near-zero in all seven. Wood is not listed: its roughness file is missing.

**Counts and memory.** GPU sizes assume uncompressed RGBA8 (4 bytes per pixel; drivers typically pad RGB to 4) with a full mip chain (×4/3).

| Set | Images | GPU (RGBA8 + mips) | Disk |
|---|---|---|---|
| All files as they are | 57 | 11.50 MiB | 5371.2 KiB (as stored) |
| Minus duplicates (0) and flat images (6) | 51 | 10.12 MiB | 528.2 KiB WebP q90; 2044.2 KiB WebP lossless |
| Packed: 36 diffuse + 4 non-flat normals + 7 ORM+H | 47 | 9.10 MiB | 2485.2 KiB PNG (diffuse as stored + ORM+H; the 4 normals, stored as BMP, not included); 561.0 KiB WebP q90; 2042.9 KiB WebP lossless |

The flat images removed are `cap-fluid-ao.bmp`, `cap-fluid-height.bmp`, `cap-fluid-normal.bmp`, `cap-roughness.png`, `side-metallic.bmp`, `side-roughness.bmp`. Of the 20 caps, 2 are PBR alternates (`AncientDark`, `WoodDark`). Leaving them out saves 0.67 MiB of GPU memory if they are loaded only for high quality. WebP sizes were measured with `magick f -quality 90 out.webp` and `-define webp:lossless=true` into a temp directory. Lossy WebP on normal and height data is listed for size only; its effect on shading was not evaluated.

## What could not be determined

- The physical tile outline on solid caps is not painted, so only the raised rim was measured. Three rim fits stopped at the search bound.
- Whether `RoadSide` is the intended WallWalk side, which roughness Shadow, SwampWater and the Lava side use, and whether sand/road use `cap-roughness.png`: the files and Textures.md do not say, or contradict each other.
- The border-line column in E is heuristic. The visual description under it is the reliable one.
