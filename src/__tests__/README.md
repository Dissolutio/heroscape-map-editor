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
| `place-and-remove.test.ts` | `addPiece`/`removePiece`: every registered piece places and removes cleanly at every rotation, plus the placement rules as small stories. |
| `replay-conflicts.test.ts` | How conflicts are computed (`data/rebuildBoardState.ts`): what counts, what does not. |
| `laur-addon-footprints.test.ts` | Which hexes lwl2/lwr2/lwr3 block (`data/laurAddonFootprints.ts`, not used by the app yet). |
| `piece-ids-and-loading.test.ts` | Piece ids, the saved-map formats, and the load path (`buildupJsonFileMap`). |
| `hex-grid.test.ts` | Cube coordinates, directions, rotation, grid generation, odd-r conversion. |
| `edges-and-nodes.test.ts` | How edges and corners are represented today, and the acceptance checklist (`it.todo`) for the edge/node model. |
| `terrain-constraints.test.ts` | Inventory normalization and set/personal/file constraints. |
| `map-share-url.test.ts` | Parsing pasted share links. |
| `safe-storage.test.ts` | Guarded browser storage access, corrupted JSON, and quota/security failures. |
| `map-storage.test.ts` | Old/new saved-map formats, separate portraits, and inline-portrait migration. |
| `map-autosave.test.ts` | Debounced map writes, lifecycle flushes, hold/release gating, and failure retries. |
| `map-portrait.test.ts` | Pure downscale dimensions and map identity through a JSONCrush share-link round trip. |
| `settings.test.ts` | Versioned settings defaults, migration, debounced persistence, and store-state classification. |
| `crash-feedback.test.ts` | The anonymous crash-report note sent to Sentry (`utils/crashFeedback.ts`): trimmed, capped, linked to the crash event, no name/email. |
| `material-clones.test.ts` | The private material copies the move/rotate preview ghost uses (`utils/materialClones.ts`), so it never changes the cached materials real pieces share. |
| `click-placement.test.ts` | What a left click with a piece pen places, per piece family, through the real click handler (`world/MapDisplay3D.tsx`) and the store, without rendering; plus the refusals, each with its message (only a castle wall or wall walk on a castle wall/arch top, an arch never on one, Laur add-ons only on Laur pillars, square and triangle pillars never stacked on each other, nothing hanging off the map; land on a whole-level fluid cap stays silent), a ship bow deck click that does nothing, and undo. Cases are in `helpers/placementCases.ts`. |
| `placement.test.ts` | `resolvePlacement` (where a click puts a piece, or the reason it is blocked; must match the click handler case for case), `placementBlockedMessages` and `evaluatePlacement` (ok / conflict / blocked from a footprint-only probe, `ignoreUID` for a moving piece, never mutates its input) in `data/placement.ts`, and the map-edge rule (`hangsOffMap`) swept over rectangle and hexagon maps of several sizes against each shape's own definition. |
| `placement-preview.test.ts` | `getPlacementPreviewState` (click-rule resolution plus placement evaluation, including map-edge footprints and non-mutation) and the distinct color/pattern styles in `world/placementPreviewStyle.ts`. |
| `ship-deck-color.test.ts` | The ship bow/wall deck colour (`world/models/shipDeckColor.ts`): yellow with the rest of the piece when hovered or selected, or when that deck is hovered to build on. |
| `drag-move.test.ts` | Drag-to-move (`data/dragMove.ts`): which pieces can be dragged, the press/drag/drop state machine (a press without movement stays a click, Esc/blur/pointercancel, swallowing the release that ends a drag), the grab offset for multi-hex pieces at every rotation, the drop decision (ok/conflict move, blocked cancels with its message; a target hanging off the map keeps its full footprint and is refused), that drag state adds no undo entries and leaves the autosaved map alone, that a move raises the viewing level exactly as a click placement does, and that the shared land ghost picks the same tile model as the pen preview. |
| `storage-known-gaps.test.ts` | Legacy constraint restoration and protection against hotkey mount overwrites. |
| `virtualscape-import.test.ts` | Version 0.0007 Virtualscape binary import through `readVirtualscapeMapFile()` and `buildupVSFileMap()`: registered codes, positions, rotations, odd-r coordinates, and the known silent-drop gap for unknown codes. |
| `map-roundtrip.test.ts` | JSON file, local autosave, and compressed share-link save/load round trips for multiple piece families, including stable map/piece data, rebuilt occupancy, no drops, and conflict recomputation. |
| `store-undo-redo.test.ts` | The real Zustand/Zundo store: paint, unpaint, move, grouped multi-piece move, `loadMap` history/conflicts, and transient UI state versus autosave. |
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
- `addPiece` edits hex objects inside the board you pass it. Clone first
  (`cloneBoard`) if you reuse a starting board.
- Do not pin altitudes of fluid-on-fluid stacking; that feature is being
  reworked on `dev`.
