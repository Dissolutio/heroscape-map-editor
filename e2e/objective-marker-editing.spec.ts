import {
  clickObjectiveMarker,
  dragObjectiveMarker,
  mapUrl,
  test,
  waitForAppReady,
  expect,
} from './fixtures'
import { FIXTURE_HEX_MAP } from './fixture-map'

test('places, edits, drags, deletes, and undoes an objective marker', async ({
  page,
}) => {
  await page.goto(mapUrl(FIXTURE_HEX_MAP, []))
  await waitForAppReady(page)

  await page.getByRole('tab', { name: 'Build' }).click()
  const penMode = page.getByRole('combobox', { name: 'Pen Mode' })
  await penMode.click()
  await page.getByRole('option', { name: 'Objective Marker' }).click()
  await page.getByRole('button', { name: '2 hexes' }).click()

  const canvas = page.locator('canvas').first()
  const initialHex = await page.evaluate(
    () => window.__TEST__?.screenPosOfHex({ q: 2, r: 2, altitude: 0 }) ?? null,
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
  await page.getByRole('tab', { name: 'Edit' }).click()

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
  await page.getByRole('option', { name: 'Select' }).click()
  await clickObjectiveMarker(page, markerUID)
  await dragObjectiveMarker(page, markerUID, { q: 3, r: 3, altitude: 0 })
  await waitForAppReady(page)
  const afterDrag = await page.evaluate(
    (uid) => window.__TEST__?.screenPosOfObjectiveMarker(uid) ?? null,
    markerUID,
  )
  expect(afterDrag).not.toEqual(beforeDrag)

  await page.getByRole('tab', { name: 'Edit' }).click()
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
