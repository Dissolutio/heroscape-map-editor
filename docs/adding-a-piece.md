# How to add a new piece (terrain) to Hexoscape

Always show set `name`, never `abbreviation`, to users.

This guide follows the current `dev` implementation. The registration tests
are the executable checklist: read
[`src/__tests__/README.md`](../src/__tests__/README.md) before changing code.
The browser hooks are documented in [`e2e/README.md`](../e2e/README.md).

## 1. Data model in one page

`MapFileState` in [`src/types.ts`](../src/types.ts) stores map metadata and
`boardPieces`. `MapState` adds `boardHexes` at runtime. A placed
`BoardPiece` is the canonical piece instance: its `uid`, `inventoryID`,
placement `altitude`, `rotation`, and cube-coordinate `pieceCoords` identify
what was placed and where. `boardHexes` is the derived occupancy/surface grid
used by placement, conflicts, and rendering; `addPiece()` expands a piece
through its template, and `buildupJsonFileMap()` rebuilds that grid while
loading. Do not add a tile cap or a footprint hex as a separate placed piece.

An encoded piece ID has this shape:

```text
altitude~q~r~rotation~inventoryID
```

`genBoardHexID()` makes the `altitude~q~r` prefix, `genPieceID()` appends the
rotation and inventory ID, and `encodeBoardPiecesToIds()` uses that encoding
for share data. For example, a grass piece at the origin can be encoded as
`0~0~0~0~g1`. The `uid` is deliberately separate from this compact ID: it
links a runtime piece to its `boardHexes` and selection/conflict state, and
`addPiece()` creates one with `nanoid(10)` when none is supplied.
`inflateBoardPiecesFromIds()` generates a fresh uid when expanding share or
legacy encoded IDs, so do not depend on a uid surviving a share-link round
trip. JSON `BoardPiece` entries with a unique uid are kept by normalization;
missing or duplicate uids are regenerated.

On load, `dropUnknownBoardPieces()` removes instances whose `inventoryID` is
not in `piecesSoFar`. `buildupJsonFileMap()` returns them in `droppedPieces`,
and `warnAboutLoadedMap()` shows one warning. File, local-map, and share-link
loaders call that warning path. Register the definition before expecting a
piece to load; unknown IDs are not retained as hidden pieces.

One existing exception is important to preserve: pieces whose terrain is
`laurWallAddon` take the Laur branch in `addPiece()`, which records only the
`BoardPiece`. They have no `boardHexes` expansion and render from
`boardPieces` in `MapBoardPiece3D`. Pen placement uses a world-hit resolver;
conflict evaluation uses the read-only data in
[`src/data/laurAddonFootprints.ts`](../src/data/laurAddonFootprints.ts) for all
eight registered Laur add-ons. The feature adapter in
[`src/data/hexGrid/pieceFeatures.ts`](../src/data/hexGrid/pieceFeatures.ts)
exposes those ends and blocked hexes as hex IDs; it does not change placement
or occupancy.

## 2. Registration checklist, in order

Start with an existing piece in the same family and copy its data shape. A
small land piece is a good starting point; the worked example below follows
`g1`.

1. **Give the piece an ID.** Add a prefix to `PiecePrefixes` only for a new
   family, and add a named ID to `Pieces` in
   [`src/types.ts`](../src/types.ts). If the piece introduces a genuinely new
   terrain kind, add it to `HexTerrain` too. Inventory IDs are compact and are
   part of serialized/share data, so do not casually rename an existing ID.
2. **Define its metadata.** Add the `Piece` entry to
   [`src/data/pieces.ts`](../src/data/pieces.ts), keyed by its own ID. Set
   `terrain`, `size`, `template`, `height`, `isHexTerrainPiece`,
   `isObstaclePiece`, and any applicable `landPrefix`, `glyphLetter`,
   `isOverlayPiece`, or `isUninventoried` fields. Named glyph definitions are
   assembled from the glyph arrays in [`src/data/glyphs.ts`](../src/data/glyphs.ts)
   when `piecesSoFar` is built.
