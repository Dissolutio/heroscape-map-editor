import {
  getPieceEdgeId,
  getPieceFeatureIds,
} from '../data/hexGrid/pieceFeatures'
import { edgeIdFromHex, hexesForEdge } from '../data/hexGrid/edgesAndNodes'
import { piecesSoFar } from '../data/pieces'
import { isStartZoneBoardPiece } from '../data/startZoneVisibility'
import {
  HexTerrain,
  Pieces,
  type BoardHex,
  type BoardHexes,
  type BoardPiece,
} from '../types'
import { isFluidTerrainHex, isSolidTerrainHex } from '../utils/board-utils'
import { HEX_DIRECTIONS, hexUtilsAdd } from '../utils/hex-utils'
import { genBoardHexID, getSurfaceAltitudeByPieceUID } from '../utils/map-utils'

type ConnectionCategory = 'land' | 'obstacle' | 'laur' | 'edge-piece' | 'none'

const connectionCategoryRules: readonly [
  Exclude<ConnectionCategory, 'none'>,
  (terrain: string, inventoryID: string, isObstaclePiece: boolean) => boolean,
][] = [
  [
    'land',
    (terrain) => isSolidTerrainHex(terrain) || isFluidTerrainHex(terrain),
  ],
  [
    'laur',
    (terrain) =>
      terrain === HexTerrain.laurWall || terrain === HexTerrain.laurWallAddon,
  ],
  [
    'edge-piece',
    (_terrain, inventoryID) =>
      inventoryID === Pieces.ladder ||
      inventoryID === Pieces.battlement ||
      inventoryID === Pieces.ropeLadder,
  ],
  [
    'obstacle',
    (terrain, _inventoryID, isObstaclePiece) =>
      isObstaclePiece ||
      terrain === HexTerrain.ruin ||
      terrain === HexTerrain.fortifiedWall,
  ],
]

function getConnectionCategory(inventoryID: string): ConnectionCategory {
  const definition = piecesSoFar[inventoryID]
  if (!definition) return 'none'
  return (
    connectionCategoryRules.find(([, matches]) =>
      matches(definition.terrain, inventoryID, definition.isObstaclePiece),
    )?.[0] ?? 'none'
  )
}

function getConnectionEdgeId(piece: BoardPiece) {
  return piece.inventoryID === Pieces.ladder
    ? edgeIdFromHex(piece.pieceCoords, piece.rotation)
    : getPieceEdgeId({ ...piece, pieceID: piece.inventoryID })
}

export type SelectionMenuContext = {
  seedPieceIDs: readonly string[]
  selectedPieceIDs: readonly string[]
  boardPieces: readonly BoardPiece[]
  boardHexes: BoardHexes
  viewingLevel: number
  isShowStartZones: boolean
  setSelectedPieceIDs: (pieceIDs: readonly string[]) => void
}

export type SelectionMenuAction = {
  id: string
  label: string
  group: string
  tooltip: string
  isEnabled: (ctx: SelectionMenuContext) => boolean
  disabledReason: (ctx: SelectionMenuContext) => string | undefined
  run: (ctx: SelectionMenuContext) => void
}

export type SelectionMenuActionItem = {
  action: SelectionMenuAction
  enabled: boolean
  disabledReason?: string
}

export function getVisibleSelectionPieces(
  boardPieces: readonly BoardPiece[],
  boardHexes: BoardHexes,
  viewingLevel: number,
  isShowStartZones: boolean,
) {
  const surfaceAltitudeByUID = getSurfaceAltitudeByPieceUID(boardHexes)
  return boardPieces.filter((piece) => {
    const definition = piecesSoFar[piece.inventoryID]
    if (!definition || (!isShowStartZones && isStartZoneBoardPiece(piece))) {
      return false
    }
    const isLand =
      isSolidTerrainHex(definition.terrain) ||
      isFluidTerrainHex(definition.terrain)
    const visibleAltitude = isLand
      ? (surfaceAltitudeByUID.get(piece.uid) ?? piece.altitude + 1)
      : piece.altitude + 1
    return visibleAltitude <= viewingLevel
  })
}

