import { expect, mapUrl, test, waitForAppReady } from './fixtures'
import { FIXTURE_HEX_MAP, FIXTURE_PIECE_IDS } from './fixture-map'

test('camera actions and tooltips follow the active view', async ({ page }) => {
  const genericColorsText =
    'Cap colors also drive SVG/PDF; 2D sub-level shades are derived automatically. Side colors affect only 3D.'
  const buriedMarksText =
    '* = the top of this tile will be covered. † = its sides will be covered. Both = fully hidden, so any piece of the same size and kind (solid for solid, fluid for fluid) works.'
  const cameraAction = page.getByRole('button', { name: /Zoom to map/ })

  await page.locator('#simple-tab-3').click()
  await expect(cameraAction).toBeVisible()
  await expect(page.getByRole('button', { name: /Reset camera/ })).toBeVisible()
  await expect(
    page.getByRole('button', { name: /Use (perspective|orthographic) camera/ }),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: /Take map picture/ }),
  ).toBeVisible()

  const genericColorsLabel = page.getByText('Generic piece colors', {
    exact: true,
  })
  await genericColorsLabel.hover()
  await expect(page.getByRole('tooltip')).toHaveText(genericColorsText)

  await page.getByRole('button', { name: 'View 2D Map' }).click()
  await expect(cameraAction).toHaveCount(0)
  await expect(genericColorsLabel).toBeVisible()

  await page
    .getByRole('button', { name: 'View pdf build instructions' })
    .click()
  await expect(cameraAction).toHaveCount(0)
  const buriedMarksSwitch = page.getByRole('checkbox', {
    name: /Show Buried-Tile Marks/,
  })
  await expect(buriedMarksSwitch).toBeVisible()
  await buriedMarksSwitch.hover()
  await expect(page.getByRole('tooltip')).toHaveText(buriedMarksText)
})

test('new map author appears in Edit Map Details and can be remembered', async ({
  page,
}) => {
  await page.locator('#simple-tab-1').click()
  await page.getByRole('button', { name: 'Create New Map' }).click()

  await page.getByRole('textbox', { name: 'Map Title' }).fill('Authored Map')
  await page.getByRole('textbox', { name: 'Map Author' }).fill('Map Builder')
  await page.getByRole('textbox', { name: 'Map Notes' }).fill('Map notes')

  const rememberName = page.getByRole('checkbox', {
    name: 'Remember my name for new maps',
  })
  await expect(rememberName).not.toBeChecked()
  await rememberName.check()
  await page.getByRole('button', { name: 'Create', exact: true }).click()
  await waitForAppReady(page)

  await page.locator('#simple-tab-2').click()
  await page.getByRole('button', { name: 'Edit Map Details' }).click()
  await expect(page.getByRole('textbox', { name: 'Map Author' })).toHaveValue(
    'Map Builder',
  )
  await expect(page.getByRole('textbox', { name: 'Map Notes' })).toHaveValue(
    'Map notes',
  )

  await page.getByRole('button', { name: 'Cancel' }).click()
  await page.locator('#simple-tab-1').click()
  await page.getByRole('button', { name: 'Create New Map' }).click()
  await expect(page.getByRole('textbox', { name: 'Map Author' })).toHaveValue(
    'Map Builder',
  )
  await expect(rememberName).toBeChecked()

  await rememberName.uncheck()
  await page.getByRole('button', { name: 'Cancel' }).click()
  await page.getByRole('button', { name: 'Create New Map' }).click()
  await expect(page.getByRole('textbox', { name: 'Map Author' })).toHaveValue(
    '',
  )
  await expect(rememberName).not.toBeChecked()
})

test('Pieces Grid filters survive zooming to a piece', async ({ page }) => {
  await page.getByRole('tab', { name: 'Build' }).click()
  await page.getByRole('button', { name: 'View Pieces Grid' }).click()

  const search = page.getByRole('searchbox')
  await search.fill('Sand')
  const sandRow = page.getByRole('row').filter({ hasText: '1-hex Sand' })
  await expect(sandRow).toHaveCount(1)
  await sandRow.getByRole('button', { name: 'Zoom To' }).click()
  await waitForAppReady(page)

  await page.getByRole('button', { name: 'View Pieces Grid' }).click()
  await expect(page.getByRole('searchbox')).toHaveValue('Sand')
  await expect(
    page.getByRole('row').filter({ hasText: '1-hex Sand' }),
  ).toHaveCount(1)
})

test('Map Inventory selects available pen modes and disables unavailable ones', async ({
  page,
}) => {
  await page.goto(
    mapUrl({ ...FIXTURE_HEX_MAP, setsUsed: ['I'] }, FIXTURE_PIECE_IDS),
  )
  await waitForAppReady(page)
  await page.getByRole('button', { name: 'View Map Inventory' }).click()

  const roadPen = page.getByRole('button', {
    name: 'Set 1-hex Road as pen mode',
  })
  await roadPen.click()
  await expect(page.getByTestId('app-status')).toContainText('pen rd1')
  await expect(
    page.getByRole('heading', { name: 'View Map Inventory' }),
  ).toBeVisible()

  const unavailableGrass = page.getByRole('button', {
    name: 'Set 1-hex Grass as pen mode',
  })
  await expect(unavailableGrass).toBeDisabled()
  await unavailableGrass.locator('xpath=..').hover()
  await expect(page.getByRole('tooltip')).toHaveText(
    'This piece is not available in the active terrain constraints.',
  )
})

test('map shrink controls are disabled when a piece occupies the removed edge', async ({
  page,
}) => {
  await page.goto(
    mapUrl({ ...FIXTURE_HEX_MAP, width: 3, length: 3 }, ['0~1~2~0~g1']),
  )
  await waitForAppReady(page)
  await page.locator('#simple-tab-2').click()

  const removeLength = page.getByRole('button', { name: '- length' })
  const removeWidth = page.getByRole('button', { name: '- width' })
  await expect(removeLength).toBeDisabled()
  await expect(removeWidth).toBeDisabled()

  await removeLength.locator('xpath=..').hover()
  await expect(page.getByRole('tooltip')).toHaveText(
    'Cannot remove the bottom row because pieces occupy hexes in it',
  )
})