3. **Give it the right footprint.** `Piece.template` must resolve in
   [`src/data/tileTemplates.ts`](../src/data/tileTemplates.ts); the registry
   test requires a template for every piece, including pieces that do not
   write grid cells. For land, the template's number of coordinates must equal
   `size`. Reuse an existing template only if its footprint is correct.
   Add rotation-specific origin transforms to
   [`src/data/rotationTransforms.ts`](../src/data/rotationTransforms.ts) when
   the piece needs them. For an obstacle whose footprint cells have different
   clearances or support requirements, keep per-template-index arrays aligned
   with that template in
   [`src/data/vertical-obstruction-templates.ts`](../src/data/vertical-obstruction-templates.ts).
   That file also defines open-base and vertical-support templates. Check
   [`src/data/interlock-templates.ts`](../src/data/interlock-templates.ts) and
   [`src/data/interlock-rotations.ts`](../src/data/interlock-rotations.ts)
   when the piece uses interlocking geometry.
4. **Register availability and menu behavior.**
   - Add a countable piece to
     [`src/inventory/blankInventory.ts`](../src/inventory/blankInventory.ts).
     The registry excludes `isOverlayPiece` and `isUninventoried` entries
     from that countable-piece check.
   - Add real counts to the applicable set records in
     [`src/data/inventories.ts`](../src/data/inventories.ts); those records are
     exposed by [`src/data/terrainSets.ts`](../src/data/terrainSets.ts).
     Otherwise the piece can be absent from a set-constrained inventory even
     though it has a definition.
   - Add a selectable family or individual obstacle to the static menu in
     [`src/controls/PenModeControls.tsx`](../src/controls/PenModeControls.tsx).
     A land size is derived from `landPrefix` and `size` by
     `getNewPieceSizeForPenMode()` in
     [`src/data/flatPieceSizes.ts`](../src/data/flatPieceSizes.ts), then shown
     by [`src/controls/PieceSizeSelect.tsx`](../src/controls/PieceSizeSelect.tsx).
     A new pen-mode prefix also needs its menu/filter handling in
     `PenModeControls`; add a hotkey only if the family is meant to have one.
   - Add the ID to a group in
     [`src/data/pieceGroups.ts`](../src/data/pieceGroups.ts) when it should
     have an explicit position in the placed-pieces grid. This file is used
     to order rows in `PiecesGridDialog()`; it is not the pen-mode menu.
     Glyphs and start zones are currently commented out as a group there.
5. **Wire the 3D piece, its preview, and its interactions.**
   - Ordinary land uses the generic instanced path:
     `getLandSubterrainInstanceData()` in
     [`src/world/models/LandSubterrainInstanced.tsx`](../src/world/models/LandSubterrainInstanced.tsx)
     and size-specific geometry/materials in
     [`src/world/models/LandSubterrain.tsx`](../src/world/models/LandSubterrain.tsx).
     `MapDisplay3D()` feeds that path. Its caps are rendered by
     [`src/world/maphex/instance/SolidCaps.tsx`](../src/world/maphex/instance/SolidCaps.tsx)
     or [`src/world/maphex/instance/FluidCap.tsx`](../src/world/maphex/instance/FluidCap.tsx).
     `PiecePreview()` has a generic land-size preview as well. If the piece
     reuses an existing terrain and supported subterrain size, no new
     per-piece model branch is needed.
   - A piece-specific 3D model needs its model component and asset (assets
     live under [`public/`](../public/)), a dispatch in
     [`src/world/MapBoardPiece3D.tsx`](../src/world/MapBoardPiece3D.tsx), and
     the corresponding ghost/model branch in
     [`src/world/PiecePreview.tsx`](../src/world/PiecePreview.tsx). Castle
     base/wall/arch hexes also have dedicated dispatch in
     [`src/world/maphex/MapHex3D.tsx`](../src/world/maphex/MapHex3D.tsx).
   - Check the complete pointer path. `MapDisplay3D()` handles left-click
     painting; caps and piece models must pass the hit `BoardHex` to
     `onPointerUpPaintPiece` where applicable. Hover/selection uses
     `usePieceHoverState()` in
     [`src/hooks/usePieceHoverState.tsx`](../src/hooks/usePieceHoverState.tsx);
     for example, `LandSubterrain` and `GlyphModel` bind pointer events and
     select by uid. A new model that visually covers a placement surface must
     not accidentally swallow the events needed to place or select pieces.
