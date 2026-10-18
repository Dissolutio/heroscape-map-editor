/**
 * E2E FIXTURE MAP
 *
 * The Playwright suite (e2e/) starts every test from one small map. If the
 * piece-id format or the load rules drift, the browser tests would fail with
 * confusing symptoms; these checks fail fast and say why. Pure logic, no
 * browser.
 */
import { describe, expect, it } from 'vitest'
import { FIXTURE_HEX_MAP, FIXTURE_PIECE_IDS } from '../../e2e/fixture-map'
import { buildupJsonFileMap } from '../data/buildupMap'
import type { HexMap } from '../types'
import {
  encodeBoardPiecesToIds,
  inflateBoardPiecesFromIds,
} from '../utils/map-utils'
import { hexAt } from './helpers/board'

const hexMap = FIXTURE_HEX_MAP as HexMap

describe('e2e fixture map', () => {
  it('piece ids survive decode and re-encode unchanged', () => {
    const pieces = inflateBoardPiecesFromIds(FIXTURE_PIECE_IDS)
    expect(encodeBoardPiecesToIds(pieces)).toEqual(FIXTURE_PIECE_IDS)
  })

  it('loads with every piece known and kept', () => {
    const map = buildupJsonFileMap(
      inflateBoardPiecesFromIds(FIXTURE_PIECE_IDS),
      hexMap,
    )
    expect(map.droppedPieces).toEqual([])
    expect(map.boardPieces).toHaveLength(FIXTURE_PIECE_IDS.length)
  })

  it('every piece owns the hex on top of it (none displaced, none off the grid)', () => {
    const map = buildupJsonFileMap(
      inflateBoardPiecesFromIds(FIXTURE_PIECE_IDS),
      hexMap,
    )
    for (const bp of map.boardPieces) {
      // a piece placed at altitude L has its top surface at L + 1
      const top = hexAt(map, bp.pieceCoords, bp.altitude + 1)
      expect(top?.boardPieceUID).toBe(bp.uid)
    }
  })

  it('the rock is stacked on the grass at (1, 2)', () => {
    const map = buildupJsonFileMap(
      inflateBoardPiecesFromIds(FIXTURE_PIECE_IDS),
      hexMap,
    )
    const coords = { q: 1, r: 2, s: -3 }
    expect(hexAt(map, coords, 1)).toMatchObject({ terrain: 'grass' })
    expect(hexAt(map, coords, 2)).toMatchObject({ terrain: 'rock', isCap: true })
  })
})
