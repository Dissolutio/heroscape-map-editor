import { FIXTURE_HEX_MAP } from './fixture-map'
import {
  OBJECTIVE_MARKERS_FIXTURE_HEX_MAP,
  OBJECTIVE_MARKERS_FIXTURE_PIECE_IDS,
  clickObjectiveMarker,
  clickPiece,
  dragObjectiveMarker,
  expect,
  findPieceUid,
  mapUrl,
  test,
  waitForAppReady,
} from './fixtures'

const SUPPORTING_PIECE_IDS = [
  '0~2~2~0~g1',
  '0~2~3~0~g1',
  '0~3~3~0~g1',
  '0~3~2~0~g1',
  '0~4~3~0~g1',
  '0~3~4~0~g1',
]

test('suggests unit names lazily and keeps them in saved map files', async ({
  page,
}) => {
  const unitNameRequests: string[] = []
  page.on('request', (request) => {
    if (request.url().endsWith('/objective-marker-unit-names.json')) {
      unitNameRequests.push(request.url())
    }
  })

  await page.goto(
    mapUrl(
      OBJECTIVE_MARKERS_FIXTURE_HEX_MAP,
      OBJECTIVE_MARKERS_FIXTURE_PIECE_IDS,
    ),
  )
  await waitForAppReady(page)
  expect(unitNameRequests).toEqual([])

  await clickObjectiveMarker(page, 'objective-ground')
  await page
    .getByRole('tab', {
      name: 'Show controls for editing details of the current map',
    })
    .click()

  const nameInput = page.getByRole('combobox', {
    name: 'Objective marker name',
  })
  await expect(nameInput).toHaveCount(1)
  await nameInput.fill('10th')
  const suggestion = page.getByRole('option', {
    name: '10th Regiment of Foot',
    exact: true,
  })
  await expect(suggestion).toBeVisible()
  await suggestion.click()
  await expect(nameInput).toHaveValue('10th Regiment of Foot')
  expect(unitNameRequests).toHaveLength(1)

  await page.getByRole('tab', { name: 'Build' }).click()
  await page.keyboard.press('Control+z')
  await page
    .getByRole('tab', {
      name: 'Show controls for editing details of the current map',
    })
    .click()
  await expect(nameInput).toHaveValue('')
  await expect
    .poll(() =>
      page.evaluate(() => window.__TEST__?.snapshot().objectiveMarkerCount),
    )
    .toBe(2)
  await page.getByRole('tab', { name: 'Build' }).click()
  await page.keyboard.press('Control+y')
  await page
    .getByRole('tab', {
      name: 'Show controls for editing details of the current map',
    })
    .click()
  await expect(nameInput).toHaveValue('10th Regiment of Foot')

  await page.getByRole('tab', { name: 'File' }).click()
  await page.getByRole('button', { name: 'Download Map File' }).click()
  const downloadPromise = page.waitForEvent('download')
  await page
    .getByRole('button', { name: 'Download file (.json)', exact: true })
    .click()
  const download = await downloadPromise
  const downloadPath = await download.path()
  if (!downloadPath) throw new Error('Map-file download was not saved')

  await page.locator('#jsonupload').setInputFiles(downloadPath)
  await waitForAppReady(page)
  await clickObjectiveMarker(page, 'objective-ground')
  await page
    .getByRole('tab', {
      name: 'Show controls for editing details of the current map',
    })
    .click()
  await expect(
    page.getByRole('combobox', { name: 'Objective marker name' }),
  ).toHaveValue('10th Regiment of Foot')
})

