import {
  clickPiece,
  expect,
  findPieceUid,
  FIXTURE_URL,
  test,
  waitForAppReady,
} from './fixtures'
import { FIXTURE_PIECE_COUNT } from './fixture-map'

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
