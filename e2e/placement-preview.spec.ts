import { edgeIdFromHex } from '../src/data/hexGrid/edgesAndNodes'
import { FIXTURE_HEX_MAP, FIXTURE_PIECE_IDS } from './fixture-map'
import {
  clickHex,
  clickPiece,
  clickShipDeck,
  expect,
  findPieceUid,
  hoverHex,
  hoverShipDeck,
  mapUrl,
  setPen,
  test,
  waitForAppReady,
} from './fixtures'

const SHIP_LADDER_MAP = { ...FIXTURE_HEX_MAP, width: 8, length: 8 }
const SHIP_LADDER_PIECES = [
  '0~0~2~0~g1',
  '0~1~2~0~g1',
  '0~2~2~0~g1',
  '0~0~1~0~g1',
  '1~0~1~0~g1',
]

test('a Ship Wall with no land beside it previews amber (unsupported)', async ({
  page,
}) => {
  await page.goto(mapUrl(SHIP_LADDER_MAP, []))
  await waitForAppReady(page)
  await setPen(page, 'sl', 1)
  await page.mouse.move(0, 0)
  // 4 hexes long: hover far enough west on the 8-wide map for the wall to fit
  await hoverHex(page, { q: 2, r: 3, altitude: 0 })
  await page.waitForFunction(
    () => window.__TEST__?.snapshot().placementPreview?.unsupported === true,
  )
  const preview = await page.evaluate(
    () => window.__TEST__?.snapshot().placementPreview,
  )
  expect(preview).toMatchObject({ status: 'ok', unsupported: true })
  expect(preview?.reason).toContain(
    'Ship Wall: 4 of 4 interlocks not connected to solid land',
  )
})

// A Ship Wall on the table at (4,3), turned so its notch hexes, (3,4) and
// (2,4), face the camera. Its deck is level 7 over them: land placed at
// altitude 6.
const SHIP_DECK_PIECES = ['0~4~3~3~sl']

test('a land pen on a Ship Wall deck previews ok and places the tile at level 7', async ({
  page,
}) => {
  await page.goto(mapUrl(SHIP_LADDER_MAP, SHIP_DECK_PIECES))
  await waitForAppReady(page)
  const wallUID = await findPieceUid(page, { inventoryID: 'sl', q: 4, r: 3 })
  await setPen(page, 'g', 1)
  await page.mouse.move(0, 0)
  await hoverShipDeck(page, wallUID, 'forward')
  // the deck holds the tile up: the normal preview, no amber
  await page.waitForFunction(() => {
    const preview = window.__TEST__?.snapshot().placementPreview
    return preview?.status === 'ok' && preview.unsupported === false
  })
  const preview = await page.evaluate(
    () => window.__TEST__?.snapshot().placementPreview,
  )
  expect(preview).toMatchObject({
    status: 'ok',
    unsupported: false,
    reason: null,
    footprintCount: 1,
  })

  await clickShipDeck(page, wallUID, 'forward')
  await page.waitForFunction(() =>
    window.__TEST__
      ?.listPieces()
      .some((piece) => piece.inventoryID === 'g1' && piece.altitude === 6),
  )
  const tile = await page.evaluate(() =>
    window.__TEST__?.listPieces().find((piece) => piece.inventoryID === 'g1'),
  )
  expect(tile).toMatchObject({
    pieceCoords: { q: 3, r: 4 },
    altitude: 6,
  })
})

test('a solid land pen previews ok over a free hex', async ({ page }) => {
  await setPen(page, 'g', 1)
  await hoverHex(page, { q: 0, r: 0, altitude: 0 })

  await page.waitForFunction(
    () => window.__TEST__?.snapshot().placementPreview?.status === 'ok',
  )
  const snapshot = await page.evaluate(() => window.__TEST__?.snapshot())
  expect(snapshot?.placementPreview).toMatchObject({
    status: 'ok',
    reason: null,
    footprintCount: 1,
  })
})

