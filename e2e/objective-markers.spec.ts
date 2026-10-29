import {
  expect,
  mapUrl,
  OBJECTIVE_MARKERS_FIXTURE_HEX_MAP,
  OBJECTIVE_MARKERS_FIXTURE_PIECE_IDS,
  test,
  waitForAppReady,
} from './fixtures'

test('renders, selects, and excludes objective markers from shadows', async ({
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
  await page.goto(
    mapUrl(
      OBJECTIVE_MARKERS_FIXTURE_HEX_MAP,
      OBJECTIVE_MARKERS_FIXTURE_PIECE_IDS,
    ),
  )
  await waitForAppReady(page)

  const markerUIDs = ['objective-ground', 'objective-stacked']
  await expect
    .poll(() =>
      page.evaluate(() => window.__TEST__?.listRenderedObjectiveMarkerUIDs()),
    )
    .toEqual(markerUIDs)
  expect(
    await page.evaluate(() => window.__TEST__?.snapshot().objectiveMarkerCount),
  ).toBe(markerUIDs.length)

  const countShadowRenders = async () =>
    Number(
      await page
        .locator('canvas[data-engine]')
        .getAttribute('data-shadow-render-count'),
    )
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        const canvas = document.querySelector('canvas[data-engine]')
        const read = () => canvas?.getAttribute('data-shadow-render-count')
        let last = read()
        let stableSince = performance.now()
        const next = () => {
          const current = read()
          if (current !== last) {
            last = current
            stableSince = performance.now()
          }
          if (performance.now() - stableSince >= 5000) resolve()
          else requestAnimationFrame(next)
        }
        requestAnimationFrame(next)
      }),
  )
  const canvas = page.locator('canvas').first()
  const canvasBounds = await canvas.boundingBox()
  if (!canvasBounds) throw new Error('Canvas is not visible')
  const waitForRenderFrames = () =>
    page.evaluate(
      () =>
        new Promise<void>((resolve) => {
          let frames = 0
          const next = () => {
            frames += 1
            if (frames === 8) resolve()
            else requestAnimationFrame(next)
          }
          requestAnimationFrame(next)
        }),
    )
  const beforeIdle = await countShadowRenders()
  await canvas.click({ position: { x: 2, y: 2 } })
  await waitForRenderFrames()
  const idleShadowRenders = (await countShadowRenders()) - beforeIdle
  const beforeSelection = await countShadowRenders()
  const triggersBeforeSelection = await page
    .locator('canvas[data-engine]')
    .getAttribute('data-shadow-triggers')
  const point = await page.evaluate(
    (uid) => window.__TEST__?.screenPosOfObjectiveMarker(uid) ?? null,
    markerUIDs[0],
  )
  if (!point) throw new Error('Objective marker is not on screen')
  await page.locator('canvas').first().click({ position: point })
  await expect
    .poll(() =>
      page.evaluate(
        () => window.__TEST__?.snapshot().selectedObjectiveMarkerUID,
      ),
    )
    .toBe(markerUIDs[0])

  await waitForRenderFrames()
  const selectionShadowRenders = (await countShadowRenders()) - beforeSelection
  expect(
    selectionShadowRenders,
    `selection added ${selectionShadowRenders} shadow renders; idle added ${idleShadowRenders}`,
  ).toBeLessThanOrEqual(idleShadowRenders)
  expect(
    await page
      .locator('canvas[data-engine]')
      .getAttribute('data-shadow-triggers'),
    `shadow triggers: ${await page
      .locator('canvas[data-engine]')
      .getAttribute('data-shadow-triggers')}`,
  ).toBe(triggersBeforeSelection)
  expect(
    await page.evaluate(() => window.__TEST__?.snapshot().selectedPieceIDs),
  ).toEqual([])

  const terrainPoint = await page.evaluate(
    () => window.__TEST__?.screenPosOfHex({ q: 2, r: 2, altitude: 1 }) ?? null,
  )
  if (!terrainPoint) throw new Error('Terrain hex is not on screen')
  await page.locator('canvas').first().click({ position: terrainPoint })
  await expect
    .poll(() =>
      page.evaluate(
        () => window.__TEST__?.snapshot().selectedObjectiveMarkerUID,
      ),
    )
    .toBeNull()
})
