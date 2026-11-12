import { bench, describe } from 'vitest'
import { buildupJsonFileMap } from '../data/buildupMap'
import { rebuildBoardStateFromPieces } from '../data/rebuildBoardState'
import type { BoardPiece, BoardPieces, HexMap } from '../types'
import { Pieces } from '../types'
import fortifiedWallsAndRuins from './fixtures/fortified-walls-and-ruins.json'
import twinIronsDockyard from './fixtures/twin-irons-dockyard.json'

const loadPieces = (fixture: { hexMap: unknown; boardPieces: unknown }) =>
  buildupJsonFileMap(
    fixture.boardPieces as BoardPiece[],
    fixture.hexMap as HexMap,
  ).boardPieces

const dockyard = loadPieces(twinIronsDockyard)
const walls = loadPieces(fortifiedWallsAndRuins)

// 200 Fortified Walls and Ruins over a land floor: the cell index stays
// keyed by cell, so the replay grows with the walls, not walls x walls.
function makeManyWalls(): BoardPieces {
  const pieces: BoardPieces = []
  const ids = [Pieces.fortifiedWall, Pieces.ruins2, Pieces.ruins3]
  for (let index = 0; index < 200; index++) {
    const q = (index % 20) * 6
    const r = Math.floor(index / 20) * 6
    const pieceCoords = { q, r, s: -q - r }
    pieces.push({
      uid: `floor-${index}`,
      inventoryID: Pieces.grass24,
      altitude: 0,
      rotation: 0,
      pieceCoords,
    })
    pieces.push({
      uid: `wall-${index}`,
      inventoryID: ids[index % ids.length],
      altitude: 1,
      rotation: index % 6,
      pieceCoords,
    })
  }
  return pieces
}
const manyWalls = makeManyWalls()

describe('edge/node cell replay', () => {
  bench('twin-irons-dockyard replay', () => {
    rebuildBoardStateFromPieces(dockyard)
  })
  bench('fortified-walls-and-ruins replay', () => {
    rebuildBoardStateFromPieces(walls)
  })
  bench('200 walls on land replay', () => {
    rebuildBoardStateFromPieces(manyWalls)
  })
})
