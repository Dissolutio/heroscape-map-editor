import {
  clickPiece,
  expect,
  findPieceUid,
  mapUrl,
  test,
  waitForAppReady,
} from './fixtures'

/**
 * Hovering a move button shows a see-through ghost of the selected piece. The
 * ghost's models share cached materials with the real pieces, and used to
 * leave the real piece see-through after the preview cleared.
 */
const MODELS_MAP = {
  id: 'e2e-preview-materials',
  name: 'E2E Preview Materials',
  author: 'e2e',
  version: 1,
  shape: 'rectangle',
  width: 6,
  length: 5,
}
const MODELS_PIECE_IDS = [
  '0~0~2~0~g1',
  '1~0~2~0~tr10', // tree on grass
  '0~2~2~0~g1',
  '1~2~2~0~lwp', // Laur square pillar on grass
]

for (const inventoryID of ['tr10', 'lwp']) {
  test(`hovering a move button leaves the real ${inventoryID} as it was`, async ({
    page,
  }) => {
    await page.goto(mapUrl(MODELS_MAP, MODELS_PIECE_IDS))
    await waitForAppReady(page)
    const uid = await findPieceUid(page, { inventoryID })
    await clickPiece(page, uid)
    await expect(page.getByTestId('app-status')).toContainText('1 selected')
    await waitForAppReady(page)

    const point = await page.evaluate(
      (id) => window.__TEST__?.screenPosOfPiece(id) ?? null,
      uid,
    )
    if (!point) throw new Error('piece is off screen')
    const canvas = page.locator('canvas').first()
    const box = await canvas.boundingBox()
    if (!box) throw new Error('no canvas')
    // the real piece, without the ghost (it is drawn one hex to the right)
    const clip = {
      x: box.x + point.x - 15,
      y: box.y + point.y - 15,
      width: 30,
      height: 30,
    }
    const before = await page.screenshot({ clip })

    const moveRight = page.getByTitle('Move selected piece 1 hex right')
    await moveRight.hover()
    await page.waitForTimeout(1000) // the ghost applies its opacity per frame
    await page.mouse.move(box.x + 5, box.y + 5) // leave: the preview clears
    await page.waitForTimeout(1000)
    await expect
      .poll(async () => (await page.screenshot({ clip })).equals(before))
      .toBe(true)
  })
}
