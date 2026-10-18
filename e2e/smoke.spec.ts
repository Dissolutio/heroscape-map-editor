import { FIXTURE_PIECE_COUNT } from './fixture-map'
import { clickPiece, expect, findPieceUid, test } from './fixtures'

test('loads the fixture map and reports ready', async ({ page }) => {
  await expect(page.locator('canvas[data-ready="true"]')).toBeVisible()
  await expect(page.getByTestId('app-status')).toContainText('Map loaded')

  const snapshot = await page.evaluate(() => window.__TEST__?.snapshot())
  expect(snapshot?.ready).toBe(true)
  expect(snapshot?.mapName).toBe('E2E Fixture Map')
  expect(snapshot?.pieceCount).toBe(FIXTURE_PIECE_COUNT)
  expect(snapshot?.selectedPieceIDs).toEqual([])
})

test('clicking a piece at its projected position selects it', async ({
  page,
}) => {
  // The app starts in select mode, so a plain left-click selects.
  const uid = await findPieceUid(page, { inventoryID: 'g1', q: 0, r: 2 })

  await clickPiece(page, uid)

  await expect(page.getByTestId('app-status')).toContainText('1 selected')
  const snapshot = await page.evaluate(() => window.__TEST__?.snapshot())
  expect(snapshot?.selectedPieceIDs).toEqual([uid])
  // the selected-piece controls (outside the canvas) appear too
  await expect(
    page.getByRole('button', { name: /delete piece/i }),
  ).toBeVisible()
})
