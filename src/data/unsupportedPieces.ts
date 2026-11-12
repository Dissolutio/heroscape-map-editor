import type { BoardHexes, BoardPieces } from '../types'
import { getUnsupportedLaurAddonUIDs } from './laurAddonSupport'
import { getUnsupportedShipWallUIDs } from './shipWallSupport'

/**
 * The derived (never saved) amber set: Laur add-ons missing pillar ports and
 * Ship Walls whose interlocks or counterweight are not on solid land. The
 * Ship Bow stands on its own and is never listed.
 *
 * Only Ship Walls are looked at for the ship check, and each reads at most
 * nine hexes by id, so there is no map scan to keep incremental.
 */
export function getUnsupportedPieceUIDs(board: {
  boardHexes: BoardHexes
  boardPieces: BoardPieces
}): string[] {
  return [
    ...getUnsupportedLaurAddonUIDs(board),
    ...getUnsupportedShipWallUIDs(board),
  ]
}
