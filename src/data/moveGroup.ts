/**
 * Pure connected-piece grouping seam. The current geometry is derived from
 * Laur wall models and placement rules; edges-and-nodes work can replace the
 * family helpers without changing these small consumer-facing functions.
 */
import type { BoardHex, BoardHexes, BoardPiece, CubeCoordinate } from '../types'
import { Pieces } from '../types'
import {
  hexUtilsAdd,
  hexUtilsGetNeighborForRotation,
  hexUtilsGetRadialFarNeighborForRotation,
} from '../utils/hex-utils'

type MoveGroupBoard = {
  boardPieces: BoardPiece[]
  boardHexes: BoardHexes
}

type MoveGroup = {
  uids: string[]
  anchorUid: string
}

const LAUR_PILLARS = new Set<string>([
  Pieces.laurWallSquarePillar,
  Pieces.laurWallPillarStackable,
  Pieces.laurWallTrianglePillar,
])

const SHORT_WALLS = new Set<string>([
  Pieces.laurWallShort,
  Pieces.laurWallShortStackable,
])

const LONG_WALLS = new Set<string>([
  Pieces.laurWallLong,
  Pieces.laurWallLongStackable,
])

const LAUR_ARCHES = new Set<string>([Pieces.laurWallArch])

const LAUR_RUINS = new Set<string>([
  Pieces.laurWallRuin1,
  Pieces.laurWallRuin2,
  Pieces.laurWallRuin3,
])

const coordKey = ({ q, r, s }: CubeCoordinate) => `${q},${r},${s}`

const coordAltitudeKey = (coords: CubeCoordinate, altitude: number) =>
  `${coordKey(coords)}@${altitude}`

const normalizeRotation = (rotation: number) => ((rotation % 6) + 6) % 6

function getLaurConnectorTarget(bp: BoardPiece): CubeCoordinate | undefined {
  // The short model spans one neighboring pillar; the long and arch models
  // span the radial far pillar, along the shared vertex between two hexes.
  if (SHORT_WALLS.has(bp.inventoryID)) {
    const rotation = normalizeRotation(bp.rotation)
    if (!Number.isInteger(rotation)) return
    return hexUtilsAdd(bp.pieceCoords, hexUtilsGetNeighborForRotation(rotation))
  }

  if (LONG_WALLS.has(bp.inventoryID) || LAUR_ARCHES.has(bp.inventoryID)) {
    const rotation = normalizeRotation(bp.rotation)
    if (Number.isInteger(rotation * 2) && !Number.isInteger(rotation)) {
      return hexUtilsAdd(
        bp.pieceCoords,
        hexUtilsGetRadialFarNeighborForRotation(rotation),
      )
    }
  }
}

function buildMoveGroupIndex(board: MoveGroupBoard) {
  const piecesByUid = new Map<string, BoardPiece>()
  const piecesByCoordAltitude = new Map<string, BoardPiece[]>()
  const hexesByCoordAltitude = new Map<string, BoardHex>()
  const adjacent = new Map<string, Set<string>>()
  const pillarUidsByCoord = new Map<string, BoardPiece[]>()
  const pieceByUidOrder = new Map<string, number>()

  const addToIndex = (
    map: Map<string, BoardPiece[]>,
    key: string,
    bp: BoardPiece,
  ) => {
    const indexed = map.get(key)
    if (indexed) indexed.push(bp)
    else map.set(key, [bp])
  }

  const connect = (a: string, b: string) => {
    if (a === b) return
    adjacent.get(a)?.add(b)
    adjacent.get(b)?.add(a)
  }

  board.boardPieces.forEach((bp, index) => {
    piecesByUid.set(bp.uid, bp)
    pieceByUidOrder.set(bp.uid, index)
    addToIndex(
      piecesByCoordAltitude,
      coordAltitudeKey(bp.pieceCoords, bp.altitude),
      bp,
    )
    adjacent.set(bp.uid, new Set())

    if (LAUR_PILLARS.has(bp.inventoryID)) {
      addToIndex(pillarUidsByCoord, coordKey(bp.pieceCoords), bp)
    }
  })

  for (const hex of Object.values(board.boardHexes)) {
    hexesByCoordAltitude.set(coordAltitudeKey(hex, hex.altitude), hex)
  }

  const pillarAnchorByCoord = new Map<string, string>()
  for (const [key, pillars] of pillarUidsByCoord) {
    const ordered = [...pillars].sort(
      (a, b) =>
        a.altitude - b.altitude ||
        (pieceByUidOrder.get(a.uid) ?? 0) - (pieceByUidOrder.get(b.uid) ?? 0),
    )
    pillarAnchorByCoord.set(key, ordered[0].uid)
    for (const pillar of pillars.slice(1)) {
      connect(ordered[0].uid, pillar.uid)
    }
  }

  connectLaurWalls(board.boardPieces, pillarAnchorByCoord, connect)
  connectLaurRuins(board.boardPieces, pillarAnchorByCoord, connect)
  connectLadderChains(
    board.boardPieces,
    piecesByCoordAltitude,
    hexesByCoordAltitude,
    connect,
  )

  const componentByUid = new Map<string, string[]>()
  const seen = new Set<string>()
  for (const bp of board.boardPieces) {
    if (seen.has(bp.uid)) continue
    const component: string[] = []
    const pending = [bp.uid]
    seen.add(bp.uid)
    while (pending.length) {
      const uid = pending.pop()
      if (!uid) continue
      component.push(uid)
      for (const neighbor of adjacent.get(uid) ?? []) {
        if (seen.has(neighbor)) continue
        seen.add(neighbor)
        pending.push(neighbor)
      }
    }
    component.sort(
      (a, b) => (pieceByUidOrder.get(a) ?? 0) - (pieceByUidOrder.get(b) ?? 0),
    )
    for (const uid of component) componentByUid.set(uid, component)
  }

  return {
    piecesByUid,
    pillarAnchorByCoord,
    componentByUid,
    piecesByCoordAltitude,
  }
}

