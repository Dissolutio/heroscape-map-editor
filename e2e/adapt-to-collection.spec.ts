import { expect, mapUrl, test, waitForAppReady } from './fixtures'

const hexMap = {
  id: 'adapt-to-collection-e2e',
  name: 'Adapt to collection',
  author: 'Original author',
  version: 1,
  shape: 'rectangle',
  width: 8,
  length: 8,
}

const fixturePieces = ['0~1~1~0~sn1', '0~3~1~0~sn1', '1~3~1~0~g1']
const evergreenFixturePieces = ['0~1~1~0~tr10']
const ropeLadderFixturePieces = ['0~1~1~0~rl']

const listPieces = async (page: import('@playwright/test').Page) =>
  page.evaluate(() => window.__TEST__?.listPieces())

const savedMetadata = async (page: import('@playwright/test').Page) =>
  page.evaluate(() => {
    const saved = localStorage.getItem('lastMap')
    return saved ? JSON.parse(saved).hexMap : null
  })

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

test('adapts a missing evergreen to an owned same-footprint snow tree and undoes it', async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem('pieceInventory', JSON.stringify({ str10: 1 }))
  })
  await page.goto(mapUrl(hexMap, evergreenFixturePieces))
  await waitForAppReady(page)
  await page
    .getByRole('tab', { name: /editing details of the current map/ })
    .click()
  await page.getByRole('button', { name: 'Adapt to my Collection' }).click()

  const dialog = page.getByRole('dialog', { name: 'Adapt to my Collection' })
  await expect(dialog).toContainText('Evergreen Tree (10)')
  await expect(dialog).toContainText('1 of 1 missing pieces covered')
  await dialog
    .getByRole('button', { name: 'Continue to name adapted map' })
    .click()
  await page
    .getByRole('dialog', { name: 'Name adapted map' })
    .getByRole('button', { name: 'Create adapted map' })
    .click()

  const summary = page.getByRole('dialog', {
    name: 'Adapted map to collection',
  })
  await expect(summary.getByRole('status')).toContainText('Adapted 1 piece')
  await expect
    .poll(async () => (await listPieces(page))?.[0]?.inventoryID)
    .toBe('str10')

  await summary.getByRole('button', { name: 'Close' }).click()
  await page.mouse.move(0, 0)
  await page.getByRole('tab', { name: /controls for building the map/ }).click()
  await page.mouse.move(0, 0)
  await page.getByRole('button', { name: /^Undo \(/ }).click()
  await expect
    .poll(async () => (await listPieces(page))?.[0]?.inventoryID)
    .toBe('tr10')
})

test('warns when a gameplay-affecting obstacle is selected as a substitute', async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem('pieceInventory', JSON.stringify({ cn: 1 }))
  })
  await page.goto(mapUrl(hexMap, ropeLadderFixturePieces))
  await waitForAppReady(page)
  await page
    .getByRole('tab', { name: /editing details of the current map/ })
    .click()
  await page.getByRole('button', { name: 'Adapt to my Collection' }).click()

  const dialog = page.getByRole('dialog', { name: 'Adapt to my Collection' })
  const substitute = dialog.getByRole('combobox', {
    name: 'Rope Ladder 1st substitute',
  })
  await substitute.click()
  await page.getByRole('option', { name: /Cannon.*changes gameplay/ }).click()
  await expect(dialog.getByRole('alert')).toContainText('Changes gameplay')
})

