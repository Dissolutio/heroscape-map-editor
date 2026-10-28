import type { Page } from '@playwright/test'
import { FIXTURE_HEX_MAP } from './fixture-map'
import {
  clickPiece,
  expect,
  findPieceUid,
  mapUrl,
  saveEvidence,
  test,
  waitForAppReady,
} from './fixtures'

const ROTATION_MAP = {
  ...FIXTURE_HEX_MAP,
  id: 'e2e-group-rotate-pivot',
  name: 'E2E Group Rotate Pivot',
  width: 12,
  length: 12,
}
const ROTATION_PIECES = ['0~2~4~0~g1', '0~6~4~0~r1', '0~4~4~0~s1']
const ROTATION_URL = mapUrl(ROTATION_MAP, ROTATION_PIECES)
const MULTI_HEX_ROTATION_URL = mapUrl(ROTATION_MAP, [
  '0~2~4~0~g1',
  '0~6~4~0~r1',
  '0~4~4~0~g3',
])

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

async function shiftClickHex(
  page: Page,
  hex: { q: number; r: number; altitude: number },
) {
  await waitForAppReady(page)
  const position = await page.evaluate(
    (coords) => window.__TEST__?.screenPosOfHex(coords) ?? null,
    hex,
  )
  if (!position) throw new Error(`Hex ${JSON.stringify(hex)} is not on screen`)
  await page
    .locator('canvas')
    .first()
    .click({ position, modifiers: ['Shift'] })
}

test('rotates three selected pieces around the default pivot hex and undoes', async ({
  page,
}) => {
  await page.goto(ROTATION_URL)
  await waitForAppReady(page)

  const first = await findPieceUid(page, {
    inventoryID: 'g1',
    q: 2,
    r: 4,
  })
  const second = await findPieceUid(page, {
    inventoryID: 'r1',
    q: 6,
    r: 4,
  })
  const pivot = await findPieceUid(page, {
    inventoryID: 's1',
    q: 4,
    r: 4,
  })
  await clickPiece(page, first)
  await shiftClickPiece(page, second)
  await shiftClickPiece(page, pivot)
  await expect
    .poll(() =>
      page.evaluate(() => window.__TEST__?.snapshot().selectedPieceIDs),
    )
    .toEqual([first, second, pivot])

  const before = {
    first: await piece(page, first),
    second: await piece(page, second),
    pivot: await piece(page, pivot),
  }
  const undos = await undoCount(page)
  await page
    .locator(
      'button[title="Rotate selected pieces around the pivot hex clockwise"]',
    )
    .click()
  await waitForAppReady(page)

  await expect
    .poll(() => piece(page, first))
    .toMatchObject({
      pieceCoords: { q: 4, r: 2, s: -6 },
      rotation: 1,
    })
  await expect
    .poll(() => piece(page, second))
    .toMatchObject({
      pieceCoords: { q: 4, r: 6, s: -10 },
      rotation: 1,
    })
  await expect
    .poll(() => piece(page, pivot))
    .toMatchObject({
      pieceCoords: { q: 4, r: 4, s: -8 },
      rotation: 1,
    })
  expect(await undoCount(page)).toBe(undos + 1)
  expect(
    await page.evaluate(() => window.__TEST__?.snapshot().selectedPieceIDs),
  ).toEqual([first, second, pivot])
  await saveEvidence(page, 'group-rotate-pivot')

  await undoButton(page).click()
  await waitForAppReady(page)
  await expect.poll(() => piece(page, first)).toEqual(before.first)
  await expect.poll(() => piece(page, second)).toEqual(before.second)
  await expect.poll(() => piece(page, pivot)).toEqual(before.pivot)
})

test('rotates around a clicked non-origin hex of a multi-hex pivot piece', async ({
  page,
}) => {
  await page.goto(MULTI_HEX_ROTATION_URL)
  await waitForAppReady(page)

  const first = await findPieceUid(page, {
    inventoryID: 'g1',
    q: 2,
    r: 4,
  })
  const second = await findPieceUid(page, {
    inventoryID: 'r1',
    q: 6,
    r: 4,
  })
  const pivot = await findPieceUid(page, {
    inventoryID: 'g3',
    q: 4,
    r: 4,
  })
  await clickPiece(page, first)
  await shiftClickPiece(page, second)
  await shiftClickHex(page, { q: 5, r: 4, altitude: 1 })
  await expect
    .poll(() =>
      page.evaluate(() => window.__TEST__?.snapshot().selectedPieceIDs),
    )
    .toEqual([first, second, pivot])
  await expect
    .poll(() => page.evaluate(() => window.__TEST__?.snapshot().rotationPivot))
    .toEqual({
      coords: { q: 5, r: 4, s: -9 },
      surfaceAltitude: 1,
    })

  const before = {
    first: await piece(page, first),
    second: await piece(page, second),
    pivot: await piece(page, pivot),
  }
  const undos = await undoCount(page)
  await saveEvidence(page, 'group-rotate-pivot')
  await page
    .locator(
      'button[title="Rotate selected pieces around the pivot hex clockwise"]',
    )
    .click()
  await waitForAppReady(page)

  await expect
    .poll(() => piece(page, first))
    .toMatchObject({
      pieceCoords: { q: 5, r: 1, s: -6 },
      rotation: 1,
    })
  await expect
    .poll(() => piece(page, second))
    .toMatchObject({
      pieceCoords: { q: 5, r: 5, s: -10 },
      rotation: 1,
    })
  await expect
    .poll(() => piece(page, pivot))
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
  expect(await undoCount(page)).toBe(undos + 1)

  const afterFirstRotation = {
    first: await piece(page, first),
    second: await piece(page, second),
    pivot: await piece(page, pivot),
  }
  await page
    .locator(
      'button[title="Rotate selected pieces around the pivot hex clockwise"]',
    )
    .click()
  await waitForAppReady(page)

  await expect
    .poll(() => piece(page, first))
    .toMatchObject({
      pieceCoords: { q: 8, r: 1, s: -9 },
      rotation: 2,
    })
  await expect
    .poll(() => piece(page, second))
    .toMatchObject({
      pieceCoords: { q: 4, r: 5, s: -9 },
      rotation: 2,
    })
  await expect
    .poll(() => piece(page, pivot))
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
  await expect.poll(() => piece(page, first)).toEqual(afterFirstRotation.first)
  await expect
    .poll(() => piece(page, second))
    .toEqual(afterFirstRotation.second)
  await expect.poll(() => piece(page, pivot)).toEqual(afterFirstRotation.pivot)

  await undoButton(page).click()
  await waitForAppReady(page)
  await expect.poll(() => piece(page, first)).toEqual(before.first)
  await expect.poll(() => piece(page, second)).toEqual(before.second)
  await expect.poll(() => piece(page, pivot)).toEqual(before.pivot)
})
