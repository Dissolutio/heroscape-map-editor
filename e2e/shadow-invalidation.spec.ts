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
  // the settle window, late model loads and the billboard warm-up (4 s) can
  // add shadow renders after placement: wait until the count has been still
  // for 5 seconds of wall-clock time
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        const canvas = document.querySelector('canvas[data-engine]')
        const read = () => canvas?.getAttribute('data-shadow-render-count')
        let last = read()
        let stableSince = performance.now()
        const next = () => {
          const now = read()
          if (now !== last) {
            last = now
            stableSince = performance.now()
          }
          if (performance.now() - stableSince >= 5000) resolve()
          else requestAnimationFrame(next)
        }
        requestAnimationFrame(next)
      }),
  )
  const afterPlacement = await shadowCount()

  const pose = await page.evaluate(() => window.__TEST__?.cameraPose())
  if (!pose) throw new Error('Camera pose is unavailable')
  // The shadow count can still tick now and then with no store change (the
  // recorded triggers show none). So compare a stretch of camera moves with an
  // idle stretch of the same length: a render per move would add one per move.
  const movesStart = Date.now()
  for (let move = 1; move <= 15; move += 1) {
    await page.evaluate(
      async ({ position, target, offset }) =>
        window.__TEST__?.setCamera(
          [position[0] + offset, position[1], position[2]],
          target,
        ),
      { ...pose, offset: move },
    )
  }
  const afterMoves = await shadowCount()
  const movesMs = Date.now() - movesStart
  await page.waitForTimeout(movesMs)
  const afterIdle = await shadowCount()

  const triggers = await page
    .locator('canvas[data-engine]')
    .getAttribute('data-shadow-triggers')
  const moveRenders = afterMoves - afterPlacement
  const idleRenders = afterIdle - afterMoves
  expect(
    moveRenders,
    `moves added ${moveRenders} shadow renders, idle added ${idleRenders}; triggers (latest last): ${triggers}`,
  ).toBeLessThanOrEqual(idleRenders + 2)
})
