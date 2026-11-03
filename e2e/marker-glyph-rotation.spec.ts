import { Pieces } from '../src/types'
import {
  expect,
  findPieceUid,
  mapUrl,
  OBJECTIVE_MARKERS_FIXTURE_HEX_MAP,
  OBJECTIVE_MARKERS_FIXTURE_PIECE_IDS,
  test,
  waitForAppReady,
} from './fixtures'

const rotationDegrees = 30
const markerGlyphRotationURL = mapUrl(
  OBJECTIVE_MARKERS_FIXTURE_HEX_MAP,
  [
    ...OBJECTIVE_MARKERS_FIXTURE_PIECE_IDS,
    `1~2~2~0~${Pieces.glyphPower}`,
  ],
)

test('shared rotation turns rendered markers and glyph symbols', async ({
  page,
}) => {
  await page.goto(markerGlyphRotationURL)
  await waitForAppReady(page)

  const glyphUID = await findPieceUid(page, {
    inventoryID: Pieces.glyphPower,
    q: 2,
    r: 2,
    altitude: 1,
  })
  await expect
    .poll(() =>
      page.evaluate((uid) => window.__TEST__?.getRenderedGlyphRotationY(uid), glyphUID),
    )
    .toBeCloseTo(0)

  await page.locator('#simple-tab-3').click()
  const slider = page.getByRole('slider', {
    name: 'Marker and glyph rotation',
  })
  const degreesField = page.getByRole('spinbutton', { name: 'Degrees' })
  await degreesField.fill(String(rotationDegrees))

  await expect(slider).toHaveAttribute('aria-valuenow', '30')
  await expect
    .poll(() =>
      page.evaluate(() => {
        const settings = JSON.parse(localStorage.getItem('settings') ?? '{}')
        return settings.values?.markerGlyphRotation
      }),
    )
    .toBe(rotationDegrees)

  const renderedRotation = (uid: string) =>
    page.evaluate(
      (markerUID) =>
        window.__TEST__?.getRenderedObjectiveMarkerRotationY(markerUID) ?? null,
      uid,
    )
  await expect.poll(() => renderedRotation('objective-ground')).toBeCloseTo(
    (-5 * Math.PI) / 6,
  )
  await expect.poll(() => renderedRotation('objective-stacked')).toBeCloseTo(
    -Math.PI / 2,
  )
  await expect
    .poll(() =>
      page.evaluate(
        (uid) => window.__TEST__?.getRenderedGlyphRotationY(uid) ?? null,
        glyphUID,
      ),
    )
    .toBeCloseTo(Math.PI / 6)

  await slider.hover()
  await expect(page.getByRole('tooltip')).toHaveText(
    'Rotates every objective marker and glyph symbol in 3D. It does not follow the camera or change saved maps or 2D/PDF exports.',
  )

  await page.getByRole('button', { name: 'Reset' }).click()
  await expect(slider).toHaveAttribute('aria-valuenow', '0')
  await expect
    .poll(() =>
      page.evaluate(() => {
        const settings = JSON.parse(localStorage.getItem('settings') ?? '{}')
        return settings.values?.markerGlyphRotation
      }),
    )
    .toBeUndefined()
})