test('derives objective marker numbers unless the number is pinned', async ({
  page,
}) => {
  await page.goto(mapUrl(FIXTURE_HEX_MAP, SUPPORTING_PIECE_IDS))
  await waitForAppReady(page)

  await page.getByRole('tab', { name: 'Build' }).click()
  const penMode = page.getByRole('combobox', { name: 'Pen Mode' })
  await penMode.click()
  await page.getByRole('option', { name: 'Objective Marker' }).click()

  const numberInput = page.getByRole('spinbutton', { name: 'Marker number' })
  const pinNumber = page.getByRole('checkbox', { name: 'Pin number' })
  const canvas = page.locator('canvas').first()
  const placeAt = async (q: number, r: number) => {
    const point = await page.evaluate(
      ({ q, r }) =>
        window.__TEST__?.screenPosOfHex({ q, r, altitude: 1 }) ?? null,
      { q, r },
    )
    if (!point) throw new Error(`Marker hex ${q}, ${r} is not on screen`)
    await canvas.click({ position: point })
  }

  await expect(numberInput).toHaveValue('1')
  await expect(pinNumber).not.toBeChecked()
  await placeAt(2, 2)
  await expect
    .poll(() =>
      page.evaluate(() => window.__TEST__?.snapshot().objectiveMarkerCount),
    )
    .toBe(1)
  await expect(numberInput).toHaveValue('2')
  await page.getByRole('button', { name: 'White' }).click()
  await expect(numberInput).toHaveValue('1')
  await page.getByRole('button', { name: 'Black' }).click()
  await expect(numberInput).toHaveValue('2')

  await page.keyboard.press('Control+z')
  await expect
    .poll(() =>
      page.evaluate(() => window.__TEST__?.snapshot().objectiveMarkerCount),
    )
    .toBe(0)
  await expect(numberInput).toHaveValue('1')
  await page.keyboard.press('Control+y')
  await expect
    .poll(() =>
      page.evaluate(() => window.__TEST__?.snapshot().objectiveMarkerCount),
    )
    .toBe(1)
  await expect(numberInput).toHaveValue('2')

  await placeAt(3, 2)
  await expect
    .poll(() =>
      page.evaluate(() => window.__TEST__?.snapshot().objectiveMarkerCount),
    )
    .toBe(2)
  await expect(numberInput).toHaveValue('3')
  let secondMarkerUID = await page.evaluate(
    () => window.__TEST__?.listRenderedObjectiveMarkerUIDs()[1] ?? null,
  )
  if (!secondMarkerUID) throw new Error('Second marker is not rendered')
  await clickObjectiveMarker(page, secondMarkerUID)
  await expect(page.getByText('Content: Number 2')).toBeVisible()
  await page.getByRole('button', { name: 'Delete objective marker' }).click()
  await expect
    .poll(() =>
      page.evaluate(() => window.__TEST__?.snapshot().objectiveMarkerCount),
    )
    .toBe(1)
  await page.getByRole('tab', { name: 'Build' }).click()
  await penMode.click()
  await page.getByRole('option', { name: 'Objective Marker' }).click()
  await expect(numberInput).toHaveValue('2')
  await placeAt(3, 2)
  await expect
    .poll(() =>
      page.evaluate(() => window.__TEST__?.snapshot().objectiveMarkerCount),
    )
    .toBe(2)
  await expect(numberInput).toHaveValue('3')
  secondMarkerUID = await page.evaluate(
    () => window.__TEST__?.listRenderedObjectiveMarkerUIDs()[1] ?? null,
  )
  if (!secondMarkerUID) throw new Error('Replaced marker is not rendered')

  await canvas.click({ position: { x: 2, y: 2 } })
  await expect
    .poll(() =>
      page.evaluate(
        () => window.__TEST__?.snapshot().selectedObjectiveMarkerUID,
      ),
    )
    .toBeNull()
  await page.getByRole('tab', { name: 'Build' }).click()
  await penMode.click()
  await page.getByRole('option', { name: 'Objective Marker' }).click()
  await expect(numberInput).toHaveValue('3')

  await pinNumber.check()
  await numberInput.fill('7')
  await placeAt(3, 3)
  await expect
    .poll(() =>
      page.evaluate(() => window.__TEST__?.snapshot().objectiveMarkerCount),
    )
    .toBe(3)
  await expect(numberInput).toHaveValue('7')

  await pinNumber.uncheck()
  await numberInput.fill('1')
  await expect(numberInput).toHaveValue('3')
  await placeAt(2, 3)
  await expect
    .poll(() =>
      page.evaluate(() => window.__TEST__?.snapshot().objectiveMarkerCount),
    )
    .toBe(4)
  await expect(numberInput).toHaveValue('4')

  await clickObjectiveMarker(page, secondMarkerUID)
  const selectedNumberInput = page.getByRole('spinbutton', {
    name: 'Marker number',
  })
  await selectedNumberInput.fill('8')
  await expect(selectedNumberInput).toHaveValue('8')
  await canvas.click({ position: { x: 2, y: 2 } })
  await expect
    .poll(() =>
      page.evaluate(
        () => window.__TEST__?.snapshot().selectedObjectiveMarkerUID,
      ),
    )
    .toBeNull()
  await page.getByRole('tab', { name: 'Build' }).click()
  await penMode.click()
  await page.getByRole('option', { name: 'Objective Marker' }).click()
  await expect(numberInput).toHaveValue('2')

  await page.getByRole('button', { name: 'Text', exact: true }).click()
  await expect(pinNumber).toHaveCount(0)
  const textInput = page.getByRole('textbox', { name: 'Marker text' })
  await textInput.fill('A2')
  await placeAt(4, 3)
  await expect
    .poll(() =>
      page.evaluate(() => window.__TEST__?.snapshot().objectiveMarkerCount),
    )
    .toBe(5)
  await expect(textInput).toHaveValue('A2')
})

