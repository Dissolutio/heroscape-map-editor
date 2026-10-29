# Objective markers: architecture and implementation plan

This plan tracks the staged objective-marker work. PR 1 implements the data
contract, persistence, and history only; UI, rendering, and exports remain for
later PRs.

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
  board pieces as IDs rather than preserving their runtime UIDs. Its
  `jsonCrush.ts` constructs a copy with `objectiveMarkerMetadataByUID` removed,
  but serializes a different copy of the original map instead. The metadata
  can therefore enter the share payload with stale UID keys and fail to attach
  to the markers rebuilt on load.
- Its export paths do not consistently render the proposed metadata: SVG draws
  only the marker shape, PDF hard-codes `A`, and 3D reuses the start-zone model
  rather than rendering marker values or distinct one-/two-hex variants.
- The implementation predates current selection, drag, and derived
  `boardHexes` behavior. Its piece-based event path is not a reliable template
  for annotation selection or drag today.
- It has no objective-marker tests and does not establish parity with the
  current save/load, sharing, SVG/PDF, or registry-lifecycle checks.

The vector shapes, text-sanitization ideas, and focused controls can inform
future work, but the data model and integration should be designed against
current `dev`.

## Data model and compatibility

Use an optional, map-owned collection so markers are saved and shared with
their map, without depending on random board-piece UIDs:

```ts
type ObjectiveMarker = {
  uid: string
  anchor: CubeCoordinate & { altitude: number }
  size: 1 | 2
  rotation: 0 | 1 | 2 | 3 | 4 | 5
  style: 'black' | 'white'
  content:
    | { kind: 'number'; value: number }
    | { kind: 'text'; value: string }
  name?: string
}

type HexMap = {
  // existing map fields
  objectiveMarkers?: ObjectiveMarker[]
}
```

Number markers follow Renegade scenario maps (1–99), in black-with-white-text
and white-with-black-text styles. Custom text is also allowed, limited to three
sanitized characters. A marker can have an optional free-text name, for example
a HeroScape unit name. Size 2 uses a two-hex footprint and a six-step rotation.
Reuse the existing template and rotation utilities rather than duplicating hex
geometry.

Normalize optional marker data at load/edit boundaries: drop malformed entries,
clamp numeric values and rotation, sanitize custom text to at most three
characters, and keep only the first entry for a duplicate UID. Generate a UID
when creating a marker; do not key marker data by `BoardPiece.uid`.

The JSON map file and local autosave retain marker names. The share-link payload
contains marker placement, size, rotation, content and style, but omits names,
which can be arbitrarily long. A link opened without names still displays the
markers without error; any future legend simply has no name for those entries.
Legacy JSON maps and share links without `objectiveMarkers` load unchanged.

The marker collection is map state and participates in the existing undo/redo
and autosave paths. One add, edit, move, or delete action is one undo step;
selection stays transient. Markers do not write
`boardHexes`, displace pieces, consume inventory, affect set constraints, or
change terrain placement rules. Marker footprints occupy a separate objective
layer: they can overlap start zones and terrain, but not another marker at the
same surface altitude. A 2-hex marker has one anchor altitude for its whole
footprint. As with `evaluatePlacement` footprints, every covered hex is on that
same placement plane; a marker does not bridge different surface altitudes.
Future placement interaction should require that each covered coordinate has a
supported surface at the anchor altitude.

The unit-name suggestion list should be derived from the `SDW` display-name
field in `src/data/armyCardsDotOrg.ts`, deduplicated and sorted. Keep the
19,000-line source out of the main bundle by either loading it as a lazy chunk
when the name field is used or generating a small sorted JSON list.

## Rendering plan

### 3D

- Render annotations in a dedicated layer/component, not as terrain meshes in
  `MapBoardPiece3D`. Resolve the anchor with the existing cube-coordinate and
  board-surface helpers, and place a compact, legible marker just above the
  supported cap to avoid z-fighting.
- Use a clear token/decal with a contrasting border and centered number or
  short custom text; preserve the black/white style, opposite text color,
  footprint size, and orientation. Keep it visible and readable over both
  textured and flat-color terrain.
