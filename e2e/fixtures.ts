import { type Page, test as base, expect } from '@playwright/test'
import JSONCrush from 'jsoncrush'
import { FIXTURE_HEX_MAP, FIXTURE_PIECE_IDS } from './fixture-map'

/**
 * Same encoding as getUrlMapString in src/data/jsonCrush.ts: the map header
 * (portrait and notes blanked) followed by the encoded piece ids, crushed.
 */
const FIXTURE_SHARE_PARAM = encodeURIComponent(
  JSONCrush.crush(
    JSON.stringify([
      { ...FIXTURE_HEX_MAP, mapPortraitBase64: '', mapNotes: '' },
      ...FIXTURE_PIECE_IDS,
    ]),
  ),
)

/**
 * Open `/hs` directly, not `/`: the router redirects `/` to `/hs` and drops
 * the query string. `e2e=1` turns on the test hooks; `m=` loads the fixture.
 */
export const FIXTURE_URL = `/hs?e2e=1&m=${FIXTURE_SHARE_PARAM}`

const READY_TIMEOUT_MS = 60_000

/** Resolves once the current map is loaded and the camera is still. */
export async function waitForAppReady(page: Page, timeout = READY_TIMEOUT_MS) {
  await page.waitForFunction(() => window.__APP_READY__ === true, null, {
    timeout,
  })
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
    const piece = window.__TEST__?.listPieces().find(
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

export const test = base.extend({
  // Every test starts on the fixture map, loaded and ready.
  page: async ({ page }, use) => {
    await page.goto(FIXTURE_URL)
    await waitForAppReady(page)
    await use(page)
  },
})

export { expect }
