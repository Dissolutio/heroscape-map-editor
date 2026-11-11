import { expect, mapUrl, saveEvidence, test, waitForAppReady } from './fixtures'

const rectangleMap = {
  id: 'map-size-display',
  name: 'Map Size Display',
  author: '',
  shape: 'rectangle',
  width: 4,
  length: 3,
  originQ: 0,
  originR: 0,
  version: 1,
}

test('shows live map size in the Edit tab and Create New Map', async ({
  page,
}) => {
  await page.goto(mapUrl(rectangleMap, []))
  await waitForAppReady(page)

  await page
    .getByRole('tab', {
      name: 'Show controls for editing details of the current map',
    })
    .click()
  const editSummary = page.getByTestId('map-size-summary')
  await expect(editSummary).toContainText('4 × 3 hexes')

  await page.getByRole('button', { name: '+ width' }).click()
  await waitForAppReady(page)
  await expect(editSummary).toContainText('5 × 3 hexes')
  await saveEvidence(page, 'map-size-display-edit')

  await page.getByRole('button', { name: 'Edit Map Details' }).click()
  const detailsDialog = page.getByRole('dialog', { name: 'Edit Map' })
  await expect(detailsDialog.getByTestId('map-size-summary')).toContainText(
    '5 × 3 hexes',
  )
  await expect(
    detailsDialog.getByText('Change the map size in the Edit tab.'),
  ).toBeVisible()
  await detailsDialog.getByRole('button', { name: 'Cancel' }).click()

  await page.locator('#simple-tab-1').click()
  await page.getByRole('button', { name: 'Create New Map' }).click()
  const newMapDialog = page.getByRole('dialog', { name: 'New Map' })
  const createSummary = newMapDialog.getByTestId('map-size-summary')
  const diagram = newMapDialog.getByTestId('map-size-diagram')
  await expect(createSummary).toContainText('20 × 20 hexes')
  await expect(diagram).toHaveAttribute(
    'aria-label',
    await createSummary.innerText(),
  )
  const initialDiagramText = await diagram.textContent()

  const mapWidthSlider = newMapDialog.getByRole('slider', {
    name: 'Map width',
  })
  await mapWidthSlider.focus()
  await mapWidthSlider.press('ArrowRight')
  await expect(createSummary).toContainText('21 × 20 hexes')
  await expect(diagram).toHaveAttribute(
    'aria-label',
    await createSummary.innerText(),
  )
  await expect.poll(() => diagram.textContent()).not.toBe(initialDiagramText)
  await saveEvidence(page, 'map-size-display-create')
})
