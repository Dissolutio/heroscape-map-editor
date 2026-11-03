# Textures plan (owner + PM, 2026-10-27)

Source data: `docs/textures-inventory.md` / `.json` (measured facts about the images in `textures/`). `Textures.md` was a rough sketch and is superseded by this file.

See [the texture asset pipeline](textures-pipeline.md) for packing commands,
repair details, and the manifest/output format.

## Goal
Per-hex instanced cells (cap + sides) replace per-piece subterrain GLBs for
ordinary land. The legacy pipeline remains the Low graphics tier.

## Graphics tiers (persisted in local settings)
1. Low: the legacy pipeline (subterrain GLBs, matcap, flat colors). No land texture arrays.
2. Medium: per-hex instancing with diffuse cap and side images.
3. High: lights + shadows with full PBR (normal, AO, roughness, height) and the PBR alternate diffuses (AncientDark, WoodDark).
The separate High Quality Render control remains available in Low: it selects
the realistic legacy cap and keeps objective-marker height aligned with it.

Packed strips contain 21 cap-diffuse layers, up from 19. Estimated RGBA8 GPU
memory includes the complete mip chains for each selected array:

| Tier | Arrays / layers | Estimated GPU memory |
|---|---:|---:|
| Low | none | 0 MiB |
| Medium | 2 / 39 | 7.38 MiB |
| High | 7 / 74 | 17.48 MiB |

High includes both diffuse cap arrays. Driver allocation and mipmap padding may
vary.

## Decisions
- Caps are 256x256, sides 128x32 (one face, exactly one level tall; sides stack and V repeats once per level).
- Each cap's hexagon fills its square (width/height about 1.0): UV = the regular pointy-top hex's bounding box mapped to 0..1, non-uniform, clamp to edge.
- Per-terrain `allowRandomRotation` controls stable 60-degree cap rotation. Solid caps rotate their full texture, including the rim, so there is no rotated-interior seam; fluid caps retain their fill/mitered-border blend. Use `?capRim=unrotated` in a development URL to compare against the previous solid-cap behavior. The switch is ignored in production.
- Neighboring pieces blend (no piece seam in the first pass); baked cap borders still show each hex.
- Shared PBR maps are accepted even where their relief doesn't match the diffuse (cap-sand-* was made from Sand.png; the Water sparkle is reused by ToxicWater, WellspringWater, Ice). Judge in the real scene before authoring per-terrain maps.
- Normal maps ship OpenGL (green up). Flip green for cap-road-normal, side-solid-normal, side-fluid-normal (DirectX). cap-sand-normal is already OpenGL.
- Flat source maps are baked as constants: fluid AO 1.0, fluid height 0.5, fluid normal neutral (128,128,255), solid cap roughness 0.2902 (#4a4a4a), side roughness 0.2824 (#484848), metalness 0 everywhere (cap-metallic's 50 stray pixels are ignored).
- Wood uses `cap-wood-roughness.png`.
- Side-image repairs at pack time: stacked levels must not show a bright repeating top row, and the left/right edge must match so hex corners don't show a seam.

## Terrain table
| Terrain | Cap diffuse (PBR alt) | Side diffuse | PBR template |
|---|---|---|---|
| Ancient | Ancient (AncientDark) | AncientSide | sand |
| Asphalt | Asphalt | AsphaltSide | sand |
| Concrete | Concrete | ConcreteSide | sand |
| Dungeon | Dungeon | DungeonSide | sand |
| Grass | Grass | GroundSide | sand |
| LavaField | LavaField | LavaFieldSide | sand |
| Rock | Rock | GroundSide | sand |
| Sand | Sand | GroundSide | sand |
| Snow | Snow | SnowSide | sand |
| Swamp | Swamp | SwampSide | sand |
| ToxicLand | ToxicLand | ToxicLandSide | sand |
| Road | Road | RoadSide | road |
| WallWalk | Road | RoadSide | road |
| Wood | Wood (WoodDark) | WoodSide | sand + cap-wood-roughness |
| Water | Water | WaterSide | fluid + water sparkle |
| ToxicWater | ToxicWater | ToxicWaterSide | fluid + water sparkle |
| WellspringWater | WellspringWater | WellspringSide | fluid + water sparkle |
| Ice | Ice | IceSide | fluid + water sparkle |
| Lava | Lava | LavaSide | fluid + cap-lava-roughness; side roughness constant |
| SwampWater | SwampWater | SwampWaterSide | fluid-water |
| Shadow | Shadow | ShadowSide | fluid-flat |

Templates:
- sand: cap-sand-height/normal/ao; side-solid-height/normal, side-ao.
- road: cap-road-height/normal, cap-road_ao; same side set as sand.
- fluid-water: constants plus cap/side water roughness maps.
- fluid-lava: constants plus cap-lava-roughness; side roughness is constant.
- fluid-flat: constant AO, roughness, metalness, and height.

## Rendering plan
- Two instanced meshes (caps, sides). Sides carry a 6-bit visibility mask; hidden quads collapse in the vertex shader. A side is hidden when the neighbor at that level is solid land (see `src/data/interlock-templates.ts`).
- Per-instance attributes: cap layer, side layer, tint/color, levels, highlight. Texture arrays (`sampler2DArray`), not 2D atlases.
- High samples tangent-space normals and ORM on solid caps and sides; fluids keep constant material values. If the combined PBR samplers exceed the device texture-unit limit, land uses the Medium diffuse look.
- Pointer events: `instanceId` -> hex -> `boardPieceUID`; hover/selected highlight is a per-instance attribute; drag, hover, select must match today's behavior.
- Fluids: separate transparent mesh (opacity 0.8, `HEXGRID_HEXCAP_FLUID_SCALE`).
- Unchanged for now: `NON_INSTANCED_SUBTERRAIN_PIECES`, castle, Laur and other GLB pieces. SVG/PDF and the registry ratchet test are unaffected.

## Phases
- Phase 0 (rendering): per-hex prisms, flat colors, side culling, picking/hover/drag parity, behind a dev switch.
- Phase 0A (assets, in parallel): pack script + packed outputs + manifest + side repairs.
- Phase 1: texture arrays + shader + manifest, diffuse only (Medium tier).
- Phase 2: PBR (High tier), tuning, per-terrain maps if needed.
- Phase 3: tier setting UI, lazy loading, defaults.
