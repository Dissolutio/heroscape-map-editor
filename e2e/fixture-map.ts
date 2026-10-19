/**
 * The small, fixed map every e2e test starts from. Data only: no imports, so
 * the Vitest guard in src/__tests__/e2e-fixture-map.test.ts can load it too.
 *
 * Piece ids are "altitude~q~r~rotation~inventoryID". The grid is a 6x6
 * rectangle: row r holds q from -floor(r/2) to 5 - floor(r/2).
 */
export const FIXTURE_HEX_MAP = {
  id: 'e2e-fixture-map',
  name: 'E2E Fixture Map',
  author: 'e2e',
  version: 1,
  shape: 'rectangle',
  width: 6,
  length: 6,
}

export const FIXTURE_PIECE_IDS = [
  '0~0~2~0~g1', // grass
  '0~1~2~0~g1', // grass, with the rock below stacked on top of it
  '0~2~2~0~g1', // grass
  '0~1~3~0~s1', // sand
  '1~1~2~0~r1', // rock on top of the grass at (1, 2)
]

export const FIXTURE_PIECE_COUNT = FIXTURE_PIECE_IDS.length
