# Browser tests and automation (Playwright)

The 3D map is a WebGL `<canvas>`. Playwright locators and accessibility
snapshots see the canvas and nothing inside it, and the map takes seconds to
load. The app therefore exposes a few hooks for browsers and agents. This file
is the one place they are documented.

## One-time setup

`@playwright/test` is a dev dependency. After `npm ci`, fetch its browser:

```sh
npx playwright install chromium
```

Run the tests with `npm run test:e2e`. The config starts the dev server
itself (or reuses one already on port 5173).

## Opening the app for automation

Open **`/hs?e2e=1`**, not `/`. The router redirects `/` to `/hs` and drops the
query string. Dev builds (`npm run dev`) have the hooks even without `?e2e=1`;
production builds have them only with it. To load a known map add the share
link parameter: `/hs?e2e=1&m=<crushed map>` (see `e2e/fixtures.ts`).

`?e2e=1` also makes the cosmetic cap rotation repeatable, so screenshots match
between runs. The rotation only shows with **High Quality Render** on; the
default caps are plain hexagons.

For the development-only per-hex land renderer, add `&perHexLand=1` to an
`/hs?e2e=1` URL. It is session-only and off by default; all other rendering
continues to use the current path.
For tier-start coverage, `&graphicsTier=medium` or `&graphicsTier=high` selects
the initial tier only when both `e2e=1` and `perHexLand=1` are present.

Add `&perf=1` to show the performance overlay in both development and production
builds. It samples frame-time average/p95, FPS, renderer resources, heap when
available, store updates, pointer moves, raycast time, and pending async work.
`&perf=1&bench=1` starts the benchmark once per browser session. The overlay's
Run button measures camera orbit and synthetic pointer sweep for the currently
selected renderer with lights off/on; `&perHexLand=1` also adds Medium when its
textures load. `&perfSeconds=N` sets each phase length (1–60 seconds; default
2). Use Copy JSON to collect the report. The 120-second leak sweep is a separate
button in the overlay. These timings are software-rendering comparisons, not
real-device FPS.

The automatic What's New dialog is suppressed for `?e2e=1` runs. A test that
needs to exercise it can explicitly opt in with `&whats-new=1`. The ordinary
What's New button remains available in e2e runs.
The What's New spec reads the current release IDs from `release-notes.md`.

## Waiting: use the ready signal, never a fixed sleep

The map is "ready" when its bounding box has stopped changing, no model is
still loading, and the camera has stopped moving. Any edit, map change, level
change or camera-type change clears it until things settle again.

- `window.__APP_READY__ === true`
- `canvas[data-ready="true"]` (also `data-map-id`)
- `[data-testid="app-status"]` reads `Map loaded: ...` instead of `Loading map`

```ts
await page.waitForFunction(() => window.__APP_READY__ === true)
```

The signal needs frames to be rendering. It copes with `frameloop="demand"`
but not with a hidden tab (the app stops rendering when `document.hidden`).
`waitForAppReady` includes an e2e-only `window.__READY_DEBUG__` snapshot and
recent browser console errors when it times out. The test timeout leaves 15
seconds after its 60-second wait for that diagnostic to be reported.

## Reading state: `window.__TEST__` and the status element

The canvas is invisible to accessibility snapshots, so read state in text:

- `[data-testid="app-status"]` (visually hidden, still in the accessibility
  tree): map name, piece count, level, pen mode, how many pieces are selected.