test('keeps auto-numbering correct after loading a map and creating a new one', async ({
  page,
}) => {
  await page.goto(mapUrl(FIXTURE_HEX_MAP, SUPPORTING_PIECE_IDS))
  await waitForAppReady(page)

  await page.getByRole('tab', { name: 'Build' }).click()
  const penMode = page.getByRole('combobox', { name: 'Pen Mode' })
  await penMode.click()
  await page.getByRole('option', { name: 'Objective Marker' }).click()
  const numberInput = page.getByRole('spinbutton', { name: 'Marker number' })
  await expect(numberInput).toHaveValue('1')

  const canvas = page.locator('canvas').first()
  const point = await page.evaluate(
    () => window.__TEST__?.screenPosOfHex({ q: 2, r: 2, altitude: 1 }) ?? null,
  )
  if (!point) throw new Error('Marker hex is not on screen')
  await canvas.click({ position: point })
  await expect(numberInput).toHaveValue('2')

  await page.getByRole('tab', { name: 'File' }).click()
  await page.getByRole('button', { name: 'Download Map File' }).click()
  const downloadPromise = page.waitForEvent('download')
  await page
    .getByRole('button', { name: 'Download file (.json)', exact: true })
    .click()
  const download = await downloadPromise
  const downloadPath = await download.path()
  if (!downloadPath) throw new Error('Map-file download was not saved')

  await page.locator('#jsonupload').setInputFiles(downloadPath)
  await waitForAppReady(page)
  await page.getByRole('tab', { name: 'Build' }).click()
  await penMode.click()
  await page.getByRole('option', { name: 'Objective Marker' }).click()
  await expect(numberInput).toHaveValue('2')

  await page.getByRole('tab', { name: 'File' }).click()
  await page.getByRole('button', { name: 'Create New Map' }).click()
  await page.getByRole('heading', { name: 'New Map' }).waitFor()
  await page.getByRole('button', { name: 'Create', exact: true }).click()
  await waitForAppReady(page)
  await expect
    .poll(() =>
      page.evaluate(() => window.__TEST__?.snapshot().objectiveMarkerCount),
    )
    .toBe(0)

  await page.getByRole('tab', { name: 'Build' }).click()
  await penMode.click()
  await page.getByRole('option', { name: 'Objective Marker' }).click()
  await expect(numberInput).toHaveValue('1')
})

