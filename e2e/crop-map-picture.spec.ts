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
  await page.getByRole('button', { name: 'Take map picture' }).click()
  const takePicture = page.getByRole('button', {
    name: 'Take picture',
    exact: true,
  })
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

test('one-shot transparent pictures preserve alpha without changing the default', async ({
  page,
}) => {
  const pictureGroup = page.getByRole('button', {
    name: 'Take map picture',
  })
  const takePicture = page.getByRole('button', {
    name: 'Take picture',
    exact: true,
  })
  const takeTransparentPicture = page.getByRole('button', {
    name: 'With transparent background',
    exact: true,
  })
  const cropDialog = page.getByRole('dialog', { name: 'Crop map picture' })
  const openPictureGroup = async () => {
    await page.locator('#simple-tab-3').click()
    if (!(await takePicture.isVisible())) await pictureGroup.click()
  }

  const savePicture = async (action = takePicture) => {
    await openPictureGroup()
    await action.click()
    await expect(cropDialog).toBeVisible()
    await expect(
      cropDialog.getByRole('img', { name: 'Cropped result preview' }),
    ).toBeVisible()
    await cropDialog.getByRole('button', { name: 'Save', exact: true }).click()
    await expect(cropDialog).toBeHidden()
  }
  const downloadPngAlphaAtCorner = async () => {
    await page.locator('#simple-tab-1').click()
    const downloadPicture = page.getByRole('button', {
      name: 'Download Map Picture',
    })
    const downloadPng = page.getByRole('button', {
      name: 'Download map picture as .PNG',
    })
    if (!(await downloadPng.isVisible())) await downloadPicture.click()
    const downloadPromise = page.waitForEvent('download')
    await downloadPng.click()
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

  await savePicture(takeTransparentPicture)
  expect(await downloadPngAlphaAtCorner()).toContain(0)
  await openPictureGroup()
  await expect(
    page.getByRole('checkbox', {
      name: 'Transparent background by default',
    }),
  ).not.toBeChecked()

  await savePicture()
  expect(await downloadPngAlphaAtCorner()).toEqual([255, 255, 255, 255])
})
