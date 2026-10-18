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

## Reading state: `window.__TEST__` and the status element

The canvas is invisible to accessibility snapshots, so read state in text:

- `[data-testid="app-status"]` (visually hidden, still in the accessibility
  tree): map name, piece count, level, pen mode, how many pieces are selected.
- `window.__TEST__.snapshot()`: the same, structured (`mapId`, `pieceCount`,
  `hexCount`, `viewingLevel`, `penMode`, `selectedPieceIDs`,
  `hoveredPieceID`, `isOrthoCam`, `ready`, and `placementPreview`
  (`status`, `reason`, and `footprintCount`, or `null`).
- `window.__TEST__.listPieces()`: every placed piece (`uid`, `inventoryID`,
  `altitude`, `rotation`, `pieceCoords`). **uids are random on every load**:
  find pieces by `inventoryID` and coordinates (`findPieceUid` in
  `e2e/fixtures.ts`).
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

Things that decide what a click does:

- Only the **left button** acts; handlers listen to `pointerup`.
- It depends on the **pen mode**. The app starts in `select`, where a click
  selects a piece. Paint modes place pieces instead.
- A click that hits nothing clears the selection. Clicking the only selected
  piece again deselects it.
- `screenPosOfPiece` aims at the piece's top surface. If another piece sits
  on top (a stacked tile, a tree, a pillar), the click selects that one; such
  a piece is only reachable from the side, if at all.
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
| Ready signal | `src/e2e/ReadySignal.tsx` (reuses `mapSettleTracker`) |
| `window.__TEST__` | `src/e2e/TestBridge.tsx` |
| Preview test state | `src/e2e/placementPreviewStore.ts` |
| Hidden status text | `src/e2e/E2EStatus.tsx` |
| Window typings | `src/e2e/e2e-globals.d.ts` |
| Tests, fixtures | `e2e/` |

All of it renders nothing and installs nothing unless the switch in `isE2E.ts`
is on.
