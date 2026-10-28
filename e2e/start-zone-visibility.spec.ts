import {
  clickHex,
  clickPiece,
  expect,
  findPieceUid,
  mapUrl,
  saveEvidence,
  setPen,
  test,
  waitForAppReady,
} from './fixtures'

const START_ZONE_MAP = mapUrl(
  {
    id: 'e2e-start-zone-visibility',
    name: 'E2E Start Zone Visibility',
    author: 'e2e',
    version: 1,
    shape: 'rectangle',
    width: 8,
    length: 8,
  },
  ['0~1~2~0~z1', '0~3~2~0~z2', '0~5~4~0~g1', '0~6~5~0~g1'],
)

test('hides placed start zones without affecting selection on show', async ({
  page,
}) => {
  await page.goto(START_ZONE_MAP)
  await waitForAppReady(page)

  const zone = await findPieceUid(page, {
    inventoryID: 'z1',
    q: 1,
    r: 2,
  })
  await clickPiece(page, zone)
  await expect
    .poll(() =>
      page.evaluate(() => window.__TEST__?.snapshot().selectedPieceIDs),
    )
    .toEqual([zone])

  await page.locator('#simple-tab-3').click()
  const showStartZones = page.getByRole('checkbox', {
    name: 'Show Start Zones',
  })
  await expect(showStartZones).toBeChecked()
  await showStartZones.click()
  await expect(showStartZones).not.toBeChecked()
  await expect
    .poll(() =>
      page.evaluate(() => window.__TEST__?.snapshot().selectedPieceIDs),
    )
    .toEqual([])

  await page.mouse.move(0, 0)
  await saveEvidence(page, 'start-zones-hidden-3d')

  await clickPiece(page, zone)
  await expect
    .poll(() =>
      page.evaluate(() => window.__TEST__?.snapshot().selectedPieceIDs),
    )
    .not.toContain(zone)

  await setPen(page, 'z3', 0)
  await clickHex(page, { q: 4, r: 4, altitude: 0 })
  await expect(
    page.getByText(
      'Start zones are hidden in 3D. Turn them on in the View tab.',
    ),
  ).toBeVisible()
  await expect(showStartZones).not.toBeChecked()
  await expect
    .poll(() => page.evaluate(() => window.__TEST__?.listPieces().length))
    .toBe(5)

  await showStartZones.click()
  await expect(showStartZones).toBeChecked()
  await clickPiece(page, zone)
  await expect
    .poll(() =>
      page.evaluate(() => window.__TEST__?.snapshot().selectedPieceIDs),
    )
    .toEqual([zone])

  await page.reload()
  await waitForAppReady(page)
  await page.locator('#simple-tab-3').click()
  await expect(
    page.getByRole('checkbox', { name: 'Show Start Zones' }),
  ).toBeChecked()
})
