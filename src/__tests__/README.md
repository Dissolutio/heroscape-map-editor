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
| `storage-known-gaps.test.ts` | Legacy constraint restoration and protection against hotkey mount overwrites. |
| `helpers/board.ts` | `makeTable`, `place`, `remove`, `withGrassFloor`, `hexAt`: build boards without the store. |

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
