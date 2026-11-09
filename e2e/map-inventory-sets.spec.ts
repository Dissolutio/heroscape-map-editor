import { expect, mapUrl, test, waitForAppReady } from './fixtures'
import { FIXTURE_HEX_MAP, FIXTURE_PIECE_IDS } from './fixture-map'

test('Map Inventory recommends the sets needed by the map', async ({
  page,
}) => {
  await page.goto(mapUrl(FIXTURE_HEX_MAP, FIXTURE_PIECE_IDS))
  await waitForAppReady(page)
  await page.getByRole('button', { name: 'View Map Inventory' }).click()

  await expect(
    page.getByRole('heading', { name: 'Sets to build this map' }),
  ).toBeVisible()
  await expect(page.getByText('1× Max Shared Terrain Kit (MSTK)')).toBeVisible()
})
