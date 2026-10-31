import type { Page } from '@playwright/test'
import { FIXTURE_HEX_MAP } from './fixture-map'
import {
  clickPiece,
  dragPieceToPiece,
  expect,
  findPieceUid,
  mapUrl,
  saveEvidence,
  test,
  waitForAppReady,
} from './fixtures'

const LADDER_MAP = {
  ...FIXTURE_HEX_MAP,
  id: 'e2e-ladder-drag',
  name: 'E2E Ladder Drag',
  width: 8,
  length: 8,
}
const LADDER_URL = mapUrl(LADDER_MAP, [
  '0~1~3~0~g1',
  '1~1~3~1~ld',
  '3~1~3~1~ld',
  '0~4~3~0~g1',
  '1~4~3~4~ld',
])

const snapshot = (page: Page) =>
  page.evaluate(() => window.__TEST__?.snapshot())
const piece = async (page: Page, uid: string) =>
  (await page.evaluate(() => window.__TEST__?.listPieces()))?.find(
    (candidate) => candidate.uid === uid,
  )
const undoButton = (page: Page) =>
  page.getByRole('button', { name: /^Undo \(/ })
const undoCount = async (page: Page) =>
  Number((await undoButton(page).getAttribute('aria-label'))?.match(/\d+/)?.[0])

test('dragging the top ladder to another stack moves only it and undo restores the stack', async ({
  page,
}) => {
  await page.goto(LADDER_URL)
  await waitForAppReady(page)
  const bottom = await findPieceUid(page, {
    inventoryID: 'ld',
    q: 1,
    r: 3,
    altitude: 1,
  })
  const top = await findPieceUid(page, {
    inventoryID: 'ld',
    q: 1,
    r: 3,
    altitude: 3,
  })
  const targetLadder = await findPieceUid(page, {
    inventoryID: 'ld',
    q: 4,
    r: 3,
    altitude: 1,
  })
  await clickPiece(page, top)
  await expect
    .poll(async () => (await snapshot(page))?.selectedPieceIDs)
    .toEqual([top])
  const undos = await undoCount(page)

  await dragPieceToPiece(page, top, targetLadder)
  await expect
    .poll(async () => (await piece(page, top))?.pieceCoords)
    .toEqual({
      q: 4,
      r: 3,
      s: -7,
    })
  expect((await piece(page, top))?.altitude).toBe(3)
  expect((await piece(page, top))?.rotation).toBe(4)
  expect((await piece(page, bottom))?.pieceCoords).toEqual({
    q: 1,
    r: 3,
    s: -4,
  })
  expect((await piece(page, bottom))?.altitude).toBe(1)
  expect((await piece(page, targetLadder))?.altitude).toBe(1)
  expect((await snapshot(page))?.selectedPieceIDs).toEqual([top])
  expect(await undoCount(page)).toBe(undos + 1)
  await waitForAppReady(page)
  await saveEvidence(page, 'ladder-stack-drag')

  await undoButton(page).click()
  await expect
    .poll(async () => (await piece(page, top))?.pieceCoords)
    .toEqual({
      q: 1,
      r: 3,
      s: -4,
    })
  expect((await piece(page, top))?.altitude).toBe(3)
  expect((await piece(page, top))?.rotation).toBe(1)
  expect((await piece(page, bottom))?.pieceCoords).toEqual({
    q: 1,
    r: 3,
    s: -4,
  })
  expect((await piece(page, targetLadder))?.altitude).toBe(1)
})
