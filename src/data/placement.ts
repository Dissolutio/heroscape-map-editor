import type {
  BoardHex,
  BoardHexes,
  BoardPieces,
  CubeCoordinate,
  Piece,
} from '../types'
import { HexTerrain, PiecePrefixes, Pieces } from '../types'
import {
  canPlaceLandTileOnHex,
  isFluidTerrainHex,
  isLaurWallAddonPieceID,
  isSolidTerrainHex,
} from '../utils/board-utils'
import { HEXGRID_MAX_ALTITUDE } from '../utils/constants'
import { cubeToPixel } from '../utils/hex-utils'
import {
  genBoardHexID,
  getBattlementClickedHexCoords,
  getRoadWallClickedHexCoords,
} from '../utils/map-utils'
import { addPiece } from './addPiece'
import { type IgnoredPieceUIDs, toIgnoredPieceUIDSet } from './ignoredPieceUIDs'
import { piecesSoFar } from './pieces'
import {
  getLaurAddonAllowedRotations,
  getLaurAddonCanonicalKey,
  resolveLaurAddonEdge,
} from './laurAddonPlacement'
import {
  canLaurAddonStackOn,
  getLaurAddonStackAltitude,
} from './laurAddonStacking'
import {
  areMatchingLaurPillarShapes,
  getLaurPillarStackAltitude,
  isLaurPillarID,
} from './laurPillarStacking'
import getPieceTemplateCoords from './rotationTransforms'
import { getSmartPlacementAltitude } from './smartPlacement'
import { verticalObstructionTemplates } from './vertical-obstruction-templates'

/** The two pieces of state placement reads. */
export type PlacementBoard = {
  boardHexes: BoardHexes
  boardPieces: BoardPieces
}

/** Which of the click rules picked the placement, tried in this order. */
export type PlacementRule =
  | 'laurAddon' // a Laur add-on on any hovered surface
  | 'castleCap' // a castle wall or wall walk on a castle wall/arch top
  | 'battlement' // the edge toward the pen rotation, one level down
  | 'roadWall' // the edge two steps clockwise of it, one level down
  | 'ropeLadder' // the clicked hex, one level down
  | 'ladderStack' // a ladder on a ladder: one level up, same rotation
  | 'pillarStack' // a Laur pillar on a matching pillar: 9 up, same rotation
  | 'land' // a solid or fluid tile on a cap it can sit on
  | 'default' // anything else, on the clicked cap

export type PlacementBlockedReason =
  | 'notOnCastleWallTop' // only a castle wall or wall walk fits on one
  | 'castleArchNeedsLand' // an arch's bases are attached: not on a wall top
  | 'pillarShapesDiffer' // square and triangle pillars do not stack
  | 'offMap' // part of the footprint is outside the map
  | 'outOfHeight' // group member below ground or above the highest level
  | 'landTileNotOnHex' // canPlaceLandTileOnHex said no
  | 'notAHex' // the pointer handed over something that is not a hex
  | 'duplicateStartZone' // one start zone per support hex and altitude

/** What a refusal tells the user; a reason missing here is silent. */
export const LAUR_STACKABLE_VARIANT_UNAVAILABLE_MESSAGE =
  'Non-stackable Laur pieces cannot be stacked, and their stackable versions are not in your inventory.'

export const placementBlockedMessages: Partial<
  Record<PlacementBlockedReason, string>
> = {
  notOnCastleWallTop: 'Only a castle wall or wall walk fits on a castle wall.',
  castleArchNeedsLand: 'A castle arch has its own bases; place it on land.',
  pillarShapesDiffer: 'Triangle and square pillars do not stack.',
  offMap: 'That piece would hang off the edge of the map.',
  outOfHeight:
    'Some pieces would end up below the ground or above the highest level.',
  duplicateStartZone: 'A start zone is already on that hex.',
}

/**
 * What can go on top of a castle wall or arch: another wall (walls have no
 * base of their own; the base is a separate castle base piece) or a wall
 * walk. An arch has its pillars' bases attached, so it cannot.
 */
const fitsOnCastleWallTop = (piece: Piece) =>
  piece.id === Pieces.castleWallEnd ||
  piece.id === Pieces.castleWallStraight ||
  piece.id === Pieces.castleWallCorner ||
  piece.terrain === HexTerrain.wallWalk

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
 * Only the physical rules block (see PlacementBlockedReason). Everything
 * else resolves, even onto other pieces: placement is permissive and
 * displaces them (see evaluatePlacement).
 * `ignoreUID` leaves a piece being moved out of the smart altitude.
 */
