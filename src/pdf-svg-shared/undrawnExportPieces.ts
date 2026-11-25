import type { BoardHexes, BoardPieces } from '../types'

const UNDRAWN_EXPORT_PIECE_IDS: ReadonlySet<string> = new Set()

export const isUndrawnExportPieceID = (inventoryID: string) =>
  UNDRAWN_EXPORT_PIECE_IDS.has(inventoryID)

/**
 * The board without the undrawn pieces and their hexes. Returns the same
 * objects when there are none, so memoized renders are not invalidated.
 */
export function withoutUndrawnExportPieces(
  boardHexes: BoardHexes,
  boardPieces: BoardPieces,
): { boardHexes: BoardHexes; boardPieces: BoardPieces } {
  if (!boardPieces.some((bp) => isUndrawnExportPieceID(bp.inventoryID))) {
    return { boardHexes, boardPieces }
  }
  return {
    boardHexes: Object.fromEntries(
      Object.entries(boardHexes).filter(
        ([, hex]) => !isUndrawnExportPieceID(hex.inventoryID),
      ),
    ),
    boardPieces: boardPieces.filter(
      (bp) => !isUndrawnExportPieceID(bp.inventoryID),
    ),
  }
}
