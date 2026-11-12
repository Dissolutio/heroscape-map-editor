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
 and rotate with the piece. The wall is `straight4`: main hexes 1-3 at
 q = 0, 1, 2 along the row (r = 0), then the knub at q = 3.

 Each main hex i, at (i, 0, -i), has an interlock on its two north faces, so
 it faces its NW neighbor (i, -1, 1-i) and its NE neighbor (i+1, -1, -i). The
 knub has none. Together they face four interface hexes, the row just north:
   (0,-1,1)  (1,-1,0)  (2,-1,-1)  (3,-1,-2)

 Counterweight candidates are the next row out (r = -2): every hex north of an
 interface hex, at NW (q, -2, 2-q) and NE (q+1, -2, 1-q), five hexes:
   (0,-2,2) (1,-2,1) (2,-2,0) (3,-2,-1) (4,-2,-2)
 A candidate only counts if it is solid land on the wall's level and touches
 an interface hex that is itself solid land (it is connected to them).

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
export const SHIP_WALL_COUNTERWEIGHT_OFFSETS: CubeCoordinate[] = [
  { q: 0, r: -2, s: 2 },
  { q: 1, r: -2, s: 1 },
  { q: 2, r: -2, s: 0 },
  { q: 3, r: -2, s: -1 },
  { q: 4, r: -2, s: -2 },
]
export const SHIP_WALL_COUNTERWEIGHT_REQUIRED = 2

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
  counterweightCount: number
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
const areNeighbors = (a: CubeCoordinate, b: CubeCoordinate) =>
  Math.max(Math.abs(a.q - b.q), Math.abs(a.r - b.r), Math.abs(a.s - b.s)) === 1

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
  const counterweightCount = SHIP_WALL_COUNTERWEIGHT_OFFSETS.map((o) =>
    place(piece.pieceCoords, o, rotation),
  ).filter(
    (c) =>
      isLandAt(boardHexes, c, level) &&
      connected.some((k) => areNeighbors(k, c)),
  ).length
  return {
    supported:
      missingInterfaceHexes.length === 0 &&
      counterweightCount >= SHIP_WALL_COUNTERWEIGHT_REQUIRED,
    missingInterfaceHexes,
    counterweightCount,
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
  if (support.counterweightCount < SHIP_WALL_COUNTERWEIGHT_REQUIRED) {
    reasons.push(
      `Ship Wall: needs ${SHIP_WALL_COUNTERWEIGHT_REQUIRED - support.counterweightCount} more land hexes behind the interlocks for counterweight (has ${support.counterweightCount})`,
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
