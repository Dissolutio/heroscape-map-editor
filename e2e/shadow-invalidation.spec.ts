import { FIXTURE_HEX_MAP, FIXTURE_PIECE_IDS } from './fixture-map'
import {
  clickHex,
  expect,
  mapUrl,
  setPen,
  test,
  waitForAppReady,
} from './fixtures'

test('refreshes shadows for a late piece mount but not for camera orbit', async ({
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
  await page.goto(mapUrl(FIXTURE_HEX_MAP, FIXTURE_PIECE_IDS))
  await waitForAppReady(page)

  const shadowCount = async () =>
    Number(
      await page
        .locator('canvas[data-engine]')
        .getAttribute('data-shadow-render-count'),
    )
  const beforePlacement = await shadowCount()
  await setPen(page, 'gn', 1)
  await clickHex(page, { q: 0, r: 0, altitude: 0 })
  await page.waitForFunction(() =>
    window.__TEST__?.listPieces().some((piece) => piece.inventoryID === 'gn1'),
  )
  await waitForAppReady(page)
  await expect.poll(shadowCount).toBeGreaterThan(beforePlacement)
  // the settle window and late model loads can add a few more shadow renders
  // after placement: wait until the count has been still for 15 frames
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        const canvas = document.querySelector('canvas[data-engine]')
        const read = () => canvas?.getAttribute('data-shadow-render-count')
        let last = read()
        let stableFrames = 0
        const next = () => {
          const now = read()
          if (now === last) stableFrames += 1
          else {
            stableFrames = 0
            last = now
          }
          if (stableFrames >= 15) resolve()
          else requestAnimationFrame(next)
        }
        requestAnimationFrame(next)
      }),
  )
  const afterPlacement = await shadowCount()

  const pose = await page.evaluate(() => window.__TEST__?.cameraPose())
  if (!pose) throw new Error('Camera pose is unavailable')
  await page.evaluate(
    async ({ position, target }) =>
      window.__TEST__?.setCamera(
        [position[0] + 1, position[1], position[2]],
        target,
      ),
    pose,
  )
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        let frames = 0
        const next = () => {
          frames += 1
          if (frames === 5) resolve()
          else requestAnimationFrame(next)
        }
        requestAnimationFrame(next)
      }),
  )

  expect(await shadowCount()).toBe(afterPlacement)
})
