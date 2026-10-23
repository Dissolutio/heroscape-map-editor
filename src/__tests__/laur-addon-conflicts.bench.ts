import { bench } from 'vitest'
import { evaluateLaurAddonConflicts } from '../data/laurAddonConflicts'
import type { BoardHexes, BoardPiece, BoardPieces } from '../types'
import { HexTerrain, Pieces } from '../types'

const addonIDs = [
  Pieces.laurWallShort,
  Pieces.laurWallShortStackable,
  Pieces.laurWallLong,
  Pieces.laurWallLongStackable,
  Pieces.laurWallArch,
  Pieces.laurWallRuin1,
  Pieces.laurWallRuin2,
  Pieces.laurWallRuin3,
]

function makeBenchmarkBoard() {
  const boardPieces: BoardPieces = []
  const boardHexes: BoardHexes = {}
  for (let index = 0; index < 2000; index++) {
    const inventoryID = addonIDs[index % addonIDs.length]
    const rotation =
      inventoryID === Pieces.laurWallShort ||
      inventoryID === Pieces.laurWallShortStackable
        ? index % 6
        : inventoryID === Pieces.laurWallLong ||
            inventoryID === Pieces.laurWallLongStackable ||
            inventoryID === Pieces.laurWallArch
          ? (index % 6) + 0.5
          : (index % 12) / 2
    const q = Math.floor(index / 40) * 4
    const r = (index % 40) * 4
    const pieceCoords = { q, r, s: -q - r }
    boardPieces.push({
      uid: `addon-${index}`,
      inventoryID,
      altitude: (index % 5) * 8,
      rotation,
      pieceCoords,
    })

    const grassCoords = { q: 100_000 + index, r: 0, s: -100_000 - index }
    const grassPiece: BoardPiece = {
      uid: `grass-${index}`,
      inventoryID: Pieces.grass1,
      altitude: 0,
      rotation: 0,
      pieceCoords: grassCoords,
    }
    boardPieces.push(grassPiece)
    boardHexes[`${index}`] = {
      ...grassCoords,
      id: `grass-hex-${index}`,
      altitude: 0,
      pieceID: `grass-${index}`,
      boardPieceUID: grassPiece.uid,
      inventoryID: grassPiece.inventoryID,
      terrain: HexTerrain.grass,
      pieceRotation: 0,
    }
  }
  return { boardPieces, boardHexes }
}

const board = makeBenchmarkBoard()

bench(
  'evaluate 2,000 Laur add-ons among 4,000 board pieces',
  () => {
    evaluateLaurAddonConflicts(board.boardPieces, board.boardHexes)
    const durations: number[] = []
    for (let run = 0; run < 5; run++) {
      const start = performance.now()
      evaluateLaurAddonConflicts(board.boardPieces, board.boardHexes)
      durations.push(performance.now() - start)
    }
    durations.sort((left, right) => left - right)
    console.log(`median of five runs: ${durations[2].toFixed(1)} ms`)
  },
  { iterations: 1, warmupIterations: 0 },
)
