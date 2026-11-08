import { readFile } from 'node:fs/promises'
import { Pieces } from '../src/types'
import {
  clickPiece,
  expect,
  findPieceUid,
  mapUrl,
  test,
  waitForAppReady,
} from './fixtures'
import { FIXTURE_HEX_MAP } from './fixture-map'

const GLYPH_MAP_URL = mapUrl(FIXTURE_HEX_MAP, [
  `0~0~2~0~${Pieces.grass1}`,
  `1~0~2~0~${Pieces.glyphPower}`,
])

test('hides glyphs only in 3D and leaves SVG downloads unchanged', async ({
  page,
}) => {
  await page.goto(GLYPH_MAP_URL)
  await waitForAppReady(page)

  const glyphUID = await findPieceUid(page, {
    inventoryID: Pieces.glyphPower,
    q: 0,
    r: 2,
    altitude: 1,
  })
  const renderedGlyphUIDs = () =>
    page.evaluate(() => window.__TEST__?.listRenderedGlyphUIDs())
  await expect.poll(renderedGlyphUIDs).toContain(glyphUID)

  await page.locator('#simple-tab-3').click()
  const showGlyphs = page.getByRole('checkbox', { name: 'Show Glyphs' })
  await expect(showGlyphs).toBeChecked()
  await showGlyphs.uncheck()
  await expect.poll(renderedGlyphUIDs).not.toContain(glyphUID)

  await clickPiece(page, glyphUID)
  await expect
    .poll(() =>
      page.evaluate(() => window.__TEST__?.snapshot().selectedPieceIDs),
    )
    .not.toContain(glyphUID)

  await showGlyphs.check()
  await expect.poll(renderedGlyphUIDs).toContain(glyphUID)
  await clickPiece(page, glyphUID)
  await expect
    .poll(() =>
      page.evaluate(() => window.__TEST__?.snapshot().selectedPieceIDs),
    )
    .toContain(glyphUID)

  await showGlyphs.uncheck()
  await expect.poll(renderedGlyphUIDs).not.toContain(glyphUID)
  await page.getByRole('button', { name: 'View 2D Map' }).click()
  await page.getByRole('checkbox', { name: 'Show Overlay Level' }).uncheck()
  await page.locator('#simple-tab-1').click()
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download this level (SVG)' }).click()
  const download = await downloadPromise
  const path = await download.path()
  if (!path) throw new Error('SVG download did not produce a file')
  const svg = await readFile(path, 'utf8')
  expect(svg).toContain('fill="rgb(255, 124, 3)"')
  expect(svg).toContain('<path d=')

  await page.reload()
  await waitForAppReady(page)
  await page.locator('#simple-tab-3').click()
  await expect(
    page.getByRole('checkbox', { name: 'Show Glyphs' }),
  ).toBeChecked()
})
