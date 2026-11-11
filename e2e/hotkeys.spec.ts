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

test('default obstacle hotkeys select Evergreen Tree, Ship, and Laur Wall', async ({
  page,
}) => {
  await page.goto(FIXTURE_URL)
  await waitForAppReady(page)

  await page.getByRole('combobox', { name: 'Pen Mode' }).click()
  await expect(page.getByRole('option', { name: 'Tree 10 [F]' })).toBeVisible()
  await expect(
    page.getByRole('option', { name: 'Ship Wall [SHIFT+S]' }),
  ).toBeVisible()
  await expect(
    page.getByRole('option', { name: 'Wall Straight [SHIFT+C]' }),
  ).toBeVisible()
  await page.keyboard.press('Escape')

  for (const [key, mode, pieceID] of [
    ['f', 'tr10', 'tr10'],
    ['Shift+s', 'sl', 'sl'],
    ['u', 'lwp', 'lwp'],
  ] as const) {
    await page.keyboard.press(key)
    await page.waitForFunction(
      ({ expectedMode, expectedPieceID }) => {
        const snapshot = window.__TEST__?.snapshot()
        return (
          snapshot?.penMode === expectedMode &&
          snapshot.penPieceID === expectedPieceID
        )
      },
      { expectedMode: mode, expectedPieceID: pieceID },
    )
    if (key === 'f') {
      await expect(
        page.getByRole('group', {
          name: 'piece select for current pen mode',
        }),
      ).toContainText('F')
      await page.keyboard.press('2')
      await page.waitForFunction(
        () => window.__TEST__?.snapshot().penPieceID === 'tr11',
      )
      await page.keyboard.press('f')
      await page.waitForFunction(
        () => window.__TEST__?.snapshot().penPieceID === 'tr11',
      )
      await page.keyboard.press('1')
      await page.waitForFunction(
        () => window.__TEST__?.snapshot().penPieceID === 'tr10',
      )
    }
  }
})

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
  const search = dialog.getByRole('textbox', { name: 'Search hotkeys' })
  const zoomRow = dialog.getByRole('group', {
    name: 'Zoom to map hotkey',
  })
  await zoomRow.getByRole('button', { name: 'Change' }).click()
  await page.keyboard.press('l')
  await dialog.getByRole('button', { name: 'Swap' }).click()
  await search.fill('L')
  await expect(zoomRow).toBeVisible()
  await expect(zoomRow).toContainText('L')
  await search.fill('Lava')
  await expect(
    dialog.getByRole('group', { name: 'Lava field hotkey' }),
  ).toBeVisible()
  await search.fill('')

  const rotateRow = dialog.getByRole('group', {
    name: 'Rotate clockwise hotkey',
  })
  await rotateRow.getByRole('button', { name: 'Change' }).click()
  await page.keyboard.down('Shift')
  await page.keyboard.down('Control')
  const recordingAlert = dialog.getByRole('alert').first()
  await expect(recordingAlert).toContainText('Shift + Ctrl + …')
  await page.keyboard.down('K')
  await expect(recordingAlert).toContainText('Shift + Ctrl + K')
  await page.keyboard.up('K')
  await expect(recordingAlert).toContainText(
    'Rotate clockwise: Shift + Ctrl + K',
  )
  await page.keyboard.up('Control')
  await page.keyboard.up('Shift')

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

  const resetAllButton = openDialog.getByRole('button', {
    name: 'Reset all hotkeys',
  })
  await resetAllButton.click()
  const resetConfirm = page.getByRole('dialog', {
    name: 'Reset all hotkeys?',
  })
  await expect(resetConfirm).toBeVisible()
  await expect(resetConfirm).toContainText('3 custom hotkeys')
  await resetConfirm.getByRole('button', { name: 'Cancel' }).click()
  await expect(
    openDialog.getByRole('group', { name: 'Rotate clockwise hotkey' }),
  ).toContainText('Alt + Q')
  await expect(
    openDialog.getByRole('group', { name: 'Zoom to map hotkey' }),
  ).toContainText('L')

  await resetAllButton.click()
  const resetAnywayConfirm = page.getByRole('dialog', {
    name: 'Reset all hotkeys?',
  })
  await resetAnywayConfirm.getByRole('button', { name: 'Reset anyway' }).click()
  await expect(openDialog.getByRole('alert')).toContainText(
    'Hotkeys reset to defaults',
  )
  await expect(
    openDialog.getByRole('group', { name: 'Rotate clockwise hotkey' }),
  ).toContainText('Q')
  await expect
    .poll(() =>
      page.evaluate(() => {
        const settings = JSON.parse(localStorage.getItem('settings') ?? '{}')
        return settings.values?.hotkeyOverrides
      }),
    )
    .toBeUndefined()
  await resetAllButton.click()
  await expect(
    page.getByRole('dialog', { name: 'Reset all hotkeys?' }),
  ).not.toBeVisible()
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
  await importDialog.getByLabel('Import hotkeys file').setInputFiles({
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

  await page.locator('#simple-tab-3').click()
  await page.getByRole('button', { name: 'Hotkeys' }).click()
  const downloadResetDialog = page.getByRole('dialog', { name: 'Hotkeys' })
  await downloadResetDialog
    .getByRole('button', { name: 'Reset all hotkeys' })
    .click()
  const downloadResetConfirm = page.getByRole('dialog', {
    name: 'Reset all hotkeys?',
  })
  await expect(downloadResetConfirm).toContainText('3 custom hotkeys')
  const resetDownloadPromise = page.waitForEvent('download')
  await downloadResetConfirm
    .getByRole('button', { name: 'Download and reset' })
    .click()
  const resetDownload = await resetDownloadPromise
  expect(resetDownload.suggestedFilename()).toBe('hexoscape-hotkeys.json')
  await expect(downloadResetDialog.getByRole('alert')).toContainText(
    'Hotkeys reset to defaults',
  )
  await expect(
    downloadResetDialog.getByRole('group', {
      name: 'Rotate clockwise hotkey',
    }),
  ).toContainText('Q')
})
