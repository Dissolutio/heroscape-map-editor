import type { Page } from '@playwright/test'
import { FIXTURE_HEX_MAP } from './fixture-map'
import {
  clickHex,
  clickPiece,
  expect,
  findPieceUid,
  mapUrl,
  test,
  waitForAppReady,
} from './fixtures'

const SINGLE_PIVOT_MAP = {
  ...FIXTURE_HEX_MAP,
  id: 'e2e-single-rotate-pivot',
  name: 'E2E Single Rotate Pivot',
  width: 12,
  length: 12,
}
const SINGLE_PIVOT_URL = mapUrl(SINGLE_PIVOT_MAP, ['0~4~4~0~g3'])

const piece = async (page: Page, uid: string) =>
  (await page.evaluate(() => window.__TEST__?.listPieces()))?.find(
    (item) => item.uid === uid,
  )
const undoButton = (page: Page) =>
  page.getByRole('button', { name: /^Undo \(/ })
const undoCount = async (page: Page) =>
  Number((await undoButton(page).getAttribute('aria-label'))?.match(/\d+/)?.[0])

test('rotates one multi-hex piece around a clicked footprint hex and undoes', async ({
  page,
}) => {
  await page.goto(SINGLE_PIVOT_URL)
  await waitForAppReady(page)

  const tile = await findPieceUid(page, {
    inventoryID: 'g3',
    q: 4,
    r: 4,
  })
  await clickPiece(page, tile)
  await expect
    .poll(() =>
      page.evaluate(() => window.__TEST__?.snapshot().selectedPieceIDs),
    )
    .toEqual([tile])

  await clickHex(page, { q: 5, r: 4, altitude: 1 })
  await expect
    .poll(() => page.evaluate(() => window.__TEST__?.snapshot().rotationPivot))
    .toEqual({
      coords: { q: 5, r: 4, s: -9 },
      surfaceAltitude: 1,
    })
  const before = await piece(page, tile)
  const undos = await undoCount(page)
  await page.screenshot({ path: 'docs/evidence/single-rotate-pivot.png' })

  const rotateClockwise = page.locator(
    'button[title="Rotate selected piece clockwise"]',
  )
  await rotateClockwise.click()
  await waitForAppReady(page)
  await expect
    .poll(() => piece(page, tile))
    .toMatchObject({
      pieceCoords: { q: 5, r: 3, s: -8 },
      rotation: 1,
    })
  await expect
    .poll(() => page.evaluate(() => window.__TEST__?.snapshot().rotationPivot))
    .toEqual({
      coords: { q: 5, r: 4, s: -9 },
      surfaceAltitude: 1,
    })

  await rotateClockwise.click()
  await waitForAppReady(page)
  await expect
    .poll(() => piece(page, tile))
    .toMatchObject({
      pieceCoords: { q: 6, r: 3, s: -9 },
      rotation: 2,
    })
  await expect
    .poll(() => page.evaluate(() => window.__TEST__?.snapshot().rotationPivot))
    .toEqual({
      coords: { q: 5, r: 4, s: -9 },
      surfaceAltitude: 1,
    })
  expect(await undoCount(page)).toBe(undos + 2)

  await undoButton(page).click()
  await waitForAppReady(page)
  await expect
    .poll(() => piece(page, tile))
    .toMatchObject({
      pieceCoords: { q: 5, r: 3, s: -8 },
      rotation: 1,
    })
  await expect
    .poll(() => page.evaluate(() => window.__TEST__?.snapshot().rotationPivot))
    .toEqual({
      coords: { q: 5, r: 3, s: -8 },
      surfaceAltitude: 1,
    })

  await undoButton(page).click()
  await waitForAppReady(page)
  await expect.poll(() => piece(page, tile)).toEqual(before)
  await expect
    .poll(() => page.evaluate(() => window.__TEST__?.snapshot().rotationPivot))
    .toEqual({
      coords: { q: 4, r: 4, s: -8 },
      surfaceAltitude: 1,
    })
})
