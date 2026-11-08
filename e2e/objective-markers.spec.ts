import {
  OBJECTIVE_MARKERS_FIXTURE_HEX_MAP,
  OBJECTIVE_MARKERS_FIXTURE_PIECE_IDS,
  expect,
  hoverHex,
  mapUrl,
  saveLocatorEvidence,
  test,
  waitForAppReady,
} from './fixtures'

const ANIMATION_FRAME_WAIT_TIMEOUT_MS = 15_000

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
    ({ timeoutMs }) =>
      new Promise<void>((resolve, reject) => {
        const canvas = document.querySelector('canvas[data-engine]')
        const read = () => canvas?.getAttribute('data-shadow-render-count')
        let last = read()
        let stableSince = performance.now()
        let frame = 0
        const timeout = window.setTimeout(() => {
          cancelAnimationFrame(frame)
          reject(
            new Error(
              `Shadow render count did not stabilize within ${timeoutMs} ms`,
            ),
          )
        }, timeoutMs)
        const next = () => {
          const current = read()
          if (current !== last) {
            last = current
            stableSince = performance.now()
          }
          if (performance.now() - stableSince >= 5000) {
            window.clearTimeout(timeout)
            resolve()
          } else {
            frame = requestAnimationFrame(next)
          }
        }
        frame = requestAnimationFrame(next)
      }),
    { timeoutMs: ANIMATION_FRAME_WAIT_TIMEOUT_MS },
  )
  const canvas = page.locator('canvas').first()
  const canvasBounds = await canvas.boundingBox()
  if (!canvasBounds) throw new Error('Canvas is not visible')
  const waitForRenderFrames = () =>
    page.evaluate(
      ({ frameCount, timeoutMs }) =>
        new Promise<void>((resolve, reject) => {
          let frames = 0
          let frame = 0
          const timeout = window.setTimeout(() => {
            cancelAnimationFrame(frame)
            reject(
              new Error(
                `Expected ${frameCount} render frames within ${timeoutMs} ms`,
              ),
            )
          }, timeoutMs)
          const next = () => {
            frames += 1
            if (frames === frameCount) {
              window.clearTimeout(timeout)
              resolve()
            } else {
              frame = requestAnimationFrame(next)
            }
          }
          frame = requestAnimationFrame(next)
        }),
      { frameCount: 8, timeoutMs: ANIMATION_FRAME_WAIT_TIMEOUT_MS },
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

  await page.locator('#simple-tab-3').click()
  const faceCameraSwitch = page.getByRole('checkbox', {
    name: 'Objective text follow camera',
  })
  await expect(faceCameraSwitch).not.toBeChecked()
  const initialTextQuaternion = await page.evaluate(
    () =>
      window.__TEST__?.getRenderedObjectiveMarkerTextQuaternion(
        'objective-ground',
      ) ?? null,
  )
  const pose = await page.evaluate(() => window.__TEST__?.cameraPose() ?? null)
  if (!initialTextQuaternion || !pose) {
    throw new Error('Objective-marker text or camera pose is unavailable')
  }
  await page.evaluate(
    ({ target }) =>
      window.__TEST__?.setCamera(
        [target[0] + 8, target[1] + 1, target[2] + 8],
        target,
      ),
    pose,
  )
  await waitForAppReady(page)
  const flatLayout = await page.evaluate(
    () =>
      window.__TEST__?.getRenderedObjectiveMarkerTextLayout(
        'objective-ground',
      ) ?? null,
  )
  expect(flatLayout?.isBillboard).toBe(false)

  await page.mouse.move(0, 0)
  await saveLocatorEvidence(canvas, 'objective-marker-text-flat-low-angle')
  await faceCameraSwitch.click()
  await expect(faceCameraSwitch).toBeChecked()
  await waitForRenderFrames()
  await waitForAppReady(page)
  const [billboardLayout, textQuaternion, cameraQuaternion] =
    await page.evaluate(() => [
      window.__TEST__?.getRenderedObjectiveMarkerTextLayout(
        'objective-ground',
      ) ?? null,
      window.__TEST__?.getRenderedObjectiveMarkerTextQuaternion(
        'objective-ground',
      ) ?? null,
      window.__TEST__?.cameraQuaternion() ?? null,
    ])
  if (!billboardLayout || !textQuaternion || !cameraQuaternion) {
    throw new Error(
      'Objective-marker text layout or orientation is unavailable',
    )
  }
  expect(billboardLayout.isBillboard).toBe(true)
  expect(billboardLayout.textBounds.min[1]).toBeGreaterThan(
    billboardLayout.markerFaceMaxY,
  )
  const quaternionDot = textQuaternion.reduce(
    (dot, value, index) => dot + value * (cameraQuaternion[index] ?? 0),
    0,
  )
  expect(Math.abs(quaternionDot)).toBeGreaterThan(0.999)
  expect(
    Math.abs(
      textQuaternion.reduce(
        (dot, value, index) =>
          dot + value * (initialTextQuaternion[index] ?? 0),
        0,
      ),
    ),
  ).toBeLessThan(0.99)

  await page.evaluate(() => window.__TEST__?.setPen('objectiveMarker', 1))
  await hoverHex(page, { q: 2, r: 2, altitude: 1 })
  await waitForRenderFrames()
  const previewQuaternion = await page.evaluate(
    () =>
      window.__TEST__?.getRenderedObjectiveMarkerTextQuaternion(
        '__objective-marker-preview__',
      ) ?? null,
  )
  if (!previewQuaternion) {
    throw new Error('Objective-marker placement preview text is unavailable')
  }
  expect(
    Math.abs(
      previewQuaternion.reduce(
        (dot, value, index) => dot + value * (cameraQuaternion[index] ?? 0),
        0,
      ),
    ),
  ).toBeGreaterThan(0.999)

  await page.mouse.move(0, 0)
  await saveLocatorEvidence(canvas, 'objective-marker-text-billboard-low-angle')
  await faceCameraSwitch.click()
  await expect(faceCameraSwitch).not.toBeChecked()
  await waitForRenderFrames()
  await waitForAppReady(page)

  await hoverHex(page, { q: 2, r: 2, altitude: 1 })
  await waitForRenderFrames()
  const flatPreviewQuaternion = await page.evaluate(
    () =>
      window.__TEST__?.getRenderedObjectiveMarkerTextQuaternion(
        '__objective-marker-preview__',
      ) ?? null,
  )
  if (!flatPreviewQuaternion) {
    throw new Error('Objective-marker placement preview text is unavailable')
  }
  expect(
    Math.abs(
      flatPreviewQuaternion.reduce(
        (dot, value, index) => dot + value * (cameraQuaternion[index] ?? 0),
        0,
      ),
    ),
  ).toBeLessThan(0.99)
  await page.evaluate(() => window.__TEST__?.setPen('select', 1))

  const visibilitySwitch = page.getByRole('checkbox', {
    name: 'Show Objective Markers',
  })
  await expect(visibilitySwitch).toBeChecked()
  await page.mouse.move(0, 0)
  await visibilitySwitch.click()
  await expect(visibilitySwitch).not.toBeChecked()
  await expect
    .poll(() =>
      page.evaluate(() => window.__TEST__?.listRenderedObjectiveMarkerUIDs()),
    )
    .toEqual([])

  await page.mouse.move(0, 0)
  await visibilitySwitch.click()
  await expect(visibilitySwitch).toBeChecked()
  await expect
    .poll(() =>
      page.evaluate(() => window.__TEST__?.listRenderedObjectiveMarkerUIDs()),
    )
    .toEqual(markerUIDs)

  await page.reload()
  await waitForAppReady(page)
  await expect
    .poll(() =>
      page.evaluate(() => window.__TEST__?.listRenderedObjectiveMarkerUIDs()),
    )
    .toEqual(markerUIDs)
})
