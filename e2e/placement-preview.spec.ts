import { FIXTURE_HEX_MAP, FIXTURE_PIECE_IDS } from './fixture-map'
import {
  clickHex,
  clickPiece,
  expect,
  findPieceUid,
  hoverHex,
  mapUrl,
  setPen,
  test,
  waitForAppReady,
} from './fixtures'

test('a solid land pen previews ok over a free hex', async ({ page }) => {
  await setPen(page, 'g', 1)
  await hoverHex(page, { q: 0, r: 0, altitude: 0 })

  await page.waitForFunction(
    () => window.__TEST__?.snapshot().placementPreview?.status === 'ok',
  )
  const snapshot = await page.evaluate(() => window.__TEST__?.snapshot())
  expect(snapshot?.placementPreview).toMatchObject({
    status: 'ok',
    reason: null,
    footprintCount: 1,
  })
})

test('a Laur add-on previews and places on empty and land hexes', async ({
  page,
}) => {
  await setPen(page, 'lws', 0)
  await hoverHex(page, { q: 0, r: 0, altitude: 0 })
  await page.waitForFunction(
    () => window.__TEST__?.snapshot().placementPreview?.status === 'ok',
  )
  const emptyPreview = await page.evaluate(
    () => window.__TEST__?.snapshot().placementPreview,
  )
  expect(emptyPreview).toMatchObject({
    status: 'ok',
    unsupported: true,
  })
  await clickHex(page, { q: 0, r: 0, altitude: 0 })
  await page.waitForFunction(
    () =>
      window.__TEST__?.snapshot().pieceCount === 6 &&
      window.__TEST__
        ?.listPieces()
        .some(
          (piece) =>
            piece.inventoryID === 'lws' &&
            piece.pieceCoords.q === 0 &&
            piece.pieceCoords.r === 0 &&
            piece.altitude === 0,
        ),
  )
  await page.waitForFunction(
    () =>
      window.__TEST__?.snapshot().placementPreview?.status === 'conflict' &&
      window.__TEST__?.snapshot().placementPreview?.unsupported === true,
  )
  const conflictedPreview = await page.evaluate(
    () => window.__TEST__?.snapshot().placementPreview,
  )
  expect(conflictedPreview).toMatchObject({
    status: 'conflict',
    unsupported: true,
  })

  await hoverHex(page, { q: 0, r: 2, altitude: 1 })
  await page.waitForFunction(
    () =>
      window.__TEST__?.snapshot().placementPreview?.status === 'ok' &&
      window.__TEST__?.snapshot().placementPreview?.unsupported === true,
  )
  const landPreview = await page.evaluate(
    () => window.__TEST__?.snapshot().placementPreview,
  )
  expect(landPreview).toMatchObject({
    status: 'ok',
    unsupported: true,
  })
  await clickHex(page, { q: 0, r: 2, altitude: 1 })
  await page.waitForFunction(
    () =>
      window.__TEST__?.snapshot().pieceCount === 7 &&
      window.__TEST__
        ?.listPieces()
        .some(
          (piece) =>
            piece.inventoryID === 'lws' &&
            piece.pieceCoords.q === 0 &&
            piece.pieceCoords.r === 2 &&
            piece.altitude === 1,
        ),
  )
})

test('a stackable Laur wall places eight levels above the wall it hits', async ({
  page,
}) => {
  await page.goto(
    mapUrl(FIXTURE_HEX_MAP, [...FIXTURE_PIECE_IDS, '1~0~2~0~lws2']),
  )
  await waitForAppReady(page)
  const lowerUID = await findPieceUid(page, {
    inventoryID: 'lws2',
    q: 0,
    r: 2,
    altitude: 1,
  })
  await setPen(page, 'lws', 2, 0)
  await clickPiece(page, lowerUID)
  await page.waitForFunction(() => window.__TEST__?.snapshot().pieceCount === 7)
  const wallPieces = await page.evaluate(() =>
    window.__TEST__
      ?.listPieces()
      .filter(
        (piece) =>
          piece.inventoryID === 'lws2' &&
          piece.pieceCoords.q === 0 &&
          piece.pieceCoords.r === 2,
      ),
  )
  expect(wallPieces?.map((piece) => piece.altitude).sort()).toEqual([1, 9])
})

test('a stackable square pillar preview and placement use the +8 step', async ({
  page,
}) => {
  await page.goto(
    mapUrl(FIXTURE_HEX_MAP, [...FIXTURE_PIECE_IDS, '1~0~2~0~lwp2']),
  )
  await waitForAppReady(page)
  const lowerUID = await findPieceUid(page, {
    inventoryID: 'lwp2',
    q: 0,
    r: 2,
    altitude: 1,
  })
  await setPen(page, 'lwp2', 0, 0)
  const point = await page.evaluate(
    (uid) => window.__TEST__?.screenPosOfPiece(uid) ?? null,
    lowerUID,
  )
  const canvas = await page.locator('canvas').first().boundingBox()
  if (!point || !canvas) throw new Error('Stacked pillar is not on screen')
  await page.mouse.move(canvas.x + point.x, canvas.y + point.y)
  await page.waitForFunction(
    () => window.__TEST__?.snapshot().placementPreview?.altitude === 9,
  )
  await clickPiece(page, lowerUID)
  await page.waitForFunction(() => window.__TEST__?.snapshot().pieceCount === 7)
  const pillars = await page.evaluate(() =>
    window.__TEST__
      ?.listPieces()
      .filter(
        (piece) =>
          piece.inventoryID === 'lwp2' &&
          piece.pieceCoords.q === 0 &&
          piece.pieceCoords.r === 2,
      ),
  )
  expect(pillars?.map((piece) => piece.altitude).sort()).toEqual([1, 9])
})

test('Laur add-on previews snap to square and triangle pillar ports', async ({
  page,
}) => {
  await page.goto(
    mapUrl(FIXTURE_HEX_MAP, [
      ...FIXTURE_PIECE_IDS,
      '1~0~2~0~lwp',
      '0~3~2~0~g1',
      '1~3~2~0.5~lwt',
    ]),
  )
  await waitForAppReady(page)

  await setPen(page, 'lwl', 0, 0.5)
  await hoverHex(page, { q: 0, r: 2, altitude: 14 })
  await page.waitForFunction(() => {
    const rotation = window.__TEST__?.snapshot().placementPreview?.rotation
    return rotation === 1.5 || rotation === 4.5
  })
  const squareRotation = await page.evaluate(
    () => window.__TEST__?.snapshot().placementPreview?.rotation,
  )
  expect([1.5, 4.5]).toContain(squareRotation)

  await setPen(page, 'lwl', 0, 1.5)
  await hoverHex(page, { q: 3, r: 2, altitude: 14 })
  await page.waitForFunction(() => {
    const rotation = window.__TEST__?.snapshot().placementPreview?.rotation
    return rotation === 0.5 || rotation === 2.5 || rotation === 4.5
  })
  const trianglePreview = await page.evaluate(
    () => window.__TEST__?.snapshot().placementPreview,
  )
  expect([0.5, 2.5, 4.5]).toContain(trianglePreview?.rotation)
  expect(trianglePreview?.rotation).not.toBe(1.5)
})
