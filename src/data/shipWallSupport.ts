import type {
  BoardHexes,
  BoardPiece,
  BoardPieces,
  CubeCoordinate,
} from '../types'
import { Pieces } from '../types'
import {
  getShipPlacementAltitude,
  isSolidTerrainHex,
} from '../utils/board-utils'
import { hexUtilsAdd, hexUtilsRotateAroundOrigin_000 } from '../utils/hex-utils'
import { genBoardHexID } from '../utils/map-utils'

/*
 Ship Wall support (physical rules, John 2026-11-12). Offsets are at rotation 0
 and rotate with the piece. The wall's template is main hexes 1-3 at
 q = 0, 1, 2 along the row (r = 0), the knub at q = 3, then the two notch
 hexes (1,-1,0) and (2,-1,-1), which block level 2 only.

 Each main hex i, at (i, 0, -i), has an interlock on its two north faces, so
 it faces its NW neighbor (i, -1, 1-i) and its NE neighbor (i+1, -1, -i). The
 knub has none. Together they face four interface hexes, the row just north:
   (0,-1,1)  (1,-1,0)  (2,-1,-1)  (3,-1,-2)
 The middle two are the notch hexes. The wall's range there starts at level
 2, so land at the wall's own level still counts.

 Counterweight (how much land sits behind the wall) is physics, not
 coordinates, so the app leaves it to the builders (John, 2026-11-12).

 The wall sits side by side with the land, at the same level, so "land" means
 a solid hex at the wall's own altitude. Fluid never counts. Nothing under the
 wall matters.
*/
export const SHIP_WALL_INTERFACE_OFFSETS: CubeCoordinate[] = [
  { q: 0, r: -1, s: 1 },
  { q: 1, r: -1, s: 0 },
  { q: 2, r: -1, s: -1 },
  { q: 3, r: -1, s: -2 },
]
/*
 Ship Bow: it always stands on its own, so there is no check and no warning.
 Interlock sides, recorded for a future "official rules" check:
 - template hexes 2 (basic2 east) and 4 (E of CUBE_EAST) each have interlocks
   on their two north faces, like the Ship Wall;
 - the origin hex has one interlock, toward its NE neighbor. That NE hex is
   also faced by interlocks from hexes 2, 3 (CUBE_NW) and 5 (NE of CUBE_NW).
*/

export type ShipWallSupport = {
  supported: boolean
  missingInterfaceHexes: CubeCoordinate[]
}

const place = (
  origin: CubeCoordinate,
  offset: CubeCoordinate,
  rotation: number,
): CubeCoordinate => {
  const { q, r, s } = hexUtilsAdd(
    origin,
    hexUtilsRotateAroundOrigin_000(offset, rotation),
  )
  // normalize -0 so coordinates compare and print cleanly
  return { q: q + 0, r: r + 0, s: s + 0 }
}

/** The wall's own hex altitude (one level above the altitude it is placed at). */
export const getShipWallLevel = (piece: Pick<BoardPiece, 'altitude'>) =>
  getShipPlacementAltitude(piece.altitude) + 1

const isLandAt = (
  boardHexes: BoardHexes,
  coords: CubeCoordinate,
  altitude: number,
) => {
  const hex = boardHexes[genBoardHexID({ ...coords, altitude })]
  return (
    hex !== undefined &&
    !hex.isVerticalClearanceHex &&
    isSolidTerrainHex(hex.terrain)
  )
}

const sameCoords = (a: CubeCoordinate, b: CubeCoordinate) =>
  a.q === b.q && a.r === b.r && a.s === b.s

export function evaluateShipWallSupport(
  piece: Pick<BoardPiece, 'altitude' | 'rotation' | 'pieceCoords'>,
  boardHexes: BoardHexes,
  // kept in the signature with the other support checks; hexes carry what we need
  _boardPieces?: BoardPieces,
): ShipWallSupport {
  const level = getShipWallLevel(piece)
  const rotation = piece.rotation
  const interfaceHexes = SHIP_WALL_INTERFACE_OFFSETS.map((o) =>
    place(piece.pieceCoords, o, rotation),
  )
  const connected = interfaceHexes.filter((c) => isLandAt(boardHexes, c, level))
  const missingInterfaceHexes = interfaceHexes.filter(
    (c) => !connected.some((k) => sameCoords(k, c)),
  )
  return {
    supported: missingInterfaceHexes.length === 0,
    missingInterfaceHexes,
  }
}

/** The amber readout lines for a Ship Wall that fails the check. */
export function getShipWallSupportReasons(support: ShipWallSupport): string[] {
  const reasons: string[] = []
  if (support.missingInterfaceHexes.length > 0) {
    reasons.push(
      `Ship Wall: ${support.missingInterfaceHexes.length} of ${SHIP_WALL_INTERFACE_OFFSETS.length} interlocks not connected to solid land`,
    )
  }
  return reasons
}

export function getUnsupportedShipWallUIDs(board: {
  boardHexes: BoardHexes
  boardPieces: BoardPieces
}): string[] {
  const unsupported: string[] = []
  for (const piece of board.boardPieces) {
    if (piece.inventoryID !== Pieces.shipWall) continue
    if (!evaluateShipWallSupport(piece, board.boardHexes).supported) {
      unsupported.push(piece.uid)
    }
  }
  return unsupported
}