- The new texture system textures terrain caps and sides. Do not add a marker
  as a terrain layer or bake marker art into cap textures. Use vector/text
  geometry or a separate small transparent marker asset/material, independent
  of terrain texture arrays. The marker should look the same in Lowest,
  Medium, and High tiers and remain legible with High-tier lighting.
- Give markers their own hit target and selected state. Terrain hover,
  selection, and drag highlights should not silently turn into marker state.

### SVG and PDF

- Draw markers as a distinct overlay pass positioned with the map's
  cube-to-pixel conversion. Share symbol geometry, sizing, content, and color
  decisions.
- Draw map marker text and objective legend text as vector paths using the
  existing `opentype.js` text-to-path helpers. The legend is a column of marker
  symbols beside their optional names, so Renegade staff can rearrange it in
  Adobe Illustrator and scale it without font substitutions.
- Keep PDF rendering on supported `@react-pdf/renderer` primitives; adapt the
  shared path data rather than assuming SVG DOM elements work as PDF nodes.
- Respect export level and overlay visibility. Test SVG markup and PDF output
  for text paths, multiple markers, rotations, colors, and names; do not rely on
  screenshots alone.

## Interaction plan

1. Add an objective-marker pen and controls for size, number/text, and style.
   Clicking a supported surface creates one annotation and never consumes
   terrain inventory.
2. Keep marker selection distinct from `selectedPieceIDs`; a marker UID must
   never be passed to a board-piece action.
3. Drag one marker at a time to a valid surface. It does not join rigid
   terrain-group transforms.
4. Rotate the selected marker in six 60-degree steps. Delete removes only the
   annotation. Clear transient marker selection on map load or deletion.
5. Add/edit/move/rotate/delete use map actions in temporal history and autosave.

## Tests to add during implementation

- Pure annotation validation, normalization, anchor bounds, stable UID
  preservation, and safe handling of missing/unknown optional marker data.
- JSON file and autosave round trips retain names. Share-link round trips retain
  placement/content/style while omitting names; verify legacy maps and links
  still load unchanged and measure a 40-marker URL payload.
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

1. **Data contract, persistence, and history (this PR).** Add typed annotations,
   normalization, map-file/autosave/share-link support, and undo/redo; no UI or
   rendering.
2. **Editing interactions.** Add marker pen, selection, single-marker drag,
   rotation, deletion, controls, and focused E2E coverage.
3. **3D layer.** Add the independent surface overlay for all graphics tiers,
   hit testing, and selected state.
4. **Unit-name auto-suggest.** Connect the optional name field to the
   deduplicated, sorted `SDW` list without adding the full card file to the main
   bundle.
5. **2D/PDF symbols and objective legend.** Add marker paths, the named legend,
   export visibility rules, and SVG/PDF output regressions.

## Decisions

1. Renegade scenario maps use numbered markers 1–99 in black-with-white-text
   and white-with-black-text styles. Custom text is also allowed, limited to
   three sanitized characters. A marker may additionally have a free-text name.
2. A marker occupies one or two hexes; a two-hex marker has six rotations. It
   is an annotation, not a terrain piece, and has no inventory or support
   requirement.
3. Markers have their own objective layer. They may overlap start zones and
   board surfaces; two markers may not overlap on the same surface altitude.
   All hexes in a two-hex footprint share the anchor altitude, following the
   single-altitude footprint used by `evaluatePlacement`; markers do not bridge
   different surface heights.
4. JSON files and autosaves store names. Share links include marker placement,
   content, and style but omit names. Opening a link without names is a clean
   degradation: markers remain, and the later legend omits those names.
5. Unit-name suggestions use deduplicated, sorted values from the `SDW` display
   name field in `armyCardsDotOrg.ts`, loaded lazily or generated into a small
   JSON file so the 19,000-line source is not in the main bundle.
6. The future SVG/PDF export includes a column legend of symbols and names.
   Marker and legend text are converted to paths with the existing
   `opentype.js` helpers so the exported artwork remains editable and scales
   cleanly in Adobe Illustrator.
