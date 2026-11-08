import { readFile } from 'node:fs/promises'
import { unzipSync } from 'fflate'
import { Pieces } from '../src/types'
import { FIXTURE_HEX_MAP, FIXTURE_PIECE_IDS } from './fixture-map'
import { expect, mapUrl, saveEvidence, test, waitForAppReady } from './fixtures'

const pieceKeyURL = mapUrl({ ...FIXTURE_HEX_MAP, width: 12, length: 12 }, [
  ...FIXTURE_PIECE_IDS,
  `0~5~5~0~${Pieces.grass24}`,
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
  `0~8~4~0~${Pieces.laurWallSquarePillar}`,
  `0~9~6~0~${Pieces.laurWallShort}`,
  `0~10~8~0~${Pieces.ladder}`,
  `0~6~9~0~${Pieces.ropeLadder}`,
  `0~10~10~0~${Pieces.glyphPower}`,
])

test('SVG levels and the standalone Legend export as Illustrator-safe paths', async ({
  page,
}) => {
  await page.goto(pieceKeyURL)
  await waitForAppReady(page)
  await page.locator('#simple-tab-3').click()
  await page
    .getByRole('button', { name: 'View pdf build instructions' })
    .click()

  const includeKey = page.getByRole('checkbox', {
    name: 'Include piece key in SVG and PDF',
  })
  const colorBorders = page.getByRole('checkbox', {
    name: 'PDF Color Borders',
  })
  await includeKey.check()
  await colorBorders.check()
  await page.getByRole('button', { name: 'View 2D Map' }).click()
  await page.locator('#simple-tab-0').click()
  const key = page.locator('[data-testid="svg-piece-key"]')
  await expect(key).toHaveCount(0)
  const levelInput = page.locator('input[type="text"]')
  await expect(levelInput).toBeVisible()
  await saveEvidence(page, 'svg-map-level')
  await levelInput.fill('Legend')
  await expect(key).toBeVisible()
  await levelInput.evaluate((element) => element.blur())
  await page.keyboard.press('PageDown')
  await expect(levelInput).toHaveValue('3')
  await expect(key).toHaveCount(0)
  await page.keyboard.press('PageUp')
  await expect(levelInput).toHaveValue('Legend')
  await expect(key).toBeVisible()
  await saveEvidence(page, 'svg-legend')
  await expect(key.getByText('Grass', { exact: true })).toBeVisible()
  await expect(key.getByText('Sand', { exact: true })).toBeVisible()
  await expect(key.getByText('Rock', { exact: true })).toBeVisible()
  await expect(key.getByText('Water', { exact: true })).toBeVisible()
  await expect(key.getByText('Evergreen Trees', { exact: true })).toBeVisible()
  await expect(
    key.getByText('Pillars and Walls (Laur)', { exact: true }),
  ).toBeVisible()
  await expect(key.getByText('Ladders', { exact: true })).toBeVisible()
  await expect(key.getByText('Rope Ladders', { exact: true })).toBeVisible()
  await expect(key.getByText('Glyphs', { exact: true })).toBeVisible()
  await expect(key.getByText('24 space', { exact: true })).toBeVisible()
  await expect(key.getByText('3 space', { exact: true })).toBeVisible()
  await expect(key.getByText('2 space', { exact: true })).toBeVisible()
  await expect(key.getByText('1 space', { exact: true })).toBeVisible()
  const missingLandShapes = await key
    .locator('[data-testid="svg-piece-key-land-cell"][data-has-entry="true"]')
    .evaluateAll((cells) =>
      cells
        .filter((cell) => {
          const shape = cell.querySelector(
            '[data-testid="svg-piece-key-shape"]',
          )
          return !shape?.querySelector('polygon, path, circle')
        })
        .map((cell) => {
          const shape = cell.querySelector(
            '[data-testid="svg-piece-key-shape"]',
          )
          return `${cell.getAttribute('data-terrain')}-${cell.getAttribute('data-size')}:hexes=${shape?.getAttribute('data-hex-count')},origins=${shape?.getAttribute('data-origin-count')}`
        }),
    )
  expect(missingLandShapes).toEqual([])
  const keyLayout = await key.evaluate((element) => {
    const title = element.querySelector(
      ':scope > text',
    ) as SVGTextElement | null
    const gridElement = element.querySelector(
      '[data-testid="svg-piece-key-land-grid"]',
    ) as SVGGElement | null
    const grid = gridElement?.getBBox()
    const groups = [
      ...element.querySelectorAll(
        '[data-testid="svg-piece-key-special-group"]',
      ),
    ]
    const cards = groups.map(
      (group) => group.querySelector(':scope > rect') as SVGRectElement | null,
    )
    const textOverflows = groups.flatMap((group, index) => {
      const card = cards[index]?.getBBox()
      if (!card) return [`missing-card-${index}`]
      return [...group.querySelectorAll(':scope > text')].flatMap((text) => {
        const bounds = (text as SVGTextElement).getBBox()
        return bounds.x >= card.x &&
          bounds.x + bounds.width <= card.x + card.width + 1
          ? []
          : [
              `${text.textContent}: ${bounds.x}-${bounds.x + bounds.width} outside ${card.x}-${card.x + card.width}`,
            ]
      })
    })
    const lastCard = cards[cards.length - 1]?.getBBox()
    return {
      titleX: title?.getBBox().x,
      gridX: grid?.x,
      gridWidth: grid?.width,
      firstCardX: cards[0]?.getBBox().x,
      lastCardRight: lastCard ? lastCard.x + lastCard.width : undefined,
      textOverflows,
    }
  })
  expect(
    Math.abs((keyLayout.titleX ?? 0) - (keyLayout.gridX ?? 0)),
  ).toBeLessThan(3)
  expect(
    Math.abs((keyLayout.firstCardX ?? 0) - (keyLayout.gridX ?? 0)),
  ).toBeLessThan(3)
  expect(
    Math.abs(
      (keyLayout.lastCardRight ?? 0) -
        ((keyLayout.gridX ?? 0) + (keyLayout.gridWidth ?? 0)),
    ),
  ).toBeLessThan(3)
  expect(keyLayout.textOverflows).toEqual([])

  await page.locator('#simple-tab-3').click()
  await page
    .getByRole('button', { name: 'View pdf build instructions' })
    .click()
  await colorBorders.uncheck()
  await page.getByRole('button', { name: 'View 2D Map' }).click()
  await page.locator('#simple-tab-0').click()
  await expect(key.getByText('dark borders').first()).toBeVisible()

  const downloadSvg = async (buttonName: string) => {
    await page.locator('#simple-tab-1').click()
    const downloadPromise = page.waitForEvent('download')
    await page.getByRole('button', { name: buttonName }).click()
    const download = await downloadPromise
    const filePath = await download.path()
    if (!filePath) throw new Error('SVG download did not produce a file')
    return readFile(filePath, 'utf8')
  }
  const checkSvgSafety = (content: string) =>
    page.evaluate((source) => {
      const document = new DOMParser().parseFromString(source, 'image/svg+xml')
      const key = document.querySelector('[data-testid="svg-piece-key"]')
      return {
        textCount: document.querySelectorAll('text').length,
        mapStrokeCount: document.querySelectorAll('[stroke], [stroke-width]')
          .length,
        keyStrokeCount: key?.querySelectorAll('[stroke], [stroke-width]')
          .length,
      }
    }, content)

  await levelInput.fill('1')
  await expect(key).toHaveCount(0)
  const mapLevelSvg = await downloadSvg('Download this level (SVG)')
  expect(mapLevelSvg).not.toContain('data-testid="svg-piece-key"')
  expect(await checkSvgSafety(mapLevelSvg)).toMatchObject({
    textCount: 0,
    mapStrokeCount: 0,
  })

  await page.locator('#simple-tab-0').click()
  await levelInput.fill('Legend')
  await expect(key).toBeVisible()
  const enabledSvg = await downloadSvg('Download this level (SVG)')
  expect(enabledSvg).toContain('data-testid="svg-piece-key"')
  expect(enabledSvg).toContain('data-testid="svg-piece-key-land-cell"')
  expect(await checkSvgSafety(enabledSvg)).toEqual({
    textCount: 0,
    mapStrokeCount: 0,
    keyStrokeCount: 0,
  })

  const legendSvg = await downloadSvg('Download Legend (SVG)')
  expect(legendSvg).toContain('data-testid="svg-piece-key"')
  expect(await checkSvgSafety(legendSvg)).toEqual({
    textCount: 0,
    mapStrokeCount: 0,
    keyStrokeCount: 0,
  })

  await page.locator('#simple-tab-3').click()
  await page
    .getByRole('button', { name: 'View pdf build instructions' })
    .click()
  await includeKey.uncheck()
  await page.getByRole('button', { name: 'View 2D Map' }).click()
  await page.locator('#simple-tab-0').click()
  await expect(key).toHaveCount(0)
  await expect(page.locator('input[type="text"]')).toHaveCount(0)
  const disabledSvg = await downloadSvg('Download this level (SVG)')
  expect(disabledSvg).not.toContain('data-testid="svg-piece-key"')
})