6. **Check placement and occupancy semantics.** `resolvePlacement()` in
   [`src/data/placement.ts`](../src/data/placement.ts) resolves the click
   target, altitude, and rotation. `addPiece()` in
   [`src/data/addPiece.ts`](../src/data/addPiece.ts) writes the piece's
   footprint, support, and clearance into `boardHexes` (except for its
   explicit boardPieces-only branches, including Laur add-ons). Use
   [`src/utils/board-utils.ts`](../src/utils/board-utils.ts) for terrain
   classification and land support rules rather than adding a second
   conflicting rule. Add special placement logic only when the intended
   behavior is not already covered by the generic land or obstacle path.
   Multi-piece drag evaluation additionally blocks members below altitude 0
   or whose top, including vertical-obstruction clearance, exceeds
   `HEXGRID_MAX_ALTITUDE`; this check is opt-in so click/pen placement retains
   its existing behavior.
7. **Cover the 2D and export views when the piece needs a distinct shape.**
   `SvgMapDisplay()` draws grid hexes through
   [`src/svg-map/SvgMapHex.tsx`](../src/svg-map/SvgMapHex.tsx) and piece-specific
   shapes through `SvgMapBoardPiece()` /
   [`src/svg-map/SvgMapBoardPiece.tsx`](../src/svg-map/SvgMapBoardPiece.tsx)
   and [`src/svg-map/SvgMapShapes.tsx`](../src/svg-map/SvgMapShapes.tsx).
   The PDF path has corresponding `PdfMapHex()`,
   [`src/pdf-map/PdfMapBoardPiece.tsx`](../src/pdf-map/PdfMapBoardPiece.tsx),
   and [`src/pdf-map/PdfMapShapes.tsx`](../src/pdf-map/PdfMapShapes.tsx);
   shared PDF/SVG geometry belongs in
   [`src/pdf-svg-shared/`](../src/pdf-svg-shared/). SVG download is wired by
   [`src/svg-map/exportSvg.ts`](../src/svg-map/exportSvg.ts), and PDF download
   by [`src/pdf-map/ReactPdfDownloadLink.tsx`](../src/pdf-map/ReactPdfDownloadLink.tsx).
   Ordinary land is represented by its hex terrain; add explicit shapes only
   if the new piece should be visible as more than that. The current tests do
   not visually test SVG/PDF output.
8. **Keep import and share loading compatible.**
   [`src/data/jsonCrush.ts`](../src/data/jsonCrush.ts) encodes
   `boardPieces` through `encodeBoardPiecesToIds()`; it does not serialize
   `boardHexes`. `buildupJsonFileMap()` in
   [`src/data/buildupMap.ts`](../src/data/buildupMap.ts) looks up each ID in
   `piecesSoFar` and rebuilds the grid. The file, URL, and local-map paths
   include [`src/layout/LoadFileHiddenInputs.tsx`](../src/layout/LoadFileHiddenInputs.tsx),
   [`src/layout/LoadMapFromUrlDialog.tsx`](../src/layout/LoadMapFromUrlDialog.tsx),
   and [`src/hooks/useAutoLoadMapFile.tsx`](../src/hooks/useAutoLoadMapFile.tsx).
   No special share-link registry is needed beyond a valid piece definition.
   If old Virtualscape files have a code for the piece, map it in
   [`src/data/pieceCodes.ts`](../src/data/pieceCodes.ts); it is an import
   code-to-piece map, not a requirement that every piece have such a code.
   `readVirtualscapeMapFile()` consumes that mapping.

There is no separate per-piece thumbnail registry in the inventory dialog:
`PiecesGridDialog()` builds rows from placed pieces, while the 3D placement
ghost is `PiecePreview()`. A new family may still require new visuals in the
render/export paths above.

## 3. Piece family changes the work

