import { clickHex, expect, hoverHex, setPen, test } from './fixtures'

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
  expect(emptyPreview?.status).toBe('ok')
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

  await hoverHex(page, { q: 0, r: 2, altitude: 1 })
  await page.waitForFunction(
    () => window.__TEST__?.snapshot().placementPreview?.status === 'ok',
  )
  const landPreview = await page.evaluate(
    () => window.__TEST__?.snapshot().placementPreview,
  )
  expect(landPreview?.status).toBe('ok')
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
