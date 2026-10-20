import { expect, mapUrl, test, waitForAppReady } from './fixtures'

const hexMap = {
  id: 'overhanging-fixture',
  name: 'Overhanging Fixture',
  author: 'e2e',
  version: 1,
  shape: 'rectangle',
  width: 6,
  length: 6,
}
const pieceIds = ['0~4~2~0~g2']

test('loads, grows, and share-round-trips a map with an overhanging piece', async ({
  page,
}) => {
  await page.goto(mapUrl(hexMap, pieceIds))
  await expect(page.getByRole('alert')).toContainText(
    'Hexoscape has adjusted your map dimensions to fit all pieces',
  )
  await waitForAppReady(page)
  let snapshot = await page.evaluate(() => window.__TEST__?.snapshot())
  expect(snapshot?.mapWidth).toBe(7)
  expect(snapshot?.mapLength).toBe(6)
  expect(snapshot?.pieceCount).toBe(1)
  expect(await page.evaluate(() => window.__TEST__?.listPieces())).toEqual([
    expect.objectContaining({
      inventoryID: 'g2',
      pieceCoords: { q: 4, r: 2, s: -6 },
    }),
  ])

  await page.goto(mapUrl({ ...hexMap, width: 7 }, pieceIds))
  await waitForAppReady(page)
  snapshot = await page.evaluate(() => window.__TEST__?.snapshot())
  expect(snapshot?.mapWidth).toBe(7)
  expect(snapshot?.mapLength).toBe(6)
  expect(snapshot?.pieceCount).toBe(1)
})
