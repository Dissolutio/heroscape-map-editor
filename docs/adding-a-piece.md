# How to add terrain to Hexoscape

Always show the set `name`, never its `abbreviation`, to users. This guide
follows the current implementation; the source and tests are authoritative when
behavior changes.

## End-to-end checklist

| Done | Step |
|---|---|
| [ ] | 1. Data: IDs, metadata, footprint, inventories/sets, interlocks |
| [ ] | 2. Placement: support, clearance, conflicts, and stacking |
| [ ] | 3. 3D: Low, Medium/High, or non-instanced GLB; preview and pointer |
| [ ] | 4. SVG/PDF: colors, shapes, letters, and buried marks |
| [ ] | 5. Textures: sources, config, pack, manifest, and guard tests |
| [ ] | 6. Edge/node declarations and their family sweep, when applicable |
| [ ] | 7. Focused/full tests, browser check, and applicable build checks |
| [ ] | 8. Release notes when preparing a user-facing release |

## 1. Register the piece and its data

`boardPieces` is the canonical list of placed pieces; `boardHexes` is derived
occupancy and surface data. A piece's `inventoryID`, placement altitude,
rotation, and cube-coordinate origin are saved. Do not register a cap or a
footprint hex as another placed piece.

1. Add a named ID to `Pieces` in [`src/types.ts`](../src/types.ts). Add a new
   `PiecePrefixes` value only for a new family, and a `HexTerrain` value only
   for a genuinely new terrain kind. IDs are part of saved/share data; do not
   rename existing ones.
2. Define the `Piece` in [`src/data/pieces.ts`](../src/data/pieces.ts), keyed by
   its ID. Set its terrain, size, template, height, land/obstacle flags, and
   applicable prefix, glyph, overlay, or inventory flags. Named glyph
   definitions are assembled from [`src/data/glyphs.ts`](../src/data/glyphs.ts).
3. Give it a template in `src/data/tileTemplates.ts`.
   The registry requires a template for every piece. For land, the template
   length must equal `size`; reuse a template only when its footprint is right.
   Add rotation transforms in `src/data/rotationTransforms.ts` if needed.
4. For obstacles with nonuniform support or clearance, keep their per-template
   arrays aligned in `src/data/vertical-obstruction-templates.ts`. Check
   `src/data/interlock-templates.ts` and `src/data/interlock-rotations.ts` for
   interlocking pieces.
5. Add countable pieces to `src/inventory/blankInventory.ts`, and actual counts
   to applicable set inventories in `src/data/inventories.ts`. Set records are
   exposed through `src/data/terrainSets.ts`. Uninventoried and overlay pieces
   are excluded from the countable-piece check.
6. Add the piece to `src/data/pieceGroups.ts` if it belongs in the placed-pieces
   grid. Add a menu entry or family handling to
   `src/controls/PenModeControls.tsx`; land size choices are derived from
   `landPrefix` and `size`. A new pen prefix needs the corresponding menu and
   filter handling.
7. Map a Virtualscape import code in `src/data/pieceCodes.ts` only if the
   original editor has one. This is not a requirement for every piece.

The registry guard in `src/__tests__/piece-registry.test.ts` checks IDs,
definitions, templates, inventories, sets, and groups. Unknown IDs are dropped
and warned about on load; they are not retained as hidden pieces.

## 2. Confirm placement and physical rules

Start with `resolvePlacement()` in `src/data/placement.ts` and `addPiece()` in
`src/data/addPiece.ts`. Reuse terrain classification and support helpers in
`src/utils/board-utils.ts` instead of introducing a competing rule. `addPiece()`
expands ordinary pieces through their template into `boardHexes`. Special
placement logic belongs in the resolver and must match the real click handler.

Check `src/data/interlock-templates.ts` and
`src/data/interlock-rotations.ts` for piece interlocks. For a new terrain kind,
update its solid/fluid classification and test support, stacking, conflicts,
map edges, and removal. Do not infer physical clearances from the rendered
model's bounds; verify them against the real piece.

