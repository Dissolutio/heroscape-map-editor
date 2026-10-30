import { readFile } from 'node:fs/promises'
import { PNG } from 'pngjs'
import { expect, test, waitForAppReady } from './fixtures'

const storedPortrait = (page: import('@playwright/test').Page) =>
  page.evaluate(() => {
    const saved = localStorage.getItem('lastMapPortrait')
    if (!saved) return ''
    return (
      (JSON.parse(saved) as { mapPortraitBase64?: string }).mapPortraitBase64 ??
      ''
    )
  })

const waitForStoredPortraitToSettle = async (
  page: import('@playwright/test').Page,
) => {
  let previous = await storedPortrait(page)
  let stablePolls = 0
  await expect
    .poll(
      async () => {
        const current = await storedPortrait(page)
        stablePolls = current === previous ? stablePolls + 1 : 0
        previous = current
        return stablePolls
      },
      { intervals: [500] },
    )
    .toBeGreaterThanOrEqual(3)
  return previous
}

test('taking a map picture opens crop dialog; save and cancel behave correctly', async ({
  page,
}) => {
  await page.locator('#simple-tab-3').click()
  const takePicture = page.getByRole('button', { name: 'Take map picture' })
  const dialog = page.getByRole('dialog', { name: 'Crop map picture' })

  await takePicture.click()
  await expect(dialog).toBeVisible()
  await expect(
    dialog.getByRole('img', { name: 'Cropped result preview' }),
  ).toBeVisible()
  await dialog.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(dialog).toBeHidden()
  await expect.poll(() => storedPortrait(page)).toMatch(/^data:image\/jpeg/)
  const savedPortrait = await waitForStoredPortraitToSettle(page)

  await page.getByRole('button', { name: 'Use perspective camera' }).click()
  await waitForAppReady(page)
  await takePicture.click()
  await expect(dialog).toBeVisible()
  await expect.poll(() => storedPortrait(page)).not.toBe(savedPortrait)
  const portraitBeforeCancel = await waitForStoredPortraitToSettle(page)

  await dialog.getByRole('button', { name: 'Cancel', exact: true }).click()
  await expect(dialog).toBeHidden()
  expect(await waitForStoredPortraitToSettle(page)).toBe(portraitBeforeCancel)
})

test('downloaded picture is opaque by default and transparent when enabled', async ({
  page,
}) => {
  await page.locator('#simple-tab-3').click()
  const takePicture = page.getByRole('button', { name: 'Take map picture' })
  const cropDialog = page.getByRole('dialog', { name: 'Crop map picture' })

  const savePicture = async () => {
    await takePicture.click()
    await expect(cropDialog).toBeVisible()
    await expect(
      cropDialog.getByRole('img', { name: 'Cropped result preview' }),
    ).toBeVisible()
    await cropDialog.getByRole('button', { name: 'Save', exact: true }).click()
    await expect(cropDialog).toBeHidden()
  }
  const downloadPngAlphaAtCorner = async () => {
    await page.locator('#simple-tab-1').click()
    await page.getByRole('button', { name: 'Download Map Picture' }).click()
    const downloadPromise = page.waitForEvent('download')
    await page
      .getByRole('button', { name: 'Download map picture as .PNG' })
      .click()
    const download = await downloadPromise
    const path = await download.path()
    if (!path) throw new Error('Expected downloaded map picture')
    const { data, width, height } = PNG.sync.read(await readFile(path))
    return [
      data[3],
      data[(width - 1) * 4 + 3],
      data[(height - 1) * width * 4 + 3],
      data[(height * width - 1) * 4 + 3],
    ]
  }

  await savePicture()
  expect(await downloadPngAlphaAtCorner()).toEqual([255, 255, 255, 255])

  await page.locator('#simple-tab-3').click()
  await page.getByRole('button', { name: '3D look...' }).click()
  const transparentBackground = page.getByRole('checkbox', {
    name: 'Transparent background',
  })
  await expect(transparentBackground).not.toBeChecked()
  await transparentBackground.check()
  await page.getByRole('button', { name: 'Close 3D look settings' }).click()

  await savePicture()
  await expect.poll(() => storedPortrait(page)).toMatch(/^data:image\/png/)
  expect(await downloadPngAlphaAtCorner()).toContain(0)
})
