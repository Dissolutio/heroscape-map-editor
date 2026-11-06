import { expect, mapUrl, test, waitForAppReady } from './fixtures'

const hexMap = {
  id: 'adapt-to-collection-e2e',
  name: 'Adapt to collection',
  author: '',
  version: 1,
  shape: 'rectangle',
  width: 8,
  length: 8,
}

const fixturePieces = ['0~1~1~0~sn1', '0~3~1~0~sn1', '1~3~1~0~g1']

const listPieces = async (page: import('@playwright/test').Page) =>
  page.evaluate(() => window.__TEST__?.listPieces())

test('requires a nonempty personal inventory', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('pieceInventory', JSON.stringify({}))
  })
  await page.goto(mapUrl(hexMap, fixturePieces))
  await waitForAppReady(page)
  await page
    .getByRole('tab', { name: /editing details of the current map/ })
    .click()

  const adaptButton = page.getByRole('button', {
    name: 'Adapt to my Collection',
  })
  await expect(adaptButton).toBeDisabled()
  await adaptButton.locator('..').hover()
  await expect(page.getByRole('tooltip')).toHaveText(
    'Add your pieces in the inventory first',
  )
})

test('adapts surface-only land with a buried fill and undoes the batch', async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem('pieceInventory', JSON.stringify({ g1: 10, r1: 10 }))
  })
  await page.goto(mapUrl(hexMap, fixturePieces))
  await waitForAppReady(page)

  await page
    .getByRole('tab', { name: /editing details of the current map/ })
    .click()
  await expect(
    page.getByRole('button', { name: 'Adapt to my Collection' }),
  ).toBeEnabled()

  await page.mouse.move(0, 0)
  await page.getByRole('button', { name: 'Adapt to my Collection' }).click()
  const dialog = page.getByRole('dialog', {
    name: 'Adapt to my Collection',
  })
  await expect(dialog).toContainText('Snow: 1 surface, 1 buried')

  await dialog.getByRole('combobox', { name: 'Snow target terrain' }).click()
  await page.getByRole('option', { name: 'Rock' }).click()
  await dialog
    .getByRole('radiogroup', { name: 'Snow scope' })
    .getByLabel('Surface only')
    .check()
  await expect(dialog).toContainText(
    'Snow: 1 surface, 1 buried → Rock surface, Grass buried',
  )

  await page.mouse.move(0, 0)
  await dialog.getByRole('button', { name: 'Apply adaptation' }).click()
  await expect(dialog.getByRole('status')).toContainText('Adapted 2 pieces')
  await expect
    .poll(async () =>
      (await listPieces(page))?.map((piece) => ({
        inventoryID: piece.inventoryID,
        altitude: piece.altitude,
        q: piece.pieceCoords.q,
        r: piece.pieceCoords.r,
      })),
    )
    .toEqual(
      expect.arrayContaining([
        { inventoryID: 'r1', altitude: 0, q: 1, r: 1 },
        { inventoryID: 'g1', altitude: 0, q: 3, r: 1 },
        { inventoryID: 'g1', altitude: 1, q: 3, r: 1 },
      ]),
    )

  await page.mouse.move(0, 0)
  await dialog.getByRole('button', { name: 'Close' }).click()
  await page.mouse.move(0, 0)
  await page.getByRole('tab', { name: /controls for building the map/ }).click()
  await page.mouse.move(0, 0)
  await page.getByRole('button', { name: /^Undo \(/ }).click()
  await expect
    .poll(async () =>
      (await listPieces(page))?.map((piece) => ({
        inventoryID: piece.inventoryID,
        altitude: piece.altitude,
        q: piece.pieceCoords.q,
        r: piece.pieceCoords.r,
      })),
    )
    .toEqual(
      expect.arrayContaining([
        { inventoryID: 'sn1', altitude: 0, q: 1, r: 1 },
        { inventoryID: 'sn1', altitude: 0, q: 3, r: 1 },
        { inventoryID: 'g1', altitude: 1, q: 3, r: 1 },
      ]),
    )
})