Useful focused tests include `place-and-remove.test.ts`, `placement.test.ts`,
`click-placement.test.ts`, `replay-conflicts.test.ts`, and
`terrain-constraints.test.ts`. Add a case to
`src/__tests__/helpers/placementCases.ts` when the piece has a distinct click
rule. Do not pin a particular altitude for fluid-on-fluid stacking; that
behavior is being reworked on `dev`.

## 3. Wire the 3D renderer, preview, and interactions

`src/world/MapDisplay3D.tsx` chooses the land renderer by effective graphics
tier:

1. **Low uses the legacy land renderer.** Ordinary land uses
   `LandSubterrainInstanced` and `LandSubterrain`; caps use the existing cap
   renderers. Reuse this generic path when the terrain and size are supported.
2. **Medium and High use per-hex land.** The renderer builds a cap and sides per
   land hex with `LandHexInstanced.tsx` and `landHexInstances.ts`. Medium uses
   diffuse arrays; High adds PBR arrays. Add a new terrain's manifest mapping
   to `LAND_HEX_TEXTURE_TERRAIN_NAMES` when it has textures.
3. **Some pieces remain model-based.** Non-land pieces and special GLB terrain
   use `MapBoardPiece3D.tsx` and their model assets/dispatch. If a land
   subterrain must stay on the GLB path instead of per-hex land, register its
   piece ID in `NON_INSTANCED_SUBTERRAIN_PIECES` in
   `src/world/models/landHexInstances.ts`. Check `PiecePreview.tsx` and
   `LandPieceGhost.tsx` for matching preview behavior.

For a custom model, add the component/asset, dispatch, preview, and any
castle-specific `MapHex3D.tsx` dispatch. Check that the model and caps forward
pointer events for painting, hover, and selection; preserve hit-hex behavior.
Use `usePieceHoverState()` where appropriate. Compare placement, hover,
selection, and drag behavior in Low and per-hex modes.

## 4. Check SVG and PDF exports

Terrain colors live in `src/world/maphex/hexColors.ts` (`hexTerrainColor`,
`terrainCapColors`, and SVG colors). Add a custom symbol only when the piece
should look different from its terrain. SVG and PDF shape tables are separate:
`src/svg-map/SvgMapShapes.tsx` and `src/pdf-map/PdfMapShapes.tsx`; their board
piece and hex renderers are `SvgMapBoardPiece.tsx`, `PdfMapBoardPiece.tsx`,
`SvgMapHex.tsx`, and `PdfMapHex.tsx`. Reuse
`src/pdf-svg-shared/` for geometry shared by both exports.

If the terrain needs a letter, update `src/utils/tileLetters.ts` and check its
contrast in `generic-terrain-colors.test.ts`. PDF buried-mark positioning also
uses the terrain-letter advances in `src/pdf-map/pdfBuriedMarkPosition.ts`.
Buried marks are selected in `src/utils/tileMarks.ts` and rendered by the SVG
and PDF hex paths; test them with `tile-marks.test.ts` and
`pdf-buried-mark-position.test.ts`.

`export-border-color.test.ts` covers shared border decisions, representative
SVG markup, and rendered PDF output. It does not visually verify every shape
or the full renderer dispatch; inspect both exports when adding custom geometry.

## 5. Add terrain textures

The source images are under `textures/`; packing writes runtime strips and
`manifest.json` under `public/textures/`. To add a textured terrain:

1. Add cap and side diffuse source images under `textures/` (256×256 caps,
   128×32 sides). Do not edit existing sources.
2. Add the terrain to `terrainTextures` in
   `scripts/textures/terrain-textures.config.mjs`. Choose existing ORM and
   normal templates, provide `flatColor` when appropriate, set the fluid flag,
   and set `allowRandomRotation` intentionally.
