import { expect, mapUrl, saveEvidence, test, waitForAppReady } from './fixtures'
import { FIXTURE_HEXAGON_MAP, FIXTURE_PIECE_IDS } from './fixture-map'

async function mapPieces(page: import('@playwright/test').Page) {
  return page.evaluate(() => window.__TEST__?.listPieces() ?? [])
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

test('converts a hexagon map to a rectangle and back without moving pieces', async ({
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

  await page.getByRole('button', { name: 'Convert to rectangle map' }).click()
  await expect(
    page.getByText(/Converted to a rectangle map \(\d+ × \d+\)/),
  ).toBeVisible()
  await waitForAppReady(page)
  await saveEvidence(page, 'convert-map-shape-rectangle')

  expect(await mapPieces(page)).toEqual(originalPieces)
  expect(await mapInventoryText(page)).toBe(originalInventory)
  expect(await undoCount(page)).toBe(originalUndoCount + 1)

  await page
    .getByRole('tab', {
      name: 'Show controls for editing details of the current map',
    })
    .click()
  await page.getByRole('button', { name: 'Convert to hexagon map' }).click()
  await expect(
    page.getByText(/Converted to a hexagon map \(radius \d+\)/),
  ).toBeVisible()
  await waitForAppReady(page)
  await saveEvidence(page, 'convert-map-shape-hexagon')

  expect(await mapPieces(page)).toEqual(originalPieces)
  expect(await mapInventoryText(page)).toBe(originalInventory)
  expect(await undoCount(page)).toBe(originalUndoCount + 2)
})
