import { readFile } from 'node:fs/promises'
import {
  clickPiece,
  expect,
  findPieceUid,
  FIXTURE_URL,
  test,
  waitForAppReady,
} from './fixtures'

const pieceRotation = async (page: Parameters<typeof waitForAppReady>[0]) => {
  const pieces = await page.evaluate(() => window.__TEST__?.listPieces())
  return pieces?.find((piece) => piece.inventoryID === 'g1')?.rotation
}

const cameraPose = async (page: Parameters<typeof waitForAppReady>[0]) =>
  page.evaluate(() => window.__TEST__?.cameraPose())

test('rebinds, exports, resets, and imports hotkeys', async ({ page }) => {
  await page.goto(FIXTURE_URL)
  await waitForAppReady(page)
  const cameraBefore = await cameraPose(page)
  await page.keyboard.press('ArrowUp')
  await waitForAppReady(page)
  expect(await cameraPose(page)).not.toEqual(cameraBefore)

  const pieceUID = await findPieceUid(page, {
    inventoryID: 'g1',
    q: 0,
    r: 2,
  })
  await clickPiece(page, pieceUID)

  await page.locator('#simple-tab-3').click()
  await page.getByRole('button', { name: 'Hotkeys' }).click()
  const dialog = page.getByRole('dialog', { name: 'Hotkeys' })
  const rotateRow = dialog.getByRole('group', {
    name: 'Rotate clockwise hotkey',
  })
  await rotateRow.getByRole('button', { name: 'Change' }).click()
  await page.keyboard.press('Alt+Q')
  await expect(rotateRow).toContainText('Alt + Q')
  await dialog.getByRole('button', { name: 'Close' }).click()

  const initialRotation = await pieceRotation(page)
  await page.keyboard.press('q')
  await expect.poll(() => pieceRotation(page)).toBe(initialRotation)
  await page.keyboard.press('Alt+Q')
  await waitForAppReady(page)
  await expect
    .poll(() => pieceRotation(page))
    .toBe(((initialRotation ?? 0) + 1) % 6)

  await page.locator('#simple-tab-3').click()
  await page.getByRole('button', { name: 'Hotkeys' }).click()
  const openDialog = page.getByRole('dialog', { name: 'Hotkeys' })
  const downloadPromise = page.waitForEvent('download')
  await openDialog.getByRole('button', { name: 'Export hotkeys' }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toBe('hexoscape-hotkeys.json')
  const downloadPath = await download.path()
  if (!downloadPath) throw new Error('Hotkey download did not complete')
  const hotkeyFile = await readFile(downloadPath)

  await openDialog.getByRole('button', { name: 'Reset all hotkeys' }).click()
  await expect
    .poll(() =>
      page.evaluate(() => {
        const settings = JSON.parse(localStorage.getItem('settings') ?? '{}')
        return settings.values?.hotkeyOverrides
      }),
    )
    .toBeUndefined()
  await openDialog.getByRole('button', { name: 'Close' }).click()

  const beforeDefaultRotation = await pieceRotation(page)
  await page.keyboard.press('q')
  await waitForAppReady(page)
  await expect
    .poll(() => pieceRotation(page))
    .toBe(((beforeDefaultRotation ?? 0) + 1) % 6)

  await page.locator('#simple-tab-3').click()
  await page.getByRole('button', { name: 'Hotkeys' }).click()
  const importDialog = page.getByRole('dialog', { name: 'Hotkeys' })
  await importDialog
    .getByLabel('Import hotkeys file')
    .setInputFiles({
      name: 'hexoscape-hotkeys.json',
      mimeType: 'application/json',
      buffer: hotkeyFile,
    })
  const importedRotateRow = importDialog.getByRole('group', {
    name: 'Rotate clockwise hotkey',
  })
  await expect(importedRotateRow).toContainText('Alt + Q')
  await importDialog.getByRole('button', { name: 'Close' }).click()

  const afterImportRotation = await pieceRotation(page)
  await page.keyboard.press('q')
  await expect.poll(() => pieceRotation(page)).toBe(afterImportRotation)
  await page.keyboard.press('Alt+Q')
  await waitForAppReady(page)
  await expect
    .poll(() => pieceRotation(page))
    .toBe(((afterImportRotation ?? 0) + 1) % 6)
})
