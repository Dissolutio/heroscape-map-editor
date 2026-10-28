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
  await expect(overlay).toContainText('React MapDisplay3D:')
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
    reports.push({ renderer, report })
  }

  console.log(
    `Headless software-rendering performance baseline: ${JSON.stringify(reports)}`,
  )
  expect(reports).toHaveLength(2)
})
