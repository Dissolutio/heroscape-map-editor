import type { Page } from '@playwright/test'
import type { TestInfo } from '@playwright/test'
import { FIXTURE_HEX_MAP } from './fixture-map'
import {
  clickPiece,
  dragPiece,
  expect,
  findPieceUid,
  mapUrl,
  startDrag,
  startDragToPiece,
  test,
  waitForAppReady,
} from './fixtures'

/**
 * Drag-to-move: a selected piece can be dragged to a new spot in select
 * mode. The fixture rock sits on the grass at (1, 2); the grass at (2, 2) is
 * free. See src/data/dragMove.ts and src/world/drag/dragController.ts.
 */

const snapshot = (page: Page) =>
  page.evaluate(() => window.__TEST__?.snapshot())
const cameraPose = (page: Page) =>
  page.evaluate(() => window.__TEST__?.cameraPose())
const piece = async (page: Page, uid: string) =>
  (await page.evaluate(() => window.__TEST__?.listPieces()))?.find(
    (p) => p.uid === uid,
  )

const undoButton = (page: Page) =>
  page.getByRole('button', { name: /^Undo \(/ })
const undoCount = async (page: Page) =>
  Number((await undoButton(page).getAttribute('aria-label'))?.match(/\d+/)?.[0])

const views = [
  { name: 'orthographic', perspective: false },
  { name: 'perspective', perspective: true },
]

const LAUR_MAP = {
  ...FIXTURE_HEX_MAP,
  id: 'e2e-laur-drag',
  name: 'E2E Laur Drag',
  width: 8,
  length: 8,
}
const LAUR_PIECES = [
  '0~1~3~0~lwp',
  '0~2~3~0~lwp',
  '0~1~4~0~lwp',
  '0~2~4~0~lwp',
  '0~5~4~0~lwp',
  '0~6~4~0~lwp',
  '0~1~4~0~lws',
]
const LAUR_URL = mapUrl(LAUR_MAP, LAUR_PIECES)

async function useView(page: Page, perspective: boolean) {
  if (!perspective) return
  await page.keyboard.press('Insert')
  await page.waitForFunction(
    () => window.__TEST__?.snapshot().isOrthoCam === false,
  )
  await page.evaluate(() =>
    window.__TEST__?.setCamera([2, 6, 9], [1.5, 0, 2.5]),
  )
  await waitForAppReady(page)
}

async function selectRock(page: Page) {
  const rock = await findPieceUid(page, { inventoryID: 'r1' })
  await clickPiece(page, rock)
  await expect
    .poll(async () => (await snapshot(page))?.selectedPieceIDs)
    .toEqual([rock])
  return rock
}

async function shiftClickPiece(page: Page, uid: string) {
  await waitForAppReady(page)
  const position = await page.evaluate(
    (id) => window.__TEST__?.screenPosOfPiece(id) ?? null,
    uid,
  )
  if (!position) throw new Error(`Piece ${uid} is not on screen`)
  await page
    .locator('canvas')
    .first()
    .click({
      position,
      modifiers: ['Shift'],
    })
}

/**
 * A left-drag over empty table at the lower left, as a user orbits the
 * camera (the lower right holds the selected-piece panel, over the canvas).
 */
async function orbitDrag(page: Page) {
  const box = await page.locator('canvas').first().boundingBox()
  if (!box) throw new Error('no canvas')
  const x = box.x + box.width * 0.25
  const y = box.y + box.height * 0.8
  await page.mouse.move(x, y)
  await page.mouse.down()
  for (let i = 1; i <= 8; i++) await page.mouse.move(x + i * 15, y - i * 6)
  await page.mouse.up()
}

for (const { name, perspective } of views) {
  test.describe(name, () => {
    test.beforeEach(async ({ page }) => {
      await useView(page, perspective)
    })

    test('a. drags the selected rock to a free hex; the camera holds; one undo puts it back', async ({
      page,
    }) => {
      const rock = await selectRock(page)
      const pose = await cameraPose(page)
      const undos = await undoCount(page)
      await startDrag(page, rock, { q: 2, r: 2, altitude: 1 })
      await expect
        .poll(async () => (await snapshot(page))?.drag)
        .toMatchObject({
          state: 'dragging',
          targetStatus: 'ok',
          targetHex: { q: 2, r: 2, altitude: 1 },
        })
      expect(await cameraPose(page)).toEqual(pose)
      await page.mouse.up()

      await expect
        .poll(async () => (await piece(page, rock))?.pieceCoords)
        .toEqual({ q: 2, r: 2, s: -4 })
      expect((await piece(page, rock))?.altitude).toBe(1)
      const after = await snapshot(page)
      expect(after?.drag).toBeNull()
      // the release did not deselect (or select something else)
      expect(after?.selectedPieceIDs).toEqual([rock])
      expect(await cameraPose(page)).toEqual(pose)
      // the whole move is one undo step
      expect(await undoCount(page)).toBe(undos + 1)

      await undoButton(page).click()
      await expect
        .poll(async () => (await piece(page, rock))?.pieceCoords)
        .toEqual({ q: 1, r: 2, s: -3 })
    })

    test('f. over its own start hex, the target is the grass under the rock', async ({
      page,
    }) => {
      const rock = await selectRock(page)
      const start = await page.evaluate(
        (id) => window.__TEST__?.screenPosOfPiece(id) ?? null,
        rock,
      )
      const box = await page.locator('canvas').first().boundingBox()
      if (!start || !box) throw new Error('rock not on screen')
      const x = box.x + start.x
      const y = box.y + start.y
      const grassUnderRock = { q: 1, r: 2, s: -3, altitude: 1 }

      // start the drag without leaving the rock: the pointer must already
      // see through it (R3F's hover memory is reset when the drag starts)
      await page.mouse.move(x, y)
      await page.mouse.down()
      for (let i = 1; i <= 4; i++) await page.mouse.move(x + i * 3, y)
      await expect
        .poll(async () => (await snapshot(page))?.drag)
        .toMatchObject({ state: 'dragging', targetHex: grassUnderRock })

      // away and back over the rock
      const away = await page.evaluate(
        () =>
          window.__TEST__?.screenPosOfHex({ q: 2, r: 2, altitude: 1 }) ?? null,
      )
      if (!away) throw new Error('grass not on screen')
      await page.mouse.move(box.x + away.x, box.y + away.y, { steps: 4 })
      await expect
        .poll(async () => (await snapshot(page))?.drag?.targetHex)
        .toEqual({ q: 2, r: 2, s: -4, altitude: 1 })
      await page.mouse.move(x, y, { steps: 4 })
      await expect
        .poll(async () => (await snapshot(page))?.drag?.targetHex)
        .toEqual(grassUnderRock)
      await page.mouse.up()
      // dropped where it was
      expect((await piece(page, rock))?.pieceCoords).toEqual({
        q: 1,
        r: 2,
        s: -3,
      })
    })
  })
}

test('b. a press and release without moving still toggles the selection', async ({
  page,
}) => {
  const rock = await selectRock(page)
  // on the selected piece: deselects (today's toggle), nothing moves
  await clickPiece(page, rock)
  await expect
    .poll(async () => (await snapshot(page))?.selectedPieceIDs)
    .toEqual([])
  expect((await piece(page, rock))?.pieceCoords).toEqual({ q: 1, r: 2, s: -3 })
  // on an unselected piece: selects
  await clickPiece(page, rock)
  await expect
    .poll(async () => (await snapshot(page))?.selectedPieceIDs)
    .toEqual([rock])
})

test('c. dragging an unselected piece orbits the camera and moves nothing', async ({
  page,
}) => {
  await useView(page, true)
  const rock = await findPieceUid(page, { inventoryID: 'r1' })
  const pieces = await page.evaluate(() => window.__TEST__?.listPieces())
  const pose = await cameraPose(page)
  await dragPiece(page, rock, { q: 2, r: 2, altitude: 1 })
  await expect.poll(() => cameraPose(page)).not.toEqual(pose)
  expect(await page.evaluate(() => window.__TEST__?.listPieces())).toEqual(
    pieces,
  )
  expect((await snapshot(page))?.drag).toBeNull()
})

test('d. Esc mid-drag cancels: board, selection unchanged, camera works again', async ({
  page,
}) => {
  await useView(page, true)
  const rock = await selectRock(page)
  const pieces = await page.evaluate(() => window.__TEST__?.listPieces())
  await startDrag(page, rock, { q: 2, r: 2, altitude: 1 })
  await expect
    .poll(async () => (await snapshot(page))?.drag?.state)
    .toBe('dragging')
  await page.keyboard.press('Escape')
  await expect.poll(async () => (await snapshot(page))?.drag).toBeNull()
  await page.mouse.up()
  expect(await page.evaluate(() => window.__TEST__?.listPieces())).toEqual(
    pieces,
  )
  // the release after Esc neither deselected nor did anything else
  expect((await snapshot(page))?.selectedPieceIDs).toEqual([rock])
  const pose = await cameraPose(page)
  await orbitDrag(page)
  await expect.poll(() => cameraPose(page)).not.toEqual(pose)
})

test('e. a camera locked with End stays locked through a drag', async ({
  page,
}) => {
  await useView(page, true)
  const rock = await selectRock(page)
  await page.keyboard.press('End')
  const pose = await cameraPose(page)
  await dragPiece(page, rock, { q: 2, r: 2, altitude: 1 })
  await expect
    .poll(async () => (await piece(page, rock))?.pieceCoords)
    .toEqual({ q: 2, r: 2, s: -4 })
  // still locked: an orbit drag over empty table does not move it
  await orbitDrag(page)
  expect(await cameraPose(page)).toEqual(pose)
})

test('Laur pillar drag moves the selected pillar and undo restores it', async ({
  page,
}) => {
  await page.goto(LAUR_URL)
  await waitForAppReady(page)
  const pillar = await findPieceUid(page, {
    inventoryID: 'lwp',
    q: 1,
    r: 3,
  })
  await clickPiece(page, pillar)
  await expect
    .poll(async () => (await snapshot(page))?.selectedPieceIDs)
    .toEqual([pillar])

  const undos = await undoCount(page)
  await dragPiece(page, pillar, { q: 4, r: 3, altitude: 0 })
  await expect
    .poll(async () => (await piece(page, pillar))?.pieceCoords)
    .toEqual({ q: 4, r: 3, s: -7 })
  expect((await piece(page, pillar))?.inventoryID).toBe('lwp')
  expect(await undoCount(page)).toBe(undos + 1)

  await undoButton(page).click()
  await expect
    .poll(async () => (await piece(page, pillar))?.pieceCoords)
    .toEqual({ q: 1, r: 3, s: -4 })
})

test('a start zone drags to another hex and undo restores it', async ({
  page,
}, testInfo: TestInfo) => {
  const startZoneURL = mapUrl(
    {
      id: 'e2e-start-zone-drag',
      name: 'E2E Start Zone Drag',
      author: 'e2e',
      version: 1,
      shape: 'rectangle',
      width: 6,
      length: 6,
    },
    ['0~1~2~0~z1'],
  )
  await page.goto(startZoneURL)
  await waitForAppReady(page)
  const zone = await findPieceUid(page, {
    inventoryID: 'z1',
    q: 1,
    r: 2,
  })
  await clickPiece(page, zone)
  await expect
    .poll(async () => (await snapshot(page))?.selectedPieceIDs)
    .toEqual([zone])

  const undos = await undoCount(page)
  await startDrag(page, zone, { q: 3, r: 2, altitude: 0 })
  await expect
    .poll(async () => (await snapshot(page))?.drag)
    .toMatchObject({
      state: 'dragging',
      targetStatus: 'ok',
      targetHex: { q: 3, r: 2, altitude: 0 },
    })
  await page.screenshot({
    path: testInfo.outputPath('start-zone-drag-preview.png'),
  })
  await page.mouse.up()
  await expect
    .poll(async () => (await piece(page, zone))?.pieceCoords)
    .toEqual({ q: 3, r: 2, s: -5 })
  expect(await undoCount(page)).toBe(undos + 1)

  await undoButton(page).click()
  await expect
    .poll(async () => (await piece(page, zone))?.pieceCoords)
    .toEqual({ q: 1, r: 2, s: -3 })
})

test('Laur add-on drag snaps to another pillar port', async ({ page }) => {
  await page.goto(LAUR_URL)
  await waitForAppReady(page)
  const addon = await findPieceUid(page, {
    inventoryID: 'lws',
    q: 1,
    r: 4,
  })
  const targetPillar = await findPieceUid(page, {
    inventoryID: 'lwp',
    q: 5,
    r: 4,
  })
  await clickPiece(page, addon)
  await expect
    .poll(async () => (await snapshot(page))?.selectedPieceIDs)
    .toEqual([addon])

  await startDragToPiece(page, addon, targetPillar)
  await expect
    .poll(async () => (await snapshot(page))?.drag)
    .toMatchObject({
      state: 'dragging',
      targetHex: { q: 5, r: 4, altitude: 0 },
    })
  await page.mouse.up()
  await expect
    .poll(async () => (await piece(page, addon))?.pieceCoords)
    .toEqual({ q: 5, r: 4, s: -9 })
  expect(await piece(page, addon)).toMatchObject({
    inventoryID: 'lws',
    altitude: 0,
    rotation: 0,
  })
})

test('a conflicted Laur ruin can still be selected and dragged', async ({
  page,
}) => {
  const conflictedLaurURL = mapUrl(
    {
      ...LAUR_MAP,
      id: 'e2e-conflicted-laur-ruin',
      name: 'E2E Conflicted Laur Ruin',
    },
    ['0~3~3~0~lwr', '0~4~3~0~g1'],
  )
  await page.goto(conflictedLaurURL)
  await waitForAppReady(page)
  const ruins = await page.evaluate(() =>
    window.__TEST__
      ?.listPieces()
      .filter((piece) => piece.inventoryID === 'lwr'),
  )
  expect(ruins).toHaveLength(1)
  const ruinUID = ruins?.[0]?.uid
  if (!ruinUID) throw new Error('No Laur ruin was loaded')

  await clickPiece(page, ruinUID)
  const selected = (await snapshot(page))?.selectedPieceIDs
  expect(selected).toHaveLength(1)
  expect(selected).toContain(ruinUID)
  const selectedRuin = selected?.[0]
  if (!selectedRuin) throw new Error('No Laur ruin was selected')

  await startDrag(page, selectedRuin, { q: 2, r: 4, altitude: 0 })
  await expect
    .poll(async () => (await snapshot(page))?.drag?.state)
    .toBe('dragging')
  await expect
    .poll(async () => (await snapshot(page))?.drag?.targetHex)
    .toEqual({
      q: 2,
      r: 4,
      s: -6,
      altitude: 0,
    })
  await page.mouse.up()
  await expect
    .poll(async () => (await piece(page, selectedRuin))?.pieceCoords)
    .toEqual({ q: 2, r: 4, s: -6 })
})

test('Laur add-on drag preview shows its unsupported amber state', async ({
  page,
}, testInfo: TestInfo) => {
  await page.goto(LAUR_URL)
  await waitForAppReady(page)
  const addon = await findPieceUid(page, {
    inventoryID: 'lws',
    q: 1,
    r: 4,
  })
  await clickPiece(page, addon)
  await expect
    .poll(async () => (await snapshot(page))?.selectedPieceIDs)
    .toEqual([addon])

  await startDrag(page, addon, { q: 4, r: 3, altitude: 0 })
  await expect
    .poll(async () => (await snapshot(page))?.drag)
    .toMatchObject({
      state: 'dragging',
      targetStatus: 'ok',
      unsupported: true,
      targetHex: { q: 4, r: 3, altitude: 0 },
    })
  await page.screenshot({
    path: testInfo.outputPath('laur-addon-drag-unsupported.png'),
  })

  await page.keyboard.press('Escape')
  await page.mouse.up()
  expect((await piece(page, addon))?.pieceCoords).toEqual({
    q: 1,
    r: 4,
    s: -5,
  })
})

test('g. a drop that would hang off the map is refused with the message', async ({
  page,
}) => {
  // a g2 at (2, 2) pointing west covers (2, 2) and (1, 2)
  await page.goto(
    mapUrl(
      {
        id: 'e2e-drag-edge',
        name: 'E2E Drag Edge',
        author: 'e2e',
        version: 1,
        shape: 'rectangle',
        width: 6,
        length: 6,
      },
      ['0~2~2~3~g2'],
    ),
  )
  await waitForAppReady(page)
  const g2 = await findPieceUid(page, { inventoryID: 'g2' })
  await clickPiece(page, g2)
  await expect
    .poll(async () => (await snapshot(page))?.selectedPieceIDs)
    .toEqual([g2])
  // grabbed at its origin and dropped on the corner, its west hex is off
  await startDrag(page, g2, { q: 0, r: 0, altitude: 0 })
  await expect
    .poll(async () => (await snapshot(page))?.drag)
    // the whole g2 footprint, the hex off the map included
    .toMatchObject({
      targetStatus: 'blocked',
      reason: 'offMap',
      footprintCount: 2,
    })
  await page.mouse.up()
  await expect(
    page.getByText('That piece would hang off the edge of the map.'),
  ).toBeVisible()
  expect((await piece(page, g2))?.pieceCoords).toEqual({ q: 2, r: 2, s: -4 })
  expect((await snapshot(page))?.drag).toBeNull()
})

test('h. dropping a piece on a stack taller than the view raises the viewing level', async ({
  page,
}) => {
  // grass at (1, 2); a rock stack three high at (3, 2), top surface level 3
  await page.goto(
    mapUrl(
      {
        id: 'e2e-drag-level',
        name: 'E2E Drag Level',
        author: 'e2e',
        version: 1,
        shape: 'rectangle',
        width: 6,
        length: 6,
      },
      ['0~1~2~0~g1', '0~3~2~0~r1', '1~3~2~0~r1', '2~3~2~0~r1'],
    ),
  )
  await waitForAppReady(page)
  const grass = await findPieceUid(page, { inventoryID: 'g1' })
  await clickPiece(page, grass)
  await expect
    .poll(async () => (await snapshot(page))?.selectedPieceIDs)
    .toEqual([grass])
  const levelBefore = (await snapshot(page))?.viewingLevel ?? 0
  expect(levelBefore).toBeLessThan(4)

  await dragPiece(page, grass, { q: 3, r: 2, altitude: 3 })
  await expect.poll(async () => (await piece(page, grass))?.altitude).toBe(3)
  // the grass now tops the stack at level 4, and the view follows it
  await expect.poll(async () => (await snapshot(page))?.viewingLevel).toBe(4)
})

test('i. drags a three-piece selection rigidly and one undo restores all three', async ({
  page,
}) => {
  const group = await Promise.all([
    findPieceUid(page, { inventoryID: 'g1', q: 0, r: 2 }),
    findPieceUid(page, { inventoryID: 's1', q: 1, r: 3 }),
    findPieceUid(page, { inventoryID: 'g1', q: 2, r: 2 }),
  ])
  await clickPiece(page, group[0])
  await shiftClickPiece(page, group[1])
  await shiftClickPiece(page, group[2])
  await expect
    .poll(async () => (await snapshot(page))?.selectedPieceIDs)
    .toEqual(group)

  const before = await page.evaluate(() => window.__TEST__?.listPieces())
  const undoCountBefore = await undoCount(page)
  const originals = group.map((uid) =>
    before?.find((candidate) => candidate.uid === uid),
  )
  if (originals.some((piece) => !piece)) {
    throw new Error('selected fixture pieces were not found')
  }

  await dragPiece(page, group[1], { q: 1, r: 1, altitude: 0 })
  await expect
    .poll(async () => {
      const after = await page.evaluate(() => window.__TEST__?.listPieces())
      return group.map(
        (uid) => after?.find((candidate) => candidate.uid === uid)?.pieceCoords,
      )
    })
    .toEqual([
      { q: 0, r: 0, s: 0 },
      { q: 1, r: 1, s: -2 },
      { q: 2, r: 0, s: -2 },
    ])
  expect(await undoCount(page)).toBe(undoCountBefore + 1)

  await undoButton(page).click()
  await expect
    .poll(async () => {
      const after = await page.evaluate(() => window.__TEST__?.listPieces())
      return group.map((uid) =>
        after?.find((candidate) => candidate.uid === uid),
      )
    })
    .toEqual(originals)
})
