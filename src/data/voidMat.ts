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

/** The 14 full hexes a Void Mat covers (its ring of half hexes is drawn only). */
export function getVoidMatHexes(mat: BoardPiece): CubeCoordinate[] {
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
 * The mat a click on a table hex selects: the topmost (last placed) mat
 * covering it, but only when nothing else is at that spot, so a mat never
 * takes a click from a piece standing on it.
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
