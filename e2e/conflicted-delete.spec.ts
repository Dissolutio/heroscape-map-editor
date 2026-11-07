import {
  clickPiece,
  expect,
  findPieceUid,
  mapUrl,
  test,
  waitForAppReady,
} from './fixtures'

const hexMap = {
  id: 'conflicted-delete',
  name: 'Conflicted Delete',
  author: '',
  version: 1,
  shape: 'rectangle',
  width: 10,
  length: 10,
}

const pieceIds = [
  '0~2~2~0~w1',
  '0~3~2~0~w1',
  '0~4~2~0~w1',
  '0~2~2~0~sl',
  '0~7~7~0~w1',
]

const sortHexes = (
  hexes: Array<{ q: number; r: number; altitude: number; terrain: string }>,
) =>
  hexes.sort(
    (a, b) =>
      a.altitude - b.altitude ||
      a.q - b.q ||
      a.r - b.r ||
      a.terrain.localeCompare(b.terrain),
  )

test('deleting unrelated water survives share-link reload without changing overlapped water', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto(mapUrl(hexMap, pieceIds))
  await waitForAppReady(page)

  const waterUIDs = await Promise.all(
    [2, 3, 4].map((q) => findPieceUid(page, { inventoryID: 'w1', q, r: 2 })),
  )
  const waterHexesBefore = await Promise.all(
    waterUIDs.map((uid) =>
      page.evaluate(
        (pieceUID) => window.__TEST__?.listPieceHexes(pieceUID),
        uid,
      ),
    ),
  )
  const unrelatedWater = await findPieceUid(page, {
    inventoryID: 'w1',
    q: 7,
    r: 7,
  })

  await clickPiece(page, unrelatedWater)
  await page.getByRole('button', { name: /delete piece/i }).click()

  await expect
    .poll(() => page.evaluate(() => window.__TEST__?.listPieces().length))
    .toBe(4)
  for (const [index, uid] of waterUIDs.entries()) {
    const hexes = await page.evaluate((pieceUID) => {
      return window.__TEST__?.listPieceHexes(pieceUID)
    }, uid)
    expect(sortHexes(hexes ?? [])).toEqual(
      sortHexes(waterHexesBefore[index] ?? []),
    )
  }

  await page.getByRole('tab', { name: 'File' }).click()
  await page.getByRole('button', { name: /share map url/i }).click()
  await page.getByRole('button', { name: 'Copy URL' }).click()
  await expect(
    page.getByText('Copied shareable map URL to clipboard!'),
  ).toBeVisible()
  const sharedUrl = new URL(
    await page.evaluate(() => navigator.clipboard.readText()),
  )
  sharedUrl.searchParams.set('e2e', '1')
  await page.goto(sharedUrl.toString())
  await waitForAppReady(page)

  const reloadedPieces = await page.evaluate(() =>
    window.__TEST__?.listPieces(),
  )
  expect(reloadedPieces).toHaveLength(4)
  expect(
    reloadedPieces?.some(
      (piece) =>
        piece.inventoryID === 'w1' &&
        piece.pieceCoords.q === 7 &&
        piece.pieceCoords.r === 7,
    ),
  ).toBe(false)
  for (let index = 0; index < waterUIDs.length; index += 1) {
    const coords = { q: index + 2, r: 2 }
    const uid = await findPieceUid(page, {
      inventoryID: 'w1',
      ...coords,
    })
    const hexes = await page.evaluate((pieceUID) => {
      return window.__TEST__?.listPieceHexes(pieceUID)
    }, uid)
    expect(sortHexes(hexes ?? [])).toEqual(
      sortHexes(waterHexesBefore[index] ?? []),
    )
  }
})
