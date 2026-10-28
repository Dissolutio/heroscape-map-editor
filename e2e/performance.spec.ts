import { expect, test, waitForAppReady } from './fixtures'

test('shows performance metrics only when explicitly enabled', async ({
  page,
}) => {
  await expect(page.getByTestId('performance-overlay')).toHaveCount(0)
  await page.goto('/hs?e2e=1&perf=1')
  await waitForAppReady(page)
  const overlay = page.getByTestId('performance-overlay')
  await expect(overlay).toBeVisible()
  await expect(overlay).toContainText('FPS:')
  await expect(overlay).toContainText('Raycast:')
  await expect(overlay).toContainText('Pointer split')
  await expect(overlay).toContainText('React MapDisplay3D:')
  await expect(overlay).toContainText('Typed arrays:')
  await expect(overlay).toContainText('Top draw-call sources:')
  const subscriberCount = await overlay
    .innerText()
    .then((text) => Number(text.match(/subscribers: (\d+)/)?.[1]))
  expect(subscriberCount).toBeGreaterThan(3)
  await expect(
    page.getByRole('button', { name: /run .* benchmark/i }),
  ).toBeVisible()
})

test('benchmarks each renderer in software WebGL', async ({ page }) => {
  test.setTimeout(180_000)
  const reports: unknown[] = []

  for (const [renderer, query] of [
    ['old', ''],
    ['per-hex', '&perHexLand=1'],
  ]) {
    await page.goto(`/hs?e2e=1&perf=1&perfSeconds=1${query}`)
    await waitForAppReady(page)
    await page.evaluate(() => {
      const target = window as Window & { __perfResults?: unknown }
      target.__perfResults = undefined
      window.addEventListener(
        'hexoscape-performance-benchmark-complete',
        (event) => {
          target.__perfResults = (event as CustomEvent<unknown>).detail
        },
        { once: true },
      )
    })
    await page.getByRole('button', { name: /run .* benchmark/i }).click()
    await page.waitForFunction(
      () =>
        typeof (window as Window & { __perfResults?: unknown })
          .__perfResults !== 'undefined',
      null,
      { timeout: 120_000 },
    )
    const report = await page.evaluate(
      () =>
        (window as Window & { __perfResults?: unknown }).__perfResults ?? null,
    )
    expect(report).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          resources: expect.objectContaining({
            typedArrayBytes: expect.any(Number),
            instanceMeshCount: expect.any(Number),
            topDrawCallSources: expect.any(Array),
          }),
          pointer: expect.objectContaining({
            pointerEventMsPerPointerMove: expect.any(Number),
            r3fDispatchMsPerPointerMove: expect.any(Number),
            appPointerHandlerMsPerPointerMove: expect.any(Number),
          }),
        }),
      ]),
    )
    reports.push({ renderer, report })
  }

  console.log(
    `Headless software-rendering performance baseline: ${JSON.stringify(reports)}`,
  )
  expect(reports).toHaveLength(2)
})

test('isolates pointer costs when the R3F event manager is disabled', async ({
  page,
}) => {
  test.setTimeout(120_000)
  await page.goto('/hs?e2e=1&perf=1&perfNoEvents=1&perfSeconds=1')
  await waitForAppReady(page)
  await page.evaluate(() => {
    const target = window as Window & { __perfResults?: unknown }
    target.__perfResults = undefined
    window.addEventListener(
      'hexoscape-performance-benchmark-complete',
      (event) => {
        target.__perfResults = (event as CustomEvent<unknown>).detail
      },
      { once: true },
    )
  })

  await page.getByRole('button', { name: /run .* benchmark/i }).click()
  await page.waitForFunction(
    () =>
      typeof (window as Window & { __perfResults?: unknown }).__perfResults !==
      'undefined',
    null,
    { timeout: 90_000 },
  )
  const report = await page.evaluate(
    () =>
      (window as Window & { __perfResults?: unknown }).__perfResults as
        | Array<{
            r3fEventsDisabled: boolean
            pointer: {
              pointerEventsPerSecond: number
              raycastMsPerPointerMove: number
              r3fDispatchMsPerPointerMove: number
            }
          }>
        | undefined,
  )
  console.log(`R3F-events-disabled pointer baseline: ${JSON.stringify(report)}`)
  expect(report?.[0]?.r3fEventsDisabled).toBe(true)
  expect(report?.[0]?.pointer.pointerEventsPerSecond).toBeGreaterThan(0)
  expect(report?.[0]?.pointer.raycastMsPerPointerMove).toBe(0)
  expect(report?.[0]?.pointer.r3fDispatchMsPerPointerMove).toBe(0)
})
