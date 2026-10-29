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
  const savedPortrait = await storedPortrait(page)

  await page.getByRole('button', { name: 'Use perspective camera' }).click()
  await waitForAppReady(page)
  await takePicture.click()
  await expect(dialog).toBeVisible()
  await expect.poll(() => storedPortrait(page)).not.toBe(savedPortrait)
  const portraitBeforeCancel = await storedPortrait(page)

  await dialog.getByRole('button', { name: 'Cancel', exact: true }).click()
  await expect(dialog).toBeHidden()
  await expect.poll(() => storedPortrait(page)).toBe(portraitBeforeCancel)
})