3. Run `npm run textures:pack`, then `npm run textures:check`. The pack command
   generates the strips and manifest; the check command verifies the outputs.
   Do not hand-edit generated files. Run `npm test` for the
   `src/__tests__/textures-pack.test.ts` checks.
4. Check the packed layer indices and dimensions in
   `public/textures/manifest.json`.
   A layer is `-1` when absent; otherwise it must be below the layer count of
   its array. `textures-pack.test.ts` checks source existence, layer bounds,
   strip dimensions, side repairs, fluid normals, and generated-output drift.

Caps are 256×256 and sides are 128×32; side images are one face and one level
high. Side diffuse layers are deduplicated by source image. Keep the existing
packing and layer model rather than inventing a new atlas. The plan estimates
about 9.1 MiB of GPU memory for all mipmapped textures.

There is an unresolved rotation-policy disagreement: `docs/textures-plan.md`
says only Ice and ToxicWater allow random cap rotation, while the checked-in
texture config and `textures-pack.test.ts` currently require it for every
terrain with a cap diffuse image. Do not silently change this policy; confirm
the intended behavior before changing the flag or its test.

The per-hex land geometry has a 14 vertex-attribute-location budget. The
`keeps land geometry within the WebGL vertex-attribute budget` test in
`src/__tests__/land-hex-geometry.test.ts` guards it. Do not add vertex
attributes to the land shader; use an existing attribute or another supported
representation, and keep the budget test passing.

## 6. Declare port providers and edge or node features when applicable

For a port provider (Laur pillars provide ports) or an edge- or
node-positioned piece (Laur add-ons, battlements, road walls, rope ladders), add
its declaration to `src/data/hexGrid/pieceFeatures.ts`. Add its terrain family
to the sweep in `src/__tests__/piece-features.test.ts` if it introduces a new
family. `edges-and-nodes.test.ts` and `piece-features.test.ts` verify coordinate
conventions and adapter parity.

Laur placement, support, footprints and conflicts use the canonical typed edge
and node IDs; altitude stays separate from the ID. Other consumers
(battlements, road walls, ladders, drag and group transforms, rendering,
picking, exports and edge/node occupancy) have not moved yet, and non-Laur
declarations stay read-only. Keep the current boardPieces-only behavior for
Laur add-ons. Get owner agreement on feature identity, support/conflict rules,
and consumers before changing runtime behavior; see
[`docs/edges-and-nodes-design.md`](edges-and-nodes-design.md).

## 7. Run tests and check the app

Tests are primarily pure-logic tests; read
[`src/__tests__/README.md`](../src/__tests__/README.md) before adding one.
These guards should catch incomplete registration, texture mappings, or
geometry changes:

- `piece-registry.test.ts` identifies missing registry data. The
  `registry-lifecycle.test.ts` ratchet automatically exercises every registered
  piece through placement, removal, drag, rotation, undo, and JSON load. Add
  family-specific support in its `makeFixture` if required.
- `textures-pack.test.ts` catches missing texture sources/configuration,
  invalid manifest layers, incorrect strip dimensions/repairs, and output drift.
- `land-hex-geometry.test.ts` fails if cap, side, or fluid geometry exceeds the
  14-location vertex-attribute budget.

Known gaps use `it.fails` and titles beginning `KNOWN GAP:`. They pass while the
defect exists and go red when it is fixed; change such a test to `it` only when
fixing that defect. Never weaken a test to make the suite green.

Run focused checks while developing, then the full suite and build:

```sh
npm test -- src/__tests__/piece-registry.test.ts \
  src/__tests__/registry-lifecycle.test.ts \
  src/__tests__/textures-pack.test.ts \
  src/__tests__/land-hex-geometry.test.ts
npm test
npx tsc -b
npx @biomejs/biome lint ./src
npx @biomejs/biome format ./src
npm run build
```

