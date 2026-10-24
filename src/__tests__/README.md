# Tests

```sh
npm install        # once on this branch: adds vitest and updates package-lock.json
npm test           # run everything once
npm run test:watch # re-run on save
```

These are **pure-logic tests** (hex math, placement rules, serialization, load).
They run in Node with no browser, React, or three.js rendering, and finish in
a couple of seconds. Rendering (3D, SVG, PDF) is not covered yet.

## What is here

| File | Protects |
| --- | --- |
| `piece-registry.test.ts` | The "add a new terrain piece" checklist: every registry that must agree about a piece. **Read this first if you are adding terrain.** |
| `generic-pieces.test.ts` | Generic solid/fluid registration, all footprint sizes on the table, solid/fluid stacking, buried marks, unlimited inventory handling, and piece-grid grouping. |
| `generic-terrain-colors.test.ts` | Generic cap/side color resolution and contrast-based `?` letter color selection. |
| `generic-letter-metrics.test.ts` | Ratchets every terrain letter against the PDF mark-width table and the Inter Bold font metrics. |
| `place-and-remove.test.ts` | `addPiece`/`removePiece`: every registered piece places and removes cleanly at every rotation, plus the placement rules as small stories. |
| `replay-conflicts.test.ts` | How conflicts are computed (`data/rebuildBoardState.ts`): ordinary occupancy conflicts plus derived Laur conflicts. |
| `laur-addon-footprints.test.ts` | All eight Laur add-on attachment ends and blocked hexes, allowed rotation kinds, wrap-around geometry, registered heights, plus pending support-table, visual-model, and pointer-altitude verification todos. |
| `laur-addon-placement.test.ts` | Laur side/vertex picking, canonical identity, port-snapped rotations for every pillar orientation and add-on, rotation hotkey cycling, click/preview parity, center tie-break, and non-mutation. |
| `laur-addon-conflicts.test.ts` | Altitude-aware canonical-port conflicts, legal +8 stack exemptions, attachment-end pillar exceptions, blocked-cell land/non-add-on conflicts, blocked add-on overlap, reverse overlaps, missing registered heights, non-mutation, and the known-good map audit. |
| `laur-addon-support.test.ts` | Square/triangle pillar port tables, every add-on's required support ports and rotations, bridge endpoints, ruin anchors, +8 stacked pillar support, and non-mutation. |
| `laur-addon-exports.test.ts` | The shared Laur add-on SVG/PDF symbol mapping and a ratchet that every Laur wall add-on has an export symbol. |
| `laur-pillar-stacking.test.ts` | Measured pillar heights and core height, the +8 stack increment, stack-support detection, stackable square pillar identification, and inventory reconciliation at the physical stack step. |
| `pieceHeights.test.ts` | Every entry in the physical height audit matches its registered height, writes exactly that many origin/clearance cells, and distinguishes a free top-level tile from one overlapping the last blocked level. |
| `piece-ids-and-loading.test.ts` | Piece ids, legacy uid-less piece normalization, saved-map formats, and the load path (`buildupJsonFileMap`). |
| `buildup-map-load-order.test.ts` | Same-altitude support/overlap order for newer add-ons through `buildupJsonFileMap`, derived conflict/support state, a ladder control, and JSON save/reload idempotence. |
| `hex-grid.test.ts` | Cube coordinates, directions, rotation, grid generation, odd-r conversion. |
| `edges-and-nodes.test.ts` | How edges and corners are represented today, and the acceptance checklist (`it.todo`) for the edge/node model. |
| `terrain-constraints.test.ts` | Inventory normalization, set/personal/file constraints, and exact pen-mode availability under inventory constraints. |
| `map-share-url.test.ts` | Parsing pasted share links. |
| `safe-storage.test.ts` | Guarded browser storage access, corrupted JSON, and quota/security failures. |
| `map-storage.test.ts` | Old/new saved-map formats, separate portraits, and inline-portrait migration. |
| `map-autosave.test.ts` | Debounced map writes, lifecycle flushes, hold/release gating, and failure retries. |
| `map-portrait.test.ts` | Pure downscale dimensions and map identity through a JSONCrush share-link round trip. |
| `settings.test.ts` | Versioned settings defaults, migration, debounced persistence, and store-state classification. |
| `tile-marks.test.ts` | Buried-status mark selection, letter/mark text composition, excluded piece families, and integration with the small buried-status board fixture. |
| `pdf-buried-mark-position.test.ts` | PDF-only mark offsets scale with the registered Inter glyph advances and leave marks-only tiles unshifted. |
| `release-notes.test.ts` | Release-note parsing and the pure first-visit / unseen-release decision. |
| `release-notes-format.test.ts` | The root release notes' date-heading format and non-empty parsed entries. |
| `crash-feedback.test.ts` | The anonymous crash-report note sent to Sentry (`utils/crashFeedback.ts`): trimmed, capped, linked to the crash event, no name/email. |
| `material-clones.test.ts` | The private material copies the move/rotate preview ghost uses (`utils/materialClones.ts`), so it never changes the cached materials real pieces share. |
| `click-placement.test.ts` | What a left click with a piece pen places, per piece family, through the real click handler (`world/MapDisplay3D.tsx`) and the store, without rendering; plus refusals and messages, Laur variant stack switching and confirmation, undo, permissive Laur add-on placement with pillar-port rotation snapping, +8 pillar stacking including the stackable square variant, map edges, and a ship bow deck click that does nothing. Cases are in `helpers/placementCases.ts`. |
| `placement.test.ts` | `resolvePlacement` (where a click puts a piece, or the reason it is blocked; must match the click handler case for case), +8 pillar and add-on stacking, Laur add-on port snapping, non-stackable wall conflict flags, the pure Laur stackable-variant pen decision and middle-click pick mode, `placementBlockedMessages` including group-drag `outOfHeight`, and `evaluatePlacement` (ok / conflict / blocked from a footprint-only probe, `ignoreUID` for a moving piece, opt-in height bounds, never mutates its input) in `data/placement.ts`, and the map-edge rule (`hangsOffMap`) swept over rectangle and hexagon maps of several sizes against each shape's own definition. |
| `placement-preview.test.ts` | `getPlacementPreviewState` (click-rule resolution plus placement evaluation, including Laur edge conflicts, unsupported support signals, map-edge footprints and non-mutation) and the distinct color/pattern styles in `world/placementPreviewStyle.ts`. |
| `ship-deck-color.test.ts` | The ship bow/wall deck colour (`world/models/shipDeckColor.ts`): yellow with the rest of the piece when hovered or selected, or when that deck is hovered to build on. |
| `drag-move.test.ts` | Drag-to-move (`data/dragMove.ts`): which pieces and selections can be dragged; the press/drag/drop state machine; multi-hex grab offsets and rigid multi-piece deltas at all six rotations; per-member status and combined blocked/conflict decisions, including group-only below-ground and vertical-clearance upper bounds; moving members ignored as conflicts; off-map refusal; conflicted add-on previews on frozen store state; one `movePieces` call/undo entry with conflict flags and viewing-level restoration; transient drag state versus autosave; and land ghost model parity. |
| `edge-piece-drag.test.ts` | Battlement, road-wall and rope-ladder drag targeting: all six resolved edges, rotation tie-breaks, cache keys, rim and castle-top behavior, rigid mixed groups, altitude bounds, undo, same-edge no-op, and frozen-board immutability. |
| `laur-drag.test.ts` | Laur drag-to-move: characterizes boardPieces-only add-on placement/removal/movement, grid-backed pillar moves, and inventory IDs on moved stacked pieces. |
| `storage-known-gaps.test.ts` | Legacy constraint restoration and protection against hotkey mount overwrites. |
| `virtualscape-import.test.ts` | Version 0.0007 Virtualscape binary import through `readVirtualscapeMapFile()` and `buildupVSFileMap()`: registered codes, positions, rotations, odd-r coordinates, unknown-code drop reporting and warning, and empty drops for known-only files. |
| `map-roundtrip.test.ts` | JSON file, local autosave, and compressed share-link save/load round trips for multiple piece families, including stable map/piece data, rebuilt occupancy, no drops, and conflict recomputation. |
| `fit-map-to-pieces.test.ts` | Pure footprint-based map growth, rectangle/hexagon origin preservation, non-mutation/idempotence, and the resize controls' existing coordinate behavior. |
| `store-move-many.test.ts` | Moving several pieces in one store update (`movePieces`, `data/movePieces.ts`): one undo step with exact undo/redo, a rigid group shift without the movers displacing each other, displacing and restoring stationary pieces exactly as `movePiece` does, the viewing level, unknown uids, a no-op that records no history, UI fields and autosave. A frozen copy of the old `movePiece` pins that single moves and non-interfering group moves are unchanged. |
| `store-undo-redo.test.ts` | The real Zustand/Zundo store: paint, unpaint, move, multi-piece undo/redo when pausing after the first move, the no-history gotcha when pausing before it, `loadMap` history/conflicts, and transient UI state versus autosave. |
| `helpers/board.ts` | `makeTable`, `place`, `remove`, `withGrassFloor`, `hexAt`: build boards without the store. |
| `helpers/clickHandler.ts` | `clickWithPen`: drive the real click handler in Node (the test stubs MapDisplay3D's children; see `click-placement.test.ts`). |

## Adding a new terrain piece

Do the work, then run `npm test`. The registry and sweep tests name the piece and
the missing step. Today the registrations a piece needs are: the `Pieces` constant
(`types.ts`), its definition in `data/pieces.ts`, a footprint in
`data/tileTemplates.ts`, an entry in `inventory/blankInventory.ts`, its place in
the set inventories (`data/inventories.ts`), and a Virtualscape code in
`data/pieceCodes.ts` if the old editor had it. The 3D model/loader and the
SVG/PDF shapes are not checked by tests yet.

## Known gaps: `it.fails`

A test titled `KNOWN GAP: ...` is written as `it.fails(...)`. It states the
behavior we **want**, and it **passes while the defect exists**. When someone fixes
the defect, the test goes **red** (Vitest reports that a test expected to fail
passed). That is the signal to change `it.fails` to `it` and keep it as a normal
regression test. Each gap explains the defect, the suggested fix, and any
assumption it makes, in the comment at the top of the test.

Some checks are "ratchets" instead: a known list of exceptions that must
shrink and may never grow. None are open right now; the last one (Laur pieces
without a tile template in `piece-registry.test.ts`) is now an empty list.

## Conventions

- Test through `place` / `remove` / `rebuildBoardStateFromPieces`, not by editing
  `boardHexes` by hand.
- `place` is **strict** by default (reports rule violations, which is what the
  placement preview sees). The real app paints and loads with `permissive: true`,
  which never rejects and only reports displaced hexes; pass `permissive: true`
  to test that mode.
- `addPiece` does not mutate the board you pass it. Use `cloneBoard` when a test
  needs an independent copy of a starting board.
- Do not pin altitudes of fluid-on-fluid stacking; that feature is being
  reworked on `dev`.
