import { FIXTURE_HEX_MAP, FIXTURE_PIECE_IDS } from './fixture-map'
import {
  clickHex,
  clickObjectiveMarker,
  clickPiece,
  expect,
  findPieceUid,
  mapUrl,
  OBJECTIVE_MARKERS_FIXTURE_HEX_MAP,
  OBJECTIVE_MARKERS_FIXTURE_PIECE_IDS,
  setPen,
  test,
  waitForAppReady,
} from './fixtures'

const URL = mapUrl(FIXTURE_HEX_MAP, FIXTURE_PIECE_IDS)
const snapshot = (page: import('@playwright/test').Page) =>
  page.evaluate(() => window.__TEST__?.snapshot())

test('a plain click on an empty hex clears piece selection', async ({
  page,
}) => {
  await page.goto(URL)
  await waitForAppReady(page)

  const rock = await findPieceUid(page, { inventoryID: 'r1' })
  await clickPiece(page, rock)
  await expect
    .poll(async () => (await snapshot(page))?.selectedPieceIDs)
    .toEqual([rock])

  await clickHex(page, { q: 0, r: 0, altitude: 0 })
  await expect
    .poll(async () => (await snapshot(page))?.selectedPieceIDs)
    .toEqual([])
})

test('a plain click on an empty hex clears objective-marker selection', async ({
  page,
}) => {
  await page.goto(
    mapUrl(
      OBJECTIVE_MARKERS_FIXTURE_HEX_MAP,
      OBJECTIVE_MARKERS_FIXTURE_PIECE_IDS,
    ),
  )
  await waitForAppReady(page)

  await clickObjectiveMarker(page, 'objective-ground')
  await expect
    .poll(async () => (await snapshot(page))?.selectedObjectiveMarkerUID)
    .toBe('objective-ground')

  await clickHex(page, { q: 0, r: 0, altitude: 0 })
  await expect
    .poll(async () => (await snapshot(page))?.selectedObjectiveMarkerUID)
    .toBeNull()
})

test('a piece pen places on an empty hex without a selection error', async ({
  page,
}) => {
  await page.goto(URL)
  await waitForAppReady(page)
  await setPen(page, 'gn', 1)

  await clickHex(page, { q: 0, r: 0, altitude: 0 })

  await expect
    .poll(async () =>
      page.evaluate(() =>
        window.__TEST__
          ?.listPieces()
          .some(
            (piece) =>
              piece.inventoryID === 'gn1' &&
              piece.pieceCoords.q === 0 &&
              piece.pieceCoords.r === 0,
          ),
      ),
    )
    .toBe(true)
})

test('a camera drag over empty hexes keeps the current selection', async ({
  page,
}) => {
  await page.goto(URL)
  await waitForAppReady(page)

  const rock = await findPieceUid(page, { inventoryID: 'r1' })
  await clickPiece(page, rock)

  const [canvas, point] = await Promise.all([
    page.locator('canvas').first().boundingBox(),
    page.evaluate(
      () =>
        window.__TEST__?.screenPosOfHex({ q: 0, r: 0, altitude: 0 }) ?? null,
    ),
  ])
  if (!canvas || !point) throw new Error('Empty hex is not on screen')

  const x = canvas.x + point.x
  const y = canvas.y + point.y
  await page.mouse.move(x, y)
  await page.mouse.down()
  for (let step = 1; step <= 8; step++) {
    await page.mouse.move(x + step * 10, y - step * 5)
  }
  await page.mouse.up()
  await waitForAppReady(page)

  await expect
    .poll(async () => (await snapshot(page))?.selectedPieceIDs)
    .toEqual([rock])
})
