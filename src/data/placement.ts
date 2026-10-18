import type {
  BoardHex,
  BoardHexes,
  BoardPieces,
  CubeCoordinate,
  Piece,
} from '../types'
import { PiecePrefixes, Pieces } from '../types'
import {
  canPlaceLandTileOnHex,
  isFluidTerrainHex,
  isLaurWallAddonPieceID,
  isSolidTerrainHex,
} from '../utils/board-utils'
import {
  genBoardHexID,
  getBattlementClickedHexCoords,
  getRoadWallClickedHexCoords,
} from '../utils/map-utils'
import { addPiece } from './addPiece'
import getPieceTemplateCoords from './rotationTransforms'
import { getSmartPlacementAltitude } from './smartPlacement'
import { verticalObstructionTemplates } from './vertical-obstruction-templates'

/** The two pieces of state placement reads. */
export type PlacementBoard = {
  boardHexes: BoardHexes
  boardPieces: BoardPieces
}

/**
 * Which of the click rules picked the placement. The rules are tried in this
 * order, so e.g. a battlement clicked on a castle wall takes `castleCap`.
 */
export type PlacementRule =
  | 'castleCap' // clicked a castle wall/arch: go on top of its column
  | 'laurAddon' // a Laur add-on on a pillar, at the pillar's altitude
  | 'battlement' // the edge toward the pen rotation, one level down
  | 'roadWall' // the edge two steps clockwise of it, one level down
  | 'ropeLadder' // the clicked hex, one level down
  | 'ladderStack' // a ladder on a ladder: one level up, same rotation
  | 'pillarStack' // a Laur pillar on a matching pillar: 9 up, same rotation
  | 'land' // a solid or fluid tile on a cap it can sit on
  | 'default' // anything else, on the clicked cap

export type PlacementBlockedReason =
  | 'needsLaurPillar' // a Laur add-on clicked off a Square/Triangle Pillar
  | 'landTileNotOnHex' // canPlaceLandTileOnHex said no

export type ResolvedPlacement = {
  piece: Piece
  coords: CubeCoordinate
  altitude: number
  rotation: number
  rule: PlacementRule
}

export type PlacementResolution =
  | ResolvedPlacement
  | { blocked: PlacementBlockedReason }

export const isPlacementBlocked = (
  resolution: PlacementResolution,
): resolution is { blocked: PlacementBlockedReason } => 'blocked' in resolution

/**
 * Where a piece goes when the pointer is on `pointerHex`: the coordinates,
 * altitude and rotation to hand addPiece, or why it cannot go there at all.
 *
 * `pointerHex` is whatever the mesh under the pointer passes the click
 * handler: a board hex for caps, castle walls and arches, and a partial hex
 * for Laur pillars and ladders (see LaurPillar.tsx and Ladder.tsx).
 *
 * Only the two refusals block. Everything else resolves, even onto other
 * pieces: placement is permissive and displaces them (see evaluatePlacement).
 */
export function resolvePlacement(
  piece: Piece,
  pointerHex: BoardHex,
  rotation: number,
  { boardHexes, boardPieces }: PlacementBoard,
): PlacementResolution {
  const hex = pointerHex
  const isCastleWallArchClicked =
    hex.pieceID.includes(PiecePrefixes.castleWall) ||
    hex.pieceID.includes(PiecePrefixes.castleArch)
  const isLaurPillarClicked =
    hex.inventoryID === Pieces.laurWallSquarePillar ||
    hex.inventoryID === Pieces.laurWallTrianglePillar
  const isMatchingPillarStackTarget =
    (piece.id === Pieces.laurWallSquarePillar &&
      hex.inventoryID === Pieces.laurWallSquarePillar) ||
    (piece.id === Pieces.laurWallTrianglePillar &&
      hex.inventoryID === Pieces.laurWallTrianglePillar)
  // for wall-walk pieces, if we clicked a wall or arch cap, then the clicked hex needs to be computed
  const clickedHex = isCastleWallArchClicked
    ? boardHexes[
        genBoardHexID({
          ...hex,
          altitude: hex.altitude + (hex?.obstacleHeight ?? 0),
        })
      ]
    : hex
  const coords = { q: clickedHex.q, r: clickedHex.r, s: clickedHex.s }
  const clickedAltitude = clickedHex.altitude
  const at = (
    rule: PlacementRule,
    altitude: number,
    placedRotation = rotation,
    placedCoords = coords,
  ): ResolvedPlacement => ({
    piece,
    coords: placedCoords,
    altitude,
    rotation: placedRotation,
    rule,
  })
  const smartAltitude = () =>
    getSmartPlacementAltitude({
      boardHexes,
      piece,
      pieceCoords: coords,
      altitude: clickedAltitude,
      rotation,
    })

  // Castle W/A: use cap coords and altitude
  if (isCastleWallArchClicked) {
    return at('castleCap', smartAltitude())
  }
  // Adding laur addon, put it at same level
  if (isLaurWallAddonPieceID(piece.id)) {
    if (!isLaurPillarClicked) return { blocked: 'needsLaurPillar' }
    return at('laurAddon', clickedAltitude)
  }
  if (piece.id === Pieces.battlement) {
    const mirrorRotation = (rotation + 3) % 6
    return at(
      'battlement',
      clickedAltitude - 1,
      mirrorRotation,
      getBattlementClickedHexCoords(clickedHex, rotation),
    )
  }
  if (piece.id === Pieces.roadWall) {
    return at(
      'roadWall',
      clickedAltitude - 1,
      rotation,
      getRoadWallClickedHexCoords(clickedHex, rotation),
    )
  }
  if (piece.id === Pieces.ropeLadder) {
    return at('ropeLadder', clickedAltitude - 1)
  }
  if (piece.id === Pieces.ladder && hex?.inventoryID === Pieces.ladder) {
    return at('ladderStack', clickedAltitude + 1, clickedHex.pieceRotation)
  }
  if (isMatchingPillarStackTarget && isLaurPillarClicked) {
    const supportingPillar = boardPieces.find(
      (bp) => bp.uid === clickedHex.boardPieceUID,
    )
    const stackAltitude = (supportingPillar?.altitude ?? clickedAltitude) + 9
    return at('pillarStack', stackAltitude, clickedHex.pieceRotation)
  }
  // LAND TILE: solid or fluid (includes ship bow buildable sections). Gated so solid
  // can't land on a half-level fluid cap, and both must target a hoverable land hex.
  if (isSolidTerrainHex(piece.terrain) || isFluidTerrainHex(piece.terrain)) {
    if (!canPlaceLandTileOnHex(piece.terrain, hex.terrain, hex.altitude)) {
      return { blocked: 'landTileNotOnHex' }
    }
    return at('land', smartAltitude())
  }
  return at('default', smartAltitude())
}

