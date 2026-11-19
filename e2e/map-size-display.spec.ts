import {
  expect,
  findPieceUid,
  mapUrl,
  saveEvidence,
  test,
  waitForAppReady,
} from './fixtures'

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

async function expectLengthLabelWithinDiagram(
  diagram: import('@playwright/test').Locator,
) {
  const diagramBounds = await diagram.boundingBox()
  const lengthLabelBounds = await diagram
    .locator('text')
    .filter({ hasText: 'Length' })
    .boundingBox()
  if (!diagramBounds || !lengthLabelBounds) {
    throw new Error('Could not measure the map size diagram')
  }

  expect(lengthLabelBounds.x).toBeGreaterThanOrEqual(diagramBounds.x)
  expect(lengthLabelBounds.x + lengthLabelBounds.width).toBeLessThanOrEqual(
    diagramBounds.x + diagramBounds.width,
  )
  expect(lengthLabelBounds.y).toBeGreaterThanOrEqual(diagramBounds.y)
  expect(lengthLabelBounds.y + lengthLabelBounds.height).toBeLessThanOrEqual(
    diagramBounds.y + diagramBounds.height,
  )
}

test('shows live map size controls and conversion across map dialogs', async ({
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
  await expect(editSummary).toHaveCount(0)
  const lengthValue = page.getByTestId('map-size-length-value')
  const widthValue = page.getByTestId('map-size-width-value')
  await expect(lengthValue).toHaveText('3')
  await expect(widthValue).toHaveText('4')
  await expect(
    page.getByRole('button', { name: 'Convert to hexagon map' }),
  ).toHaveCount(0)

  await page.getByRole('button', { name: 'Add a row at the bottom' }).click()
  await waitForAppReady(page)
  await expect(lengthValue).toHaveText('4')
  await expect(widthValue).toHaveText('4')
  await page.getByRole('button', { name: 'Add a column on the right' }).click()
  await waitForAppReady(page)
  await expect(lengthValue).toHaveText('4')
  await expect(widthValue).toHaveText('5')
  await saveEvidence(page, 'map-size-display-edit-rectangle')

  await page.getByRole('button', { name: 'Edit Map Details' }).click()
  const detailsDialog = page.getByRole('dialog', { name: 'Edit Map' })
  await expect(detailsDialog.getByTestId('map-size-summary')).toContainText(
    'Length 4 · Width 5 hexes',
  )
  await expect(detailsDialog.getByText('Shape: Rectangle')).toBeVisible()
  const detailsDiagram = detailsDialog.getByTestId('map-size-diagram')
  await expectLengthLabelWithinDiagram(detailsDiagram)
  await saveEvidence(page, 'map-size-display-details')
  await detailsDialog
    .getByRole('button', { name: 'Convert to hexagon map' })
    .click()
  await expect(
    detailsDialog.getByRole('button', { name: 'Convert to rectangle map' }),
  ).toBeVisible()
  await expect(detailsDialog.getByText('Shape: Hexagon')).toBeVisible()
  await expect(
    page.getByText(/Converted to a hexagon map \(size \d+\)/),
  ).toBeVisible()
  await detailsDialog.getByRole('button', { name: 'Cancel' }).click()
  await expect(page.getByTestId('map-size-length-value')).toHaveText(/^\d+$/)
  await expect(
    page.getByRole('button', { name: 'Add an outer ring' }),
  ).toBeVisible()
  await saveEvidence(page, 'map-size-display-edit-hexagon')

  await page.getByRole('button', { name: 'Edit Map Details' }).click()
  const hexagonDetailsDialog = page.getByRole('dialog', { name: 'Edit Map' })
  await expect(hexagonDetailsDialog.getByText('Shape: Hexagon')).toBeVisible()
  await hexagonDetailsDialog
    .getByRole('button', { name: 'Convert to rectangle map' })
    .click()
  await expect(hexagonDetailsDialog.getByText('Shape: Rectangle')).toBeVisible()
  await expect(
    page.getByText(/Converted to a rectangle map \(\d+ × \d+\)/),
  ).toBeVisible()
  await hexagonDetailsDialog.getByRole('button', { name: 'Cancel' }).click()

  await page.locator('#simple-tab-1').click()
  await page.getByRole('button', { name: 'Create New Map' }).click()
  const newMapDialog = page.getByRole('dialog', { name: 'New Map' })
  const createSummary = newMapDialog.getByTestId('map-size-summary')
  const diagram = newMapDialog.getByTestId('map-size-diagram')
  await expectLengthLabelWithinDiagram(diagram)
  await expect(createSummary).toContainText('Length 20 · Width 20 hexes')
  await expect(diagram).toHaveAttribute(
    'aria-label',
    (await createSummary.textContent()) ?? '',
  )
  const initialDiagramText = await diagram.textContent()

  const mapWidthSlider = newMapDialog.getByRole('slider', {
    name: 'Map width',
  })
  await mapWidthSlider.focus()
  await mapWidthSlider.press('ArrowRight')
  await expect(createSummary).toContainText('Length 20 · Width 21 hexes')
  await expect(diagram).toHaveAttribute(
    'aria-label',
    (await createSummary.textContent()) ?? '',
  )
  await expect.poll(() => diagram.textContent()).not.toBe(initialDiagramText)
  await saveEvidence(page, 'map-size-display-create')
})

test('trims padded maps without moving pieces', async ({ page }) => {
  const paddedMap = {
    id: 'trim-map',
    name: 'Trim Map',
    author: '',
    shape: 'rectangle',
    width: 8,
    length: 8,
    originQ: 0,
    originR: 0,
    version: 1,
  }
  await page.goto(mapUrl(paddedMap, ['0~2~2~0~g1']))
  await waitForAppReady(page)

  await page
    .getByRole('tab', {
      name: 'Show controls for editing details of the current map',
    })
    .click()

  const pieceUID = await findPieceUid(page, {
    inventoryID: 'g1',
    q: 2,
    r: 2,
  })
  if (!pieceUID) throw new Error('Trim test piece is not rendered')
  const beforePiece = await page.evaluate(
    (uid) => window.__TEST__?.screenPosOfPiece(uid) ?? null,
    pieceUID,
  )
  await page.getByRole('button', { name: 'Trim map' }).click()
  await waitForAppReady(page)

  await expect(page.getByTestId('map-size-length-value')).toHaveText(/^[1-8]$/)
  await expect(page.getByTestId('map-size-width-value')).toHaveText(/^[1-8]$/)
  await page.getByRole('button', { name: 'Edit Map Details' }).click()
  await expect(
    page
      .getByRole('dialog', { name: 'Edit Map' })
      .getByTestId('map-size-summary'),
  ).not.toContainText('Length 8')

  const afterPiece = await page.evaluate(
    (uid) => window.__TEST__?.screenPosOfPiece(uid) ?? null,
    pieceUID,
  )
  expect(afterPiece).toEqual(beforePiece)

  await page
    .getByRole('dialog', { name: 'Edit Map' })
    .getByRole('button', { name: 'Cancel' })
    .click()
  await page.keyboard.press('Control+z')
  await expect(page.getByTestId('map-size-length-value')).toHaveText('8')
  await expect(page.getByTestId('map-size-width-value')).toHaveText('8')
})
