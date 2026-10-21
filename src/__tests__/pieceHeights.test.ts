import { describe, expect, it } from 'vitest'
import { MEASURED_PIECE_HEIGHTS } from '../data/pieceHeightAudit'
import { piecesSoFar } from '../data/pieces'
import { Pieces } from '../types'
import { makeTable, place } from './helpers/board'

describe('measured piece heights', () => {
  it.each(Object.entries(MEASURED_PIECE_HEIGHTS))(
    '%s blocks its measured clearance',
    (pieceID, { blockedLevels }) => {
      const table = makeTable()
      const obstacle = place({
        board: table,
        pieceID,
        at: table.center,
        altitude: 0,
        uid: 'measured-obstacle',
      })
      expect(obstacle.error).toBeUndefined()
      expect(piecesSoFar[pieceID].height).toBe(blockedLevels)

      const column = Object.values(obstacle.board.boardHexes)
        .filter(
          (hex) =>
            hex.boardPieceUID === 'measured-obstacle' &&
            hex.q === table.center.q &&
            hex.r === table.center.r,
        )
        .sort((a, b) => a.altitude - b.altitude)
      expect(column).toHaveLength(blockedLevels)
      expect(column.map((hex) => hex.altitude)).toEqual(
        Array.from({ length: blockedLevels }, (_, index) => index + 1),
      )

      const clearTile = place({
        board: obstacle.board,
        pieceID: 'g1',
        at: table.center,
        altitude: blockedLevels,
        permissive: true,
      })
      expect(clearTile.error).toBeUndefined()
      expect(clearTile.displacedUIDs).not.toContain('measured-obstacle')

      const overlappingTile = place({
        board: obstacle.board,
        pieceID: 'g1',
        at: table.center,
        altitude: blockedLevels - 1,
        permissive: true,
      })
      expect(overlappingTile.error).toBeUndefined()
      expect(overlappingTile.displacedUIDs).toContain('measured-obstacle')
    },
  )

  it('keeps Big Tree 415 at its registered height', () => {
    expect(piecesSoFar[Pieces.tree415].height).toBe(15)
  })
})
