import {
  clickObjectiveMarker,
  dragObjectiveMarker,
  mapUrl,
  OBJECTIVE_MARKERS_FIXTURE_HEX_MAP,
  OBJECTIVE_MARKERS_FIXTURE_PIECE_IDS,
  test,
  waitForAppReady,
  expect,
} from './fixtures'
import { FIXTURE_HEX_MAP } from './fixture-map'

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

  const markerUID = await page.evaluate(
    () => window.__TEST__?.listRenderedObjectiveMarkerUIDs()[0] ?? null,
  )
  if (!markerUID) throw new Error('Placed objective marker is not rendered')
  await clickObjectiveMarker(page, markerUID)
  await page
    .getByRole('tab', {
      name: 'Show controls for editing details of the current map',
    })
    .click()

  const numberInput = page.getByRole('spinbutton', { name: 'Marker number' })
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
  await page.getByRole('tab', { name: 'Build' }).click()
  await penMode.click()
  await page.getByRole('option', { name: 'Select [Z]', exact: true }).click()
  await clickObjectiveMarker(page, markerUID)
  await dragObjectiveMarker(page, markerUID, { q: 3, r: 3, altitude: 1 })
  await waitForAppReady(page)
  const afterDrag = await page.evaluate(
    (uid) => window.__TEST__?.screenPosOfObjectiveMarker(uid) ?? null,
    markerUID,
  )
  expect(afterDrag).not.toEqual(beforeDrag)

  await page
    .getByRole('tab', {
      name: 'Show controls for editing details of the current map',
    })
    .click()
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