export function resolvePlacement(
  piece: Piece,
  pointerHex: BoardHex,
  rotation: number,
  board: PlacementBoard,
  options: {
    ignoreUID?: IgnoredPieceUIDs
    deferOffMapCheck?: boolean
    worldPoint?: { x: number; z: number }
  } = {},
): PlacementResolution {
  // e.g. ShipBow used to hand over `{}`; there is nothing to place on
  if (typeof pointerHex?.pieceID !== 'string') return { blocked: 'notAHex' }
  const resolution = resolveByRule(piece, pointerHex, rotation, board, options)
  if (
    !isPlacementBlocked(resolution) &&
    !options.deferOffMapCheck &&
    hangsOffMap(board.boardHexes, resolution)
  ) {
    return { blocked: 'offMap' }
  }
  return resolution
}

/**
 * Whether any hex of the piece's footprint is outside the map. Every map
 * position has a table hex at altitude 0, and nothing removes those.
 * Battlements and road walls sit on an edge of the clicked hex, so only
 * that hex counts for them, and it is on the map: their stored coords are
 * the neighbour across that edge.
 */
export function hangsOffMap(
  boardHexes: BoardHexes,
  { piece, coords, rotation, rule }: ResolvedPlacement,
) {
  if (rule === 'battlement' || rule === 'roadWall') return false
  return isFootprintOffMap(
    (hex) => Boolean(boardHexes[genBoardHexID({ ...hex, altitude: 0 })]),
    { piece, coords, rotation },
  )
}

export function isFootprintOffMap(
  hasTableHex: (coords: CubeCoordinate) => boolean,
  {
    piece,
    coords,
    rotation,
  }: Pick<ResolvedPlacement, 'piece' | 'coords' | 'rotation'>,
) {
  return getPieceTemplateCoords({
    clickedHex: coords,
    rotation,
    template: piece.template,
    isVsTile: false,
  }).some((hex) => !hasTableHex(hex))
}

