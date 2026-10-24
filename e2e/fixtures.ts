import { type Page, test as base, expect } from '@playwright/test'
import JSONCrush from 'jsoncrush'
import { FIXTURE_HEX_MAP, FIXTURE_PIECE_IDS } from './fixture-map'

/**
 * The app URL that loads this map. Same encoding as getUrlMapString in
 * src/data/jsonCrush.ts: the map header (portrait and notes blanked) followed
 * by the encoded piece ids, crushed.
 *
 * Open `/hs` directly, not `/`: the router redirects `/` to `/hs` and drops
 * the query string. `e2e=1` turns on the test hooks; `m=` loads the map.
 */
export const mapUrl = (hexMap: object, pieceIds: string[]) =>
  `/hs?e2e=1&m=${encodeURIComponent(
    JSONCrush.crush(
      JSON.stringify([
        { ...hexMap, mapPortraitBase64: '', mapNotes: '' },
        ...pieceIds,
      ]),
    ),
  )}`

export const FIXTURE_URL = mapUrl(FIXTURE_HEX_MAP, FIXTURE_PIECE_IDS)

const READY_TIMEOUT_MS = 60_000
const pageErrors = new WeakMap<Page, string[]>()

function capturePageErrors(page: Page) {
  let errors = pageErrors.get(page)
  if (errors) return errors
  errors = []
  const addError = (message: string) => {
    errors?.push(message)
    if (errors && errors.length > 10) errors.shift()
  }
  page.on('console', (message) => {
    if (message.type() === 'error') addError(message.text())
  })
  page.on('pageerror', (error) => addError(error.message))
  pageErrors.set(page, errors)
  return errors
}

/** Resolves once the current map is loaded and the camera is still. */
export async function waitForAppReady(page: Page, timeout = READY_TIMEOUT_MS) {
  const errors = capturePageErrors(page)
  try {
    await page.waitForFunction(() => window.__APP_READY__ === true, null, {
      timeout,
    })
  } catch (error) {
    if (!String(error).includes('Timeout')) throw error
    let snapshot: unknown
    try {
      snapshot = await page.evaluate(() => {
        const now = performance.now()
        const debug = window.__READY_DEBUG__
        const canvas = document.querySelector('canvas')
        return {
          appReady: window.__APP_READY__ ?? false,
          documentHidden: document.hidden,
          url: window.location.href,
          status: document.querySelector('[data-testid="app-status"]')
            ?.textContent,
          canvasReady: canvas?.dataset.ready ?? null,
          canvasMapID: canvas?.dataset.mapId ?? null,
          readyDebug: debug
            ? {
                ...debug,
                frameAgeMs:
                  debug.lastFrameAt === null
                    ? null
                    : now - debug.lastFrameAt,
                loaderIdleMs: now - debug.lastLoaderActiveAt,
              }
            : null,
        }
      })
    } catch {
      snapshot = { unavailable: 'page closed or evaluation failed' }
    }
    throw new Error(
      `App-ready timeout after ${timeout} ms.\n${String(error)}\nDiagnostics: ${JSON.stringify(
        { snapshot, consoleErrors: errors },
        null,
        2,
      )}`,
    )
  }
}

type PieceMatch = {
  inventoryID: string
  q?: number
  r?: number
  altitude?: number
}

/**
 * The uid of a placed piece. Uids are random on every load, so find pieces by
 * what they are and where they sit instead.
 */
export async function findPieceUid(page: Page, match: PieceMatch) {
  const uid = await page.evaluate((m) => {
    const piece = window.__TEST__
      ?.listPieces()
      .find(
        (p) =>
          p.inventoryID === m.inventoryID &&
          (m.q === undefined || p.pieceCoords.q === m.q) &&
          (m.r === undefined || p.pieceCoords.r === m.r) &&
          (m.altitude === undefined || p.altitude === m.altitude),
      )
    return piece?.uid ?? null
  }, match)
  if (!uid) {
    throw new Error(`No placed piece matches ${JSON.stringify(match)}`)
  }
  return uid
}

async function clickCanvasAt(
  page: Page,
  point: { x: number; y: number } | null,
  what: string,
) {
  if (!point) {
    throw new Error(
      `${what} is not on screen (missing, behind the camera, or off the canvas). Move the camera with window.__TEST__.setCamera(...) and try again.`,
    )
  }
  await page.locator('canvas').first().click({ position: point })
}

/** Left-click the top of a placed piece, as a user would. */
export async function clickPiece(page: Page, uid: string) {
  await waitForAppReady(page)
  const point = await page.evaluate(
    (id) => window.__TEST__?.screenPosOfPiece(id) ?? null,
    uid,
  )
  await clickCanvasAt(page, point, `Piece ${uid}`)
}

/** Left-click the top surface of a hex. */
export async function clickHex(
  page: Page,
  hex: { q: number; r: number; altitude: number },
) {
  await waitForAppReady(page)
  const point = await page.evaluate(
    (h) => window.__TEST__?.screenPosOfHex(h) ?? null,
    hex,
  )
  await clickCanvasAt(page, point, `Hex ${JSON.stringify(hex)}`)
}