| Kind | Additional work to check |
| --- | --- |
| Plain land tile | `isHexTerrainPiece`, `landPrefix`, terrain, size, and matching template. Reuse the generic subterrain and caps where possible. For a new terrain kind, update `HexTerrain`, solid/fluid classification, terrain/cap colors, and SVG/PDF terrain colors. |
| Obstacle | Set the obstacle metadata and physical footprint/height. Add per-cell clearance/support/open-base data only when the model requires it. Add the model dispatch, preview, and pointer behavior; test the support and conflict story. |
| Glyph | Use the right power/treasure glyph definition in `data/glyphs.ts`; named entries are converted to `Piece` definitions. `GlyphModel`/`GlyphModelPreview` use the shared glyph asset and the piece terrain for color. `addPiece()` requires glyph support from land, not bare table. `PenModeControls` separately lists named glyphs. |
| Castle or wall | Distinguish a land-like wall walk from castle bases, walls, arches, battlements, and ladders. Those have explicit 3D dispatch and click rules; castle wall/arch tops use special placement handling. Test the exact family case, not just generic obstacle placement. |
| Fluid tile | Classify it with the fluid terrains in `isFluidTerrainHex()`. The placement increment, fluid cap rendering, and loaded-map stack warning are separate concerns; test them without assuming a stable altitude for fluid-on-fluid stacks. |
| Edge/node feature | Add a declaration to [`src/data/hexGrid/pieceFeatures.ts`](../src/data/hexGrid/pieceFeatures.ts) for Laur pillars and add-ons, battlements, road walls, rope ladders, or any new edge/node-positioned piece; update the terrain-family sweep in [`src/__tests__/piece-features.test.ts`](../src/__tests__/piece-features.test.ts) if it uses a new terrain. Keep the adapter read-only: there is no first-class edge/node occupancy model today. Do not change the existing `laurWallAddon` boardPieces-only behavior. **Needs owner input:** agree on identity, occupancy/conflict, click/hover, and export rules before behavior changes. |
| Generic terrain | Use stable `gn*` solid and `gf*` fluid IDs. Generic pieces are unlimited and stay out of finite inventories and terrain-set records. Their four colors are device settings, not map data or share-link data; do not add Virtualscape codes. |

For new obstacle dimensions, **Needs owner input:** confirm the physical support
and clearance values against the actual piece. The current occupancy engine is
an approximation, and comments in `addPiece.ts` still mark some support rules
as TODO; do not infer exact collision behavior from the rendered mesh bounds.

## 4. Tests to run and add

Run `npm test`. The most relevant existing tests are:

| Test | What it catches |
| --- | --- |
| [`src/__tests__/piece-registry.test.ts`](../src/__tests__/piece-registry.test.ts) | The `Pieces`/`piecesSoFar` ID mapping, definition keys, blank inventory, Virtualscape code targets, boxed-set inventory IDs/counts, piece-grid groups, land size versus template length, duplicate `(terrain, size)` land definitions, and a template for every piece. It does not test model dispatch, previews, or pen-menu wiring. |
| [`src/__tests__/place-and-remove.test.ts`](../src/__tests__/place-and-remove.test.ts) | Places registered pieces at supported rotations and removes them; also covers strict placement stories. A missing template or unsupported piece branch tends to fail here. |
| [`src/__tests__/terrain-constraints.test.ts`](../src/__tests__/terrain-constraints.test.ts) | Inventory normalization, set/personal/file constraints, and which land sizes are available from an inventory. |
| [`src/__tests__/placement.test.ts`](../src/__tests__/placement.test.ts) | `resolvePlacement()`, placement blocking/evaluation, map-edge footprint sweeps, and parity with the shared placement cases. |
| [`src/__tests__/click-placement.test.ts`](../src/__tests__/click-placement.test.ts) and [`src/__tests__/helpers/placementCases.ts`](../src/__tests__/helpers/placementCases.ts) | The real click handler, placement by family, refusals/messages, conflicts, permissive Laur add-on placement, and undo. Add a case here when a new piece needs a distinct click rule. |
| [`src/__tests__/placement-preview.test.ts`](../src/__tests__/placement-preview.test.ts) | Preview placement status/reason and preview styles; it does not render or screenshot the actual 3D model. |
| [`src/__tests__/replay-conflicts.test.ts`](../src/__tests__/replay-conflicts.test.ts) | Conflict ownership and rebuild behavior when pieces overlap or are removed. |
| [`src/__tests__/piece-ids-and-loading.test.ts`](../src/__tests__/piece-ids-and-loading.test.ts) | Encoded-ID round trips, uid regeneration/normalization, malformed/unknown pieces, and the `buildupJsonFileMap()` load path. |
| [`src/__tests__/fluid-stacks.test.ts`](../src/__tests__/fluid-stacks.test.ts) | Current fluid-run counting and loaded-map warning behavior. It is not a reason to freeze a particular fluid-on-fluid placement altitude. |
| [`src/__tests__/edges-and-nodes.test.ts`](../src/__tests__/edges-and-nodes.test.ts), [`src/__tests__/piece-features.test.ts`](../src/__tests__/piece-features.test.ts), and [`src/__tests__/laur-addon-footprints.test.ts`](../src/__tests__/laur-addon-footprints.test.ts) | Current edge/node coordinate facts and acceptance TODOs; registry declaration coverage and adapter parity for every legal rotation; all eight owner-specified Laur add-on footprints and registered heights. |
| [`src/__tests__/laur-addon-placement.test.ts`](../src/__tests__/laur-addon-placement.test.ts) | Laur side/vertex picking, canonical identity, allowed rotations, center tie-break, and non-mutation. |
| [`src/__tests__/laur-addon-conflicts.test.ts`](../src/__tests__/laur-addon-conflicts.test.ts) | Derived Laur edge/footprint conflict detection and the empty support-table seam. |