function connectLaurWalls(
  boardPieces: BoardPiece[],
  pillarAnchorByCoord: Map<string, string>,
  connect: (a: string, b: string) => void,
) {
  for (const bp of boardPieces) {
    const target = getLaurConnectorTarget(bp)
    if (!target) continue
    const sourceAnchor = pillarAnchorByCoord.get(coordKey(bp.pieceCoords))
    const targetAnchor = pillarAnchorByCoord.get(coordKey(target))
    if (!sourceAnchor || !targetAnchor) continue
    connect(bp.uid, sourceAnchor)
    connect(bp.uid, targetAnchor)
  }
}

function connectLaurRuins(
  boardPieces: BoardPiece[],
  pillarAnchorByCoord: Map<string, string>,
  connect: (a: string, b: string) => void,
) {
  for (const bp of boardPieces) {
    if (!LAUR_RUINS.has(bp.inventoryID)) continue
    const anchor = pillarAnchorByCoord.get(coordKey(bp.pieceCoords))
    if (anchor) connect(bp.uid, anchor)
  }
}

function connectLadderChains(
  boardPieces: BoardPiece[],
  piecesByCoordAltitude: Map<string, BoardPiece[]>,
  hexesByCoordAltitude: Map<string, BoardHex>,
  connect: (a: string, b: string) => void,
) {
  for (const bp of boardPieces) {
    if (bp.inventoryID !== Pieces.ladder) continue
    const originHex = hexesByCoordAltitude.get(
      coordAltitudeKey(bp.pieceCoords, bp.altitude + 1),
    )
    if (
      originHex?.inventoryID !== Pieces.ladder ||
      originHex.boardPieceUID !== bp.uid
    ) {
      continue
    }
    const upperPieces = piecesByCoordAltitude.get(
      // ladderStack targets the clicked ladder's top (+1), then placement
      // stores the new BoardPiece one level above that (+1 again).
      coordAltitudeKey(bp.pieceCoords, bp.altitude + 2),
    )
    for (const upper of upperPieces ?? []) {
      if (
        upper.inventoryID !== Pieces.ladder ||
        upper.rotation !== bp.rotation
      ) {
        continue
      }
      const upperOrigin = hexesByCoordAltitude.get(
        coordAltitudeKey(upper.pieceCoords, upper.altitude + 1),
      )
      if (
        upperOrigin?.inventoryID === Pieces.ladder &&
        upperOrigin.boardPieceUID === upper.uid
      ) {
        connect(bp.uid, upper.uid)
      }
    }
  }
}

function getAnchorUid(
  uid: string,
  piecesByUid: Map<string, BoardPiece>,
  pillarAnchorByCoord: Map<string, string>,
  component: string[],
): string {
  const bp = piecesByUid.get(uid)
  if (!bp) return uid

  if (bp.inventoryID === Pieces.ladder) {
    const ladderMembers = component
      .map((memberUid) => piecesByUid.get(memberUid))
      .filter(
        (member): member is BoardPiece => member?.inventoryID === Pieces.ladder,
      )
    ladderMembers.sort(
      (a, b) => a.altitude - b.altitude || a.uid.localeCompare(b.uid),
    )
    return ladderMembers[0]?.uid ?? uid
  }

  if (
    LAUR_PILLARS.has(bp.inventoryID) ||
    SHORT_WALLS.has(bp.inventoryID) ||
    LONG_WALLS.has(bp.inventoryID) ||
    LAUR_ARCHES.has(bp.inventoryID) ||
    LAUR_RUINS.has(bp.inventoryID)
  ) {
    const pillarAnchor = pillarAnchorByCoord.get(coordKey(bp.pieceCoords))
    return pillarAnchor && component.includes(pillarAnchor) ? pillarAnchor : uid
  }

  return uid
}

function getMoveGroupFromIndex(
  uid: string,
  index: ReturnType<typeof buildMoveGroupIndex>,
): MoveGroup {
  const component = index.componentByUid.get(uid)
  if (!component) return { uids: [uid], anchorUid: uid }
  return {
    uids: component,
    anchorUid: getAnchorUid(
      uid,
      index.piecesByUid,
      index.pillarAnchorByCoord,
      component,
    ),
  }
}

/** Return the connected component containing uid, or uid alone if unknown. */
export function getMoveGroup(board: MoveGroupBoard, uid: string): MoveGroup {
  return getMoveGroupFromIndex(uid, buildMoveGroupIndex(board))
}

/**
 * Expand selected uids to their connected components. The grabbed piece's
 * family-specific anchor is preserved, even when other selected groups join.
 */
export function expandMoveGroup(
  board: MoveGroupBoard,
  uids: string[],
  grabbedUid: string,
): MoveGroup {
  const index = buildMoveGroupIndex(board)
  const expanded = new Set<string>()
  let grabbedGroup = getMoveGroupFromIndex(grabbedUid, index)
  for (const uid of [...uids, grabbedUid]) {
    const group = getMoveGroupFromIndex(uid, index)
    for (const memberUid of group.uids) expanded.add(memberUid)
    if (uid === grabbedUid) grabbedGroup = group
  }
  const orderedUids = board.boardPieces
    .filter((bp) => expanded.has(bp.uid))
    .map((bp) => bp.uid)
  for (const uid of expanded) {
    if (!index.piecesByUid.has(uid)) orderedUids.push(uid)
  }
  return { uids: orderedUids, anchorUid: grabbedGroup.anchorUid }
}
