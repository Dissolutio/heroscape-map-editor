import type {
  BoardHex,
  BoardHexes,
  BoardPiece,
  BoardPieces,
  CubeCoordinate,
} from '../types'
import { HexTerrain } from '../types'
import { getShipPlacementAltitude, isShipPieceID } from '../utils/board-utils'
import { hexUtilsAdd, hexUtilsRotateAroundOrigin_000 } from '../utils/hex-utils'
import { genBoardHexID } from '../utils/map-utils'
import { SHIP_NOTCH_OFFSETS } from './tileTemplates'

/*
 Ship decks (John, 2026-11-12). Both ships have 2 hexes of decking at level 7
 (level 1 is the ship's own level): the ship's two notch hexes, CUBE_NE of the
 origin and CUBE_EAST of that one, rotated with the piece. Land attaches there,
 so a land tile whose bottom is on a deck is supported by the ship.

 Ships sit at a full level (getShipPlacementAltitude), so the deck does too,
 even when the 3D Ship Bow rests half a level lower on a single fluid tile
 (getShipBowRestOffset is visual only).
*/
export const SHIP_DECK_LEVEL = 7

export type ShipDeckSection = 'forward' | 'aft'

export type ShipDeckHex = CubeCoordinate & {
  /** The altitude land is placed at to sit on the deck: the top of level 6. */
  altitude: number
}

/**
 * A ship's two deck hexes: forward is CUBE_NE of the origin, aft is east of
 * that one (rotated with the piece). `altitude` is the placement altitude of
 * land on the deck, so the land's own hex is at the ship's level 7.
 */
export function getShipDeckHexes(
  bp: Pick<BoardPiece, 'altitude' | 'rotation' | 'pieceCoords'>,
): Record<ShipDeckSection, ShipDeckHex> {
  // the ship's level 1 is at getShipPlacementAltitude + 1
  const altitude = getShipPlacementAltitude(bp.altitude) + SHIP_DECK_LEVEL - 1
  const at = (offset: CubeCoordinate): ShipDeckHex => {
    const { q, r, s } = hexUtilsAdd(
      bp.pieceCoords,
      hexUtilsRotateAroundOrigin_000(offset, bp.rotation),
    )
    // normalize -0 so coordinates compare and print cleanly
    return { q: q + 0, r: r + 0, s: s + 0, altitude }
  }
  return {
    forward: at(SHIP_NOTCH_OFFSETS[0]),
    aft: at(SHIP_NOTCH_OFFSETS[1]),
  }
}

/** The hex IDs land is placed on to sit on a ship deck, over all ships. */
export function getShipDeckHexIDs(boardPieces: BoardPieces): Set<string> {
  const ids = new Set<string>()
  for (const bp of boardPieces) {
    if (!isShipPieceID(bp.inventoryID)) continue
    const { forward, aft } = getShipDeckHexes(bp)
    ids.add(genBoardHexID(forward))
    ids.add(genBoardHexID(aft))
  }
  return ids
}

/**
 * The hex a click on a ship's deck section hands the click handler: the
 * section's hex at the deck altitude, so land built there sits at level 7.
 * The ship's own clearance hex at that key (the Ship Bow's notch range reaches
 * level 6) is not something to build on, so it is passed over like an empty
 * key: a minimal empty hex stands in. Any other piece's hex there is handed
 * over as it is.
 */
export function getShipDeckPointerHex(
  bp: Pick<BoardPiece, 'uid' | 'altitude' | 'rotation' | 'pieceCoords'>,
  section: ShipDeckSection,
  boardHexes: BoardHexes,
): BoardHex {
  const deckHex = getShipDeckHexes(bp)[section]
  const existing = boardHexes[genBoardHexID(deckHex)]
  if (existing && existing.boardPieceUID !== bp.uid) return existing
  return {
    ...deckHex,
    id: genBoardHexID(deckHex),
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