function getVisibleSeeds(ctx: SelectionMenuContext) {
  const visibleIDs = new Set(
    getVisibleSelectionPieces(
      ctx.boardPieces,
      ctx.boardHexes,
      ctx.viewingLevel,
      ctx.isShowStartZones,
    ).map((piece) => piece.uid),
  )
  return ctx.seedPieceIDs.filter((uid) => visibleIDs.has(uid))
}

export function selectSameType(ctx: SelectionMenuContext) {
  const visiblePieces = getVisibleSelectionPieces(
    ctx.boardPieces,
    ctx.boardHexes,
    ctx.viewingLevel,
    ctx.isShowStartZones,
  )
  const piecesByUID = new Map(visiblePieces.map((piece) => [piece.uid, piece]))
  const typeKeys = new Set(
    getVisibleSeeds(ctx).flatMap((uid) => {
      const piece = piecesByUID.get(uid)
      const definition = piecesSoFar[piece?.inventoryID ?? '']
      if (!piece || !definition) return []
      return [
        definition.landPrefix
          ? `land:${definition.landPrefix}`
          : `piece:${piece.inventoryID}`,
      ]
    }),
  )
  return visiblePieces
    .filter((piece) => {
      const definition = piecesSoFar[piece.inventoryID]
      const typeKey = definition?.landPrefix
        ? `land:${definition.landPrefix}`
        : `piece:${piece.inventoryID}`
      return typeKeys.has(typeKey)
    })
    .map((piece) => piece.uid)
}

export function selectSameLevel(ctx: SelectionMenuContext) {
  const visiblePieces = getVisibleSelectionPieces(
    ctx.boardPieces,
    ctx.boardHexes,
    ctx.viewingLevel,
    ctx.isShowStartZones,
  )
  const visibleIDs = new Set(visiblePieces.map((piece) => piece.uid))
  const seedIDs = new Set(getVisibleSeeds(ctx))
  const levels = new Set(
    ctx.boardPieces
      .filter((piece) => visibleIDs.has(piece.uid) && seedIDs.has(piece.uid))
      .map((piece) => piece.altitude),
  )
  return visiblePieces
    .filter((piece) => levels.has(piece.altitude))
    .map((piece) => piece.uid)
}

export function invertSelection(ctx: SelectionMenuContext) {
  const selectedIDs = new Set(ctx.selectedPieceIDs)
  return getVisibleSelectionPieces(
    ctx.boardPieces,
    ctx.boardHexes,
    ctx.viewingLevel,
    ctx.isShowStartZones,
  )
    .filter((piece) => !selectedIDs.has(piece.uid))
    .map((piece) => piece.uid)
}

function addNeighbor(
  neighbors: Map<string, Set<string>>,
  firstUID: string,
  secondUID: string | undefined,
) {
  if (!secondUID || firstUID === secondUID || !neighbors.has(secondUID)) return
  neighbors.get(firstUID)?.add(secondUID)
  neighbors.get(secondUID)?.add(firstUID)
}

