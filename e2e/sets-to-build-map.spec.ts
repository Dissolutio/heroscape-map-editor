import { FIXTURE_HEX_MAP, FIXTURE_PIECE_IDS } from './fixture-map'
import {
  expect,
  mapUrl,
  saveLocatorEvidence,
  test,
  waitForAppReady,
} from './fixtures'

test('Sets to build dialog lists catalog options outside Map Inventory', async ({
  page,
}) => {
  await page.goto(mapUrl(FIXTURE_HEX_MAP, FIXTURE_PIECE_IDS))
  await waitForAppReady(page)
  await page
    .getByRole('tab', { name: /taking a map picture, controlling the camera/ })
    .click()
  await page.getByRole('button', { name: 'Sets to build this map' }).click()

  const dialog = page.getByRole('dialog')
  await saveLocatorEvidence(dialog, 'sets-to-build-map-after')
  await expect(
    dialog.getByRole('heading', { name: 'Sets to build this map' }),
  ).toBeVisible()
  await expect(
    dialog.getByRole('heading', { name: 'Contemporary' }),
  ).toBeVisible()
  await expect(dialog.getByRole('heading', { name: 'Classic' })).toBeVisible()
  await expect(
    dialog
      .getByText(/\d+× .+ — \d+ (Master Sets?|Expansions?|Promos?)/)
      .first(),
  ).toBeVisible()
  await expect(dialog.getByText(/MSTK|Max Shared Terrain Kit/)).toHaveCount(0)

  await page.getByRole('button', { name: 'Close' }).click()
  await page.getByRole('tab', { name: 'Build' }).click()
  await page.getByRole('button', { name: 'View Map Inventory' }).click()
  await expect(
    page.getByRole('dialog').getByRole('heading', {
      name: 'Sets to build this map',
    }),
  ).toHaveCount(0)
})