export type PlacementStatus = 'ok' | 'conflict' | 'blocked'
// A future 'unsupported' (placed, but nothing physically holds it up) belongs
// here; today strict support failures count as 'conflict'.

export type PlacementEvaluation = {
  /**
   * ok: goes in cleanly. conflict: still goes in (placement is permissive)
   * but displaces pieces or breaks a placement rule. blocked: a click does
   * nothing.
   */
  status: PlacementStatus
  /** Pieces whose hexes the placement would overwrite. */
  displacedUIDs: string[]
  /** The piece's template hexes at the placement altitude. */
  footprintHexes: (CubeCoordinate & { altitude: number })[]
  reason?: string
}

const PROBE_UID = 'placement-probe'

/**
 * What placing `resolution` would do to `board`, without changing it.
 *
 * Like getSmartPlacementAltitude, this probes only the footprint's columns:
 * it copies that slice (addPiece edits the hex objects it is given), places
 * strictly to check the rules, then permissively (as painting does) to see
 * what it displaces. It never replays the whole map.
 *
 * `ignoreUID` leaves a piece out of the probe, so a piece being moved does
 * not conflict with where it is now.
 */
export function evaluatePlacement(
  board: PlacementBoard,
  resolution: PlacementResolution,
  { ignoreUID }: { ignoreUID?: string } = {},
): PlacementEvaluation {
  if (isPlacementBlocked(resolution)) {
    return {
      status: 'blocked',
      displacedUIDs: [],
      footprintHexes: [],
      reason: resolution.blocked,
    }
  }
  const { piece, coords, altitude, rotation } = resolution
  const footprint = getPieceTemplateCoords({
    clickedHex: coords,
    rotation,
    template: piece.template,
    isVsTile: false,
  })
  const footprintHexes = footprint.map((hex) => ({ ...hex, altitude }))
  // addPiece reads the hexes at the placement altitude (support) and writes
  // at most a level up plus the piece's full clearance.
  const clearance = Math.max(
    1,
    piece.height,
    ...(verticalObstructionTemplates[piece.id] ?? []),
  )
  const localHexes: BoardHexes = {}
  for (const hexCoords of footprint) {
    for (
      let level = altitude;
      level <= altitude + clearance + 2;
      level += 0.5
    ) {
      const id = genBoardHexID({ ...hexCoords, altitude: level })
      const hex = board.boardHexes[id]
      if (hex && (!ignoreUID || hex.boardPieceUID !== ignoreUID)) {
        localHexes[id] = hex
      }
    }
  }
  const boardPieces = ignoreUID
    ? board.boardPieces.filter((bp) => bp.uid !== ignoreUID)
    : board.boardPieces
  const args = {
    piece,
    pieceCoords: coords,
    placementAltitude: altitude,
    rotation,
    isVsTile: false,
    boardPieces,
    uid: PROBE_UID,
  }
  const strict = addPiece({ ...args, boardHexes: structuredClone(localHexes) })
  const painted = addPiece({
    ...args,
    boardHexes: structuredClone(localHexes),
    permissive: true,
  })
  const displacedUIDs = painted.displacedUIDs ?? []
  const result = (status: PlacementStatus, reason?: string) => ({
    status,
    displacedUIDs,
    footprintHexes,
    ...(reason ? { reason } : {}),
  })
  if (painted.error) return result('conflict', painted.error.message)
  // e.g. a second start zone on the same hex: painting it does nothing
  if (!painted.newBoardPieces.some((bp) => bp.uid === PROBE_UID)) {
    return result('blocked', 'Nothing would be placed')
  }
  if (displacedUIDs.length > 0) {
    return result('conflict', 'Overlaps other pieces')
  }
  if (strict.error) return result('conflict', strict.error.message)
  return result('ok')
}
