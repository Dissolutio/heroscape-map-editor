import { readFile } from 'node:fs/promises'
import { Pieces } from '../src/types'
import { FIXTURE_HEX_MAP, FIXTURE_PIECE_IDS } from './fixture-map'
import {
  expect,
  mapUrl,
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

test('SVG downloads include the optional editable piece key', async ({
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
  const key = page.locator('[data-testid="svg-piece-key"]')
  await expect(key).toBeVisible()
  await expect(key.getByText('Grass', { exact: true })).toBeVisible()
  await expect(key.getByText('Sand', { exact: true })).toBeVisible()
  await expect(key.getByText('Rock', { exact: true })).toBeVisible()
  await expect(key.getByText('Water', { exact: true })).toBeVisible()
  await expect(key.getByText('Evergreen Trees', { exact: true })).toBeVisible()
  const laurTitle = await key
    .locator('[data-testid="svg-piece-key-special-group"]')
    .nth(2)
    .locator('text')
    .first()
    .evaluate((element) => ({
      text: element.textContent?.replace(/\s/g, ''),
      lines: element.querySelectorAll('tspan').length,
    }))
  expect(laurTitle.text).toContain('PillarsandWalls(Laur)')
  expect(laurTitle.lines).toBeGreaterThan(1)
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
  await saveSvgEvidence(key, 'svg-piece-key')

  await page.locator('#simple-tab-3').click()
  await page
    .getByRole('button', { name: 'View pdf build instructions' })
    .click()
  await colorBorders.uncheck()
  await page.getByRole('button', { name: 'View 2D Map' }).click()
  await expect(key.getByText('dark borders').first()).toBeVisible()
  await saveSvgEvidence(key, 'svg-piece-key-dark-borders')

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
  await page
    .getByRole('button', { name: 'View pdf build instructions' })
    .click()
  await includeKey.uncheck()
  await page.getByRole('button', { name: 'View 2D Map' }).click()
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
