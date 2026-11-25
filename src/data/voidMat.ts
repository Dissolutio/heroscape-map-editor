import type {
  BoardHexes,
  BoardPiece,
  BoardPieces,
  CubeCoordinate,
} from '../types'
import { HexTerrain } from '../types'
import { piecesSoFar } from './pieces'
import getPieceTemplateCoords from './rotationTransforms'

export const isVoidMatPieceID = (inventoryID: string) =>
  piecesSoFar[inventoryID]?.terrain === HexTerrain.voidMat

/** The full hexes a Void Mat or Marker occupies visually on the table. */
export function getVoidMatHexes(
  mat: Pick<BoardPiece, 'inventoryID' | 'pieceCoords' | 'rotation'>,
): CubeCoordinate[] {
  const piece = piecesSoFar[mat.inventoryID]
  if (!piece) return []
  return getPieceTemplateCoords({
    clickedHex: mat.pieceCoords,
    rotation: mat.rotation,
    template: piece.template,
    isVsTile: false,
  })
}

/**
 * The topmost Void Mat or Marker at a table hex, only when nothing else is
 * there, so a void piece never takes a click from a piece standing on it.
 */
export function findVoidMatAtTableHex(
  boardPieces: BoardPieces,
  boardHexes: BoardHexes,
  { q, r, s }: CubeCoordinate,
): BoardPiece | undefined {
  const isOccupied = Object.values(boardHexes).some(
    (hex) => hex.q === q && hex.r === r && Boolean(hex.boardPieceUID),
  )
  if (isOccupied) return undefined
  for (let index = boardPieces.length - 1; index >= 0; index -= 1) {
    const candidate = boardPieces[index]
    if (!isVoidMatPieceID(candidate.inventoryID)) continue
    if (
      getVoidMatHexes(candidate).some(
        (hex) => hex.q === q && hex.r === r && hex.s === s,
      )
    ) {
      return candidate
    }
  }
  return undefined
}