function buildPieceNeighbors(
  visiblePieces: readonly BoardPiece[],
  boardHexes: BoardHexes,
) {
  const neighbors = new Map(
    visiblePieces.map((piece) => [piece.uid, new Set<string>()]),
  )
  const categories = new Map(
    visiblePieces.map((piece) => [
      piece.uid,
      getConnectionCategory(piece.inventoryID),
    ]),
  )
  const visibleIDs = new Set(neighbors.keys())
  const hexesByUID = new Map<string, BoardHex[]>()
  for (const hex of Object.values(boardHexes)) {
    if (!hex.boardPieceUID || !visibleIDs.has(hex.boardPieceUID)) continue
    const ownedHexes = hexesByUID.get(hex.boardPieceUID)
    if (ownedHexes) ownedHexes.push(hex)
    else hexesByUID.set(hex.boardPieceUID, [hex])
  }

  const addLandAt = (
    uid: string,
    coords: { q: number; r: number; s: number },
    altitude: number,
  ) => {
    const land = boardHexes[genBoardHexID({ ...coords, altitude })]
    if (land?.boardPieceUID && categories.get(land.boardPieceUID) === 'land') {
      addNeighbor(neighbors, uid, land.boardPieceUID)
    }
  }

  for (const hex of Object.values(boardHexes)) {
    const uid = hex.boardPieceUID
    if (!uid || !visibleIDs.has(uid)) continue
    const category = categories.get(uid)
    if (category === 'land') {
      for (const direction of Object.values(HEX_DIRECTIONS)) {
        const neighborCoords = hexUtilsAdd(hex, direction)
        const neighbor =
          boardHexes[
            genBoardHexID({ ...neighborCoords, altitude: hex.altitude })
          ]
        if (categories.get(neighbor?.boardPieceUID ?? '') === 'land') {
          addNeighbor(neighbors, uid, neighbor?.boardPieceUID)
        }
      }
      for (const altitude of [hex.altitude - 1, hex.altitude + 1]) {
        const stacked = boardHexes[genBoardHexID({ ...hex, altitude })]
        if (categories.get(stacked?.boardPieceUID ?? '') === 'land') {
          addNeighbor(neighbors, uid, stacked?.boardPieceUID)
        }
      }
    } else if (category === 'laur') {
      for (const altitude of [hex.altitude - 1, hex.altitude + 1]) {
        const stacked = boardHexes[genBoardHexID({ ...hex, altitude })]
        if (categories.get(stacked?.boardPieceUID ?? '') === 'laur') {
          addNeighbor(neighbors, uid, stacked?.boardPieceUID)
        }
      }
    }
  }

  for (const piece of visiblePieces) {
    const category = categories.get(piece.uid)
    if (category === 'obstacle' || category === 'laur') {
      const ownedHexes = hexesByUID.get(piece.uid) ?? []
      const footprintCoords =
        ownedHexes.length > 0
          ? ownedHexes
              .filter((hex) => !hex.isVerticalClearanceHex)
              .map(({ q, r, s }) => ({ q, r, s }))
          : (getPieceFeatureIds({
              ...piece,
              pieceID: piece.inventoryID,
            })?.footprint?.endHexIds.map((id) => {
              const [q, r, s] = id.slice('hex:'.length).split(',').map(Number)
              return { q, r, s }
            }) ?? [])
      for (const coords of footprintCoords) {
        addLandAt(piece.uid, coords, piece.altitude)
      }
    }

    if (category === 'edge-piece') {
      const edgeID = getConnectionEdgeId(piece)
      if (edgeID) {
        for (const coords of hexesForEdge(edgeID)) {
          const endpoint =
            boardHexes[genBoardHexID({ ...coords, altitude: piece.altitude })]
          const endpointCategory = categories.get(endpoint?.boardPieceUID ?? '')
          if (
            endpointCategory === 'land' ||
            endpointCategory === 'laur' ||
            (endpoint?.terrain &&
              [
                HexTerrain.castleWall,
                HexTerrain.castleBase,
                HexTerrain.shipWall,
                HexTerrain.shipBow,
                HexTerrain.fortifiedWall,
                HexTerrain.ruin,
                HexTerrain.marvelRuin,
              ].includes(endpoint.terrain as HexTerrain))
          ) {
            addNeighbor(neighbors, piece.uid, endpoint?.boardPieceUID)
          }
        }
      }
      if (piece.inventoryID === Pieces.ladder) {
        const height = piecesSoFar[piece.inventoryID]?.height ?? 0
        for (const altitude of [piece.altitude, piece.altitude + height]) {
          addLandAt(piece.uid, piece.pieceCoords, altitude)
        }
      }
    }
  }

  const piecesWithFeatures = new Map<string, Set<string>>()
  for (const piece of visiblePieces) {
    const category = categories.get(piece.uid)
    if (category !== 'laur' && category !== 'edge-piece') continue
    const featureIds =
      category === 'edge-piece' && piece.inventoryID === Pieces.ladder
        ? [getConnectionEdgeId(piece)]
        : (getPieceFeatureIds({
            ...piece,
            pieceID: piece.inventoryID,
          })?.featureIds ?? [])
    for (const featureId of featureIds) {
      if (!featureId) continue
      const attached = piecesWithFeatures.get(featureId)
      if (attached) {
        for (const uid of attached) addNeighbor(neighbors, piece.uid, uid)
        attached.add(piece.uid)
      } else {
        piecesWithFeatures.set(featureId, new Set([piece.uid]))
      }
    }
  }
  return neighbors
}

