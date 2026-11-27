# How to add terrain to Hexoscape

Always show the set `name`, never its `abbreviation`, to users. Follow this
checklist from registration through rendering and tests. Source and tests are
authoritative when behavior changes.

## End-to-end checklist

- [ ] [Register the piece, template, rotation and inventory](#1-register-the-piece)
- [ ] [Check placement, support, bases and cell conflicts](#2-check-placement-and-cells)
- [ ] [Add Virtualscape import/export support when available](#3-add-virtualscape-support)
- [ ] [Wire 3D models, graphics tiers and textures](#4-wire-the-3d-renderer)
- [ ] [Check SVG/PDF appearance and locked colors](#5-check-2d-exports)
- [ ] [Gate community content and inventory UI](#6-wire-inventory-and-community-content)
- [ ] [Add focused tests and check the app](#7-test-the-piece)

## 1. Register the piece

- [ ] Add a stable `Pieces` ID in [`src/types.ts`](../src/types.ts).
      Add a `PiecePrefixes` or `HexTerrain` value only for a new family or terrain.
- [ ] Define the piece in [`src/data/pieces.ts`](../src/data/pieces.ts):
      terrain, size, template, physical `height`, and applicable flags.
- [ ] Use `gameHeight` when printed rules height differs from physical height.
      Use `null` when the game defines no height.
- [ ] Add or reuse a footprint in
      [`src/data/tileTemplates.ts`](../src/data/tileTemplates.ts).
      Land template length must equal `size`; verify the actual footprint.
- [ ] Add rotation anchors in
      [`src/data/rotationTransforms.ts`](../src/data/rotationTransforms.ts)
      when the rotated footprint needs a different origin.
- [ ] Keep ordinary placement and Virtualscape anchors distinct:
      `getPieceTemplateCoords` applies a template rotation; `isVsTile` also applies
      the Virtualscape origin offset.
- [ ] Align support and clearance entries in
      [`src/data/vertical-obstruction-templates.ts`](../src/data/vertical-obstruction-templates.ts).
      Check [`src/data/interlock-templates.ts`](../src/data/interlock-templates.ts)
      and [`src/data/interlock-rotations.ts`](../src/data/interlock-rotations.ts)
      for interlocking pieces.
- [ ] Add countable pieces to
      [`src/inventory/blankInventory.ts`](../src/inventory/blankInventory.ts),
      set quantities to [`src/data/inventories.ts`](../src/data/inventories.ts),
      and set metadata in [`src/data/terrainSets.ts`](../src/data/terrainSets.ts).
- [ ] Add the piece to
      [`src/data/pieceGroups.ts`](../src/data/pieceGroups.ts) if it belongs in the
      placed-pieces grid. Add menu/filter handling in
      [`src/controls/PenModeControls.tsx`](../src/controls/PenModeControls.tsx)
      when existing derived choices do not cover it.
- [ ] For obstacle variants, use one `pieceSizeFamily` and unique,
      one-based `variantOrder` values with short `variantLabel`s.
- [ ] Run [`src/__tests__/piece-registry.test.ts`](../src/__tests__/piece-registry.test.ts)
      to catch missing IDs, definitions, templates, inventories, sets and groups.

## 2. Check placement and cells

- [ ] Start with [`src/data/placement.ts`](../src/data/placement.ts),
      [`src/data/addPiece.ts`](../src/data/addPiece.ts) and
      [`src/utils/board-utils.ts`](../src/utils/board-utils.ts).
      Keep previews, clicks and map loading consistent.
- [ ] Verify physical support, clearance, stacking, conflicts, map edges and
      removal against the real piece. Do not infer clearances from model bounds.
- [ ] For a seated obstacle, add its rule to
      [`src/data/seatedObstacles.ts`](../src/data/seatedObstacles.ts):
      `built-in` or `separate` base, allowed base IDs, footprint and default.
- [ ] Base footprints are `six-hex`, `same-size` or `one-per-hex`.
      Built-in bases are represented by the obstacle; separate bases are board
      pieces that are grouped, moved and removed with it.
- [ ] Check era-dependent rules against `setsUsed`. For example, Rock Outcrop
      3 uses a same-size built-in Shadow base for classic-only sets; otherwise it
      uses one base per footprint hex. Community sets do not make a map
      contemporary.
- [ ] Count built-in base use through
      [`src/inventory/laurInventoryReconcile.ts`](../src/inventory/laurInventoryReconcile.ts);
      do not add duplicate base pieces to the map. Separate bases remain inventory
      pieces and must be represented in the set counts.
- [ ] For an edge/node or footprint piece, add a declaration in
      [`src/data/hexGrid/pieceFeatures.ts`](../src/data/hexGrid/pieceFeatures.ts)
      and a model-derived footprint in
      [`src/data/hexGrid/pieceFootprints.ts`](../src/data/hexGrid/pieceFootprints.ts).
- [ ] [`src/data/hexGrid/pieceCells.ts`](../src/data/hexGrid/pieceCells.ts)
      resolves rotated hex, edge and node cells with level ranges. Conflicts occur
      when pieces fill the same cell at overlapping levels.
- [ ] Default pieces still own their written hexes; `hex-center` pieces avoid
      edges/nodes; walls fill only their declared edge/node cells; ships expose
      their hull footprint against walls.
- [ ] Add coverage in
      [`src/__tests__/edge-node-cells.test.ts`](../src/__tests__/edge-node-cells.test.ts)
      and [`src/__tests__/store-edge-node-walls.test.ts`](../src/__tests__/store-edge-node-walls.test.ts).
      Inspect the debug cells overlay with `?cells=1`.
- [ ] For port providers or add-ons, also check
      [`src/data/portPieces.ts`](../src/data/portPieces.ts),
      [`src/data/hexGrid/pieceFeatures.ts`](../src/data/hexGrid/pieceFeatures.ts)
      and [`docs/edges-and-nodes-design.md`](edges-and-nodes-design.md).

## 3. Add Virtualscape support

- [ ] Add a numeric import code to
      [`src/data/pieceCodes.ts`](../src/data/pieceCodes.ts) only if the original
      editor has one. Named `28xxx` records carry a CString name after RGBA and
      use `virtualscapeNamedPieceCodes` in the same file.
- [ ] Check import parsing and coordinate conversion in
      [`src/data/readVirtualscapeMapFile.ts`](../src/data/readVirtualscapeMapFile.ts)
      and [`src/data/buildupMap.ts`](../src/data/buildupMap.ts).
      Virtualscape positions are odd-r; rotations and altitude can need conversion.
- [ ] For a new or irregular footprint, measure a template map in Virtualscape:
      place lava on the recorded/clicked hex and water on every other footprint
      hex. Import it at each rotation and compare the water hexes to the template.
- [ ] Store the import anchor/rotation correction in
      [`src/data/rotationTransforms.ts`](../src/data/rotationTransforms.ts) and
      [`src/data/readVirtualscapeMapFile.ts`](../src/data/readVirtualscapeMapFile.ts)
      where needed. Keep the export inverse in
      [`src/data/writeVirtualscapeMapFile.ts`](../src/data/writeVirtualscapeMapFile.ts)
      and its rotation helpers in sync.
- [ ] Add import and export cases to
      [`src/__tests__/virtualscape-import.test.ts`](../src/__tests__/virtualscape-import.test.ts)
      and [`src/__tests__/virtualscape-export.test.ts`](../src/__tests__/virtualscape-export.test.ts).
      Round-trip origin, rotation, altitude, bases and linked add-ons where relevant.
- [ ] Keep fixture-backed metadata in
      [`src/data/virtualscapeTileMetadata.ts`](../src/data/virtualscapeTileMetadata.ts)
      aligned with the Virtualscape fixture files.

## 4. Wire the 3D renderer

- [ ] Check the effective tier in
      [`src/world/MapDisplay3D.tsx`](../src/world/MapDisplay3D.tsx):
      Low uses legacy land; Medium/High use per-hex land.
- [ ] Reuse [`src/world/models/LandSubterrain.tsx`](../src/world/models/LandSubterrain.tsx)
      for supported Low-tier land and
      [`src/world/models/landHexInstances.ts`](../src/world/models/landHexInstances.ts)
      for per-hex land. Medium loads diffuse arrays; High adds PBR arrays.
- [ ] For non-land or special GLB pieces, add the asset under `public/`, wire
      dispatch in [`src/world/MapBoardPiece3D.tsx`](../src/world/MapBoardPiece3D.tsx),
      and update previews, picking and pointer forwarding.
- [ ] Apply object transforms in Blender before export when the component uses
      mesh geometry directly. Preserve names consumed by the component; pylon
      beams are identified by `beam` in the mesh or material name.
- [ ] Load GLBs through
      [`src/world/models/useDisposableGLTF.ts`](../src/world/models/useDisposableGLTF.ts).
      It reference-counts cached assets and disposes owned geometry, skeletons and
      textures; do not dispose shared materials.
- [ ] Check bounds, ground alignment, mesh names, UVs and embedded textures with
      the focused GLB tests under [`src/__tests__/`](../src/__tests__/README.md).
- [ ] For terrain textures, add source images under `textures/` (256×256 caps,
      128×32 sides), configure
      [`scripts/textures/terrain-textures.config.mjs`](../scripts/textures/terrain-textures.config.mjs),
      then run `npm run textures:pack` and `npm run textures:check`.
- [ ] Add the `HexTerrain` manifest mapping in
      `src/world/models/landHexInstances.ts`. Do not hand-edit generated files in
      `public/textures/`; verify mappings with
      [`src/__tests__/textures-pack.test.ts`](../src/__tests__/textures-pack.test.ts).
- [ ] Preserve the 14 vertex-attribute limit in
      [`src/__tests__/land-hex-geometry.test.ts`](../src/__tests__/land-hex-geometry.test.ts).
- [ ] Compare placement, hover, selection and drag in Low and per-hex modes.
      Preserve `usePieceHoverState()` and hit-hex behavior where applicable.

## 5. Check 2D exports

- [ ] Add terrain colors in
      [`src/world/maphex/hexColors.ts`](../src/world/maphex/hexColors.ts) and
      shared border decisions in
      [`src/pdf-svg-shared/exportBorderColor.ts`](../src/pdf-svg-shared/exportBorderColor.ts).
- [ ] SVG and PDF shapes are separate:
      [`src/svg-map/SvgMapShapes.tsx`](../src/svg-map/SvgMapShapes.tsx) and
      [`src/pdf-map/PdfMapShapes.tsx`](../src/pdf-map/PdfMapShapes.tsx).
      Reuse [`src/pdf-svg-shared/`](../src/pdf-svg-shared/) for shared geometry.
- [ ] Add a letter in [`src/utils/tileLetters.ts`](../src/utils/tileLetters.ts)
      only when needed. Check contrast and buried marks in
      [`src/utils/tileMarks.ts`](../src/utils/tileMarks.ts) and the related tests.
- [ ] Add or update piece-key shapes and descriptions in
      [`src/pdf-svg-shared/pieceKey.ts`](../src/pdf-svg-shared/pieceKey.ts) when
      the piece needs a legend symbol.
- [ ] Inspect both SVG and PDF when adding custom geometry.
      [`src/__tests__/export-border-color.test.ts`](../src/__tests__/export-border-color.test.ts)
      covers shared borders and representative rendered output.
- [ ] Add the new piece's expected lines to
      [`src/__tests__/__snapshots__/export-colors-lock.test.ts.snap`](../src/__tests__/__snapshots__/export-colors-lock.test.ts.snap).
      Never change existing export colors without approval.

## 6. Wire inventory and community content

- [ ] Add the owned count to
      [`src/inventory/blankInventory.ts`](../src/inventory/blankInventory.ts) and
      box counts to [`src/data/inventories.ts`](../src/data/inventories.ts).
      Exclude only genuinely uninventoried or overlay pieces.
- [ ] Set the set's `era` and `setType` in
      [`src/data/terrainSets.ts`](../src/data/terrainSets.ts). Community sets use
      era `community` and appear in the Community category in
      [`src/controls/InventoryForm.tsx`](../src/controls/InventoryForm.tsx) and
      [`src/layout/InputSetsUsedCard.tsx`](../src/layout/InputSetsUsedCard.tsx).
- [ ] Mark a community set `isVC: true`. Use
      [`src/data/vcContent.ts`](../src/data/vcContent.ts) helpers so
      `includeVCContent` gates pieces and sets in menus, groups, inventory,
      Sets to Build and Adapt. The Void Marker is VC but is not in set inventory.
- [ ] Keep Community separate from classic/contemporary era logic; do not
      classify it as either.
- [ ] Test VC availability and map loading in
      [`src/__tests__/void-and-pylons.test.ts`](../src/__tests__/void-and-pylons.test.ts)
      and [`src/__tests__/vc-map-load.test.ts`](../src/__tests__/vc-map-load.test.ts).
- [ ] Check the collection inventory in
      [`src/inventory/ViewMapInventoryDialog.tsx`](../src/inventory/ViewMapInventoryDialog.tsx),
      set recommendations in
      [`src/inventory/SetsToBuildMapDialog.tsx`](../src/inventory/SetsToBuildMapDialog.tsx)
      and substitutions in
      [`src/controls/AdaptToCollectionDialog.tsx`](../src/controls/AdaptToCollectionDialog.tsx).
- [ ] Add or extend focused tests in
      [`src/__tests__/sets-to-build-map.test.ts`](../src/__tests__/sets-to-build-map.test.ts)
      and [`src/__tests__/adapt-to-collection.test.ts`](../src/__tests__/adapt-to-collection.test.ts).

## 7. Test the piece

- [ ] Read [`src/__tests__/README.md`](../src/__tests__/README.md).
      Tests characterize pure behavior; use existing board helpers instead of
      mutating `boardHexes` directly.
- [ ] Add focused cases for registration, placement/removal, conflicts,
      support, rotation, inventory and serialization as applicable.
      See [`src/__tests__/place-and-remove.test.ts`](../src/__tests__/place-and-remove.test.ts),
      [`src/__tests__/replay-conflicts.test.ts`](../src/__tests__/replay-conflicts.test.ts)
      and [`src/__tests__/terrain-constraints.test.ts`](../src/__tests__/terrain-constraints.test.ts).
- [ ] A known defect uses `it.fails` and a title starting `KNOWN GAP:`.
      It passes while the defect exists and goes red when fixed; change it to `it`
      only while fixing that defect. Never weaken a test to get green.
- [ ] Run focused tests, then the full suite and checks:

  ```sh
  npm test -- src/__tests__/piece-registry.test.ts \
    src/__tests__/registry-lifecycle.test.ts
  npm test
  npx tsc -b
  npx @biomejs/biome lint ./src
  npx @biomejs/biome format ./src
  npm run build
  ```

- [ ] For browser coverage, read
      [`e2e/README.md`](../e2e/README.md) and add a focused Playwright case when
      behavior needs the real UI or canvas.
- [ ] Open `/hs?e2e=1`, wait for `window.__APP_READY__ === true`, read state
      from `window.__TEST__.snapshot()` and click using bridge positions, not
      guessed canvas coordinates.
- [ ] Check graphics tiers with
      `&perHexLand=1&graphicsTier=medium` or `high`. The canvas is not visible to
      accessibility snapshots; use the bridge and status element.
- [ ] The bridge is for setup and read-only state; drive real UI actions for
      the behavior under test. E2E screenshots are opt-in and should not be
      committed by default.
