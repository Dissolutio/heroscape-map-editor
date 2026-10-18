import { expect, hoverHex, setPen, test } from './fixtures'

test('a solid land pen previews ok over a free hex', async ({ page }) => {
  await setPen(page, 'g', 1)
  await hoverHex(page, { q: 2, r: 2, altitude: 0 })

  await page.waitForFunction(
    () =>
      window.__TEST__?.snapshot().placementPreview?.status === 'ok',
  )
  const snapshot = await page.evaluate(() => window.__TEST__?.snapshot())
  expect(snapshot?.placementPreview).toMatchObject({
    status: 'ok',
    reason: null,
    footprintCount: 1,
  })
})

test('a Laur add-on over grass previews blocked with its reason', async ({
  page,
}) => {
  await setPen(page, 'lws', 0)
  await hoverHex(page, { q: 0, r: 2, altitude: 1 })

  await page.waitForFunction(
    () =>
      window.__TEST__?.snapshot().placementPreview?.reason ===
      'needsLaurPillar',
  )
  const snapshot = await page.evaluate(() => window.__TEST__?.snapshot())
  expect(snapshot?.placementPreview).toMatchObject({
    status: 'blocked',
    reason: 'needsLaurPillar',
    footprintCount: 0,
  })
})