test('names a new adaptation, preserves metadata on cancel, and undoes it', async ({
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

  const originalPieces = await listPieces(page)
  const openDialog = async () => {
    await page.mouse.move(0, 0)
    await page.getByRole('button', { name: 'Adapt to my Collection' }).click()
    return page.getByRole('dialog', { name: 'Adapt to my Collection' })
  }
  let dialog = await openDialog()
  await expect(dialog.getByRole('table').first().getByRole('row')).toHaveCount(
    2,
  )
  await expect(dialog).toContainText('Snow')
  await expect(dialog).not.toContainText('Generic')
  await dialog.getByRole('combobox', { name: 'Snow 1st substitute' }).click()
  await expect(
    page.getByRole('option', { name: 'Generic', exact: false }),
  ).toHaveCount(0)
  await page.getByRole('option', { name: 'Rock' }).click()
  await expect(dialog).toContainText('1 of 1 surface hex covered')
  await expect(
    dialog.getByRole('combobox', { name: 'Snow 2nd substitute' }),
  ).toHaveCount(0)
  await dialog
    .getByRole('button', { name: 'Continue to name adapted map' })
    .click()

  const namingDialog = page.getByRole('dialog', { name: 'Name adapted map' })
  await expect(
    namingDialog.getByRole('textbox', { name: 'Map Title' }),
  ).toHaveValue('Adapt to collection (Adapted to collection)')
  await expect(
    namingDialog.getByRole('textbox', { name: 'Map Author' }),
  ).toHaveValue('Original author')
  await namingDialog.getByRole('button', { name: 'Cancel' }).click()
  await expect(namingDialog).toBeHidden()
  await expect(page.getByTestId('app-status')).toContainText(
    'Map loaded: Adapt to collection',
  )
  expect(await listPieces(page)).toEqual(originalPieces)

  dialog = await openDialog()
  await dialog.getByRole('combobox', { name: 'Snow 1st substitute' }).click()
  await page.getByRole('option', { name: 'Rock' }).click()
  await dialog
    .getByRole('radiogroup', { name: 'Snow covered pieces' })
    .getByLabel('Any spare land')
    .check()
  await dialog
    .getByRole('button', { name: 'Continue to name adapted map' })
    .click()
  const confirmDialog = page.getByRole('dialog', { name: 'Name adapted map' })
  await confirmDialog
    .getByRole('textbox', { name: 'Map Title' })
    .fill('Renamed adaptation')
  await confirmDialog
    .getByRole('textbox', { name: 'Map Author' })
    .fill('Updated author')
  await page.mouse.move(0, 0)
  await confirmDialog
    .getByRole('button', { name: 'Create adapted map' })
    .click()

  const summaryDialog = page.getByRole('dialog', {
    name: 'Adapted map to collection',
  })
  await expect(summaryDialog.getByRole('status')).toContainText(
    'Adapted 2 pieces',
  )
  await expect(page.getByTestId('app-status')).toContainText(
    'Map loaded: Renamed adaptation',
  )
  await expect.poll(() => page.evaluate(() => location.search)).toBe('')
  await expect
    .poll(() => savedMetadata(page))
    .toMatchObject({ name: 'Renamed adaptation', author: 'Updated author' })
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

  await summaryDialog.getByRole('button', { name: 'Close' }).click()
  await page.mouse.move(0, 0)
  await page.getByRole('tab', { name: /controls for building the map/ }).click()
  await page.mouse.move(0, 0)
  await page.getByRole('button', { name: /^Undo \(/ }).click()
  await expect(page.getByTestId('app-status')).toContainText(
    'Map loaded: Adapt to collection',
  )
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
  await expect
    .poll(() => savedMetadata(page))
    .toMatchObject({ name: 'Adapt to collection', author: 'Original author' })
})

test('preserves the source share link when an adaptation changes nothing', async ({
  page,
}) => {
  const alreadyAdaptedMap = {
    ...hexMap,
    name: 'Already adapted (Adapted to collection)',
  }
  await page.addInitScript(() => {
    localStorage.setItem('pieceInventory', JSON.stringify({ r1: 1 }))
  })
  await page.goto(mapUrl(alreadyAdaptedMap, ['0~1~1~0~sn2']))
  await waitForAppReady(page)
  await page
    .getByRole('tab', { name: /editing details of the current map/ })
    .click()
  await page.getByRole('button', { name: 'Adapt to my Collection' }).click()
  await page
    .getByRole('dialog', { name: 'Adapt to my Collection' })
    .getByRole('button', { name: 'Continue to name adapted map' })
    .click()

  const namingDialog = page.getByRole('dialog', { name: 'Name adapted map' })
  await expect(
    namingDialog.getByRole('textbox', { name: 'Map Title' }),
  ).toHaveValue('Already adapted (Adapted to collection)')
  await namingDialog.getByRole('button', { name: 'Create adapted map' }).click()

  const summary = page.getByRole('dialog', {
    name: 'Adapted map to collection',
  })
  await expect(summary).toContainText('Adapted 0 pieces')
  await expect(summary).toContainText('Snow: 1 × 2-hex pieces')
  await expect.poll(() => page.evaluate(() => location.search)).toContain('m=')
})

test('shows second and third substitutes only while surface pieces remain', async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'pieceInventory',
      JSON.stringify({ g1: 1, r1: 1, s1: 1 }),
    )
  })
  const pieces = ['0~1~1~0~sn1', '0~2~1~0~sn1', '0~3~1~0~sn1', '0~4~1~0~sn1']
  await page.goto(mapUrl(hexMap, pieces))
  await waitForAppReady(page)
  await page
    .getByRole('tab', { name: /editing details of the current map/ })
    .click()
  await page.getByRole('button', { name: 'Adapt to my Collection' }).click()
  const dialog = page.getByRole('dialog', { name: 'Adapt to my Collection' })

  await expect(dialog).toContainText('1 of 4 surface hexes covered')
  await expect(
    dialog.getByRole('combobox', { name: 'Snow 2nd substitute' }),
  ).toBeVisible()
  await expect(
    dialog.getByRole('combobox', { name: 'Snow 3rd substitute' }),
  ).toHaveCount(0)
  await dialog.getByRole('combobox', { name: 'Snow 2nd substitute' }).click()
  await page.getByRole('option', { name: 'Rock' }).click()
  await expect(dialog).toContainText('1 more surface hex covered')
  await expect(
    dialog.getByRole('combobox', { name: 'Snow 3rd substitute' }),
  ).toBeVisible()
  await dialog.getByRole('combobox', { name: 'Snow 3rd substitute' }).click()
  await page.getByRole('option', { name: 'Sand' }).click()
  await dialog
    .getByRole('button', { name: 'Continue to name adapted map' })
    .click()
  await page
    .getByRole('dialog', { name: 'Name adapted map' })
    .getByRole('button', { name: 'Create adapted map' })
    .click()
  const summary = page.getByRole('dialog', {
    name: 'Adapted map to collection',
  })
  await expect(summary).toContainText('Snow: 1 × 1-hex pieces')
})
