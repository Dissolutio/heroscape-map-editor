import type { Page } from '@playwright/test'
import { FIXTURE_HEX_MAP } from './fixture-map'
import {
  clickPiece,
  expect,
  findPieceUid,
  mapUrl,
  startDrag,
  test,
  waitForAppReady,
} from './fixtures'

const VOID_MAP = {
  ...FIXTURE_HEX_MAP,
  id: 'e2e-void-mat-drag',
  name: 'E2E Void Mat Drag',
  width: 10,
  length: 8,
}
const VOID_PIECES = ['0~2~0~0~vc1', '0~4~0~0~g1', '0~7~0~0~vc5']
const VOID_URL = mapUrl(VOID_MAP, VOID_PIECES)

const snapshot = (page: Page) =>
  page.evaluate(() => window.__TEST__?.snapshot())

test('selects and drags a Void Mat through other levels', async ({ page }) => {
  await page.goto(VOID_URL)
  await waitForAppReady(page)

  const mat = await findPieceUid(page, {
    inventoryID: 'vc1',
    q: 2,
    r: 0,
    altitude: 0,
  })
  await clickPiece(page, mat)
  await expect
    .poll(async () => (await snapshot(page))?.selectedPieceIDs)
    .toEqual([mat])
  await expect
    .poll(async () => (await snapshot(page))?.hoveredPieceID)
    .toBe(mat)

  await startDrag(page, mat, { q: 4, r: 0, altitude: 1 })
  await expect
    .poll(async () => {
      const state = await snapshot(page)
      return {
        ghostingOtherLevels: state?.ghostingOtherLevels,
        drag: state?.drag,
      }
    })
    .toMatchObject({
      ghostingOtherLevels: true,
      drag: { state: 'dragging', targetHex: { altitude: 0 } },
    })

  const dropHex = (await snapshot(page))?.drag?.targetHex
  expect(dropHex).not.toBeNull()
  if (!dropHex) throw new Error('Void Mat drag has no table target')
  await page.mouse.up()

  await expect
    .poll(async () => {
      const state = await snapshot(page)
      return {
        dragging: state?.drag,
        ghostingOtherLevels: state?.ghostingOtherLevels,
      }
    })
    .toEqual({ dragging: null, ghostingOtherLevels: false })
  expect(
    (await snapshot(page))?.voidPieces.find((piece) => piece.uid === mat),
  ).toMatchObject({
    pieceCoords: { q: dropHex.q, r: dropHex.r, s: dropHex.s },
    altitude: 0,
  })

  const marker = await findPieceUid(page, {
    inventoryID: 'vc5',
    q: 7,
    r: 0,
    altitude: 0,
  })
  await clickPiece(page, marker)
  await expect
    .poll(async () => (await snapshot(page))?.selectedPieceIDs)
    .toEqual([marker])
})
