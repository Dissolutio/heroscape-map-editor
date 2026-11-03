import { PNG } from 'pngjs'
import { expect, mapUrl, saveEvidence, test, waitForAppReady } from './fixtures'

// The owner's "Cove of Bilfrost" map: a water tile at (0,0), grass at (1,0),
// and a 2-hex grass on that grass overhanging the water. The fluid tile is
// half a level tall, so the water cap shows under the overhang.
// Same map as src/__tests__/fixtures/fluid-cap-under-overhang.json.
const coveMap = {
  id: 'dNTKsBN7lDkWQ',
  name: 'Cove of Bilfrost',
  author: '',
  version: 1,
  shape: 'rectangle',
  width: 2,
  length: 2,
}
const covePieces = ['0~0~0~0~w1', '0~1~0~0~g1', '1~1~0~3~g2']
const ladderMap = { ...coveMap, id: 'fluid-cap-under-ladder' }
const waterOnlyPieces = ['0~0~0~0~w1']
const waterAndLadderPieces = [...waterOnlyPieces, '1~0~0~0~ld']

const TIER_URLS = {
  low: '',
  medium: '&perHexLand=1&graphicsTier=medium',
  high: '&perHexLand=1&graphicsTier=high',
} as const

function waterCapPixelRatio(image: PNG, center: { x: number; y: number }) {
  let waterPixels = 0
  let samples = 0
  for (let dy = -15; dy <= 15; dy += 1) {
    for (let dx = -110; dx <= -40; dx += 1) {
      const offset =
        (Math.round(center.y + dy) * image.width + Math.round(center.x + dx)) *
        4
      const [red, green, blue] = image.data.slice(offset, offset + 3)
      if (blue > red * 1.3 && green > red * 1.2 && blue > 100 && green > 80) {
        waterPixels += 1
      }
      samples += 1
    }
  }
  return waterPixels / samples
}

test('the water cap under an overhanging grass tile is drawn in every tier', async ({
  page,
}) => {
  for (const [tier, params] of Object.entries(TIER_URLS)) {
    await page.goto(`${mapUrl(coveMap, covePieces)}${params}`)
    await waitForAppReady(page)
    await expect
      .poll(async () =>
        page.evaluate(() => window.__TEST__?.snapshot().landRenderer),
      )
      .toBe(tier === 'low' ? 'legacy' : 'per-hex')
    expect(
      await page.evaluate(() => window.__TEST__?.snapshot().pieceCount),
    ).toBe(3)

    // Look into the gap under the overhang from the open (west) side, low
    // over the table, aimed at the water hex.
    const pose = await page.evaluate(() => window.__TEST__?.cameraPose())
    if (!pose) throw new Error('No camera pose')
    const [tx, ty, tz] = pose.target
    await page.evaluate(
      ([x, y, z]) =>
        window.__TEST__?.setCamera([x - 3.6, y + 1.5, z + 2.6], [x, y, z]),
      [tx - 1, ty, tz] as [number, number, number],
    )
    await waitForAppReady(page)
    const water = await page.evaluate(() =>
      window.__TEST__?.screenPosOfHex({ q: 0, r: 0, altitude: 1 }),
    )
    const canvas = await page.locator('canvas').first().boundingBox()
    if (!water || !canvas) throw new Error('The water hex is not on screen')
    await saveEvidence(page, `fluid-cap-under-overhang-${tier}`, {
      clip: {
        x: Math.max(0, Math.round(canvas.x + water.x - 240)),
        y: Math.max(0, Math.round(canvas.y + water.y - 180)),
        width: 480,
        height: 360,
      },
    })
  }
})

test('a ladder leaves the water cap visible in every tier', async ({
  page,
}) => {
  test.setTimeout(180_000)
  for (const [tier, params] of Object.entries(TIER_URLS)) {
    await page.goto(`${mapUrl(ladderMap, waterOnlyPieces)}${params}`)
    await waitForAppReady(page)
    await expect
      .poll(async () =>
        page.evaluate(() => window.__TEST__?.snapshot().landRenderer),
      )
      .toBe(tier === 'low' ? 'legacy' : 'per-hex')

    const pose = await page.evaluate(() => window.__TEST__?.cameraPose())
    if (!pose) throw new Error('No camera pose')
    const [tx, ty, tz] = pose.target
    const position: [number, number, number] = [tx - 3.6, ty + 1.5, tz + 2.6]
    const target: [number, number, number] = [tx, ty, tz]
    await page.evaluate(
      ({ cameraPosition, cameraTarget }) =>
        window.__TEST__?.setCamera(cameraPosition, cameraTarget),
      { cameraPosition: position, cameraTarget: target },
    )
    await waitForAppReady(page)

    const canvas = await page.locator('canvas').first().boundingBox()
    const water = await page.evaluate(() =>
      window.__TEST__?.screenPosOfHex({ q: 0, r: 0, altitude: 1 }),
    )
    if (!water || !canvas) throw new Error('The water hex is not on screen')
    const center = { x: canvas.x + water.x, y: canvas.y + water.y }
    const before = PNG.sync.read(await page.screenshot())
    expect(
      waterCapPixelRatio(before, center),
      `water-cap pixels before ladder (${tier})`,
    ).toBeGreaterThan(0.6)
    await saveEvidence(page, `fluid-cap-under-ladder-before-${tier}`, {
      clip: {
        x: Math.max(0, Math.round(center.x - 240)),
        y: Math.max(0, Math.round(center.y - 180)),
        width: 480,
        height: 360,
      },
    })

    await page.goto(`${mapUrl(ladderMap, waterAndLadderPieces)}${params}`)
    await waitForAppReady(page)
    await expect
      .poll(async () =>
        page.evaluate(() => window.__TEST__?.snapshot().landRenderer),
      )
      .toBe(tier === 'low' ? 'legacy' : 'per-hex')
    expect(
      await page.evaluate(() => window.__TEST__?.snapshot().pieceCount),
    ).toBe(2)
    await page.evaluate(
      ({ cameraPosition, cameraTarget }) =>
        window.__TEST__?.setCamera(cameraPosition, cameraTarget),
      { cameraPosition: position, cameraTarget: target },
    )
    await waitForAppReady(page)

    const ladderCanvas = await page.locator('canvas').first().boundingBox()
    const ladderWater = await page.evaluate(() =>
      window.__TEST__?.screenPosOfHex({ q: 0, r: 0, altitude: 1 }),
    )
    if (!ladderWater || !ladderCanvas) {
      throw new Error('The water hex under the ladder is not on screen')
    }
    const ladderCenter = {
      x: ladderCanvas.x + ladderWater.x,
      y: ladderCanvas.y + ladderWater.y,
    }
    const after = PNG.sync.read(await page.screenshot())
    expect(
      waterCapPixelRatio(after, ladderCenter),
      `water-cap pixels under ladder (${tier})`,
    ).toBeGreaterThan(0.6)
    await saveEvidence(page, `fluid-cap-under-ladder-after-${tier}`, {
      clip: {
        x: Math.max(0, Math.round(ladderCenter.x - 240)),
        y: Math.max(0, Math.round(ladderCenter.y - 180)),
        width: 480,
        height: 360,
      },
    })
  }
})
