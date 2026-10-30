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
      { interval: 500 },
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
