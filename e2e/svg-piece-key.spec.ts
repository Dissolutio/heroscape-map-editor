import { readFile } from 'node:fs/promises'
import { Pieces } from '../src/types'
import {
  expect,
  mapUrl,
  saveLocatorEvidence,
  test,
  waitForAppReady,
} from './fixtures'
import { FIXTURE_HEX_MAP, FIXTURE_PIECE_IDS } from './fixture-map'

const pieceKeyURL = mapUrl({ ...FIXTURE_HEX_MAP, width: 12, length: 12 }, [
  ...FIXTURE_PIECE_IDS,
  `0~6~1~0~${Pieces.grass2}`,
  `0~6~5~0~${Pieces.grass3}`,
  `0~3~8~0~${Pieces.grass7}`,
  `0~8~6~0~${Pieces.rock1}`,
  `0~9~9~0~${Pieces.sand1}`,
  `0~5~1~0~${Pieces.sand2}`,
  `0~8~2~0~${Pieces.sand3}`,
  `0~4~9~0~${Pieces.rock2}`,
  `0~7~10~0~${Pieces.rock3}`,
  `0~1~0~0~${Pieces.water3}`,
  `0~10~2~0~${Pieces.tree10}`,
  `0~3~2~0~${Pieces.laurWallLong}`,
  `0~10~8~0~${Pieces.ladder}`,
])

test('SVG downloads include the optional editable piece key', async ({
  page,
}) => {
  await page.goto(pieceKeyURL)
  await waitForAppReady(page)
  await page.locator('#simple-tab-3').click()
  await page.getByRole('button', { name: 'PDF', exact: true }).click()

  const includeKey = page.getByRole('checkbox', {
    name: 'Include piece key in SVG and PDF',
  })
  await includeKey.check()
  await page.getByRole('button', { name: '2D', exact: true }).click()
  const key = page.locator('[data-testid="svg-piece-key"]')
  await expect(key).toBeVisible()
  await expect(key.getByText('Grass', { exact: true })).toBeVisible()
  await expect(key.getByText('Sand', { exact: true })).toBeVisible()
  await expect(key.getByText('Rock', { exact: true })).toBeVisible()
  await expect(key.getByText('Water', { exact: true })).toBeVisible()
  await expect(key.getByText('Evergreen Trees', { exact: true })).toBeVisible()
  await expect(
    key.getByText('Pillars and Walls (Laur)', { exact: true }),
  ).toBeVisible()
  await expect(key.getByText('Ladders', { exact: true })).toBeVisible()
  await expect(key.getByText('3 space', { exact: true })).toBeVisible()
  await expect(key.getByText('2 space', { exact: true })).toBeVisible()
  await expect(key.getByText('1 space', { exact: true })).toBeVisible()
  await saveLocatorEvidence(key, 'svg-piece-key')

  const downloadSvg = async () => {
    await page.locator('#simple-tab-1').click()
    const downloadPromise = page.waitForEvent('download')
    await page
      .getByRole('button', { name: 'Download Current 2D Level as SVG' })
      .click()
    const download = await downloadPromise
    const filePath = await download.path()
    if (!filePath) throw new Error('SVG download did not produce a file')
    return readFile(filePath, 'utf8')
  }

  const enabledSvg = await downloadSvg()
  expect(enabledSvg).toContain('data-testid="svg-piece-key"')
  expect(enabledSvg).toContain('data-testid="svg-piece-key-land-cell"')
  expect(enabledSvg).toContain('<text')

  await page.locator('#simple-tab-3').click()
  await page.getByRole('button', { name: 'PDF', exact: true }).click()
  await includeKey.uncheck()
  await page.getByRole('button', { name: '2D', exact: true }).click()
  await expect(key).toHaveCount(0)
  const disabledSvg = await downloadSvg()
  expect(disabledSvg).not.toContain('data-testid="svg-piece-key"')
})

test('PDF downloads include the piece key with both border modes', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 700, height: 900 })
  await page.goto(pieceKeyURL)
  await waitForAppReady(page)
  await page.locator('#simple-tab-3').click()
  await page.getByRole('button', { name: 'PDF', exact: true }).click()
  await page
    .getByRole('checkbox', { name: 'Include piece key in SVG and PDF' })
    .check()

  const downloadPdf = async (name: string) => {
    const link = page.getByRole('link', {
      name: /Download build instructions \.pdf/,
    })
    await expect(link).toBeVisible()
    const downloadPromise = page.waitForEvent('download')
    await link.click()
    const download = await downloadPromise
    const path = await download.path()
    if (!path) throw new Error('PDF download did not produce a file')
    const pdf = await readFile(path)
    expect(pdf.subarray(0, 4).toString()).toBe('%PDF')
    await download.saveAs(testInfo.outputPath(name))
  }

  const colorBorders = page.getByRole('checkbox', {
    name: 'PDF Color Borders',
  })
  await colorBorders.check()
  await downloadPdf('piece-key-color-borders.pdf')
  await colorBorders.uncheck()
  await downloadPdf('piece-key-dark-borders.pdf')
})
