import type { Page } from '@playwright/test'
import {
  clickPiece,
  expect,
  findPieceUid,
  FIXTURE_URL,
  mapUrl,
  test,
  waitForAppReady,
} from './fixtures'
import { PNG } from 'pngjs'
import {
  FIXTURE_HEX_MAP,
  FIXTURE_PIECE_COUNT,
  FIXTURE_PIECE_IDS,
} from './fixture-map'

type ScreenPoint = { x: number; y: number }
type RGB = [number, number, number]

function samplePixel(image: PNG, x: number, y: number): RGB {
  const channels: [number[], number[], number[]] = [[], [], []]
  for (let dy = -1; dy <= 1; dy += 1) {
    for (let dx = -1; dx <= 1; dx += 1) {
      const offset = (Math.round(y + dy) * image.width + Math.round(x + dx)) * 4
      channels[0].push(image.data[offset])
      channels[1].push(image.data[offset + 1])
      channels[2].push(image.data[offset + 2])
    }
  }
  return channels.map((channel) => {
    channel.sort((a, b) => a - b)
    return channel[4]
  }) as RGB
}

function maxChannelDelta(left: RGB, right: RGB) {
  return Math.max(
    Math.abs(left[0] - right[0]),
    Math.abs(left[1] - right[1]),
    Math.abs(left[2] - right[2]),
  )
}

function lightness([red, green, blue]: RGB) {
  return red * 0.2126 + green * 0.7152 + blue * 0.0722
}

async function sampleCanvasPoints(
  page: Page,
  points: Record<string, ScreenPoint>,
) {
  const canvas = await page.locator('canvas').first().boundingBox()
  if (!canvas) throw new Error('The WebGL canvas is not visible')
  const image = PNG.sync.read(await page.screenshot())
  return Object.fromEntries(
    Object.entries(points).map(([name, point]) => [
      name,
      samplePixel(image, canvas.x + point.x, canvas.y + point.y),
    ]),
  ) as Record<string, RGB>
}

test('per-hex land mode loads without console errors and selects a hex', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  page.on('pageerror', (error) => errors.push(error.message))

  await page.goto(`${FIXTURE_URL}&perHexLand=1`)
  await waitForAppReady(page)

  const uid = await findPieceUid(page, {
    inventoryID: 'g1',
    q: 0,
    r: 2,
  })
  await clickPiece(page, uid)

  await expect(page.getByTestId('app-status')).toContainText('1 selected')
  const snapshot = await page.evaluate(() => window.__TEST__?.snapshot())
  expect(snapshot?.selectedPieceIDs).toEqual([uid])
  expect(snapshot?.landInstanceCounts).toEqual({
    solid: FIXTURE_PIECE_COUNT,
    fluid: 0,
  })
  expect(errors).toEqual([])
})

test('per-hex land pixels stay colored across lights and shadows toggles', async ({
  page,
}) => {
  const map = mapUrl(FIXTURE_HEX_MAP, [...FIXTURE_PIECE_IDS, '0~2~3~0~w1'])
  await page.goto(`${map}&perHexLand=1`)
  await waitForAppReady(page)
  await page.locator('#simple-tab-3').click()

  const solidUID = await findPieceUid(page, {
    inventoryID: 'g1',
    q: 0,
    r: 2,
  })
  const fluidUID = await findPieceUid(page, {
    inventoryID: 'w1',
    q: 2,
    r: 3,
  })
  const camera = await page.evaluate(() => window.__TEST__?.cameraPose())
  if (!camera) throw new Error('The e2e camera bridge is unavailable')
  await page.evaluate(
    ({ target }) =>
      window.__TEST__?.setCamera(
        [target[0] + 8, target[1] + 12, target[2] + 8],
        target,
      ),
    camera,
  )
  await waitForAppReady(page)

  const points = await page.evaluate(
    ({ solidUID, fluidUID }) => {
      const bridge = window.__TEST__
      if (!bridge) throw new Error('The e2e map bridge is unavailable')
      const sideBottom = bridge.screenPosOfHexEdge({
        q: 0,
        r: 2,
        altitude: -1,
        edge: 1,
      })
      const sideTop = bridge.screenPosOfHexEdge({
        q: 0,
        r: 2,
        altitude: 0,
        edge: 1,
      })
      const solid = bridge.screenPosOfPiece(solidUID)
      const fluid = bridge.screenPosOfPiece(fluidUID)
      const background = bridge.screenPosOfHex({
        q: 3,
        r: 2,
        altitude: 0,
      })
      if (!sideBottom || !sideTop || !solid || !fluid || !background) {
        throw new Error('A per-hex pixel sample point is not on screen')
      }
      return {
        solid,
        fluid,
        background,
        side: {
          x: (sideBottom.x + sideTop.x) / 2,
          y: (sideBottom.y + sideTop.y) / 2,
        },
      }
    },
    { solidUID, fluidUID },
  )
  const lights = page.getByRole('checkbox', {
    name: 'Render Lights and Shadows',
  })
  await expect(lights).not.toBeChecked()

  const expectUnlitAppearance = async () => {
    const colors = await sampleCanvasPoints(page, points)
    expect(lightness(colors.solid)).toBeGreaterThan(40)
    expect(maxChannelDelta(colors.solid, [124, 154, 60])).toBeLessThan(85)
    expect(maxChannelDelta(colors.side, [151, 90, 58])).toBeLessThan(100)
    expect(maxChannelDelta(colors.fluid, colors.background)).toBeGreaterThan(40)
  }
  const expectLitAppearance = async () => {
    const colors = await sampleCanvasPoints(page, points)
    expect(lightness(colors.solid)).toBeGreaterThan(60)
    expect(maxChannelDelta(colors.solid, [124, 154, 60])).toBeLessThan(85)
    expect(maxChannelDelta(colors.side, [151, 90, 58])).toBeLessThan(100)
    expect(maxChannelDelta(colors.fluid, colors.background)).toBeGreaterThan(40)
  }

  await expectUnlitAppearance()
  await lights.check()
  await waitForAppReady(page)
  await expectLitAppearance()
  await lights.uncheck()
  await waitForAppReady(page)
  await expectUnlitAppearance()
  await lights.check()
  await waitForAppReady(page)
  await expectLitAppearance()

  await clickPiece(page, solidUID)
  await page.mouse.move(10, 700)
  await waitForAppReady(page)
  const selected = await page.evaluate(() => window.__TEST__?.snapshot())
  expect(selected?.selectedPieceIDs).toEqual([solidUID])

  for (const enabled of [false, true]) {
    if (enabled) {
      await lights.check()
    } else {
      await lights.uncheck()
    }
    await waitForAppReady(page)
    const colors = await sampleCanvasPoints(page, points)
    expect(lightness(colors.solid)).toBeGreaterThan(40)
    expect(colors.side[0]).toBeGreaterThan(colors.side[2] * 2)
    expect(colors.side[1]).toBeGreaterThan(colors.side[2] * 2)
    const snapshot = await page.evaluate(() => window.__TEST__?.snapshot())
    expect(snapshot?.selectedPieceIDs).toEqual([solidUID])
  }
})