There is no separate active exception-ratchet suite. The test README says the
old Laur-without-template exception is now empty; the registry test currently
requires every piece to have a template. That is a guard, not permission to
add a new exception.

Add at least one focused test for the new piece's distinguishing behavior.
For a plain land piece, assert the expected rotated footprint and a
place/remove round trip through the helpers in
[`src/__tests__/helpers/board.ts`](../src/__tests__/helpers/board.ts). For a
special placement rule, add the story to `placementCases.ts` so both the
resolver and click-handler tests exercise it. Add serialization assertions if
the piece has a special encoded ID. A model or PDF/SVG change still needs a browser/manual output check: focused
tests cover shared export colors and minimal output, but not the full renderer
dispatch or visual appearance.

`it.fails` tests titled `KNOWN GAP: ...` are intentional: they pass while a
known defect exists and turn red when that defect is fixed. When fixing that
defect, change `it.fails` to `it` and retain the assertion as a regression
test. Never flip or weaken a gap to make the suite green; report an unexpected
red test instead.

## 5. Check the piece in the browser

Use the hooks described in [`e2e/README.md`](../e2e/README.md):

1. Open `/hs?e2e=1` (not `/`) and wait for
   `window.__APP_READY__ === true`; do not substitute a fixed sleep.
2. Read `window.__TEST__.snapshot()` and
   `[data-testid="app-status"]` for the ready state and piece count.
   `window.__TEST__.listPieces()` reports `inventoryID`, coordinates,
   altitude, rotation, and uid. Find the piece by `inventoryID` and
   coordinates, not by uid across reloads.
3. Drive the actual pen menu and canvas. Use
   `window.__TEST__.screenPosOfPiece(uid)` or
   `window.__TEST__.screenPosOfHex(...)` through the helpers in
   `e2e/fixtures.ts`; never click guessed canvas coordinates. For a preview,
   inspect `snapshot().placementPreview` after moving over a projected hex.
4. Add or update an e2e case under `e2e/` if the new interaction cannot be
   covered by the pure-logic tests. The bridge is otherwise read-only; use
   its camera and setup-only `setPen` helpers only as documented.

## 6. Worked example: one-hex grass (`g1`)

1. `PiecePrefixes.grass` is `g`, and `Pieces.grass1` is `g1` in
   [`src/types.ts`](../src/types.ts).
2. [`src/data/pieces.ts`](../src/data/pieces.ts) defines `piecesSoFar.g1` as
   solid grass, size 1, template `'1'`, height 1, with `landPrefix: 'g'`.
   [`src/data/tileTemplates.ts`](../src/data/tileTemplates.ts) maps `'1'` to
   the one-coordinate `basic1` footprint.
3. [`src/inventory/blankInventory.ts`](../src/inventory/blankInventory.ts)
   gives it a zero baseline count. Set inventories such as
   `landsPieceSet` and `aoa1PieceSet` in
   [`src/data/inventories.ts`](../src/data/inventories.ts) provide actual
   counts. `pieceGroups.ts` puts it in Grass ordering, and
   `PenModeControls.tsx` exposes the Grass prefix; the selected size resolves
   to `g1`.
4. `getLandSubterrainInstanceData()` and `LandSubterrain` render it through
   the generic 1-hex subterrain; `SolidCaps` renders the surface cap.
   `PiecePreview()` uses the generic 1-hex preview. No per-piece 3D model
   branch is needed.
