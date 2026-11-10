import { readFile } from 'node:fs/promises'
import { unzipSync } from 'fflate'
import { piecesSoFar } from '../src/data/pieces'
import { HexTerrain, Pieces } from '../src/types'
import { FIXTURE_HEX_MAP, FIXTURE_PIECE_IDS } from './fixture-map'
import {
  expect,
  mapUrl,
  saveEvidence,
  saveSvgEvidence,
  test,
  waitForAppReady,
} from './fixtures'

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

const issue350InventoryIDs = [
  ...new Set(
    Object.values(piecesSoFar)
      .filter(({ terrain }) =>
        [
          HexTerrain.tree,
          HexTerrain.snowTree,
          HexTerrain.palm,
          HexTerrain.brush,
        ].includes(terrain as HexTerrain),
      )
      .map(({ id }) => id),
  ),
  Pieces.laurWallSquarePillar,
  Pieces.laurWallPillarStackable,
  Pieces.laurWallTrianglePillar,
  Pieces.laurWallShort,
  Pieces.laurWallShortStackable,
  Pieces.laurWallLong,
  Pieces.laurWallLongStackable,
  Pieces.laurWallArch,
  Pieces.laurWallRuin1,
  Pieces.laurWallRuin2,
  Pieces.laurWallRuin3,
  Pieces.ladder,
  Pieces.ropeLadder,
  Pieces.toxic1,
]
const issue350PieceKeyURL = mapUrl(
  { ...FIXTURE_HEX_MAP, width: 24, length: 24 },
  issue350InventoryIDs.map(
    (inventoryID, index) =>
      `0~${(index % 8) * 3}~${Math.floor(index / 8) * 3}~0~${inventoryID}`,
  ),
)
const issue353InventoryIDs = [
  ...issue350InventoryIDs,
  Pieces.hive,
  Pieces.water1,
  Pieces.water3,
  Pieces.wellspringWater1,
  Pieces.swampWater6,
  Pieces.ice4,
  Pieces.ice6,
  Pieces.lava3,
  Pieces.shadow3,
  Pieces.toxicWater1,
  Pieces.genericFluid3,
  'y56',
  'y36',
]
const issue353PieceKeyURL = mapUrl(
  { ...FIXTURE_HEX_MAP, width: 64, length: 64 },
  issue353InventoryIDs.map(
    (inventoryID, index) =>
      `0~${(index % 8) * 7}~${Math.floor(index / 8) * 7}~0~${inventoryID}`,
  ),
)

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
  const svgColorBorders = page.getByRole('checkbox', {
    name: 'SVG Color Borders',
  })
  await includeKey.check()
  await colorBorders.check()
  await page.getByRole('button', { name: 'View 2D Map' }).click()
  await svgColorBorders.check()
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
  const landGrid = key.getByTestId('svg-piece-key-land-grid')
  await expect(landGrid.getByText('24 space', { exact: true })).toBeVisible()
  await expect(landGrid.getByText('3 space', { exact: true })).toBeVisible()
  await expect(landGrid.getByText('2 space', { exact: true })).toBeVisible()
  await expect(landGrid.getByText('1 space', { exact: true })).toBeVisible()
  const oneHexBorder = key
    .locator(
      '[data-testid="svg-piece-key-land-cell"][data-terrain="grass"][data-size="1"]',
    )
    .locator('[data-testid="svg-piece-key-shape"] polygon')
    .nth(1)
  const sevenHexBorder = key
    .locator(
      '[data-testid="svg-piece-key-land-cell"][data-terrain="grass"][data-size="7"]',
    )
    .locator('[data-testid="svg-piece-key-shape"] polygon')
    .nth(1)
  const legendBorders = async () =>
    Promise.all([
      oneHexBorder.getAttribute('fill'),
      sevenHexBorder.getAttribute('fill'),
    ])
  const colorLegendBorders = await legendBorders()
  await page.locator('#simple-tab-3').click()
  await svgColorBorders.uncheck()
  expect(await legendBorders()).toEqual(['#000000', '#000000'])
  await svgColorBorders.check()
  expect(await legendBorders()).toEqual(colorLegendBorders)
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
    const firstCard = cards[0]?.getBBox()
    return {
      titleX: title?.getBBox().x,
      gridX: grid?.x,
      gridWidth: grid?.width,
      firstCardX: cards[0]?.getBBox().x,
      lastCardRight: lastCard ? lastCard.x + lastCard.width : undefined,
      firstCardWidth: firstCard?.width,
      cardCount: cards.length,
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
        ((keyLayout.firstCardX ?? 0) +
          (((keyLayout.cardCount - 1) % 3) + 1) *
            (keyLayout.firstCardWidth ?? 0)),
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
  await expect(key.getByText('red borders').first()).toBeVisible()

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

test('renders issue 350 key evidence with all tree and Laur variants', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 1400, height: 1100 })
  await page.goto(issue350PieceKeyURL)
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
  await expect(levelInput).toBeVisible()
  await levelInput.fill('Legend')
  const key = page.locator('[data-testid="svg-piece-key"]')
  await expect(key).toBeVisible()
  await saveSvgEvidence(key, 'issue-350-svg-piece-key')
  const specialRowAlignment = await key.evaluate((element) => {
    const errors: string[] = []
    for (const group of element.querySelectorAll(
      '[data-testid="svg-piece-key-special-group"]',
    )) {
      const rows = new Map<
        string,
        {
          inventoryID: string
          shapeTop: number
          shapeBottom: number
          captionTop: number
        }[]
      >()
      for (const entry of group.querySelectorAll(
        '[data-testid="svg-piece-key-special-entry"]',
      )) {
        const row = entry.getAttribute('data-row-index') ?? ''
        const shape = entry.querySelector(
          '[data-testid="svg-piece-key-shape"]',
        ) as SVGGElement | null
        const caption = entry.querySelector(
          ':scope > text',
        ) as SVGTextElement | null
        if (!shape || !caption) {
          errors.push(`missing shape or caption in row ${row}`)
          continue
        }
        const shapeBounds = shape.getBBox()
        const captionBounds = caption.getBBox()
        rows.set(row, [
          ...(rows.get(row) ?? []),
          {
            inventoryID: shape.getAttribute('data-inventory-id') ?? '',
            shapeTop: shapeBounds.y,
            shapeBottom: shapeBounds.y + shapeBounds.height,
            captionTop: captionBounds.y,
          },
        ])
      }

      // Shapes are centered in their row; ship pieces share a bottom line.
      const isShipGroup = group.getAttribute('data-group-id') === 'ship'
      for (const [row, entries] of rows) {
        const shapeLines = entries.map(({ shapeTop, shapeBottom }) =>
          isShipGroup ? shapeBottom : (shapeTop + shapeBottom) / 2,
        )
        const captionTops = entries.map(({ captionTop }) => captionTop)
        if (Math.max(...shapeLines) - Math.min(...shapeLines) > 3) {
          errors.push(
            `shapes do not share a ${isShipGroup ? 'bottom' : 'center'} line in row ${row}: ${JSON.stringify(entries)}`,
          )
        }
        if (Math.max(...captionTops) - Math.min(...captionTops) > 2) {
          errors.push(`captions do not share a top line in row ${row}`)
        }
        if (
          Math.max(...entries.map(({ shapeBottom }) => shapeBottom)) >
          Math.min(...captionTops) + 1
        ) {
          errors.push(`captions overlap shapes in row ${row}`)
        }
      }
    }
    return errors
  })
  expect(specialRowAlignment).toEqual([])

  await page.setViewportSize({ width: 700, height: 900 })
  await page.locator('#simple-tab-3').click()
  await page
    .getByRole('button', { name: 'View pdf build instructions' })
    .click()
  const pdfLink = page.getByRole('link', {
    name: /Download build instructions \.pdf/,
  })
  await expect(pdfLink).toBeVisible()
  const downloadPromise = page.waitForEvent('download')
  await pdfLink.click()
  const download = await downloadPromise
  const pdfPath = await download.path()
  if (!pdfPath) throw new Error('PDF download did not produce a file')
  await download.saveAs(testInfo.outputPath('issue-350-piece-key.pdf'))
})

