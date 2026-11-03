import { expect, findPieceUid, mapUrl, test, waitForAppReady } from './fixtures'
import { FIXTURE_HEX_MAP } from './fixture-map'

const snapshot = (page: import('@playwright/test').Page) =>
  page.evaluate(() => window.__TEST__?.snapshot())

test('saved selections survive map-file reload and recall with replace or Shift-add', async ({
  page,
}) => {
  const map = {
    ...FIXTURE_HEX_MAP,
    id: 'e2e-saved-selection',
    name: 'E2E Saved Selection',
    width: 8,
    length: 8,
  }
  await page.goto(
    mapUrl(map, ['0~0~2~0~g1', '0~1~3~0~g1', '0~2~2~0~g1', '0~5~0~0~s1']),
  )
  await waitForAppReady(page)

  const group = await Promise.all([
    findPieceUid(page, { inventoryID: 'g1', q: 0, r: 2 }),
    findPieceUid(page, { inventoryID: 'g1', q: 1, r: 3 }),
    findPieceUid(page, { inventoryID: 'g1', q: 2, r: 2 }),
  ])
  const other = await findPieceUid(page, { inventoryID: 's1', q: 5, r: 0 })
  const selectAt = async (uid: string, shift = false) => {
    const position = await page.evaluate(
      (id) => window.__TEST__?.screenPosOfPiece(id) ?? null,
      uid,
    )
    if (!position) throw new Error(`Piece ${uid} is not on screen`)
    await page.locator('canvas').first().click({
      position,
      modifiers: shift ? ['Shift'] : [],
    })
  }

  await selectAt(group[0]!)
  await selectAt(group[1]!, true)
  await selectAt(group[2]!, true)
  await expect
    .poll(async () => (await snapshot(page))?.selectedPieceIDs)
    .toEqual(group)

  page.once('dialog', (dialog) => dialog.accept('Pinned group'))
  await page.getByRole('button', { name: /Save selection/ }).click()
  await expect(
    page.getByRole('button', { name: 'Recall saved selection Pinned group' }),
  ).toBeVisible()

  await page.getByRole('tab', { name: 'File' }).click()
  await page.getByRole('button', { name: 'Download Map File' }).click()
  const downloadPromise = page.waitForEvent('download')
  await page
    .getByRole('button', { name: 'Download file (.json)', exact: true })
    .click()
  const download = await downloadPromise
  const filePath = await download.path()
  if (!filePath) throw new Error('Map-file download did not produce a file')

  await page.locator('#jsonupload').setInputFiles(filePath)
  await waitForAppReady(page)
  await expect(
    page.getByRole('button', { name: 'Recall saved selection Pinned group' }),
  ).toBeVisible()

  const reloadedGroup = await Promise.all([
    findPieceUid(page, { inventoryID: 'g1', q: 0, r: 2 }),
    findPieceUid(page, { inventoryID: 'g1', q: 1, r: 3 }),
    findPieceUid(page, { inventoryID: 'g1', q: 2, r: 2 }),
  ])
  const reloadedOther = await findPieceUid(page, {
    inventoryID: 's1',
    q: 5,
    r: 0,
  })
  await selectAt(reloadedOther)
  const savedLink = page.getByRole('button', {
    name: 'Recall saved selection Pinned group',
  })
  await savedLink.click()
  await expect
    .poll(async () => (await snapshot(page))?.selectedPieceIDs)
    .toEqual(reloadedGroup)

  await selectAt(reloadedOther)
  await savedLink.click({ modifiers: ['Shift'] })
  await expect
    .poll(async () => (await snapshot(page))?.selectedPieceIDs)
    .toEqual([reloadedOther, ...reloadedGroup])
})
