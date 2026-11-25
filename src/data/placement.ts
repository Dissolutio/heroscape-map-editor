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
import {
  getLaurAddonAllowedRotations,
  getLaurAddonFeatureId,
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
import { piecesSoFar } from './pieces'
import { isPortAddonPieceID } from './portPieces'
import getPieceTemplateCoords from './rotationTransforms'
import {
  getDefaultSeatedBasePlacements,
  getExistingSeatedBases,
  getSeatedObstacleDefinition,
} from './seatedObstacles'
import { getSmartPlacementAltitude } from './smartPlacement'
import { getTemplateTopLevel } from './vertical-obstruction-templates'
import { type HexEdgeId, edgeIdFromHex } from './hexGrid/edgesAndNodes'
import { getEdgeNodePieceColumns } from './hexGrid/pieceCells'

/** The two pieces of state placement reads. */
export type PlacementBoard = {
  boardHexes: BoardHexes
  boardPieces: BoardPieces
  setsUsed?: readonly string[]
}

/** Which of the click rules picked the placement, tried in this order. */
export type PlacementRule =
  | 'laurAddon' // a port add-on (Laur, Deflector Shield) on any surface
  | 'voidMat' // a Void Mat: always on the table, level 0
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
  edgeId?: HexEdgeId
}

export type PlacementResolution =
  | ResolvedPlacement
  | { blocked: PlacementBlockedReason }

export type PlacementPlan = {
  resolution: PlacementResolution
  automaticBases?: ResolvedPlacement[]
}

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
    edgeId?: HexEdgeId
  } = {},
): PlacementResolution {
  // e.g. ShipBow used to hand over `{}`; there is nothing to place on
  if (typeof pointerHex?.pieceID !== 'string') return { blocked: 'notAHex' }
  const isEdgePiece =
    piece.id === Pieces.battlement ||
    piece.id === Pieces.roadWall ||
    piece.id === Pieces.ropeLadder
  const edgeId = isEdgePiece
    ? (options.edgeId ?? edgeIdFromHex(pointerHex, rotation))
    : undefined
  const edgeIndex = edgeId
    ? Array.from({ length: 6 }, (_, index) => index).find(
        (index) => edgeIdFromHex(pointerHex, index) === edgeId,
      )
    : undefined
  if (edgeId && edgeIndex === undefined) return { blocked: 'notAHex' }
  const resolution = resolveByRule(
    piece,
    pointerHex,
    edgeIndex ?? rotation,
    board,
    { ...options, edgeId },
  )
  if (
    !isPlacementBlocked(resolution) &&
    !options.deferOffMapCheck &&
    hangsOffMap(board.boardHexes, resolution)
  ) {
    return { blocked: 'offMap' }
  }
  return resolution
}