test('renders issue 353 key evidence for fluids, glyphs, and the hive', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 1400, height: 1100 })
  await page.goto(issue353PieceKeyURL)
  await waitForAppReady(page)
  await page.locator('#simple-tab-3').click()
  await page
    .getByRole('button', { name: 'View pdf build instructions' })
    .click()
  await page
    .getByRole('checkbox', { name: 'Include piece key in SVG and PDF' })
    .check()
  const pdfColorBorders = page.getByRole('checkbox', {
    name: 'PDF Color Borders',
  })
  await page.getByRole('button', { name: 'View 2D Map' }).click()
  await page.locator('#simple-tab-0').click()

  const levelInput = page.locator('input[type="text"]')
  await expect(levelInput).toBeVisible()
  await levelInput.fill('Legend')
  const key = page.locator('[data-testid="svg-piece-key"]')
  await expect(key).toBeVisible()
  await expect(key.getByText('Liquid and Base Terrain')).toBeVisible()
  await expect(key.getByText('Jungle Trees')).toBeVisible()
  await expect(key.getByText('Glyphs', { exact: true })).toBeVisible()
  const emptyFluidRows = await key
    .locator(
      '[data-testid="svg-piece-key-fluid-grid"] [data-testid="svg-piece-key-land-table"]',
    )
    .evaluateAll((tables) =>
      tables.flatMap((table, tableIndex) =>
        [...table.querySelectorAll('[data-testid="svg-piece-key-table-row"]')]
          .filter(
            (row) =>
              !row.querySelector(
                '[data-testid="svg-piece-key-land-cell"][data-has-entry="true"]',
              ),
          )
          .map(
            (row) =>
              `table ${tableIndex}, size ${row.getAttribute('data-size')}`,
          ),
      ),
    )
  expect(emptyFluidRows).toEqual([])
  await saveSvgEvidence(key, 'issue-353-svg-live-piece-key', 1)

  await page.setViewportSize({ width: 700, height: 900 })
  await page.locator('#simple-tab-3').click()
  await page
    .getByRole('button', { name: 'View pdf build instructions' })
    .click()
  const downloadPdf = async (name: string) => {
    const pdfLink = page.getByRole('link', {
      name: /Download build instructions \.pdf/,
    })
    await expect(pdfLink).toBeVisible()
    const downloadPromise = page.waitForEvent('download')
    await pdfLink.click()
    const download = await downloadPromise
    const pdfPath = await download.path()
    if (!pdfPath) throw new Error('PDF download did not produce a file')
    await download.saveAs(testInfo.outputPath(name))
  }
  await pdfColorBorders.check()
  await downloadPdf('issue-353-pdf-piece-key-color-borders.pdf')
  await pdfColorBorders.uncheck()
  await downloadPdf('issue-353-pdf-piece-key-dark-borders.pdf')

  await page.setViewportSize({ width: 1400, height: 1100 })
  await page.locator('#simple-tab-3').click()
  await page.locator('#simple-tab-1').click()
  const svgDownloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download Legend (SVG)' }).click()
  const svgDownload = await svgDownloadPromise
  const svgPath = await svgDownload.path()
  if (!svgPath) throw new Error('SVG download did not produce a file')
  const exportedSvg = await readFile(svgPath, 'utf8')
  await page.setContent(exportedSvg)
  const exportedHivePathCount = await page
    .locator(
      `[data-testid="svg-piece-key-shape"][data-inventory-id="${Pieces.hive}"]`,
    )
    .locator('path')
    .count()
  expect(exportedHivePathCount).toBeGreaterThanOrEqual(6)
  const captionPathOffsets = await page
    .locator('[data-testid="svg-piece-key-special-entry"]')
    .evaluateAll((entries) =>
      entries.flatMap((entry) => {
        const shape = entry.querySelector(
          ':scope > [data-testid="svg-piece-key-shape"]',
        )
        const slotCenter =
          Number(entry.getAttribute('data-slot-x')) +
          Number(entry.getAttribute('data-slot-width')) / 2
        return [...entry.children]
          .filter((child) => child !== shape)
          .flatMap((child) =>
            child.tagName.toLowerCase() === 'path'
              ? [child]
              : [...child.querySelectorAll('path')],
          )
          .map((path) => {
            const bounds = (path as SVGGraphicsElement).getBBox()
            return Math.abs(bounds.x + bounds.width / 2 - slotCenter)
          })
      }),
    )
  expect(captionPathOffsets.length).toBeGreaterThan(0)
  expect(captionPathOffsets.every((offset) => offset < 1)).toBe(true)
  await saveSvgEvidence(
    page.locator('svg'),
    'issue-353-svg-exported-piece-key',
    1,
  )
})