/** The click rules, in order; resolvePlacement adds the map-edge check. */
function resolveByRule(
  piece: Piece,
  pointerHex: BoardHex,
  rotation: number,
  { boardHexes, boardPieces }: PlacementBoard,
  {
    ignoreUID,
    worldPoint,
  }: {
    ignoreUID?: IgnoredPieceUIDs
    worldPoint?: { x: number; z: number }
  },
): PlacementResolution {
  const hex = pointerHex
  const isCastleWallArchClicked =
    hex.pieceID.includes(PiecePrefixes.castleWall) ||
    hex.pieceID.includes(PiecePrefixes.castleArch)
  const isLaurPillarClicked = isLaurPillarID(hex.inventoryID)
  const isMatchingPillarStackTarget = areMatchingLaurPillarShapes(
    piece.id,
    hex.inventoryID,
  )
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
      ignoreUID,
    })

  // Laur add-ons may be placed on any hovered surface; support is evaluated
  // separately and the hit surface determines their altitude.
  if (isLaurWallAddonPieceID(piece.id)) {
    const center = cubeToPixel(coords)
    const hoveredAddon = boardPieces.find(
      (boardPiece) => boardPiece.uid === hex.boardPieceUID,
    )
    const stackBase =
      hoveredAddon && canLaurAddonStackOn(piece.id, hoveredAddon.inventoryID)
        ? hoveredAddon
        : undefined
    const requestedRotation = stackBase?.rotation ?? rotation
    const edge = resolveLaurAddonEdge(
      coords,
      worldPoint ?? { x: center.x, z: center.y },
      requestedRotation,
      getLaurAddonAllowedRotations(piece.id, hex),
    )
    const resolvedRotation = edge?.rotation ?? requestedRotation
    const canStackOnHoveredAddon =
      stackBase &&
      getLaurAddonCanonicalKey(coords, resolvedRotation) ===
        getLaurAddonCanonicalKey(stackBase.pieceCoords, stackBase.rotation)
    return at(
      'laurAddon',
      canStackOnHoveredAddon
        ? getLaurAddonStackAltitude(stackBase.altitude)
        : clickedAltitude,
      resolvedRotation,
    )
  }
  // Castle W/A: use cap coords and altitude
  if (isCastleWallArchClicked) {
    if (
      piece.id === Pieces.castleArch ||
      piece.id === Pieces.castleArchNoDoor
    ) {
      return { blocked: 'castleArchNeedsLand' }
    }
    if (!fitsOnCastleWallTop(piece)) return { blocked: 'notOnCastleWallTop' }
    return at('castleCap', smartAltitude())
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
  if (isLaurPillarID(piece.id) && isLaurPillarClicked) {
    if (!isMatchingPillarStackTarget) return { blocked: 'pillarShapesDiffer' }
    const supportingPillar = boardPieces.find(
      (bp) => bp.uid === clickedHex.boardPieceUID,
    )
    const stackAltitude = getLaurPillarStackAltitude(
      supportingPillar?.altitude ?? clickedAltitude,
    )
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

/** Placement outcome; Laur support is reported separately from conflicts. */
export type PlacementStatus = 'ok' | 'conflict' | 'blocked'

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
 * Like getSmartPlacementAltitude, this probes only the footprint's columns,
 * placing strictly to check the rules, then permissively (as painting does)
 * to see what it displaces. It never replays the whole map.
 *
 * `ignoreUID` leaves one or more moving pieces out of the probe, so a drag
 * group does not conflict with its original positions.
 */
export function evaluatePlacement(
  board: PlacementBoard,
  resolution: PlacementResolution,
  {
    ignoreUID,
    checkHeightBounds = false,
  }: { ignoreUID?: IgnoredPieceUIDs; checkHeightBounds?: boolean } = {},
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
  if (hangsOffMap(board.boardHexes, resolution)) {
    return {
      status: 'blocked',
      displacedUIDs: [],
      footprintHexes,
      reason: 'offMap',
    }
  }
  const clearance = Math.max(
    piece.height,
    ...(verticalObstructionTemplates[piece.id] ?? []),
  )
  const minimumAltitude =
    resolution.rule === 'land' ||
    resolution.rule === 'battlement' ||
    resolution.rule === 'roadWall' ||
    resolution.rule === 'ropeLadder'
      ? -1
      : 0
  if (
    checkHeightBounds &&
    (altitude < minimumAltitude || altitude + clearance > HEXGRID_MAX_ALTITUDE)
  ) {
    return {
      status: 'blocked',
      displacedUIDs: [],
      footprintHexes,
      reason: 'outOfHeight',
    }
  }
  // addPiece reads the hexes at the placement altitude (support) and writes
  // at most a level up plus the piece's full clearance.
  const probeClearance = Math.max(1, clearance)
  const ignoredUIDs = toIgnoredPieceUIDSet(ignoreUID)
  const localHexes: BoardHexes = {}
  for (const hexCoords of footprint) {
    for (
      let level = altitude;
      level <= altitude + probeClearance + 2;
      level += 0.5
    ) {
      const id = genBoardHexID({ ...hexCoords, altitude: level })
      const hex = board.boardHexes[id]
      if (hex && !ignoredUIDs.has(hex.boardPieceUID ?? '')) {
        localHexes[id] = hex
      }
    }
  }
  const boardPieces = ignoredUIDs.size
    ? board.boardPieces.filter((bp) => !ignoredUIDs.has(bp.uid))
    : board.boardPieces
  if (
    piece.terrain === HexTerrain.startZone &&
    boardPieces.some((bp) => {
      const existingPiece = piecesSoFar[bp.inventoryID]
      return (
        existingPiece?.terrain === HexTerrain.startZone &&
        bp.altitude === altitude &&
        bp.pieceCoords.q === coords.q &&
        bp.pieceCoords.r === coords.r &&
        bp.pieceCoords.s === coords.s
      )
    })
  ) {
    return {
      status: 'blocked',
      displacedUIDs: [],
      footprintHexes,
      reason: 'duplicateStartZone',
    }
  }
  const args = {
    piece,
    pieceCoords: coords,
    placementAltitude: altitude,
    rotation,
    isVsTile: false,
    boardPieces,
    uid: PROBE_UID,
  }
  const strict = addPiece({ ...args, boardHexes: localHexes })
  const painted = addPiece({
    ...args,
    boardHexes: localHexes,
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