5. `MapDisplay3D.onPointerUpPaintPiece()` passes the clicked hex to
   `resolvePlacement()`. The solid-land rule accepts an empty/table or solid
   target (with the fluid-specific restrictions handled separately), then
   `addPiece()` uses template `'1'` to add the `BoardPiece` and its derived
   grid cells. `LandSubterrain` and the cap's hover hooks handle selection.
6. `pieceCodes.ts` maps Virtualscape code `1001` to `g1`. A share link stores
   the compact ID (`altitude~q~r~rotation~g1`); loading looks up `g1` in
   `piecesSoFar` and reconstructs the grid. SVG/PDF show its terrain through
   the generic hex renderers, not a custom land-piece symbol.

## 7. Dry run and common mistakes

The guide was dry-run on a temporary local branch from `dev` with a trivial
`grass4` definition that reused template `'4'`. The temporary branch was
discarded without a commit. The five source files it actually required were:

- [`src/types.ts`](../src/types.ts)
- [`src/data/pieces.ts`](../src/data/pieces.ts)
- [`src/inventory/blankInventory.ts`](../src/inventory/blankInventory.ts)
- [`src/data/pieceGroups.ts`](../src/data/pieceGroups.ts)
- [`src/data/inventories.ts`](../src/data/inventories.ts)

The first check, after adding only the `Pieces.grass4` constant, failed exactly
at `piece-registry.test.ts > every Pieces constant has a definition in
piecesSoFar`. After adding the definition, blank count, Grass group, and a set
count, `piece-registry.test.ts`, `place-and-remove.test.ts`, and
`terrain-constraints.test.ts` passed (184 passed, 6 expected failures in that
targeted run). No template, model, preview, placement, Virtualscape-code, or
export file needed editing: template `'4'`, generic 4-hex land rendering, and
the existing Grass pen mode already covered the fake piece. The dry run did
not create a product piece and changed no file on this documentation branch.

Common late catches:

- A `Pieces` constant without a matching definition fails the first registry
  guard; a missing template can throw in the placement/rotation path.
- A land template with the wrong number of coordinates, or a second land
  definition with the same `(terrain, size)`, fails the registry checks.
- Adding only to `blankPieceInventory` does not give a piece a real count in
  any set. Adding it to `pieceGroups` does not add a pen-mode option.
- A new terrain name not classified as solid or fluid can miss generic
  placement/render behavior; update the terrain helpers and color paths too.
- An obstacle can look correct while its per-hex clearance/support arrays are
  misaligned with the footprint, or while its preview/model doesn't forward
  click and hover events.
- Special placement logic belongs in `resolvePlacement()` and must agree with
  the real click-handler cases; don't test only the preview.
- SVG/PDF custom shapes and the browser 3D model are not verified by the
  registry tests. Check both export formats when adding a distinct symbol.
- Share IDs do not carry runtime uids. Older app versions intentionally drop
  unknown inventory IDs and warn; they do not preserve a piece they cannot
  define.

**Needs owner input:** fluid-on-fluid stacking is recent work on `dev` that may
be refactored. Confirm the intended behavior before changing it, and do not
write tests that pin a particular stacked-fluid altitude.

**Needs owner input:** the `Glyphs & Start Zones` group is commented out in
`pieceGroups.ts`, while glyphs and start zones have their own pen-mode entries.
Decide whether a new overlay should also be ordered in the placed-pieces grid
before restoring or extending that group.

**Needs owner input:** the `.hsc` download path currently calls
`writeVirtualScapeArrayBuffer()` in
[`src/data/writeVirtualscapeMapFile.ts`](../src/data/writeVirtualscapeMapFile.ts),
from [`src/controls/ExportBinaryFileButton.tsx`](../src/controls/ExportBinaryFileButton.tsx);
its `myFile` is a hard-coded one-tile sample. Confirm whether live-map
Virtualscape export is in scope before treating that path as a piece-export
registration point.

**Needs owner input:** `piece-ids-and-loading.test.ts` has a normal `it()` test
whose title says `KNOWN GAP: piece objects without a uid are rejected`, while
its assertions and `normalizePieceArray()` expect a uid-less object to be
retained and assigned a uid. Clarify whether the test title is stale or the
intended contract changed; this guide follows the behavior asserted by the test
and implemented by the normalizer.