test('whole-map ZIP and combined SVG each trigger one download', async ({
  page,
}) => {
  await page.goto(pieceKeyURL)
  await waitForAppReady(page)
  await page.locator('#simple-tab-3').click()
  await page
    .getByRole('button', { name: 'View pdf build instructions' })
    .click()
  await page
    .getByRole('checkbox', { name: 'Include piece key in SVG and PDF' })
    .check()
  await page.getByRole('button', { name: 'View 2D Map' }).click()
  await page.locator('#simple-tab-0').click()
  const levelInput = page.locator('input[type="text"]')
  const viewingLevelBeforeExport = await levelInput.inputValue()
  await page.locator('#simple-tab-1').click()

  const downloads: string[] = []
  page.on('download', (download) =>
    downloads.push(download.suggestedFilename()),
  )

  const zipPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download whole map (.zip)' }).click()
  const zipDownload = await zipPromise
  const zipPath = await zipDownload.path()
  if (!zipPath) throw new Error('ZIP download did not produce a file')
  const archive = unzipSync(new Uint8Array(await readFile(zipPath)))
  const zipFiles = Object.keys(archive)
  expect(zipFiles.some((path) => path.endsWith('/legend.svg'))).toBe(true)
  expect(zipFiles.some((path) => path.endsWith('/99-overlay.svg'))).toBe(true)
  expect(zipFiles.some((path) => /\/01-level-1\.svg$/.test(path))).toBe(true)
  expect(zipFiles.some((path) => /\/02-level-2\.svg$/.test(path))).toBe(true)
  await page.waitForTimeout(100)
  expect(downloads).toHaveLength(1)

  const svgPromise = page.waitForEvent('download')
  await page
    .getByRole('button', { name: 'Download whole map (one SVG)' })
    .click()
  const svgDownload = await svgPromise
  const svgPath = await svgDownload.path()
  if (!svgPath) throw new Error('Combined SVG download did not produce a file')
  const combinedSvg = await readFile(svgPath, 'utf8')
  const groupIDs = await page.evaluate((source) => {
    const document = new DOMParser().parseFromString(source, 'image/svg+xml')
    return [...document.querySelectorAll(':scope > g[id]')].map((group) =>
      group.getAttribute('id'),
    )
  }, combinedSvg)
  expect(groupIDs).toEqual(['level-1', 'level-2', 'overlay', 'legend'])
  const combinedSafety = await page.evaluate((source) => {
    const document = new DOMParser().parseFromString(source, 'image/svg+xml')
    return {
      textCount: document.querySelectorAll('text').length,
      strokeCount: document.querySelectorAll('[stroke], [stroke-width]').length,
    }
  }, combinedSvg)
  expect(combinedSafety).toEqual({ textCount: 0, strokeCount: 0 })
  await page.waitForTimeout(100)
  expect(downloads).toHaveLength(2)
  await page.locator('#simple-tab-0').click()
  await expect(levelInput).toHaveValue(viewingLevelBeforeExport)
  await page.locator('#simple-tab-1').click()
  await page.setContent(combinedSvg)
  await expect(page.locator('svg > g#level-1')).toBeVisible()
  await saveEvidence(page, 'svg-combined-export')
})

test('PDF downloads include the piece key with both border modes', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 700, height: 900 })
  await page.goto(pieceKeyURL)
  await waitForAppReady(page)
  await page.locator('#simple-tab-3').click()
  await page
    .getByRole('button', { name: 'View pdf build instructions' })
    .click()
  await page
    .getByRole('checkbox', { name: 'Include piece key in SVG and PDF' })
    .check()
  const colorBorders = page.getByRole('checkbox', {
    name: 'PDF Color Borders',
  })

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

  await colorBorders.check()
  await downloadPdf('piece-key-color-borders.pdf')
  await colorBorders.uncheck()
  await downloadPdf('piece-key-dark-borders.pdf')
})