test('places, edits, drags, deletes, and undoes an objective marker', async ({
  page,
}) => {
  await page.goto(mapUrl(FIXTURE_HEX_MAP, SUPPORTING_PIECE_IDS))
  await waitForAppReady(page)

  await page.getByRole('tab', { name: 'Build' }).click()
  const penMode = page.getByRole('combobox', { name: 'Pen Mode' })
  await penMode.click()
  await page.getByRole('option', { name: 'Objective Marker' }).click()
  await page.getByRole('button', { name: '2-hex marker' }).click()

  const canvas = page.locator('canvas').first()
  const initialHex = await page.evaluate(
    () => window.__TEST__?.screenPosOfHex({ q: 2, r: 2, altitude: 1 }) ?? null,
  )
  if (!initialHex) throw new Error('Initial marker hex is not on screen')
  await canvas.click({ position: initialHex })
  await expect
    .poll(() =>
      page.evaluate(() => window.__TEST__?.snapshot().objectiveMarkerCount),
    )
    .toBe(1)

  await expect
    .poll(() =>
      page.evaluate(
        () => window.__TEST__?.listRenderedObjectiveMarkerUIDs().length,
      ),
    )
    .toBe(1)
  const markerUID = await page.evaluate(
    () => window.__TEST__?.listRenderedObjectiveMarkerUIDs()[0] ?? null,
  )
  if (!markerUID) throw new Error('Placed objective marker is not rendered')
  await clickObjectiveMarker(page, markerUID)
  await expect
    .poll(() => page.evaluate(() => window.__TEST__?.snapshot().penMode))
    .toBe('select')
  await expect
    .poll(() =>
      page.evaluate(
        () => window.__TEST__?.snapshot().selectedObjectiveMarkerUID,
      ),
    )
    .toBe(markerUID)
  await expect(
    page.getByText('Type: Objective marker · Size: 2 hexes'),
  ).toBeVisible()
  await expect(page.getByText('Content: Number 1')).toBeVisible()
  await expect(page.getByText('Style: Black')).toBeVisible()
  await expect(page.getByText('Location: q 2, r 2, level 1')).toBeVisible()
  await expect(
    page.getByText(
      'Drag the marker to move it. Selecting a marker switches to Select mode.',
    ),
  ).toBeVisible()

  const secondFootprintHex = await page.evaluate(
    () => window.__TEST__?.screenPosOfHex({ q: 3, r: 2, altitude: 1 }) ?? null,
  )
  if (!secondFootprintHex) {
    throw new Error('Second marker footprint hex is not on screen')
  }
  await page.locator('canvas').first().click({ position: secondFootprintHex })
  await expect
    .poll(() =>
      page.evaluate(
        () => window.__TEST__?.snapshot().selectedObjectiveMarkerUID,
      ),
    )
    .toBe(markerUID)

  const pieceUID = await findPieceUid(page, {
    inventoryID: 'g1',
    q: 4,
    r: 3,
  })
  if (!pieceUID) throw new Error('Supporting terrain piece is not on the map')
  await clickPiece(page, pieceUID)
  await expect
    .poll(() =>
      page.evaluate(
        () => window.__TEST__?.snapshot().selectedObjectiveMarkerUID,
      ),
    )
    .toBeNull()
  await expect
    .poll(() =>
      page.evaluate(() => window.__TEST__?.snapshot().selectedPieceIDs),
    )
    .toEqual([pieceUID])

  await page
    .locator('canvas')
    .first()
    .click({ position: { x: 2, y: 2 } })
  await expect
    .poll(() =>
      page.evaluate(() => window.__TEST__?.snapshot().selectedPieceIDs),
    )
    .toEqual([])

  const numberInput = page.getByRole('spinbutton', { name: 'Marker number' })
  await clickObjectiveMarker(page, markerUID)
  await expect(numberInput).toBeVisible()
  await numberInput.fill('7')
  await expect(numberInput).toHaveValue('7')
  const whiteStyle = page.getByRole('button', { name: 'White' })
  await whiteStyle.click()
  await expect(whiteStyle).toHaveAttribute('aria-pressed', 'true')

  await page.keyboard.press('q')
  const oneStepRotation = page.getByRole('button', {
    name: 'Rotate marker 1 steps',
  })
  await expect(oneStepRotation).toHaveAttribute('aria-pressed', 'true')

  const beforeDrag = await page.evaluate(
    (uid) => window.__TEST__?.screenPosOfObjectiveMarker(uid) ?? null,
    markerUID,
  )
  if (!beforeDrag) throw new Error('Marker position is not available')
  await dragObjectiveMarker(page, markerUID, { q: 3, r: 3, altitude: 1 })
  await waitForAppReady(page)
  const afterDrag = await page.evaluate(
    (uid) => window.__TEST__?.screenPosOfObjectiveMarker(uid) ?? null,
    markerUID,
  )
  expect(afterDrag).not.toEqual(beforeDrag)
  await expect(page.getByText('Location: q 3, r 3, level 1')).toBeVisible()
  await page.getByRole('button', { name: 'Delete objective marker' }).click()
  await expect
    .poll(() =>
      page.evaluate(() => window.__TEST__?.snapshot().objectiveMarkerCount),
    )
    .toBe(0)

  await page.keyboard.press('Control+z')
  await waitForAppReady(page)
  await expect
    .poll(() =>
      page.evaluate(() => window.__TEST__?.snapshot().objectiveMarkerCount),
    )
    .toBe(1)
  await clickObjectiveMarker(page, markerUID)

  await page.keyboard.press('Control+z')
  await waitForAppReady(page)
  const afterUndoDrag = await page.evaluate(
    (uid) => window.__TEST__?.screenPosOfObjectiveMarker(uid) ?? null,
    markerUID,
  )
  expect(afterUndoDrag).toEqual(beforeDrag)

  await page.keyboard.press('Control+z')
  await expect(
    page.getByRole('button', { name: 'Rotate marker 0 steps' }),
  ).toHaveAttribute('aria-pressed', 'true')
  await page.keyboard.press('Control+z')
  await expect(page.getByRole('button', { name: 'Black' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await page.keyboard.press('Control+z')
  await expect(numberInput).toHaveValue('1')
  await page.keyboard.press('Control+z')
  await expect
    .poll(() =>
      page.evaluate(() => window.__TEST__?.snapshot().objectiveMarkerCount),
    )
    .toBe(0)
  await expect
    .poll(() =>
      page.evaluate(
        () => window.__TEST__?.snapshot().selectedObjectiveMarkerUID,
      ),
    )
    .toBeNull()
})
