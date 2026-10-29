import { expect, FIXTURE_URL, test, waitForAppReady } from './fixtures'

test('3D look settings preview, persist, invalidate shadows, and reset', async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'settings',
      JSON.stringify({
        v: 1,
        values: { isLightsAndShadowsRender: true },
      }),
    )
  })
  await page.goto(FIXTURE_URL)
  await waitForAppReady(page)
  await page.locator('#simple-tab-3').click()
  await page.getByRole('button', { name: '3D look...' }).click()

  const dialog = page.getByRole('dialog', { name: '3D look settings' })
  const slider = dialog.getByRole('slider', { name: 'Point light intensity' })
  const shadowCount = async () =>
    Number(
      await page
        .locator('canvas[data-engine]')
        .getAttribute('data-shadow-render-count'),
    )
  const before = await shadowCount()

  await slider.focus()
  await page.keyboard.press('End')
  await expect(slider).toHaveAttribute('aria-valuenow', '400')
  await expect
    .poll(() =>
      page.evaluate(() => {
        const settings = JSON.parse(localStorage.getItem('settings') ?? '{}')
        return settings.values?.lookSettings?.pointLightIntensity
      }),
    )
    .toBe(400)
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  )

  const after = await shadowCount()
  expect(after).toBeGreaterThan(before)
  expect(after - before).toBeLessThanOrEqual(4)

  await page.getByRole('button', { name: 'Reset to defaults' }).click()
  await expect
    .poll(() =>
      page.evaluate(() => {
        const settings = JSON.parse(localStorage.getItem('settings') ?? '{}')
        return settings.values?.lookSettings
      }),
    )
    .toBeUndefined()
  await expect(slider).toHaveAttribute('aria-valuenow', '200')
})
