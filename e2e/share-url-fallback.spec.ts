import { expect, mapUrl, test, waitForAppReady } from './fixtures'
import { FIXTURE_HEX_MAP, FIXTURE_PIECE_IDS } from './fixture-map'

const startZoneIDs = Array.from(
  { length: 700 },
  (_, index) => `0~${index % 28}~${Math.floor(index / 28)}~0~z1`,
)

test('copies a reduced link and leaves the editor map unchanged', async ({
  page,
}) => {
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto(
    mapUrl(FIXTURE_HEX_MAP, [...FIXTURE_PIECE_IDS, ...startZoneIDs]),
  )
  await waitForAppReady(page)

  const originalPieces = await page.evaluate(() =>
    window.__TEST__?.listPieces(),
  )
  const originalSnapshot = await page.evaluate(() =>
    window.__TEST__?.snapshot(),
  )
  expect(originalPieces).toHaveLength(
    FIXTURE_PIECE_IDS.length + startZoneIDs.length,
  )

  await page.getByRole('tab', { name: 'File' }).click()
  await page.getByRole('button', { name: /share map url/i }).click()
  await page.getByRole('button', { name: 'Copy URL' }).click()

  const warning = page.getByRole('alert')
  await expect(warning).toContainText(
    'Your map was too big for a link, so this link leaves out start zones.',
  )
  await expect(warning).toContainText(
    'Download the map file to share everything.',
  )
  await expect(warning.getByRole('button', { name: 'Dismiss' })).toBeVisible()

  const stillInEditor = await page.evaluate(() => window.__TEST__?.listPieces())
  expect(stillInEditor).toEqual(originalPieces)

  const sharedUrl = new URL(
    await page.evaluate(() => navigator.clipboard.readText()),
  )
  expect(sharedUrl.href.length).toBeLessThanOrEqual(2082)
  expect(sharedUrl.searchParams.has('m')).toBe(true)
  sharedUrl.searchParams.set('e2e', '1')
  await page.goto(sharedUrl.toString())
  await waitForAppReady(page)

  const reloadedSnapshot = await page.evaluate(() =>
    window.__TEST__?.snapshot(),
  )
  const reloadedPieces = await page.evaluate(() =>
    window.__TEST__?.listPieces(),
  )
  expect(reloadedSnapshot).toMatchObject({
    mapId: originalSnapshot?.mapId,
    mapName: originalSnapshot?.mapName,
    mapWidth: originalSnapshot?.mapWidth,
    mapLength: originalSnapshot?.mapLength,
    pieceCount: FIXTURE_PIECE_IDS.length,
    objectiveMarkerCount: originalSnapshot?.objectiveMarkerCount,
  })
  expect(reloadedPieces).toHaveLength(FIXTURE_PIECE_IDS.length)
  const pieceDetails = (pieces: typeof originalPieces) =>
    pieces
      ?.map(({ inventoryID, pieceCoords, altitude, rotation }) =>
        JSON.stringify([
          inventoryID,
          pieceCoords.q,
          pieceCoords.r,
          pieceCoords.s,
          altitude,
          rotation,
        ]),
      )
      .sort()
  expect(pieceDetails(reloadedPieces)).toEqual(
    pieceDetails(originalPieces?.filter((piece) => piece.inventoryID !== 'z1')),
  )
})
