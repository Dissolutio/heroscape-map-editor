import {
  clickPiece,
  expect,
  findPieceUid,
  mapUrl,
  startDrag,
  startDragToPiece,
  test,
  waitForAppReady,
} from './fixtures'
import { FIXTURE_HEX_MAP } from './fixture-map'

const piece = async (page: import('@playwright/test').Page, uid: string) =>
  (await page.evaluate(() => window.__TEST__?.listPieces()))?.find(
    (item) => item.uid === uid,
  )
const undoButton = (page: import('@playwright/test').Page) =>
  page.getByRole('button', { name: /^Undo \(/ })
const undoCount = async (page: import('@playwright/test').Page) =>
  Number((await undoButton(page).getAttribute('aria-label'))?.match(/\d+/)?.[0])

const LADDER_MAP = {
  ...FIXTURE_HEX_MAP,
  id: 'e2e-drag-rotate-ladder',
  name: 'E2E Drag Rotate Ladder',
  width: 8,
  length: 8,
}
const LADDER_URL = mapUrl(LADDER_MAP, [
  '0~1~3~0~g1',
  '1~1~3~1~ld',
  '0~4~3~0~g1',
  '1~4~3~4~ld',
  '3~1~3~3~ld',
])

test('rotates a dragged piece with the wheel and undo restores it', async ({
  page,
}) => {
  await waitForAppReady(page)
  const uid = await findPieceUid(page, {
    inventoryID: 'g1',
    q: 0,
    r: 2,
    altitude: 0,
  })
  await clickPiece(page, uid)
  const before = await piece(page, uid)
  if (!before) throw new Error('Selected piece is missing')
  const undos = await undoCount(page)

  await startDrag(page, uid, { q: 4, r: 2, altitude: 0 })
  await expect
    .poll(
      async () =>
        (await page.evaluate(() => window.__TEST__?.snapshot()))?.drag,
    )
    .toMatchObject({ state: 'dragging', targetStatus: 'ok' })
  await page.mouse.wheel(0, 100)
  await page.screenshot({ path: 'docs/evidence/drag-rotate-wheel.png' })
  await page.mouse.up()

  await expect
    .poll(async () => (await piece(page, uid))?.pieceCoords)
    .toEqual({ q: 4, r: 2, s: -6 })
  expect(await piece(page, uid)).toMatchObject({
    rotation: 1,
    altitude: 0,
  })
  expect(await undoCount(page)).toBe(undos + 1)

  await undoButton(page).click()
  await expect
    .poll(async () => (await piece(page, uid))?.pieceCoords)
    .toEqual(before.pieceCoords)
  expect(await piece(page, uid)).toMatchObject({
    rotation: before.rotation,
    altitude: before.altitude,
  })
})

test('the pointer sector selects a dragged ladder stack rotation', async ({
  page,
}) => {
  await page.goto(LADDER_URL)
  await waitForAppReady(page)
  const top = await findPieceUid(page, {
    inventoryID: 'ld',
    q: 1,
    r: 3,
    altitude: 3,
  })
  await clickPiece(page, top)
  const before = await piece(page, top)
  if (!before) throw new Error('Selected ladder is missing')

  const targetLadder = await findPieceUid(page, {
    inventoryID: 'ld',
    q: 4,
    r: 3,
    altitude: 1,
  })
  await startDragToPiece(page, top, targetLadder)
  await expect
    .poll(
      async () =>
        (await page.evaluate(() => window.__TEST__?.snapshot()))?.drag,
    )
    .toMatchObject({ state: 'dragging' })
  await page.mouse.wheel(0, 100)
  await page.mouse.up()

  await expect
    .poll(async () => (await piece(page, top))?.pieceCoords)
    .toEqual({ q: 4, r: 3, s: -7 })
  expect(await piece(page, top)).toMatchObject({
    rotation: 4,
    altitude: 3,
  })

  await undoButton(page).click()
  await expect
    .poll(async () => (await piece(page, top))?.pieceCoords)
    .toEqual(before.pieceCoords)
  expect(await piece(page, top)).toMatchObject({
    rotation: before.rotation,
    altitude: before.altitude,
  })
})

test('Escape discards a wheel rotation during drag', async ({ page }) => {
  await waitForAppReady(page)
  const uid = await findPieceUid(page, {
    inventoryID: 'g1',
    q: 0,
    r: 2,
    altitude: 0,
  })
  await clickPiece(page, uid)
  const before = await piece(page, uid)
  if (!before) throw new Error('Selected piece is missing')
  const undos = await undoCount(page)

  await startDrag(page, uid, { q: 4, r: 2, altitude: 0 })
  await page.mouse.wheel(0, 100)
  await page.keyboard.press('Escape')
  await page.mouse.up()

  await expect
    .poll(
      async () =>
        (await page.evaluate(() => window.__TEST__?.snapshot()))?.drag,
    )
    .toBeNull()
  expect(await piece(page, uid)).toMatchObject({
    pieceCoords: before.pieceCoords,
    rotation: before.rotation,
    altitude: before.altitude,
  })
  expect(await undoCount(page)).toBe(undos)
})
