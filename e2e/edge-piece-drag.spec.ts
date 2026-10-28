import type { Page } from '@playwright/test'
import type { TestInfo } from '@playwright/test'
import { FIXTURE_HEX_MAP } from './fixture-map'
import {
  clickPiece,
  expect,
  findPieceUid,
  mapUrl,
  startDragToHexEdge,
  test,
  waitForAppReady,
} from './fixtures'

const EDGE_MAP = {
  ...FIXTURE_HEX_MAP,
  id: 'e2e-edge-piece-drag',
  name: 'E2E Edge Piece Drag',
  width: 8,
  length: 8,
}
const EDGE_PIECES = ['-1~2~3~3~bt', '-1~0~4~5~bt', '-1~1~2~1~bt', '-1~1~4~0~rl']
const EDGE_URL = mapUrl(EDGE_MAP, EDGE_PIECES)

const snapshot = (page: Page) =>
  page.evaluate(() => window.__TEST__?.snapshot())
const piece = async (page: Page, uid: string) =>
  (await page.evaluate(() => window.__TEST__?.listPieces()))?.find(
    (item) => item.uid === uid,
  )
const undoButton = (page: Page) =>
  page.getByRole('button', { name: /^Undo \(/ })
const undoCount = async (page: Page) =>
  Number((await undoButton(page).getAttribute('aria-label'))?.match(/\d+/)?.[0])

async function shiftClickPiece(page: Page, uid: string) {
  await waitForAppReady(page)
  const position = await page.evaluate(
    (id) => window.__TEST__?.screenPosOfPiece(id) ?? null,
    uid,
  )
  if (!position) throw new Error(`Piece ${uid} is not on screen`)
  await page
    .locator('canvas')
    .first()
    .click({ position, modifiers: ['Shift'] })
}

test('a selected battlement drags to a resolved edge and undo restores it', async ({
  page,
}, testInfo: TestInfo) => {
  await page.goto(EDGE_URL)
  await waitForAppReady(page)
  const battlement = await findPieceUid(page, {
    inventoryID: 'bt',
    q: 2,
    r: 3,
    altitude: -1,
  })
  await clickPiece(page, battlement)
  await expect
    .poll(async () => (await snapshot(page))?.selectedPieceIDs)
    .toEqual([battlement])

  const undos = await undoCount(page)
  await startDragToHexEdge(page, battlement, {
    q: 4,
    r: 3,
    altitude: 0,
    edge: 1,
  })
  await expect
    .poll(async () => (await snapshot(page))?.drag)
    .toMatchObject({
      state: 'dragging',
      targetStatus: 'ok',
      targetHex: { q: 4, r: 3, altitude: 0 },
    })
  await page.screenshot({
    path: testInfo.outputPath('battlement-edge-drag-preview.png'),
  })
  await page.mouse.up()

  await expect
    .poll(async () => (await piece(page, battlement))?.pieceCoords)
    .toEqual({ q: 4, r: 4, s: -8 })
  expect(await piece(page, battlement)).toMatchObject({
    inventoryID: 'bt',
    altitude: -1,
    rotation: 4,
  })
  expect(await undoCount(page)).toBe(undos + 1)

  await undoButton(page).click()
  await expect
    .poll(async () => (await piece(page, battlement))?.pieceCoords)
    .toEqual({ q: 2, r: 3, s: -5 })
})

test('battlements sharing a support hex keep their edges in a group drag', async ({
  page,
}) => {
  await page.goto(EDGE_URL)
  await waitForAppReady(page)
  const battlements = await Promise.all([
    findPieceUid(page, { inventoryID: 'bt', q: 2, r: 3 }),
    findPieceUid(page, { inventoryID: 'bt', q: 0, r: 4 }),
    findPieceUid(page, { inventoryID: 'bt', q: 1, r: 2 }),
  ])
  await clickPiece(page, battlements[0])
  await shiftClickPiece(page, battlements[1])
  await shiftClickPiece(page, battlements[2])
  await expect
    .poll(async () => (await snapshot(page))?.selectedPieceIDs)
    .toEqual(battlements)

  const before = await page.evaluate(() => window.__TEST__?.listPieces())
  const originals = battlements.map((uid) =>
    before?.find((candidate) => candidate.uid === uid),
  )
  if (originals.some((item) => !item)) {
    throw new Error('selected battlements were not found')
  }
  const undos = await undoCount(page)
  await startDragToHexEdge(page, battlements[0], {
    q: 4,
    r: 3,
    altitude: 0,
    edge: 1,
  })
  await expect
    .poll(async () => (await snapshot(page))?.drag)
    .toMatchObject({
      state: 'dragging',
      targetStatus: 'ok',
      targetHex: { q: 4, r: 3, altitude: 0 },
    })
  await page.mouse.up()

  const moved = await page.evaluate(
    (uids) =>
      uids.map((uid) =>
        window.__TEST__?.listPieces().find((item) => item.uid === uid),
      ),
    battlements,
  )
  expect(moved).toMatchObject([
    { pieceCoords: { q: 5, r: 3, s: -8 }, rotation: 3 },
    { pieceCoords: { q: 3, r: 4, s: -7 }, rotation: 5 },
    { pieceCoords: { q: 4, r: 2, s: -6 }, rotation: 1 },
  ])
  expect(await undoCount(page)).toBe(undos + 1)

  await undoButton(page).click()
  await expect
    .poll(async () =>
      page.evaluate(
        (uids) =>
          uids.map((uid) =>
            window.__TEST__?.listPieces().find((item) => item.uid === uid),
          ),
        battlements,
      ),
    )
    .toEqual(originals)
})

test('a selected rope ladder drags to an edge and undo restores it', async ({
  page,
}) => {
  await page.goto(EDGE_URL)
  await waitForAppReady(page)
  const ladder = await findPieceUid(page, {
    inventoryID: 'rl',
    q: 1,
    r: 4,
    altitude: -1,
  })
  await clickPiece(page, ladder)
  await expect
    .poll(async () => (await snapshot(page))?.selectedPieceIDs)
    .toEqual([ladder])

  const undos = await undoCount(page)
  await startDragToHexEdge(page, ladder, {
    q: 4,
    r: 4,
    altitude: 0,
    edge: 3,
  })
  await expect
    .poll(async () => (await snapshot(page))?.drag)
    .toMatchObject({
      state: 'dragging',
      targetStatus: 'ok',
      targetHex: { q: 4, r: 4, altitude: 0 },
    })
  await page.mouse.up()

  await expect
    .poll(async () => (await piece(page, ladder))?.pieceCoords)
    .toEqual({ q: 4, r: 4, s: -8 })
  expect(await piece(page, ladder)).toMatchObject({
    inventoryID: 'rl',
    altitude: -1,
    rotation: 3,
  })
  expect(await undoCount(page)).toBe(undos + 1)

  await undoButton(page).click()
  await expect
    .poll(async () => (await piece(page, ladder))?.pieceCoords)
    .toEqual({ q: 1, r: 4, s: -5 })
})