For a browser check, read [`e2e/README.md`](../e2e/README.md). Open
`/hs?e2e=1` (not `/`), wait for `window.__APP_READY__ === true`, and use the
documented `window.__TEST__` helpers instead of guessed canvas coordinates.
Use `&perHexLand=1&graphicsTier=medium` or `high` to exercise per-hex tiers.
Evidence screenshots are temporary review aids; do not commit them.

## 8. Add release notes when preparing a release

User-facing release entries go in the root `release-notes.md`, not in this
guide. Use a unique date heading such as `Oct-29-2026`, then an optional `TLDR:`
line and one or more `- ` bullets. Keep the wording user-facing. The
`src/__tests__/release-notes-format.test.ts` checks valid headings, unique IDs,
and non-empty parsed entries. Do not edit release notes for a guide-only change.

## Worked example: a hypothetical one-hex solid terrain

Suppose the project approves a new solid terrain called Basalt with one piece,
`basalt1`. These names are illustrative; confirm the real ID and terrain naming
before using them. The Basalt image paths below are new files to create, not
assets already in this checkout.

1. In `src/types.ts`, add the approved `HexTerrain`, prefix, and `Pieces` ID.
   In `src/utils/board-utils.ts`, classify the new terrain as solid.
2. In `src/data/pieces.ts`, define the one-hex land piece with size `1`, height
   `1`, and template `'1'`. That template already exists in
   `src/data/tileTemplates.ts`, so do not edit it unless its footprint is
   actually wrong.
3. Add the count to `src/inventory/blankInventory.ts`, the approved set counts
   to `src/data/inventories.ts`, and its grid placement to
   `src/data/pieceGroups.ts`. Add its pen family/size handling in
   `src/controls/PenModeControls.tsx`. Add a Virtualscape mapping only if one
   exists.
4. Add its 3D cap/side colors in `src/world/maphex/hexColors.ts`. If this is a
   textured terrain, add `textures/caps/Basalt.png` and
   `textures/sides/BasaltSide.png`, map them in
   `scripts/textures/terrain-textures.config.mjs`, and add its `HexTerrain`
   mapping in `src/world/models/landHexInstances.ts`. No custom GLB or shape is
   needed when the generic solid-land paths and exports are correct.
5. Add an export letter in `src/utils/tileLetters.ts` only if the terrain needs
   one. Check SVG/PDF colors and buried marks; add custom shapes only if its
   export appearance differs from a normal terrain hex.
6. Run the registry, lifecycle, texture, and geometry tests shown above. Then
   run `npm run textures:pack` and `npm run textures:check` for texture changes,
   followed by `npm test`, `npx tsc -b`, the Biome checks, and `npm run build`.
7. Open a draft PR targeting `dev`. After review and the owner's go-ahead, merge
   to `dev`; do not merge directly to `main`. Add a release-note entry when
   preparing the user-facing release.

## Common mistakes

- **Wrong registration is only discovered later.** A `Pieces` constant without
  a definition, inventory count, set entry, group, or template is caught by the
  registry checks. The lifecycle ratchet also needs a family fixture when a
  piece requires special support.
- **Land shader attributes exceed the hardware budget.** The land geometry
  test counts geometry attributes plus the instanced matrix and color inputs.
  Keep the 14-location limit; do not add a vertex attribute to solve per-piece
  data needs.
- **Texture-array upload flags are not ordinary 2D texture flags.** WebGL
  rejects `flipY` and `premultiplyAlpha` for 3D texture uploads. Keep both
  false on `DataArrayTexture`; row orientation is handled while preparing the
  array data.
- **Evidence files leak into the change.** E2E screenshots are temporary review
  aids and should not be committed.
- **Biome lines grow past the project style.** Keep source lines within the
  project's 80-column limit and run the documented Biome checks.
- **A custom model swallows clicks.** Preserve pointer forwarding for paint,
  hover, selection, and drag; verify through the actual canvas path.
- **A correct 3D model is mistaken for a correct export.** SVG and PDF shapes
  are separate. Check both when adding a distinct symbol.
