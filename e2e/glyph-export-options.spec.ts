import { piecesSoFar } from '../src/data/pieces'
import { Pieces } from '../src/types'
import { expect, mapUrl, test, waitForAppReady } from './fixtures'
import { FIXTURE_HEX_MAP } from './fixture-map'

const glyphMapURL = mapUrl(FIXTURE_HEX_MAP, [
  `0~0~2~0~${Pieces.grass1}`,
  `1~0~2~0~${Pieces.glyphPower}`,
  `0~1~2~0~${Pieces.outcrop1}`,
])

test('glyph export options update the SVG view', async ({ page }) => {
  await page.goto(glyphMapURL)
  await waitForAppReady(page)
  await page.locator('#simple-tab-3').click()
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
  await svg.screenshot({ path: 'docs/evidence/glyph-spaces-before.png' })

  const transparentGlyphs = page.getByRole('checkbox', {
    name: 'Transparent glyph spaces',
  })
  await transparentGlyphs.hover()
  await expect(page.getByRole('tooltip')).toHaveText(
    'Show glyph spaces transparently in SVG and PDF, preserving outlines and symbols.',
  )
  await transparentGlyphs.check()
  await expect.poll(getGlyphAttributes).toEqual({
    fills: ['none', before.fills[1]],
    symbol: '?',
  })

  await page.mouse.move(0, 0)
  await expect(page.getByRole('tooltip')).toHaveCount(0)
  const hideHeights = page.getByRole('checkbox', {
    name: 'Hide heights on glyphs',
  })
  await hideHeights.hover()
  await expect(page.getByRole('tooltip')).toHaveText(
    'Hide hex heights at glyph spaces in SVG and PDF.',
  )
  await hideHeights.check()
  await expect
    .poll(async () => (await getSvgText()).includes(height))
    .toBe(true)
  await expect(glyphSymbol).toHaveText('?')
  await svg.screenshot({ path: 'docs/evidence/glyph-spaces-after.png' })
})
