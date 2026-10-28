# Objective markers: architecture and implementation plan

This is a planning document only. Objective markers are not implemented by this
change.

## Recommendation

Represent objective markers as a **map-level annotation layer**, separate from
the terrain-piece registry and `boardPieces`.

An objective marker communicates scenario information; it is not a terrain
piece with a physical inventory count, footprint, support requirement, or
collision volume. Making it a registered piece would couple it to terrain
placement, inventory and set constraints, piece IDs, `boardHexes` rebuilding,
and the registry lifecycle ratchet. It would also require special cases to
prevent a visual annotation from behaving like a physical obstacle.

The existing examples are related, but not interchangeable:

- **Start zones** are special overlay-like entries in `piecesSoFar` and
  `boardPieces`. They have no `boardHexes` expansion, but still participate in
  piece selection, movement, hiding, save/load, and piece lifecycle tests.
- **Glyphs** are registered overlay pieces. They have placement rules and
  derived board state, and named glyphs are generated from the glyph data.
- **Generic** is actual terrain: its variants are registered and constrained
  by inventory/set rules, and placement expands into derived board hexes.
- **Buried-tile marks** are calculated from board state and displayed in 2D/PDF
  output. They are derived information, not separately editable or persisted
  objects.

Objective markers need the editing and persistence of a placed object, but not
the terrain semantics of a piece. Keep them out of `piecesSoFar` and the
registry lifecycle ratchet; cover their independent lifecycle with
annotation-specific tests. Do not generalize the start-zone exception into a
new kind of fake piece.

## Assessment of `add-objective-markers`

The old branch adds four marker IDs (two marker types at one- and two-hex
sizes), treats them as overlay/obstacle pieces, adds a dialog for marker text
and labels, and draws marker symbols in 3D, SVG, and PDF. Its work spans:

- **Model and state:** `src/types.ts`, `src/data/pieces.ts`,
  `src/data/addPiece.ts`, `src/store/map-slice.ts`,
  `src/data/jsonCrush.ts`, and `src/utils/objective-markers.ts`.
- **Controls and dialog:** `src/controls/EditControlsTab.tsx`,
  `src/controls/PenModeControls.tsx`,
  `src/controls/SelectedPieceControls.tsx`,
  `src/layout/EditObjectiveMarkersDialog.tsx`,
  `src/layout/HomePage.tsx`, and `src/layout/dialogNames.ts`.
- **Rendering and exports:** `src/world/MapBoardPiece3D.tsx`,
  `src/world/maphex/hexColors.ts`, `src/svg-map/SvgMapHex.tsx`,
  `src/svg-map/SvgMapShapes.tsx`, `src/pdf-map/PdfMapHex.tsx`,
  `src/pdf-map/PdfMapShapes.tsx`, and `src/pdf-map/PdfMap6LevelsPerPage.tsx`.

Nothing from that branch is merged or cherry-picked into this plan.

### Good ideas to reuse

- Keep marker display data distinct from terrain and give it a small,
  explicit validation/normalization boundary.
- A focused marker-editing control and consistent symbol geometry across 2D
  and PDF are useful product and rendering ideas.
- The branch attempted to assign default numbers in creation order and to
  sanitize short display text and longer labels. Revisit those behaviors as
  product decisions rather than carrying over its storage scheme.

### Stale or unsuitable parts

- Its markers are registered as pieces and inserted into `boardPieces`, with
  piece sizes, terrain identities, and placement logic. That is the wrong
  source of truth for annotations and would bring them into physical
  placement/lifecycle machinery.
- The branch adds marker definitions without the current complete terrain
  registration surface (including current inventory/set, grouping, footprint,
  placement, and lifecycle expectations). Its 1-/2-hex piece sizes should not
  be carried forward as placement footprints.
- It keys text metadata by `BoardPiece.uid`, even though share links encode
  board pieces as IDs rather than preserving their runtime UIDs. More
  importantly, its `jsonCrush.ts` explicitly removes
  `objectiveMarkerMetadataByUID` from the shareable map object, so marker text
  and labels do not round-trip through share links.
- The implementation predates current selection, drag, and derived
  `boardHexes` behavior. Its piece-based event path is not a reliable template
  for annotation selection or drag today.
- It has no objective-marker tests and does not establish parity with the
  current save/load, sharing, SVG/PDF, or registry-lifecycle checks.

The vector shapes, text-sanitization ideas, and focused controls can inform
future work, but the data model and integration should be designed against
current `dev`.

## Proposed data model and compatibility

Use an optional, map-owned collection so markers are saved and shared with
their map, without depending on random board-piece UIDs:

```ts
type ObjectiveMarkerAnchor = {
  kind: 'hex'
  coords: CubeCoordinate
  altitude: number // the supported surface hex altitude
}

type ObjectiveMarker = {
  uid: string
  anchor: ObjectiveMarkerAnchor
  kind: 'number' | 'symbol'
  value: string
  color: ObjectiveMarkerColor
  rotation: 0 | 1 | 2 | 3 | 4 | 5
  label?: string
}

type HexMap = {
  // existing map fields
  objectiveMarkers?: ObjectiveMarker[]
}
```

`ObjectiveMarkerColor` should be a small named palette, not arbitrary CSS.
Start with hex-center surface anchors only; the discriminated anchor type leaves
room for edge or piece anchors after their coordinate and selection semantics
are agreed. Bound and normalize `value` and `label` at load/edit boundaries.
Generate a stable marker UID when creating a marker and preserve it in map
files and share links.

