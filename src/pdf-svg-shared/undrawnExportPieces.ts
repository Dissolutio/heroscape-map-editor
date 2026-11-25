import type { BoardHexes, BoardPieces } from '../types'
import { Pieces } from '../types'

/**
 * Pieces the 2D view, SVG and PDF exports (and their piece keys) do not draw
 * yet. Void and Pylons gets its 2D symbols in a later phase (John's SVGs in
 * assets-src/void-and-pylons/); until then these are left out rather than
 * drawn wrongly. Remove an id here when its symbol lands.
 */
const UNDRAWN_EXPORT_PIECE_IDS: ReadonlySet<string> = new Set([
  Pieces.voidMat,
  Pieces.twoWayPylon,
  Pieces.threeWayPylon,
  Pieces.deflectorShield,
])

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
