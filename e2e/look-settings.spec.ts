import { CAMERA_FOV } from '../src/utils/constants'
import { FIXTURE_URL, expect, test, waitForAppReady } from './fixtures'

test('3D look settings preview, persist, invalidate shadows, and reset', async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'settings',
      JSON.stringify({
        v: 1,
        values: { isLightsAndShadowsRender: true, isOrthoCam: false },
      }),
    )
  })
  await page.goto(FIXTURE_URL)
  await waitForAppReady(page)
  await page.locator('#simple-tab-3').click()
  await page.getByRole('button', { name: '3D look...' }).click()

  const dialog = page.getByRole('dialog', { name: '3D look settings' })
  const fovSlider = dialog.getByRole('slider', { name: 'Field of view' })
  const slider = dialog.getByRole('slider', { name: 'Point light intensity' })
  const transparentBackground = dialog.getByRole('checkbox', {
    name: 'Transparent background',
  })
  const cameraDistance = () =>
    page.evaluate(() => {
      const pose = window.__TEST__?.cameraPose()
      if (!pose) return null
      return Math.hypot(
        pose.position[0] - pose.target[0],
        pose.position[1] - pose.target[1],
        pose.position[2] - pose.target[2],
      )
    })
  const shadowCount = async () =>
    Number(
      await page
        .locator('canvas[data-engine]')
        .getAttribute('data-shadow-render-count'),
    )
  const initialDistance = await cameraDistance()
  if (initialDistance === null) throw new Error('Expected perspective camera')

  await fovSlider.focus()
  await page.keyboard.press('End')
  await expect(fovSlider).toHaveAttribute('aria-valuenow', '90')
  await expect
    .poll(() => page.evaluate(() => window.__TEST__?.snapshot().cameraFov))
    .toBe(90)
  const updatedDistance = await cameraDistance()
  if (updatedDistance === null) throw new Error('Expected perspective camera')
  expect(updatedDistance).toBeCloseTo(
    (initialDistance * Math.tan((CAMERA_FOV * Math.PI) / 360)) /
      Math.tan((90 * Math.PI) / 360),
    1,
  )
  await expect
    .poll(() =>
      page.evaluate(() => {
        const settings = JSON.parse(localStorage.getItem('settings') ?? '{}')
        return settings.values?.lookSettings?.fov
      }),
    )
    .toBe(90)
  await transparentBackground.check()
  await expect
    .poll(() =>
      page.evaluate(() => {
        const settings = JSON.parse(localStorage.getItem('settings') ?? '{}')
        return settings.values?.lookSettings?.transparentPictureBackground
      }),
    )
    .toBe(true)
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.mouse.move(0, 0)
  await dialog.getByRole('button', { name: 'Copy settings as JSON' }).click()
  await expect
    .poll(() =>
      page.evaluate(async () =>
        JSON.parse(await navigator.clipboard.readText()),
      ),
    )
    .toMatchObject({ fov: 90, transparentPictureBackground: true })
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
  await expect(fovSlider).toHaveAttribute('aria-valuenow', '65')
  await expect(transparentBackground).not.toBeChecked()
  await expect
    .poll(() => page.evaluate(() => window.__TEST__?.snapshot().cameraFov))
    .toBe(65)
})