- `window.__TEST__.snapshot()`: the same, structured (`mapId`, `mapWidth`,
  `mapLength`, `pieceCount`, `hexCount`, `viewingLevel`, `penMode`, `selectedPieceIDs`,
  `hoveredPieceID`, `isOrthoCam`, `ready`, `placementPreview`
  (`status`, `reason`, `footprintCount`, `unsupported`, `altitude`, and
  `rotation`, or `null`), and
  `drag`: a piece
  press or drag in progress, or `null` (`state` is `'pressed'` or
  `'dragging'`; `targetStatus` is the drop's `'ok'`, `'conflict'` or
  `'blocked'`, or `null` with no target; `unsupported` marks a dragged
  Laur add-on missing required support ports; for a multi-selection it is the
  worst member status; `reason`; `footprintCount`, the total hexes in all
  target footprints, off-map ones included (a target hanging off the map is
  `blocked`/`offMap` with its full footprint; a group member outside the
  altitude bounds is `blocked`/`outOfHeight`); `targetHex`, the hex under the
  pointer, `{ q, r, s, altitude }` or `null`).
- `window.__TEST__.listPieces()`: every placed piece (`uid`, `inventoryID`,
  `altitude`, `rotation`, `pieceCoords`). **uids are random on every load**:
  find pieces by `inventoryID` and coordinates (`findPieceUid` in
  `e2e/fixtures.ts`).
- `window.__TEST__.cameraPose()`: the camera's `position`, `target` and
  `zoom` (rounded), to check that something did not move the camera.
- `window.__TEST__.stats()`: draw calls and triangles.

The bridge is read-only apart from the camera and the setup-only `setPen`
helper. Drive the app through its real UI, hotkeys and canvas clicks, as a user
would. `setPen(penMode, size, rotation?)` is for preparing a preview test;
`hoverHex` in `e2e/fixtures.ts` moves the mouse to the projected hex position.

## Clicking the canvas

Never click guessed coordinates. Ask the app where something is:

```ts
const uid = await findPieceUid(page, { inventoryID: 'g1', q: 0, r: 2 })
await clickPiece(page, uid) // uses __TEST__.screenPosOfPiece
await clickHex(page, { q: 1, r: 2, altitude: 2 }) // uses __TEST__.screenPosOfHex
```

Both return `null` (and the helpers throw) when the target is off screen. Move
the camera instantly with
`await window.__TEST__.setCamera([x, y, z], [targetX, targetY, targetZ])`
(it resolves once the move has rendered), then wait for ready again.
To test a pen hover, use `hoverHex(page, { q, r, altitude })` from
`e2e/fixtures.ts`; it moves the mouse to
`window.__TEST__.screenPosOfHex(...)`.

To drag a piece, use `dragPiece(page, uid, { q, r, altitude })` from
`e2e/fixtures.ts`: it presses at `screenPosOfPiece`, moves in several steps
past the 5 px click tolerance, and releases at `screenPosOfHex`.
`startDrag` does the same without releasing (for Esc, or to read
`snapshot().drag` mid-drag; finish with `page.mouse.up()`). The one selected
piece or an all-draggable selected group drags, in select mode, including
start zones. Dropping a start zone onto an occupied start-zone position is
refused so it cannot disappear. A drag that starts anywhere else or with a
non-draggable member orbits the camera. While dragging, the moving pieces are
see-through to the pointer, so
`drag.targetHex` over their own spots is the hex under them.
For a target that is itself a model (for example, a Laur pillar port), use
`dragPieceToPiece(page, uid, targetUID)`; it uses the bridge's
`screenPosOfPiece` for both endpoints.
For a specific edge of a hovered hex, use `startDragToHexEdge` and
`window.__TEST__.screenPosOfHexEdge`; the helper aims just inside that edge
while still letting the app resolve the real hovered hex and pointer point.
Dragging a ladder moves the grabbed ladder and every contiguous ladder above
it; ladders below it stay in place.
While a drag is active, the mouse wheel rotates the piece or dragged group;
for ladders, the pointer's sector on the hovered hex sets the ladder's
orientation instead.

Things that decide what a click does:

- Only the **left button** acts; handlers listen to `pointerup`.
- It depends on the **pen mode**. The app starts in `select`, where a click
  selects a piece. Paint modes place pieces instead.
- A click that hits nothing clears the selection. Clicking the only selected
  piece again deselects it.
- `screenPosOfPiece` aims at the piece's top surface, except Laur add-ons, for
  which it targets the add-on's canonical side/vertex feature point, and
  ladders / boardPieces-only edge pieces, for which it targets their rendered
  model.
  If another piece sits on top (a stacked tile, a tree, a pillar), the click
  selects that one; such a piece is only reachable from the side, if at all.
- A tall piece in front can hide the target. If a click selects something
  else, check `snapshot().selectedPieceIDs` and move the camera.
- The camera starts orthographic (top-down); `Insert` toggles perspective.
  Switching does not re-frame the map, so call `setCamera` if pieces come
  back `null`.

## Software WebGL

Headless Chromium has no GPU, so `playwright.config.ts` passes SwiftShader
flags. It is slow, so timeouts are generous: do not lower them. If the canvas
is blank or WebGL fails to start, read the browser console first. A headed
browser with a real GPU does not need the flags.

## The fixture map

`e2e/fixture-map.ts` holds a 6x6 map with five pieces (grass, sand, and a rock
stacked on grass). `src/__tests__/e2e-fixture-map.test.ts` checks it still
loads cleanly, so format drift fails in `npm test` rather than in the browser.

## Where the code lives

| What | Where |
| --- | --- |
| On/off switches (read once at load) | `src/e2e/isE2E.ts` |
| Ready signal | `src/e2e/ReadySignal.tsx` (reuses `mapSettleTracker`; window hooks remain e2e-only) |
| `window.__TEST__` | `src/e2e/TestBridge.tsx` |
| Preview test state | `src/e2e/placementPreviewStore.ts` |
| Hidden status text | `src/e2e/E2EStatus.tsx` |
| Window typings | `src/e2e/e2e-globals.d.ts` |
| Tests, fixtures | `e2e/` |
| Viewing-level regression | `e2e/viewing-level.spec.ts` |
| Load-time map fitting | `e2e/load-fits-map.spec.ts` |
| Group rotation around a clicked footprint hex | `e2e/group-rotate-pivot.spec.ts` |
| Single-piece rotation around a clicked footprint hex | `e2e/single-rotate-pivot.spec.ts` |
| Hiding placed start zones in the 3D view | `e2e/start-zone-visibility.spec.ts` |
| View tooltips, camera visibility, and new-map author details | `e2e/ui-polish.spec.ts` |
| Per-hex land pixels, diffuse textures, tier changes, and lights toggles | `e2e/per-hex-land.spec.ts` |
| Lazy Graphics tier texture loading in per-hex land mode | `e2e/graphics-tier.spec.ts` |
| Opt-in performance overlay | `e2e/performance.spec.ts` |

The map-settle tracker also feeds the app's startup UI in normal runs. The
window bridge, hidden status element, deterministic rotation, and other
browser-only hooks remain gated by `isE2E.ts`.