`HexMap` is already stored as the first object in JSONCrush share data and
alongside `boardPieces` in JSON/autosave data. An optional marker array there
can be preserved by existing map envelopes and the share-link payload without
changing the encoded piece-ID list. Confirm and test this end to end when
implementing it. Existing maps without the property load with no markers;
unknown or malformed marker entries should be ignored safely rather than
breaking a map load. Do not key marker metadata by `BoardPiece.uid`.

The marker array is map state and must be included in the existing undo/redo
snapshot and autosave path. One add, edit, move, rotate, or delete action should
be one undo step. Selection remains transient UI state. Markers do not write
`boardHexes`, displace pieces, consume inventory, affect set constraints, or
change terrain placement rules. The initial placement rule should only allow
anchors on an existing supported surface; overlapping an existing overlay is
an explicit product decision, not an inventory conflict.

## Rendering plan

### 3D

- Render annotations in a dedicated layer/component, not as terrain meshes in
  `MapBoardPiece3D`. Resolve the anchor with the existing cube-coordinate and
  board-surface helpers, and place a compact, legible marker just above the
  supported cap to avoid z-fighting.
- Use a clear token/decal with a contrasting border and centered number or
  symbol; preserve the chosen color and orientation. Keep it visible and
  readable over both textured and flat-color terrain.
- The new texture system textures terrain caps and sides. Do not add a marker
  as a terrain layer or bake marker art into cap textures. Use vector/text
  geometry or a separate small transparent marker asset/material, independent
  of terrain texture arrays. The marker should look the same in Lowest,
  Medium, and High tiers and remain legible with High-tier lighting.
- Give markers their own hit target and selected state. Terrain hover,
  selection, and drag highlights should not silently turn into marker state.

### SVG and PDF

- Add markers as a distinct overlay pass positioned from the same
  cube-coordinate-to-pixel conversion as other map content. Share marker
  geometry, sizing, label layout, and color decisions between exports.
- Respect viewing-level and overlay-level visibility, and keep the marker
  inside the exported map bounds. Decide whether labels are always rendered or
  only in a marker-detail/export option.
- Keep PDF rendering on supported `@react-pdf/renderer` primitives. Share
  geometry and decisions with SVG; do not assume SVG DOM elements can be used
  directly as PDF components.
- Add focused SVG markup and PDF-output regressions, including multiple markers,
  text/symbols, rotations, colors, and visibility. Do not rely on screenshots
  alone.

## Interaction plan

1. Add an objective-marker pen mode and a small tool for choosing marker value
   and color. Clicking a supported surface creates one annotation; it never
   places a terrain piece or consumes constrained inventory.
2. In select mode, clicking a marker selects it. Keep marker selection distinct
   from `selectedPieceIDs`, or use an explicitly tagged selection target so a
   marker UID can never be passed to a board-piece action.
3. Dragging a selected marker changes its anchor to a valid surface target.
   The initial version moves one marker at a time; it does not join rigid
   terrain-group transforms.
4. Rotate the selected marker in six 60-degree steps using the established
   rotation control/hotkey pattern. Delete removes only the annotation.
5. Add/edit/move/rotate/delete use store actions that participate in temporal
   history and autosave. Clear transient marker selection on map load or when
   its marker is deleted.

## Tests to add during implementation

- Pure annotation validation, normalization, anchor bounds, stable UID
  preservation, and safe handling of missing/unknown optional marker data.
- JSON file, autosave, and compressed share-link round trips; verify a legacy
  map without `objectiveMarkers` still loads unchanged.
- Store undo/redo for add, text/color edit, drag, rotate, and delete, with one
  history entry per user action.
- Placement/constraint checks proving markers do not add `boardPieces`, write
  `boardHexes`, displace terrain, or affect inventory/set availability.
- SVG and PDF output tests for content, geometry, rotation, color, and
  visibility. Keep shared geometry assertions separate from PDF primitive
  assertions.
- E2E coverage for marker pen placement, selection, drag, rotate, delete,
  undo/redo, and ordinary piece selection/drag still working around markers.
  Drive the canvas using the documented `window.__TEST__` helpers and ready
  signal.
- Keep the registry lifecycle ratchet scoped to registered pieces. Add a
  separate marker lifecycle suite rather than registering annotations just to
  make that ratchet exercise them. Register any new test files in the test
  READMEs.

## Suggested small PR sequence

1. **Agree the annotation contract.** Resolve the product questions below;
   define typed marker/anchor/color data and safe normalization. Add old-map
   compatibility tests.
2. **Persistence and history.** Wire marker data through JSON, autosave,
   share-link round trips, and undo/redo. Test that legacy maps and existing
   share links remain valid; no rendering yet.
3. **Editing interactions.** Add marker pen, selection, single-marker drag,
   rotation, deletion, and controls using dedicated annotation actions. Add
   store/interaction tests and focused E2E coverage.
4. **3D layer.** Add the independent surface overlay for all graphics tiers,
   including hit testing and selected state. Verify no terrain texture or
   piece lifecycle regression.
5. **2D/PDF exports.** Add the shared marker layout and SVG/PDF adapters,
   visibility rules, and output regressions. Update export documentation if
   the final product decisions affect it.

## Product-owner questions

1. **What can a marker show?** Recommended default: a short free-form value
   (numbers or a few symbols) plus an optional longer label, instead of a
   fixed catalog of marker types.
2. **Which colors?** Recommended default: a small accessible palette with one
   high-contrast default; avoid arbitrary color entry in the first version.
3. **What does it attach to?** Recommended default: the center of a supported
   hex surface only. Defer edge and piece anchors until their placement and
   drag semantics are specified.
4. **Should labels appear in printed exports or a legend?** Recommended
   default: print the visible marker value, omit longer labels and a separate
   legend in the first version.