test('Evergreen Tree hotkeys select each numbered variant', async ({
  page,
}) => {
  await page.goto(mapUrl(FIXTURE_HEX_MAP, []))
  await waitForAppReady(page)
  await setPen(page, 'tr10', 1)
  await hoverHex(page, { q: 2, r: 2, altitude: 0 })

  for (const [key, pieceID, footprintCount] of [
    ['1', 'tr10', 1],
    ['2', 'tr11', 1],
    ['3', 'tr12', 1],
    ['4', 'tr15', 4],
  ] as const) {
    await page.keyboard.press(key)
    await page.waitForFunction(
      ({ id, count }) => {
        const snapshot = window.__TEST__?.snapshot()
        return (
          snapshot?.penPieceID === id &&
          snapshot.placementPreview?.footprintCount === count
        )
      },
      { id: pieceID, count: footprintCount },
    )
    const snapshot = await page.evaluate(() => window.__TEST__?.snapshot())
    expect(snapshot?.penPieceID).toBe(pieceID)
  }
})

test('Ship hotkeys preview all variants and place a rope ladder on a wall', async ({
  page,
}) => {
  await page.goto(mapUrl(SHIP_LADDER_MAP, SHIP_LADDER_PIECES))
  await waitForAppReady(page)
  await setPen(page, 'sl', 1)
  await hoverHex(page, { q: 4, r: 3, altitude: 0 })

  await page.keyboard.press('2')
  await page.waitForFunction(
    () => window.__TEST__?.snapshot().penPieceID === 'sb',
  )
  const penMode = page.getByRole('combobox', { name: 'Pen Mode' })
  await expect(penMode).toContainText('Ship Bow')
  await penMode.click()
  await page.getByRole('option', { name: /Ship Wall/ }).click()
  await page.waitForFunction(() => {
    const snapshot = window.__TEST__?.snapshot()
    return snapshot?.penMode === 'sl' && snapshot.penPieceID === 'sl'
  })
  await expect(penMode).toContainText('Ship Wall')
  // Wait for the closing menu's backdrop to go away, or the hover lands on it.
  await expect(page.getByRole('listbox')).toBeHidden()
  await page.mouse.move(0, 0)
  // The Ship Wall is 4 hexes long (knub included), so hover far enough west
  // on this 8-wide map for the whole wall to fit.
  await hoverHex(page, { q: 2, r: 3, altitude: 0 })
  await page.waitForFunction(
    () => window.__TEST__?.snapshot().placementPreview !== null,
  )
  const selectedWallPreview = await page.evaluate(() =>
    window.__TEST__?.snapshot(),
  )
  expect(selectedWallPreview?.placementPreview).not.toBeNull()

  for (const [key, pieceID] of [
    ['1', 'sl'],
    ['2', 'sb'],
    ['3', 'rl'],
    ['4', 'cn'],
  ] as const) {
    await page.keyboard.press(key)
    await page.waitForFunction(
      (id) => window.__TEST__?.snapshot().penPieceID === id,
      pieceID,
    )
    const snapshot = await page.evaluate(() => window.__TEST__?.snapshot())
    expect(snapshot?.penPieceID).toBe(pieceID)
  }

  await setPen(page, 'sl', 1, 0)
  await hoverHex(page, { q: 0, r: 2, altitude: 1 })
  await page.mouse.move(0, 0)
  await clickHex(page, { q: 0, r: 2, altitude: 1 })
  await page.waitForFunction(() =>
    window.__TEST__?.listPieces().some((piece) => piece.inventoryID === 'sl'),
  )

  const wallUID = await findPieceUid(page, {
    inventoryID: 'sl',
    q: 0,
    r: 2,
  })
  const wall = await page.evaluate(
    (uid) => window.__TEST__?.listPieces().find((piece) => piece.uid === uid),
    wallUID,
  )
  if (!wall) throw new Error('Ship wall was not placed')

  await setPen(page, 'sl', 3, 1)
  await hoverHex(page, { q: 0, r: 1, altitude: 2 })
  await page.waitForFunction(
    () =>
      window.__TEST__?.snapshot().penPieceID === 'rl' &&
      window.__TEST__?.snapshot().placementPreview,
  )
  await page.mouse.move(0, 0)
  await clickHex(page, { q: 0, r: 1, altitude: 2 })

  await page.waitForFunction(() =>
    window.__TEST__?.listPieces().some((piece) => piece.inventoryID === 'rl'),
  )
  const ladder = await page.evaluate(() =>
    window.__TEST__?.listPieces().find((piece) => piece.inventoryID === 'rl'),
  )
  if (!ladder) throw new Error('Rope ladder was not placed')
  expect(ladder).toMatchObject({
    inventoryID: 'rl',
    pieceCoords: { q: 0, r: 1, s: -1 },
    altitude: 1,
    rotation: 1,
  })
  expect(edgeIdFromHex(ladder.pieceCoords, ladder.rotation)).toBe(
    edgeIdFromHex(wall.pieceCoords, (ladder.rotation + 3) % 6),
  )
})

