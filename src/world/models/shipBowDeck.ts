import type { BoardHex, BoardHexes, BoardPiece } from '../../types'
import { HexTerrain } from '../../types'
import { hexUtilsGetShipBuildableCoords } from '../../utils/hex-utils'
import { genBoardHexID } from '../../utils/map-utils'
import type { DeckSection } from './shipDeckColor'

/**
 * The hex a click on a Ship Bow deck section hands the click handler: the
 * section's hex at the bow's altitude + 6 (level 6 of the bow, so land built
 * there sits at level 7, the upper deck). The deck sections are the bow's two
 * notch hexes. The bow's own notch clearance hex at that key is not something
 * to build on, so it is passed over like an empty key: a minimal empty hex
 * stands in, as before the notch hexes existed. Any other piece's hex there is
 * handed over as it is.
 */
export function getShipBowDeckPointerHex(
  bp: Pick<BoardPiece, 'uid' | 'altitude' | 'rotation' | 'pieceCoords'>,
  section: DeckSection,
  boardHexes: BoardHexes,
): BoardHex {
  const coords = hexUtilsGetShipBuildableCoords(bp.pieceCoords, bp.rotation)[
    section
  ]
  const altitude = bp.altitude + 6
  const existing = boardHexes[genBoardHexID({ ...coords, altitude })]
  if (existing && existing.boardPieceUID !== bp.uid) return existing
  return {
    ...coords,
    altitude,
    boardPieceUID: '',
    inventoryID: '',
    pieceID: '',
    pieceRotation: 0,
    terrain: HexTerrain.empty,
    isCap: false,
    isObstacleOrigin: false,
    isObstacleAuxiliary: false,
  } as BoardHex
}
