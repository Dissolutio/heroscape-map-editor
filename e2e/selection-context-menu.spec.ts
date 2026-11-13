import {
  clickPiece,
  expect,
  findPieceUid,
  pickFromMenu,
  FIXTURE_URL,
  setPen,
  test,
  waitForAppReady,
} from './fixtures'

const snapshot = (page: import('@playwright/test').Page) =>
  page.evaluate(() => window.__TEST__?.snapshot())

async function rightClickCanvasPoint(
  page: import('@playwright/test').Page,
  point: { x: number; y: number },
) {
  const canvas = await page.locator('canvas').first().boundingBox()
  if (!canvas) throw new Error('The 3D canvas is not visible')
  await page.mouse.click(canvas.x + point.x, canvas.y + point.y, {
    button: 'right',
  })
}

async function rightClickPiece(
  page: import('@playwright/test').Page,
  uid: string,
) {
  const point = await page.evaluate(
    (pieceUID) => window.__TEST__?.screenPosOfPiece(pieceUID) ?? null,
    uid,
  )
  if (!point) throw new Error(`Piece ${uid} is not on screen`)
  await rightClickCanvasPoint(page, point)
}

async function chooseAction(
  page: import('@playwright/test').Page,
  label: string,
) {
  await expect(
    page.getByRole('menu', { name: 'Piece selection actions' }),
  ).toBeVisible()
  await page.mouse.move(0, 0)
  await page.getByRole('menuitem', { name: label }).click()
  await page.locator('.MuiMenu-root').waitFor({ state: 'detached' })
}

test('right-click selection actions work in every graphics tier', async ({
  page,
}) => {
  await page.goto(FIXTURE_URL)
  await waitForAppReady(page)
  await setPen(page, 'gn', 1)

  const grass = await findPieceUid(page, {
    inventoryID: 'g1',
    q: 0,
    r: 2,
  })
  const emptyPoint = await page.evaluate(
    () => window.__TEST__?.screenPosOfHex({ q: 0, r: 0, altitude: 0 }) ?? null,
  )
  if (!emptyPoint) throw new Error('Fixture empty ground is not on screen')
  await page.locator('#simple-tab-3').click()
  const graphics = page.getByTestId('graphics-tier-select')
  const tiers = [
    'Low (classic look)',
    'Medium (diffuse textures)',
    'High (PBR textures)',
  ]

  for (const [index, tier] of tiers.entries()) {
    if (index > 0) {
      await graphics.click()
      await pickFromMenu(page, tier)
    }
    await waitForAppReady(page)
    await rightClickPiece(page, grass)
    await expect(
      page.getByRole('menu', { name: 'Piece selection actions' }),
    ).toBeVisible()
    await page.keyboard.press('Escape')
    await page.locator('.MuiMenu-root').waitFor({ state: 'detached' })
    await expect(
      page.getByRole('menu', { name: 'Piece selection actions' }),
    ).toBeHidden()
  }

  await rightClickPiece(page, grass)
  await expect
    .poll(async () => (await snapshot(page))?.selectedPieceIDs)
    .toEqual([grass])
  await page.keyboard.press('Escape')
  await page.locator('.MuiMenu-root').waitFor({ state: 'detached' })
  await setPen(page, 'select', 1)

  const pieces = await page.evaluate(() => window.__TEST__?.listPieces() ?? [])
  const grassIDs = pieces
    .filter((piece) => piece.inventoryID === 'g1')
    .map((piece) => piece.uid)
  const sand = pieces.find((piece) => piece.inventoryID === 's1')?.uid
  const rock = pieces.find((piece) => piece.inventoryID === 'r1')?.uid
  if (!sand || !rock) throw new Error('Fixture is missing its sand or rock')

  await rightClickPiece(page, grass)
  const canvasBounds = await page.locator('canvas').first().boundingBox()
  if (!canvasBounds) throw new Error('The 3D canvas is not visible')
  await page.mouse.click(
    canvasBounds.x + emptyPoint.x,
    canvasBounds.y + emptyPoint.y,
  )
  await expect(
    page.getByRole('menu', { name: 'Piece selection actions' }),
  ).toBeHidden()
  await page.locator('.MuiMenu-root').waitFor({ state: 'detached' })

  await rightClickPiece(page, grass)
  await expect(
    page.getByRole('menu', { name: 'Piece selection actions' }),
  ).toBeVisible()
  await page.keyboard.press('ArrowDown')
  await expect(
    page.getByRole('menuitem', { name: 'Select same type' }),
  ).toBeFocused()
  await page.keyboard.press('Enter')
  await expect
    .poll(async () => (await snapshot(page))?.selectedPieceIDs)
    .toEqual(grassIDs)
  await expect(
    page.getByRole('menu', { name: 'Piece selection actions' }),
  ).toBeHidden()

  await rightClickPiece(page, grass)
  await page.evaluate(async () => {
    const pose = window.__TEST__?.cameraPose()
    if (!pose) return
    await window.__TEST__?.setCamera(
      [pose.position[0] + 0.1, pose.position[1], pose.position[2]],
      pose.target,
    )
  })
  await expect(
    page.getByRole('menu', { name: 'Piece selection actions' }),
  ).toBeHidden()
  await waitForAppReady(page)
  await clickPiece(page, grass)

  await rightClickPiece(page, grass)
  await chooseAction(page, 'Select same type')
  await expect
    .poll(async () => (await snapshot(page))?.selectedPieceIDs)
    .toEqual(grassIDs)

  await rightClickPiece(page, grass)
  await chooseAction(page, 'Select connected')
  await expect
    .poll(async () => (await snapshot(page))?.selectedPieceIDs)
    .toHaveLength(pieces.length)

  await clickPiece(page, sand)
  await rightClickPiece(page, sand)
  await chooseAction(page, 'Select same level')
  await expect
    .poll(async () => (await snapshot(page))?.selectedPieceIDs)
    .toEqual(expect.arrayContaining([...grassIDs, sand]))
  await expect
    .poll(async () => (await snapshot(page))?.selectedPieceIDs)
    .not.toContain(rock)

  await rightClickCanvasPoint(page, emptyPoint)
  await chooseAction(page, 'Invert selection')
  await expect
    .poll(async () => (await snapshot(page))?.selectedPieceIDs)
    .toEqual([rock])

  const before = await page.evaluate(
    () => window.__TEST__?.cameraPose() ?? null,
  )
  const canvas = await page.locator('canvas').first().boundingBox()
  if (!canvas) throw new Error('The 3D canvas is not visible')
  await page.mouse.move(canvas.x + emptyPoint.x, canvas.y + emptyPoint.y)
  await page.mouse.down({ button: 'right' })
  for (let step = 1; step <= 8; step += 1) {
    await page.mouse.move(
      canvas.x + emptyPoint.x + step * 10,
      canvas.y + emptyPoint.y - step * 5,
    )
  }
  await page.mouse.up({ button: 'right' })
  await waitForAppReady(page)

  await expect(
    page.getByRole('menu', { name: 'Piece selection actions' }),
  ).toBeHidden()
  const after = await page.evaluate(() => window.__TEST__?.cameraPose() ?? null)
  expect(after).not.toEqual(before)
  await expect
    .poll(async () => (await snapshot(page))?.selectedPieceIDs)
    .toEqual([rock])
})
