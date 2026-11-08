import { getShipWallSvgPolygonPoints } from '../src/pdf-svg-shared/hexPolygonPoints'
import { SVG_HEX_RADIUS } from '../src/utils/constants'
import { hexUtilsHexToPixel } from '../src/utils/map-utils'
import { expect, mapUrl, test, waitForAppReady } from './fixtures'

const shipWallBaseURL = mapUrl(
  {
    id: 'overwritten-ship-wall-origin',
    name: 'Overwritten Ship Wall Origin',
    author: '',
    version: 1,
    shape: 'rectangle',
    width: 10,
    length: 10,
  },
  ['0~2~2~0~g1', '1~2~2~0~sl'],
)

test('2D view keeps a Ship Wall symbol whose origin hex is overwritten', async ({
  page,
}) => {
  await page.goto(shipWallBaseURL)
  await waitForAppReady(page)

  const ship = await page.evaluate(() =>
    window.__TEST__?.listPieces().find((piece) => piece.inventoryID === 'sl'),
  )
  expect(ship).toBeDefined()
  if (!ship) return

  const waterPlaced = await page.evaluate(
    ({ coords, altitude }) =>
      window.__TEST__?.paintPiece('w1', coords, altitude) ?? false,
    { coords: ship.pieceCoords, altitude: ship.altitude },
  )
  expect(waterPlaced).toBe(true)
  await waitForAppReady(page)

  const shipHexes = await page.evaluate((uid) => {
    return window.__TEST__?.listPieceHexes(uid) ?? []
  }, ship.uid)
  expect(
    shipHexes.some(
      (hex) =>
        hex.q === ship.pieceCoords.q &&
        hex.r === ship.pieceCoords.r &&
        hex.altitude === ship.altitude + 1,
    ),
  ).toBe(false)

  await page.mouse.move(0, 0)
  await page.getByRole('button', { name: 'View 2D Map' }).click()
  const svg = page.locator('[id="2d-svg-view"]')
  await expect(svg.locator('title')).toHaveText('2D Map Display')

  const pixel = hexUtilsHexToPixel(ship.pieceCoords)
  const translation = `translate(${pixel.x}, ${pixel.y})`
  const rotation = `rotate(${(((ship.rotation % 6) + 6) % 6) * 60})`
  const points = getShipWallSvgPolygonPoints(SVG_HEX_RADIUS, 0).points
  const symbolCount = await svg.evaluate(
    (element, expected) => {
      const groups = [...element.querySelectorAll('g')].filter(
        (group) => group.getAttribute('transform') === expected.translation,
      )
      return groups.reduce(
        (count, group) =>
          count +
          [...group.querySelectorAll('g')].filter(
            (rotated) =>
              rotated.getAttribute('transform') === expected.rotation &&
              [...rotated.querySelectorAll('polygon')].some(
                (polygon) => polygon.getAttribute('points') === expected.points,
              ),
          ).length,
        0,
      )
    },
    { translation, rotation, points },
  )
  expect(symbolCount).toBe(1)
})
