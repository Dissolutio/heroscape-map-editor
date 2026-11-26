import { readFileSync } from 'node:fs'
import { expect, test, waitForAppReady } from './fixtures'

test('loads and renders a Void Mat from the Virtualscape file input', async ({
  page,
}) => {
  await page.goto('/hs?e2e=1')
  await waitForAppReady(page)

  await page.getByRole('tab', { name: 'File' }).click()
  await page.locator('#vsupload').setInputFiles({
    name: 'vs-void-mat-two-grass.hsc',
    mimeType: 'application/octet-stream',
    buffer: readFileSync(
      new URL(
        '../src/__tests__/fixtures/vs-void-mat-two-grass.hsc',
        import.meta.url,
      ),
    ),
  })
  await expect
    .poll(() =>
      page.evaluate(() => {
        const state = window.__TEST__?.snapshot()
        return state
          ? {
              mapWidth: state.mapWidth,
              mapLength: state.mapLength,
              pieceCount: state.pieceCount,
            }
          : null
      }),
    )
    .toMatchObject({ mapWidth: 8, mapLength: 11, pieceCount: 3 })
  await waitForAppReady(page)

  const state = await page.evaluate(() => window.__TEST__?.snapshot())
  if (!state) throw new Error('The e2e test bridge is unavailable')
  expect(state).toMatchObject({
    mapWidth: 8,
    mapLength: 11,
    hexCount: 96,
    pieceCount: 3,
  })

  const pieces = await page.evaluate(() => window.__TEST__?.listPieces() ?? [])
  expect(pieces.map(({ inventoryID }) => inventoryID).sort()).toEqual([
    'g1',
    'g7',
    'vc1',
  ])
  const mat = pieces.find(({ inventoryID }) => inventoryID === 'vc1')
  if (!mat) throw new Error('The imported Void Mat is missing from the store')
  expect(mat).toMatchObject({
    altitude: 0,
    pieceCoords: { q: 1, r: 2, s: -3 },
    rotation: 0,
  })
  expect(state.voidPieces).toEqual([
    {
      uid: mat.uid,
      inventoryID: 'vc1',
      altitude: 0,
      pieceCoords: { q: 1, r: 2, s: -3 },
      rotation: 0,
    },
  ])

  const rendering = state.voidMatRenderings.find(
    (piece) => piece.uid === mat.uid,
  )
  expect(rendering).toMatchObject({
    visible: true,
  })
  expect(rendering?.meshCount).toBeGreaterThan(0)
  expect(['textured', 'fallback']).toContain(rendering?.rendering)
  expect(state.viewingLevel).toBe(mat.altitude)

  const screenPosition = await page.evaluate(
    (uid) => window.__TEST__?.screenPosOfPiece(uid) ?? null,
    mat.uid,
  )
  expect(screenPosition).not.toBeNull()
})
