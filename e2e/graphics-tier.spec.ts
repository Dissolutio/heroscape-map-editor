import { expect, FIXTURE_URL, test, waitForAppReady } from './fixtures'

test('graphics tier lazily loads Medium textures and returns to Lowest', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  page.on('pageerror', (error) => errors.push(error.message))

  await page.goto(`${FIXTURE_URL}&perHexLand=1`)
  await waitForAppReady(page)
  await page.locator('#simple-tab-3').click()

  const graphics = page.getByTestId('graphics-tier-select')
  await expect(graphics).toBeVisible()
  await page.getByText('Graphics', { exact: true }).hover()
  await expect(page.getByRole('tooltip')).toHaveText(
    'Medium and High download texture images the first time you choose them. High also enables lights and shadows and uses alternate cap images. Lowest uses no images.',
  )
  await page.mouse.move(0, 0)
  await expect(page.getByRole('tooltip')).toBeHidden()
  await graphics.click()
  await page.getByRole('option', { name: 'Medium (textures)' }).click()
  await expect(page.getByTestId('graphics-texture-status')).toHaveText(
    'Textures ready',
  )

  await graphics.click()
  await page.getByRole('option', { name: 'Lowest' }).click()
  await expect(graphics).toContainText('Lowest')
  await expect(page.getByTestId('graphics-texture-status')).toHaveCount(0)
  expect(errors).toEqual([])
})

test('picture-only High restores the previous graphics and lighting settings', async ({
  page,
}) => {
  await page.goto(`${FIXTURE_URL}&perHexLand=1`)
  await waitForAppReady(page)
  await page.locator('#simple-tab-3').click()

  const pictureHigh = page.getByRole('checkbox', {
    name: 'Use High quality when taking a map picture',
  })
  await expect(pictureHigh).toBeVisible()
  await pictureHigh.check()
  await page.getByRole('button', { name: 'Take map picture' }).click()

  const cropDialog = page.getByRole('dialog', { name: 'Crop map picture' })
  await expect(cropDialog).toBeVisible({ timeout: 60_000 })
  await cropDialog.getByRole('button', { name: 'Cancel', exact: true }).click()
  await expect(cropDialog).toBeHidden()
  await expect(page.getByTestId('graphics-tier-select')).toContainText('Lowest')
  await expect(
    page.getByRole('checkbox', { name: 'Render Lights and Shadows' }),
  ).not.toBeChecked()
  await expect(pictureHigh).toBeChecked()
})