export function resolvePlacementPlan(
  piece: Piece,
  pointerHex: BoardHex,
  rotation: number,
  board: PlacementBoard,
  options: {
    ignoreUID?: IgnoredPieceUIDs
    deferOffMapCheck?: boolean
    worldPoint?: { x: number; z: number }
    edgeId?: HexEdgeId
  } = {},
): PlacementPlan {
  const definition = getSeatedObstacleDefinition(piece.id, board.setsUsed)
  if (!definition) {
    return {
      resolution: resolvePlacement(piece, pointerHex, rotation, board, options),
    }
  }

  const clickedBase = board.boardPieces.find(
    (boardPiece) =>
      boardPiece.uid === pointerHex.boardPieceUID &&
      definition.allowedBaseIDs.includes(boardPiece.inventoryID),
  )
  const initialResolution = resolvePlacement(
    piece,
    pointerHex,
    rotation,
    board,
    options,
  )
  if (isPlacementBlocked(initialResolution)) {
    return { resolution: initialResolution }
  }
  const coords =
    clickedBase &&
    (definition.baseFootprint === 'six-hex' ||
      definition.baseFootprint === 'same-size')
      ? clickedBase.pieceCoords
      : initialResolution.coords
  const layouts = getDefaultSeatedBasePlacements(
    piece.id,
    coords,
    rotation,
    board.setsUsed,
  )
  const existingBases = getExistingSeatedBases(
    piece.id,
    coords,
    rotation,
    board.boardHexes,
    board.boardPieces,
    board.setsUsed,
  )
  const missingLayouts = layouts.filter(
    (layout) =>
      !existingBases.some(({ boardPiece }) => {
        if (!definition.allowedBaseIDs.includes(boardPiece.inventoryID)) {
          return false
        }
        if (definition.baseFootprint === 'one-per-hex') {
          return (
            boardPiece.pieceCoords.q === layout.coords.q &&
            boardPiece.pieceCoords.r === layout.coords.r &&
            boardPiece.pieceCoords.s === layout.coords.s
          )
        }
        return true
      }),
  )
  const basePiece = layouts[0]?.piece
  if (!basePiece) return { resolution: initialResolution }

  const baseResolution = resolvePlacement(
    basePiece,
    pointerHex,
    rotation,
    board,
    options,
  )
  if (isPlacementBlocked(baseResolution) && !existingBases.length) {
    return { resolution: baseResolution }
  }
  const baseAltitude =
    existingBases[0]?.boardPiece.altitude ??
    (isPlacementBlocked(baseResolution) ? 0 : baseResolution.altitude)
  const automaticBases: ResolvedPlacement[] = missingLayouts.map((layout) => ({
    piece: layout.piece,
    coords: layout.coords,
    altitude: baseAltitude,
    rotation: layout.rotation,
    rule: 'land',
  }))

  let resolutionBoard = board
  let simulatedHexes = board.boardHexes
  let simulatedPieces = board.boardPieces
  for (const [index, automaticBase] of automaticBases.entries()) {
    const baseResult = addPiece({
      piece: automaticBase.piece,
      boardHexes: simulatedHexes,
      boardPieces: simulatedPieces,
      pieceCoords: automaticBase.coords,
      placementAltitude: automaticBase.altitude,
      rotation: automaticBase.rotation,
      isVsTile: false,
      uid: `${PROBE_UID}-base-${index}`,
      permissive: true,
    })
    simulatedHexes = baseResult.newBoardHexes
    simulatedPieces = baseResult.newBoardPieces
  }
  if (automaticBases.length) {
    resolutionBoard = {
      ...board,
      boardHexes: simulatedHexes,
      boardPieces: simulatedPieces,
    }
  }

  let supportHex: BoardHex | undefined
  if (existingBases.length) {
    const existingBase = existingBases[0]
    const baseHex = existingBase
      ? Object.values(board.boardHexes).find(
          (hex) =>
            hex.boardPieceUID === existingBase.boardPiece.uid &&
            hex.altitude === existingBase.surfaceAltitude,
        )
      : undefined
    if (baseHex && existingBase) {
      supportHex = {
        ...baseHex,
        ...coords,
        id: genBoardHexID({
          ...coords,
          altitude: existingBase.surfaceAltitude,
        }),
      }
    }
  }
  if (!supportHex && automaticBases.length) {
    supportHex = Object.values(simulatedHexes).find(
      (hex) =>
        hex.boardPieceUID === `${PROBE_UID}-base-0` &&
        hex.q === coords.q &&
        hex.r === coords.r &&
        hex.s === coords.s,
    )
  }

  const resolution = supportHex
    ? resolvePlacement(piece, supportHex, rotation, resolutionBoard, options)
    : initialResolution
  return {
    resolution,
    ...(automaticBases.length ? { automaticBases } : {}),
  }
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
  {
    piece,
    coords,
    rotation,
  }: Pick<ResolvedPlacement, 'piece' | 'coords' | 'rotation'>,
) {
  if (piece.id === Pieces.battlement || piece.id === Pieces.roadWall) {
    return false
  }
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
    edgeId,
  }: {
    ignoreUID?: IgnoredPieceUIDs
    worldPoint?: { x: number; z: number }
    edgeId?: HexEdgeId
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
  // The hex above a wall or arch cap can be missing (for example at the top
  // of the map); treat that as no hex instead of crashing the preview.
  if (!clickedHex) return { blocked: 'notAHex' }
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
    ...(edgeId === undefined ? {} : { edgeId }),
  })
  const smartAltitude = () =>
    getSmartPlacementAltitude({
      boardHexes,
      boardPieces,
      piece,
      pieceCoords: coords,
      altitude: clickedAltitude,
      rotation,
      ignoreUID,
    })

  // Laur add-ons may be placed on any hovered surface; support is evaluated
  // separately and the hit surface determines their altitude.
  if (isPortAddonPieceID(piece.id)) {
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
      edge?.featureId ===
        getLaurAddonFeatureId(stackBase.pieceCoords, stackBase.rotation)
    return at(
      'laurAddon',
      canStackOnHoveredAddon
        ? getLaurAddonStackAltitude(stackBase.altitude)
        : clickedAltitude,
      resolvedRotation,
    )
  }
  // Void Mat: printed paper, always flat on the table (level 0) wherever the
  // pointer is; it fills no cells.
  if (piece.terrain === HexTerrain.voidMat) {
    return at('voidMat', 0, rotation, { q: hex.q, r: hex.r, s: hex.s })
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
  const clearance = Math.max(piece.height, getTemplateTopLevel(piece.id))
  const minimumAltitude = resolution.edgeId ? -1 : 0
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
  // A wall's edges and nodes also border hexes outside its template.
  const probeColumns = [
    ...footprint,
    ...getEdgeNodePieceColumns({
      inventoryID: piece.id,
      pieceCoords: coords,
      rotation,
      altitude,
    }),
  ]
  for (const hexCoords of probeColumns) {
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

export function evaluatePlacementPlan(
  board: PlacementBoard,
  plan: PlacementPlan,
): PlacementEvaluation {
  if (!plan.automaticBases?.length) {
    return evaluatePlacement(board, plan.resolution)
  }

  let workingBoard = board
  let hasConflict = false
  const displacedUIDs = new Set<string>()
  const footprintHexes: PlacementEvaluation['footprintHexes'] = []
  let reason: string | undefined
  for (const [index, automaticBase] of plan.automaticBases.entries()) {
    const baseEvaluation = evaluatePlacement(workingBoard, automaticBase)
    footprintHexes.push(...baseEvaluation.footprintHexes)
    if (baseEvaluation.status === 'blocked') {
      return {
        ...baseEvaluation,
        footprintHexes: [
          ...footprintHexes,
          ...evaluatePlacement(board, plan.resolution).footprintHexes,
        ],
      }
    }
    hasConflict ||= baseEvaluation.status === 'conflict'
    for (const uid of baseEvaluation.displacedUIDs) displacedUIDs.add(uid)
    const baseResult = addPiece({
      piece: automaticBase.piece,
      boardHexes: workingBoard.boardHexes,
      boardPieces: workingBoard.boardPieces,
      pieceCoords: automaticBase.coords,
      placementAltitude: automaticBase.altitude,
      rotation: automaticBase.rotation,
      isVsTile: false,
      uid: `${PROBE_UID}-base-${index}`,
      permissive: true,
    })
    if (baseResult.error) {
      hasConflict = true
      reason ??= baseResult.error.message
    }
    workingBoard = {
      ...workingBoard,
      boardHexes: baseResult.newBoardHexes,
      boardPieces: baseResult.newBoardPieces,
    }
  }
  const placementEvaluation = evaluatePlacement(workingBoard, plan.resolution)
  footprintHexes.push(...placementEvaluation.footprintHexes)
  for (const uid of placementEvaluation.displacedUIDs) displacedUIDs.add(uid)
  if (placementEvaluation.status === 'blocked') {
    return {
      ...placementEvaluation,
      footprintHexes,
      displacedUIDs: [...displacedUIDs],
    }
  }
  hasConflict ||= placementEvaluation.status === 'conflict'
  return {
    status: hasConflict ? 'conflict' : 'ok',
    displacedUIDs: [...displacedUIDs],
    footprintHexes,
    reason: placementEvaluation.reason ?? reason,
  }
}
