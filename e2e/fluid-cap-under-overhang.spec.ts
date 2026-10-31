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

const TIER_URLS = {
  low: '',
  medium: '&perHexLand=1&graphicsTier=medium',
  high: '&perHexLand=1&graphicsTier=high',
} as const

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