export function selectConnected(ctx: SelectionMenuContext) {
  const visiblePieces = getVisibleSelectionPieces(
    ctx.boardPieces,
    ctx.boardHexes,
    ctx.viewingLevel,
    ctx.isShowStartZones,
  )
  const neighbors = buildPieceNeighbors(visiblePieces, ctx.boardHexes)
  const connected = new Set<string>()
  const queue: string[] = []
  for (const uid of getVisibleSeeds(ctx)) {
    if (!connected.has(uid) && neighbors.has(uid)) {
      connected.add(uid)
      queue.push(uid)
    }
  }
  for (let index = 0; index < queue.length; index += 1) {
    for (const neighbor of neighbors.get(queue[index]) ?? []) {
      if (connected.has(neighbor)) continue
      connected.add(neighbor)
      queue.push(neighbor)
    }
  }
  return visiblePieces
    .filter((piece) => connected.has(piece.uid))
    .map((piece) => piece.uid)
}

const hasVisibleSeeds = (ctx: SelectionMenuContext) =>
  getVisibleSeeds(ctx).length > 0

const seedRequired = (ctx: SelectionMenuContext) =>
  hasVisibleSeeds(ctx) ? undefined : 'Select a visible piece first.'

export const selectionMenuActions: SelectionMenuAction[] = [
  {
    id: 'same-type',
    label: 'Select same type',
    group: 'selection',
    tooltip:
      'Land matches the same land prefix across all sizes; other pieces match the exact inventory ID.',
    isEnabled: hasVisibleSeeds,
    disabledReason: seedRequired,
    run: (ctx) => ctx.setSelectedPieceIDs(selectSameType(ctx)),
  },
  {
    id: 'connected',
    label: 'Select connected',
    group: 'selection',
    tooltip:
      'Connects side-touching or stacked land, obstacles to the land beneath them, Laur pieces by attachment or stacking, and ladders, battlements, or rope ladders to edge attachments.',
    isEnabled: hasVisibleSeeds,
    disabledReason: seedRequired,
    run: (ctx) => ctx.setSelectedPieceIDs(selectConnected(ctx)),
  },
  {
    id: 'same-level',
    label: 'Select same level',
    group: 'selection',
    tooltip:
      'Matches the seed piece’s base altitude. Multi-level pieces use their base altitude.',
    isEnabled: hasVisibleSeeds,
    disabledReason: seedRequired,
    run: (ctx) => ctx.setSelectedPieceIDs(selectSameLevel(ctx)),
  },
  {
    id: 'invert',
    label: 'Invert selection',
    group: 'global',
    tooltip: 'Select all visible pieces that are not currently selected.',
    isEnabled: (ctx) =>
      getVisibleSelectionPieces(
        ctx.boardPieces,
        ctx.boardHexes,
        ctx.viewingLevel,
        ctx.isShowStartZones,
      ).length > 0,
    disabledReason: () => 'There are no visible pieces to select.',
    run: (ctx) => ctx.setSelectedPieceIDs(invertSelection(ctx)),
  },
]

export function getSelectionMenuItems(
  actions: readonly SelectionMenuAction[],
  ctx: SelectionMenuContext,
): SelectionMenuActionItem[] {
  return actions.map((action) => {
    const enabled = action.isEnabled(ctx)
    return {
      action,
      enabled,
      ...(!enabled ? { disabledReason: action.disabledReason(ctx) } : {}),
    }
  })
}