test('a Laur add-on previews and places on empty and land hexes', async ({
  page,
}) => {
  await setPen(page, 'lws', 0)
  await hoverHex(page, { q: 0, r: 0, altitude: 0 })
  await page.waitForFunction(
    () => window.__TEST__?.snapshot().placementPreview?.status === 'ok',
  )
  const emptyPreview = await page.evaluate(
    () => window.__TEST__?.snapshot().placementPreview,
  )
  expect(emptyPreview).toMatchObject({
    status: 'ok',
    unsupported: true,
  })
  await clickHex(page, { q: 0, r: 0, altitude: 0 })
  await page.waitForFunction(
    () =>
      window.__TEST__?.snapshot().pieceCount === 6 &&
      window.__TEST__
        ?.listPieces()
        .some(
          (piece) =>
            piece.inventoryID === 'lws' &&
            piece.pieceCoords.q === 0 &&
            piece.pieceCoords.r === 0 &&
            piece.altitude === 0,
        ),
  )
  await page.waitForFunction(
    () =>
      window.__TEST__?.snapshot().placementPreview?.status === 'conflict' &&
      window.__TEST__?.snapshot().placementPreview?.unsupported === true,
  )
  const conflictedPreview = await page.evaluate(
    () => window.__TEST__?.snapshot().placementPreview,
  )
  expect(conflictedPreview).toMatchObject({
    status: 'conflict',
    unsupported: true,
  })

  await hoverHex(page, { q: 0, r: 2, altitude: 1 })
  await page.waitForFunction(
    () =>
      window.__TEST__?.snapshot().placementPreview?.status === 'ok' &&
      window.__TEST__?.snapshot().placementPreview?.unsupported === true,
  )
  const landPreview = await page.evaluate(
    () => window.__TEST__?.snapshot().placementPreview,
  )
  expect(landPreview).toMatchObject({
    status: 'ok',
    unsupported: true,
  })
  await clickHex(page, { q: 0, r: 2, altitude: 1 })
  await page.waitForFunction(
    () =>
      window.__TEST__?.snapshot().pieceCount === 7 &&
      window.__TEST__
        ?.listPieces()
        .some(
          (piece) =>
            piece.inventoryID === 'lws' &&
            piece.pieceCoords.q === 0 &&
            piece.pieceCoords.r === 2 &&
            piece.altitude === 1,
        ),
  )
})

test('a stackable Laur wall places eight levels above the wall it hits', async ({
  page,
}) => {
  await page.goto(
    mapUrl(FIXTURE_HEX_MAP, [...FIXTURE_PIECE_IDS, '1~0~2~0~lws2']),
  )
  await waitForAppReady(page)
  const lowerUID = await findPieceUid(page, {
    inventoryID: 'lws2',
    q: 0,
    r: 2,
    altitude: 1,
  })
  await setPen(page, 'lws', 5, 0)
  await clickPiece(page, lowerUID)
  await page.waitForFunction(() => window.__TEST__?.snapshot().pieceCount === 7)
  const wallPieces = await page.evaluate(() =>
    window.__TEST__
      ?.listPieces()
      .filter(
        (piece) =>
          piece.inventoryID === 'lws2' &&
          piece.pieceCoords.q === 0 &&
          piece.pieceCoords.r === 2,
      ),
  )
  expect(wallPieces?.map((piece) => piece.altitude).sort()).toEqual([1, 9])
})

