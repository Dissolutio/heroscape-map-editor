import { expect, mapUrl, saveEvidence, test, waitForAppReady } from './fixtures'
import { FIXTURE_HEXAGON_MAP, FIXTURE_PIECE_IDS } from './fixture-map'

async function mapPieces(page: import('@playwright/test').Page) {
  return page.evaluate(() => window.__TEST__?.listPieces() ?? [])
}

async function expectUniformPieceTranslation(
  page: import('@playwright/test').Page,
  previousPieces: Awaited<ReturnType<typeof mapPieces>>,
) {
  const nextPieces = await mapPieces(page)
  expect(nextPieces).toHaveLength(previousPieces.length)
  const previousByUID = new Map(
    previousPieces.map((piece) => [piece.uid, piece]),
  )
  const firstPiece = nextPieces[0]
  const firstPrevious = firstPiece
    ? previousByUID.get(firstPiece.uid)
    : undefined
  if (!firstPiece || !firstPrevious) {
    throw new Error('Expected pieces before and after map conversion')
  }
  const offset = {
    q: firstPiece.pieceCoords.q - firstPrevious.pieceCoords.q,
    r: firstPiece.pieceCoords.r - firstPrevious.pieceCoords.r,
    s: firstPiece.pieceCoords.s - firstPrevious.pieceCoords.s,
  }

  for (const piece of nextPieces) {
    const previous = previousByUID.get(piece.uid)
    if (!previous) throw new Error(`Missing piece ${piece.uid}`)
    expect(piece).toMatchObject({
      inventoryID: previous.inventoryID,
      altitude: previous.altitude,
      rotation: previous.rotation,
      pieceCoords: {
        q: previous.pieceCoords.q + offset.q,
        r: previous.pieceCoords.r + offset.r,
        s: previous.pieceCoords.s + offset.s,
      },
    })
  }
  const snapshot = await page.evaluate(() => window.__TEST__?.snapshot())
  expect(snapshot?.mapOriginQ).toBe(0)
  expect(snapshot?.mapOriginR).toBe(0)
  return { nextPieces, offset }
}

async function mapInventoryText(page: import('@playwright/test').Page) {
  await page.getByRole('tab', { name: 'Build' }).click()
  await page.getByRole('button', { name: 'View Map Inventory' }).click()
  const dialog = page.getByRole('dialog', { name: 'View Map Inventory' })
  await expect(dialog).toBeVisible()
  const text = await dialog.innerText()
  await dialog.getByRole('button', { name: 'Close' }).click()
  return text
}

async function undoCount(page: import('@playwright/test').Page) {
  const label = await page
    .getByRole('button', { name: /^Undo \(/ })
    .getAttribute('aria-label')
  const count = label?.match(/\d+/)?.[0]
  if (!count) throw new Error('Could not read the undo history count')
  return Number(count)
}

test('normalizes piece coordinates when converting to rectangle and hexagon', async ({
  page,
}) => {
  await page.goto(mapUrl(FIXTURE_HEXAGON_MAP, FIXTURE_PIECE_IDS))
  await waitForAppReady(page)

  const originalPieces = await mapPieces(page)
  const originalInventory = await mapInventoryText(page)
  const originalUndoCount = await undoCount(page)
  await page
    .getByRole('tab', {
      name: 'Show controls for editing details of the current map',
    })
    .click()

  await expect(
    page.getByRole('button', { name: 'Convert to rectangle map' }),
  ).toHaveCount(0)
  await page.getByRole('button', { name: 'Edit Map Details' }).click()
  const detailsDialog = page.getByRole('dialog', { name: 'Edit Map' })
  await detailsDialog
    .getByRole('button', { name: 'Convert to rectangle map' })
    .click()
  await expect(
    page.getByText(/Converted to a rectangle map \(\d+ × \d+\)/),
  ).toBeVisible()
  await waitForAppReady(page)
  await saveEvidence(page, 'convert-map-shape-rectangle')

  const { nextPieces: rectanglePieces, offset } =
    await expectUniformPieceTranslation(page, originalPieces)
  expect(offset).toEqual({ q: 1, r: -1, s: 0 })
  await detailsDialog.getByRole('button', { name: 'Cancel' }).click()
  expect(await mapInventoryText(page)).toBe(originalInventory)
  expect(await undoCount(page)).toBe(originalUndoCount + 1)

  await page
    .getByRole('tab', {
      name: 'Show controls for editing details of the current map',
    })
    .click()
  await page.getByRole('button', { name: 'Edit Map Details' }).click()
  const rectangleDetailsDialog = page.getByRole('dialog', { name: 'Edit Map' })
  await rectangleDetailsDialog
    .getByRole('button', { name: 'Convert to hexagon map' })
    .click()
  await expect(
    page.getByText(/Converted to a hexagon map \(size \d+\)/),
  ).toBeVisible()
  await waitForAppReady(page)
  await saveEvidence(page, 'convert-map-shape-hexagon')

  await expectUniformPieceTranslation(page, rectanglePieces)
  await rectangleDetailsDialog.getByRole('button', { name: 'Cancel' }).click()
  expect(await mapInventoryText(page)).toBe(originalInventory)
  expect(await undoCount(page)).toBe(originalUndoCount + 2)
})
