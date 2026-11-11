import { piecesSoFar } from '../src/data/pieces'
import { Pieces } from '../src/types'
import {
  expect,
  mapUrl,
  saveLocatorEvidence,
  test,
  waitForAppReady,
} from './fixtures'
import { FIXTURE_HEX_MAP } from './fixture-map'

const glyphMapURL = mapUrl(FIXTURE_HEX_MAP, [
  `0~0~2~0~${Pieces.grass1}`,
  `1~0~2~0~${Pieces.glyphPower}`,
  `0~1~2~0~${Pieces.outcrop1}`,
])

test('glyphs remain opaque and heights visible in SVG exports', async ({
  page,
}) => {
  await page.goto(glyphMapURL)
  await waitForAppReady(page)
  await page.locator('#simple-tab-3').click()
  await page.mouse.move(0, 0)
  await page.getByRole('button', { name: 'View 2D Map' }).click()
  await page.getByRole('checkbox', { name: 'Show Overlay Level' }).uncheck()
  const svg = page.locator('[id="2d-svg-view"]')
  await expect(svg).toBeVisible()

  const glyphSymbol = svg.locator('text').filter({ hasText: '?' })
  await expect(glyphSymbol).toHaveCount(1)
  const getGlyphAttributes = () =>
    glyphSymbol.evaluate((symbol) => {
      const polygons = [
        ...(symbol.parentElement?.querySelectorAll('polygon') ?? []),
      ]
      return {
        fills: polygons.map((polygon) => polygon.getAttribute('fill')),
        symbol: symbol.textContent,
      }
    })
  const getSvgText = () => svg.locator('text').allTextContents()
  const height = String(piecesSoFar[Pieces.outcrop1].height)

  await expect
    .poll(async () => (await getSvgText()).includes(height))
    .toBe(true)
  const before = await getGlyphAttributes()
  expect(before.fills[0]).not.toBe('none')
  await saveLocatorEvidence(svg, 'glyph-export')
})
