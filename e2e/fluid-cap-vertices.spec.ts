import { type Page, expect } from '@playwright/test'
import { PNG } from 'pngjs'
import { mapUrl, saveEvidence, test, waitForAppReady } from './fixtures'

const fluidMap = {
  id: 'fluid-cap-vertices',
  name: 'Fluid cap vertices',
  author: 'e2e',
  version: 1,
  shape: 'rectangle',
  width: 8,
  length: 8,
}

const fluidPieces = [
  '0~0~1~0~w3',
  '0~4~1~0~l3',
  '0~0~5~0~i3',
  '0~4~5~0~xw1',
  '0~6~5~0~ww1',
]

type Point = { x: number; y: number }

function darkPixelCounts(
  image: PNG,
  point: Point,
  canvas: { x: number; y: number },
) {
  const center = {
    x: Math.round(canvas.x + point.x),
    y: Math.round(canvas.y + point.y),
  }
  const innerRadius = 5
  const outerRadius = 10
  let innerDark = 0
  let ringDark = 0
  let ringPixels = 0

  for (let dy = -outerRadius; dy <= outerRadius; dy += 1) {
    for (let dx = -outerRadius; dx <= outerRadius; dx += 1) {
      const offset = ((center.y + dy) * image.width + center.x + dx) * 4
      const lightness =
        image.data[offset] * 0.2126 +
        image.data[offset + 1] * 0.7152 +
        image.data[offset + 2] * 0.0722
      const isDark = lightness < 40
      if (Math.max(Math.abs(dx), Math.abs(dy)) <= innerRadius) {
        if (isDark) innerDark += 1
      } else {
        ringPixels += 1
        if (isDark) ringDark += 1
      }
    }
  }

  return {
    innerDark,
    expectedInnerDark: (ringDark / ringPixels) * (innerRadius * 2 + 1) ** 2,
  }
}

async function getThreeWayVertices(page: Page) {
  return page.evaluate(() => {
    const bridge = window.__TEST__
    if (!bridge) throw new Error('The e2e map bridge is unavailable')
    const pieces = [
      { q: 0, r: 1 },
      { q: 4, r: 1 },
      { q: 0, r: 5 },
    ]
    return pieces.map(({ q, r }) => {
      const centers = [
        bridge.screenPosOfHex({ q, r, altitude: 0 }),
        bridge.screenPosOfHex({ q: q + 1, r, altitude: 0 }),
        bridge.screenPosOfHex({ q, r: r + 1, altitude: 0 }),
      ]
      if (centers.some((center) => !center)) {
        throw new Error('A fluid hex is not on screen')
      }
      const [first, second, third] = centers
      if (!first || !second || !third) {
        throw new Error('A fluid hex is not on screen')
      }
      return {
        x: (first.x + second.x + third.x) / 3,
        y: (first.y + second.y + third.y) / 3,
      }
    })
  })
}

test('three-hex fluid caps have no dark tooth at their shared vertex', async ({
  page,
}) => {
  for (const tier of ['medium', 'high']) {
    await page.goto(
      `${mapUrl(fluidMap, fluidPieces)}&perHexLand=1&graphicsTier=${tier}`,
    )
    await waitForAppReady(page)
    await expect
      .poll(async () =>
        page.evaluate(() => window.__TEST__?.snapshot().landRenderer),
      )
      .toBe('per-hex')

    const canvas = await page.locator('canvas').first().boundingBox()
    if (!canvas) throw new Error('The WebGL canvas is not visible')
    const vertices = await getThreeWayVertices(page)
    const image = PNG.sync.read(await page.screenshot())
    const measurements = vertices.map((vertex) =>
      darkPixelCounts(image, vertex, canvas),
    )

    for (const [
      index,
      { innerDark, expectedInnerDark },
    ] of measurements.entries()) {
      const name = ['water', 'lava', 'ice'][index]
      const vertex = vertices[index]
      console.info(
        `${tier} ${name} 11x11 dark pixels: ${innerDark}, local-fill expectation: ${expectedInnerDark.toFixed(1)}`,
      )
      await saveEvidence(page, `fluid-cap-vertices-${tier}-${name}`, {
        clip: {
          x: Math.round(canvas.x + vertex.x - 16),
          y: Math.round(canvas.y + vertex.y - 16),
          width: 33,
          height: 33,
        },
      })
      expect(
        innerDark - expectedInnerDark,
        `dark-pixel excess at shared vertex (${tier}, ${name})`,
      ).toBeLessThanOrEqual(8)
    }
  }
})