/** Move the pointer to a hex using its projected canvas position. */
export async function hoverHex(
  page: Page,
  hex: { q: number; r: number; altitude: number },
) {
  await waitForAppReady(page)
  const point = await page.evaluate(
    (h) => window.__TEST__?.screenPosOfHex(h) ?? null,
    hex,
  )
  const canvas = await page.locator('canvas').first().boundingBox()
  if (!point || !canvas) {
    throw new Error(`Hex ${JSON.stringify(hex)} is not on screen`)
  }
  await page.mouse.move(canvas.x + point.x, canvas.y + point.y)
}

/** A canvas point (from screenPosOf*) in page coordinates, for page.mouse. */
async function toPagePoint(
  page: Page,
  point: { x: number; y: number } | null,
  what: string,
) {
  const canvas = await page.locator('canvas').first().boundingBox()
  if (!point || !canvas) throw new Error(`${what} is not on screen`)
  return { x: canvas.x + point.x, y: canvas.y + point.y }
}

const piecePagePoint = async (page: Page, uid: string) =>
  toPagePoint(
    page,
    await page.evaluate(
      (id) => window.__TEST__?.screenPosOfPiece(id) ?? null,
      uid,
    ),
    `Piece ${uid}`,
  )

const hexPagePoint = async (
  page: Page,
  hex: { q: number; r: number; altitude: number },
) =>
  toPagePoint(
    page,
    await page.evaluate((h) => window.__TEST__?.screenPosOfHex(h) ?? null, hex),
    `Hex ${JSON.stringify(hex)}`,
  )

const hexEdgePagePoint = async (
  page: Page,
  hex: { q: number; r: number; altitude: number; edge: number },
) =>
  toPagePoint(
    page,
    await page.evaluate(
      (target) => window.__TEST__?.screenPosOfHexEdge(target) ?? null,
      hex,
    ),
    `Edge ${JSON.stringify(hex)}`,
  )

/**
 * Press the left button on a piece and move to a hex in several steps (past
 * the 5 px click tolerance), without releasing. Only an already selected
 * piece starts a drag; on any other the camera orbits, as it does today.
 */
export async function startDrag(
  page: Page,
  uid: string,
  toHex: { q: number; r: number; altitude: number },
  steps = 8,
) {
  await waitForAppReady(page)
  const from = await piecePagePoint(page, uid)
  const to = await hexPagePoint(page, toHex)
  await page.mouse.move(from.x, from.y)
  await page.mouse.down()
  for (let i = 1; i <= steps; i++) {
    await page.mouse.move(
      from.x + ((to.x - from.x) * i) / steps,
      from.y + ((to.y - from.y) * i) / steps,
    )
  }
}

/** Drag a piece onto a hex and release there (see startDrag). */
export async function dragPiece(
  page: Page,
  uid: string,
  toHex: { q: number; r: number; altitude: number },
  steps = 8,
) {
  await startDrag(page, uid, toHex, steps)
  await page.mouse.up()
}

/** Press and drag a piece to one edge of a hex without releasing. */
export async function startDragToHexEdge(
  page: Page,
  uid: string,
  target: { q: number; r: number; altitude: number; edge: number },
  steps = 8,
) {
  await waitForAppReady(page)
  const from = await piecePagePoint(page, uid)
  const to = await hexEdgePagePoint(page, target)
  await page.mouse.move(from.x, from.y)
  await page.mouse.down()
  for (let i = 1; i <= steps; i++) {
    await page.mouse.move(
      from.x + ((to.x - from.x) * i) / steps,
      from.y + ((to.y - from.y) * i) / steps,
    )
  }
}

/** Press and drag between model positions reported by the app test bridge. */
export async function startDragToPiece(
  page: Page,
  uid: string,
  targetUID: string,
  steps = 8,
) {
  await waitForAppReady(page)
  const from = await piecePagePoint(page, uid)
  const to = await piecePagePoint(page, targetUID)
  await page.mouse.move(from.x, from.y)
  await page.mouse.down()
  for (let i = 1; i <= steps; i++) {
    await page.mouse.move(
      from.x + ((to.x - from.x) * i) / steps,
      from.y + ((to.y - from.y) * i) / steps,
    )
  }
}

/** Drag a piece between model positions reported by the app test bridge. */
export async function dragPieceToPiece(
  page: Page,
  uid: string,
  targetUID: string,
  steps = 8,
) {
  await startDragToPiece(page, uid, targetUID, steps)
  await page.mouse.up()
}

/** Set paint controls through the E2E-only setup hook. */
export async function setPen(
  page: Page,
  penMode: string,
  size: number,
  rotation?: number,
) {
  await page.evaluate(
    ({ mode, pieceSize, penRotation }) =>
      window.__TEST__?.setPen(mode, pieceSize, penRotation),
    { mode: penMode, pieceSize: size, penRotation: rotation },
  )
}

export const test = base.extend({
  // Every test starts on the fixture map, loaded and ready.
  page: async ({ page }, use) => {
    capturePageErrors(page)
    await page.goto(FIXTURE_URL)
    await waitForAppReady(page)
    await use(page)
  },
})

export { expect }