test('a stackable square pillar preview and placement use the +8 step', async ({
  page,
}) => {
  await page.goto(
    mapUrl(FIXTURE_HEX_MAP, [...FIXTURE_PIECE_IDS, '1~0~2~0~lwp2']),
  )
  await waitForAppReady(page)
  const lowerUID = await findPieceUid(page, {
    inventoryID: 'lwp2',
    q: 0,
    r: 2,
    altitude: 1,
  })
  await setPen(page, 'lwp2', 0, 0)
  const point = await page.evaluate(
    (uid) => window.__TEST__?.screenPosOfPiece(uid) ?? null,
    lowerUID,
  )
  const canvas = await page.locator('canvas').first().boundingBox()
  if (!point || !canvas) throw new Error('Stacked pillar is not on screen')
  await page.mouse.move(canvas.x + point.x, canvas.y + point.y)
  await page.waitForFunction(
    () => window.__TEST__?.snapshot().placementPreview?.altitude === 9,
  )
  await clickPiece(page, lowerUID)
  await page.waitForFunction(() => window.__TEST__?.snapshot().pieceCount === 7)
  const pillars = await page.evaluate(() =>
    window.__TEST__
      ?.listPieces()
      .filter(
        (piece) =>
          piece.inventoryID === 'lwp2' &&
          piece.pieceCoords.q === 0 &&
          piece.pieceCoords.r === 2,
      ),
  )
  expect(pillars?.map((piece) => piece.altitude).sort()).toEqual([1, 9])
})

test('Laur add-on previews snap to square and triangle pillar ports', async ({
  page,
}) => {
  await page.goto(
    mapUrl(FIXTURE_HEX_MAP, [
      ...FIXTURE_PIECE_IDS,
      '1~0~2~0~lwp',
      '0~3~2~0~g1',
      '1~3~2~0.5~lwt',
    ]),
  )
  await waitForAppReady(page)

  await setPen(page, 'lwl', 0, 0.5)
  await hoverHex(page, { q: 0, r: 2, altitude: 14 })
  await page.waitForFunction(() => {
    const rotation = window.__TEST__?.snapshot().placementPreview?.rotation
    return rotation === 1.5 || rotation === 4.5
  })
  const squareRotation = await page.evaluate(
    () => window.__TEST__?.snapshot().placementPreview?.rotation,
  )
  expect([1.5, 4.5]).toContain(squareRotation)

  await setPen(page, 'lwl', 0, 1.5)
  await hoverHex(page, { q: 3, r: 2, altitude: 14 })
  await page.waitForFunction(() => {
    const rotation = window.__TEST__?.snapshot().placementPreview?.rotation
    return rotation === 0.5 || rotation === 2.5 || rotation === 4.5
  })
  const trianglePreview = await page.evaluate(
    () => window.__TEST__?.snapshot().placementPreview,
  )
  expect([0.5, 2.5, 4.5]).toContain(trianglePreview?.rotation)
  expect(trianglePreview?.rotation).not.toBe(1.5)
})

// A grass floor and one Fortified Wall at (4,4). Another Fortified Wall one
// hex SE shares three of its template hexes but none of its edges or nodes
// (see src/data/hexGrid/pieceFootprints.ts).
const WALL_MAP = { ...FIXTURE_HEX_MAP, width: 10, length: 10 }
const WALL_PIECES = [
  ...Array.from({ length: 10 * 10 }, (_, index) => {
    const r = Math.floor(index / 10)
    const q = (index % 10) - Math.floor(r / 2)
    return `0~${q}~${r}~0~g1`
  }),
  '1~4~4~0~fw',
]

test('a Fortified Wall beside another, on different edges, previews ok', async ({
  page,
}) => {
  await page.goto(mapUrl(WALL_MAP, WALL_PIECES))
  await waitForAppReady(page)
  // size 0: the Fortified Wall has no size variants
  await setPen(page, 'fw', 0, 0)
  await page.mouse.move(0, 0)
  await hoverHex(page, { q: 4, r: 5, altitude: 1 })
  await page.waitForFunction(
    () => window.__TEST__?.snapshot().placementPreview?.status !== undefined,
  )
  const preview = await page.evaluate(
    () => window.__TEST__?.snapshot().placementPreview,
  )
  expect(preview).toMatchObject({ status: 'ok', altitude: 1, rotation: 0 })
})
