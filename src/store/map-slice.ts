import { VC_MAP_LOADED_MESSAGE, boardPiecesUseVC } from '../data/vcContent'
import { produce } from 'immer'
import { isEqual } from 'lodash'
import { nanoid } from 'nanoid'
import { enqueueSnackbar } from 'notistack'
import type { StateCreator } from 'zustand'
import { addPiece } from '../data/addPiece'
import { getNewPieceSizeForPenMode } from '../data/flatPieceSizes'
import { getPieceEdgeId } from '../data/hexGrid/pieceFeatures'
import { getUnsupportedPieceUIDs } from '../data/unsupportedPieces'
import { type MovePieceArgs, applyPieceMoves } from '../data/movePieces'
import { filterVisibleObjectiveMarkerUIDs } from '../data/objectiveMarkerVisibility'
import { findVoidMatLayoutForMarkers, getVoidMatHexes } from '../data/voidMat'
import {
  type NewObjectiveMarker,
  type ObjectiveMarker,
  type ObjectiveMarkerAnchor,
  generateObjectiveMarkerUID,
  normalizeObjectiveMarkers,
  objectiveMarkersOverlap,
} from '../data/objectiveMarkers'
import { piecesSoFar } from '../data/pieces'
import {
  computeConflictedPieceUIDs,
  rebuildBoardStateFromPieces,
} from '../data/rebuildBoardState'
import { removePiece } from '../data/removePiece'
import { reanchorRotationPivotAfterRotation } from '../data/rotationPivot'
import { getSeatedGroupUIDs, includeSeatedMoves } from '../data/seatedObstacles'
import {
  type SavedSelection,
  type SelectionUnit,
  normalizeSavedSelections,
  pruneDeletedPiece,
  pruneSavedSelections,
  renameSavedSelection,
  resolveSelectionUnit,
  saveNamedSelection,
} from '../data/selectionUnits'
import {
  filterVisiblePieceIDs,
  isGlyphBoardPiece,
  isStartZoneBoardPiece,
} from '../data/startZoneVisibility'
import { HexTerrain, Pieces } from '../types'
import type {
  AddRemovePieceError,
  BoardPiece,
  CubeCoordinate,
  MapState,
  Piece,
} from '../types'
import { PiecePrefixes } from '../types'
import { normalizeBoardPieces } from '../utils/map-utils'
import { normalizePieceInventory } from '../utils/piece-inventory'
import {
  getAvailableLandPrefixesForInventory,
  getAvailableLandPrefixesForSets,
  getEffectiveTerrainConstraintInventory,
} from '../utils/terrain-constraints'
import { clearPalmCanopyCache } from '../world/models/PalmFrondCanopy'
import { clearGlobalMaterialCache } from '../world/models/materials'
import type { AppState } from './store'

const preferredConstrainedPenModes: PiecePrefixes[] = [
  PiecePrefixes.grass,
  PiecePrefixes.rock,
  PiecePrefixes.sand,
  PiecePrefixes.water,
  PiecePrefixes.wellspringWater,
  PiecePrefixes.toxicWater,
  PiecePrefixes.swampWater,
  PiecePrefixes.ice,
  PiecePrefixes.lava,
  PiecePrefixes.shadow,
  PiecePrefixes.road,
  PiecePrefixes.wallWalk,
  PiecePrefixes.lavaField,
  PiecePrefixes.snow,
  PiecePrefixes.swamp,
  PiecePrefixes.dungeon,
  PiecePrefixes.toxic,
  PiecePrefixes.ancientTerrain,
  PiecePrefixes.asphalt,
  PiecePrefixes.concrete,
  PiecePrefixes.wood,
]

function getObjectiveMarkerLabel(marker: ObjectiveMarker) {
  if (marker.name) return marker.name
  return marker.content.kind === 'number'
    ? `#${marker.content.value}`
    : marker.content.value
}

function getPreferredConstrainedPenMode(setsUsed?: string[]) {
  const availablePrefixes = getAvailableLandPrefixesForSets(setsUsed)
  if (availablePrefixes.size === 0) {
    return undefined
  }
  const preferred = preferredConstrainedPenModes.find((prefix) =>
    availablePrefixes.has(prefix),
  )
  return preferred ?? [...availablePrefixes][0]
}

function getPreferredConstrainedPenModeFromInventory(
  constrainedInventory?: Record<string, number>,
) {
  const availablePrefixes = getAvailableLandPrefixesForInventory(
    normalizePieceInventory(constrainedInventory),
  )
  if (availablePrefixes.size === 0) {
    return undefined
  }
  const preferred = preferredConstrainedPenModes.find((prefix) =>
    availablePrefixes.has(prefix),
  )
  return preferred ?? [...availablePrefixes][0]
}

function getDefaultSizeForLandPrefix(prefix: string) {
  return getNewPieceSizeForPenMode(prefix, 'select', 0).newSize
}

export interface MapSlice extends MapState {
  savedSelections: SavedSelection[]
  conflictedPieceUIDs: string[]
  unsupportedPieceUIDs: string[]
  isAutosaveHeld: boolean
  mapLoadRevision: number
  recomputeConflicts: () => void
  paintTile: (args: PaintTileArgs) => AddRemovePieceError
  unpaintTile: (uid: string) => void
  convertVoidMatToMarkers: (selectedUIDs: string[]) => string[]
  convertVoidMarkersToMat: (selectedUIDs: string[]) => string | undefined
  convertTerrainForPieces: (args: ConvertTerrainArgs) => number
  movePiece: (args: MovePieceArgs) => void
  /** Moves several pieces in one update (one undo step); see applyPieceMoves. */
  movePieces: (args: {
    moves: MovePieceArgs[]
    preserveRotationPivot?: boolean
  }) => void
  addObjectiveMarker: (marker: NewObjectiveMarker) => string | undefined
  updateObjectiveMarker: (
    uid: string,
    updates: Partial<
      Pick<ObjectiveMarker, 'size' | 'rotation' | 'style' | 'content' | 'name'>
    >,
  ) => void
  moveObjectiveMarker: (uid: string, anchor: ObjectiveMarkerAnchor) => void
  removeObjectiveMarker: (uid: string) => void
  loadMap: (
    map: MapState & { dimensionsAdjusted?: boolean },
    options?: LoadMapOptions,
  ) => void
  addMapPortraitBase64: (pic: string) => void
  changeMapName: (val: string) => void
  changeSetsUsed: (val: string[]) => void
  syncTerrainConstraintPenMode: () => void
  changeAuthorName: (val: string) => void
  changeMapNotes: (val: string) => void
  saveSelectedSelection: (name: string) => 'saved' | 'empty' | 'full'
  renameSavedSelection: (id: string, name: string) => void
  deleteSavedSelection: (id: string) => void
  selectSelectionUnit: (selection: SelectionUnit, additive?: boolean) => void
}

export type LoadMapOptions = {
  holdAutosave?: boolean
}

type PaintTileArgs = {
  piece: Piece
  clickedHexCoords: CubeCoordinate
  altitude: number
  rotation: number
  automaticBases?: {
    piece: Piece
    clickedHexCoords: CubeCoordinate
    altitude: number
    rotation: number
  }[]
}

type ConvertTerrainArgs = {
  selectedUIDs: string[]
  targetInventoryBySourceInventory: Record<string, string>
  targetInventoryByUID?: Record<string, string>
  adaptToCollection?: boolean
  mapMetadata?: { name: string; author: string; mapNotes?: string }
}

/**
 * The viewing level after placing (or moving) a piece at `altitude`: raised
 * to the level of the piece's top (altitude + 1) when that is higher, never
 * lowered.
 */
export function getViewingLevelAfterPlacing(
  viewingLevel: number,
  altitude: number,
) {
  const placedAtLevel = altitude + 1
  return placedAtLevel > viewingLevel ? placedAtLevel : viewingLevel
}

const createMapSlice: StateCreator<AppState, [], [], MapSlice> = (
  set,
  get,
) => ({
  boardHexes: {},
  hexMap: {
    id: '',
    name: '',
    author: '',
    version: 1,
    // sets: '',
    shape: 'rectangle',
    width: 20,
    length: 20,
  },
  boardPieces: [],
  savedSelections: [],
  conflictedPieceUIDs: [],
  unsupportedPieceUIDs: [],
  isAutosaveHeld: false,
  mapLoadRevision: 0,
  recomputeConflicts: () =>
    set((state) =>
      produce(state, (draft) => {
        draft.conflictedPieceUIDs = computeConflictedPieceUIDs(
          draft.boardPieces,
        )
        draft.unsupportedPieceUIDs = getUnsupportedPieceUIDs({
          boardPieces: draft.boardPieces,
          boardHexes: draft.boardHexes,
        })
      }),
    ),
  paintTile: ({
    piece,
    clickedHexCoords,
    altitude,
    rotation,
    automaticBases,
  }: PaintTileArgs): AddRemovePieceError => {
    let error: AddRemovePieceError
    const uid = nanoid(10)
    const automaticBaseUIDs = automaticBases?.map(() => nanoid(10)) ?? []
    get().pushPendingUndoSelectionRestore({
      pieceUIDs: [...automaticBaseUIDs, uid],
      objectiveMarkerUID: null,
    })
    set((state) => {
      return produce(state, (draft) => {
        let boardHexes = draft.boardHexes
        let boardPieces = draft.boardPieces
        for (const [index, automaticBase] of (automaticBases ?? []).entries()) {
          const baseResult = addPiece({
            piece: automaticBase.piece,
            boardHexes,
            boardPieces,
            pieceCoords: automaticBase.clickedHexCoords,
            placementAltitude: automaticBase.altitude,
            rotation: automaticBase.rotation,
            isVsTile: false,
            uid: automaticBaseUIDs[index],
            permissive: true,
          })
          error = baseResult.error
          if (error) return
          boardHexes = baseResult.newBoardHexes
          boardPieces = baseResult.newBoardPieces
        }
        const {
          newBoardHexes,
          newBoardPieces,
          error: addPieceError,
        } = addPiece({
          piece,
          boardHexes,
          boardPieces,
          pieceCoords: clickedHexCoords,
          placementAltitude: altitude,
          rotation,
          isVsTile: false,
          uid,
          permissive: true,
        })
        error = addPieceError
        draft.viewingLevel = getViewingLevelAfterPlacing(
          state.viewingLevel,
          altitude,
        )
        draft.boardHexes = newBoardHexes
        draft.boardPieces = newBoardPieces
        // Recompute from boardPieces so conflict state stays correct even after load/rehydrate drift.
        draft.conflictedPieceUIDs = computeConflictedPieceUIDs(newBoardPieces)
        draft.unsupportedPieceUIDs = getUnsupportedPieceUIDs({
          boardPieces: newBoardPieces,
          boardHexes: newBoardHexes,
        })
      })
    })
    get().clearPendingUndoSelectionRestore()
    if (!error) {
      get().recordActionLog({
        type: 'place',
        pieceName: piece.title,
        selection: {
          pieceUIDs: [...automaticBaseUIDs, uid],
        },
      })
    }
    return error
  },
  unpaintTile: (uid: string) => {
    const stateBeforeDelete = get()
    const removedPiece = stateBeforeDelete.boardPieces.find(
      (piece) => piece.uid === uid,
    )
    if (!removedPiece) return
    const deletedUIDs = getSeatedGroupUIDs(
      uid,
      stateBeforeDelete.boardHexes,
      stateBeforeDelete.boardPieces,
      stateBeforeDelete.hexMap.setsUsed,
    ).filter((pieceUID) =>
      stateBeforeDelete.boardPieces.some((piece) => piece.uid === pieceUID),
    )
    get().pushPendingUndoSelectionRestore({
      pieceUIDs: deletedUIDs,
      objectiveMarkerUID: null,
    })
    set((state) => {
      return produce(state, (draft) => {
        draft.rotationPivot = null
        const deletedUIDSet = new Set(deletedUIDs)
        const remainingPieces = draft.boardPieces.filter(
          (piece) => !deletedUIDSet.has(piece.uid),
        )
        const rebuilt = rebuildBoardStateFromPieces(
          remainingPieces,
          draft.boardHexes,
        )
        draft.boardHexes = rebuilt.boardHexes
        draft.boardPieces = rebuilt.boardPieces
        draft.savedSelections = deletedUIDs.reduce(
          (selections, deletedUID) => pruneDeletedPiece(selections, deletedUID),
          draft.savedSelections,
        )
        draft.conflictedPieceUIDs = rebuilt.conflictedPieceUIDs
        draft.unsupportedPieceUIDs = getUnsupportedPieceUIDs({
          boardPieces: rebuilt.boardPieces,
          boardHexes: rebuilt.boardHexes,
        })
      })
    })
    get().clearPendingUndoSelectionRestore()
    get().recordActionLog({
      type: 'delete',
      pieceName:
        piecesSoFar[removedPiece.inventoryID]?.title ??
        removedPiece.inventoryID,
      selection: { pieceUIDs: deletedUIDs },
    })
  },
  convertVoidMatToMarkers: (selectedUIDs) => {
    const selectedIDs = new Set(selectedUIDs)
    const mats = get().boardPieces.filter(
      (piece) =>
        selectedIDs.has(piece.uid) && piece.inventoryID === Pieces.voidMat,
    )
    if (!mats.length) return []

    const sourceUIDs = mats.map((piece) => piece.uid)
    const markerUIDs: string[] = []
    get().pushPendingUndoSelectionRestore({
      pieceUIDs: sourceUIDs,
      objectiveMarkerUID: null,
    })
    set((state) =>
      produce(state, (draft) => {
        let workingHexes = draft.boardHexes
        let workingPieces = draft.boardPieces
        for (const mat of mats) {
          const currentMat = workingPieces.find(
            (piece) => piece.uid === mat.uid,
          )
          if (!currentMat) continue
          const hexes = getVoidMatHexes(currentMat)
          const removed = removePiece({
            uid: currentMat.uid,
            boardHexes: workingHexes,
            boardPieces: workingPieces,
          })
          workingHexes = removed.newBoardHexes
          workingPieces = removed.newBoardPieces

          for (const coords of hexes) {
            const uid = nanoid()
            const added = addPiece({
              piece: piecesSoFar[Pieces.voidMarker],
              boardHexes: workingHexes,
              boardPieces: workingPieces,
              pieceCoords: coords,
              placementAltitude: currentMat.altitude,
              rotation: currentMat.rotation,
              isVsTile: false,
              uid,
              permissive: true,
            })
            workingHexes = added.newBoardHexes
            workingPieces = added.newBoardPieces
            markerUIDs.push(uid)
          }
        }

        const rebuilt = rebuildBoardStateFromPieces(workingPieces, workingHexes)
        draft.boardHexes = rebuilt.boardHexes
        draft.boardPieces = rebuilt.boardPieces
        draft.conflictedPieceUIDs = rebuilt.conflictedPieceUIDs
        draft.unsupportedPieceUIDs = getUnsupportedPieceUIDs({
          boardPieces: rebuilt.boardPieces,
          boardHexes: rebuilt.boardHexes,
        })
        draft.selectedPieceIDs = markerUIDs
        draft.rotationPivot = null
      }),
    )
    get().clearPendingUndoSelectionRestore()
    if (!markerUIDs.length) return []
    get().recordActionLog({
      type: 'convert',
      count: sourceUIDs.length,
      selection: { pieceUIDs: sourceUIDs },
    })
    return markerUIDs
  },
  convertVoidMarkersToMat: (selectedUIDs) => {
    if (selectedUIDs.length !== 14) return undefined
    const selectedIDs = new Set(selectedUIDs)
    const markers = get().boardPieces.filter((piece) =>
      selectedIDs.has(piece.uid),
    )
    if (markers.length !== 14) return undefined
    const layout = findVoidMatLayoutForMarkers(markers)
    if (!layout) return undefined

    const matUID = nanoid()
    get().pushPendingUndoSelectionRestore({
      pieceUIDs: markers.map((piece) => piece.uid),
      objectiveMarkerUID: null,
    })
    set((state) =>
      produce(state, (draft) => {
        let workingHexes = draft.boardHexes
        let workingPieces = draft.boardPieces
        for (const marker of markers) {
          const removed = removePiece({
            uid: marker.uid,
            boardHexes: workingHexes,
            boardPieces: workingPieces,
          })
          workingHexes = removed.newBoardHexes
          workingPieces = removed.newBoardPieces
        }
        const added = addPiece({
          piece: piecesSoFar[Pieces.voidMat],
          boardHexes: workingHexes,
          boardPieces: workingPieces,
          pieceCoords: layout.pieceCoords,
          placementAltitude: 0,
          rotation: layout.rotation,
          isVsTile: false,
          uid: matUID,
          permissive: true,
        })
        const rebuilt = rebuildBoardStateFromPieces(
          added.newBoardPieces,
          added.newBoardHexes,
        )
        draft.boardHexes = rebuilt.boardHexes
        draft.boardPieces = rebuilt.boardPieces
        draft.conflictedPieceUIDs = rebuilt.conflictedPieceUIDs
        draft.unsupportedPieceUIDs = getUnsupportedPieceUIDs({
          boardPieces: rebuilt.boardPieces,
          boardHexes: rebuilt.boardHexes,
        })
        draft.selectedPieceIDs = [matUID]
        draft.rotationPivot = null
      }),
    )
    get().clearPendingUndoSelectionRestore()
    get().recordActionLog({
      type: 'convert',
      count: 1,
      selection: { pieceUIDs: markers.map((piece) => piece.uid) },
    })
    return matUID
  },
  convertTerrainForPieces: ({
    selectedUIDs,
    targetInventoryBySourceInventory,
    targetInventoryByUID,
    adaptToCollection,
    mapMetadata,
  }: ConvertTerrainArgs): number => {
    const metadataChanged =
      mapMetadata !== undefined &&
      (get().hexMap.name !== mapMetadata.name ||
        get().hexMap.author !== mapMetadata.author ||
        (mapMetadata.mapNotes !== undefined &&
          get().hexMap.mapNotes !== mapMetadata.mapNotes))
    let convertedCount = 0
    const affectedUIDs = [
      ...new Set(
        selectedUIDs.filter((uid) => {
          const boardPiece = get().boardPieces.find(
            (piece) => piece.uid === uid,
          )
          if (!boardPiece) return false
          const targetInventoryID =
            targetInventoryByUID?.[uid] ??
            targetInventoryBySourceInventory[boardPiece.inventoryID]
          if (
            !targetInventoryID ||
            targetInventoryID === boardPiece.inventoryID
          ) {
            return false
          }
          const targetPiece = piecesSoFar[targetInventoryID]
          return Boolean(targetPiece)
        }),
      ),
    ]
    if (affectedUIDs.length) {
      get().pushPendingUndoSelectionRestore({
        pieceUIDs: affectedUIDs,
        objectiveMarkerUID: null,
      })
    }
    set((state) => {
      return produce(state, (draft) => {
        let workingHexes = draft.boardHexes
        let workingPieces = draft.boardPieces
        let occupancyChanged = false
        const originalOrder = new Map(
          workingPieces.map((piece, index) => [piece.uid, index]),
        )

        for (const uid of selectedUIDs) {
          const boardPiece = workingPieces.find((bp) => bp.uid === uid)
          if (!boardPiece) continue

          const targetInventoryID =
            targetInventoryByUID?.[uid] ??
            targetInventoryBySourceInventory[boardPiece.inventoryID]
          if (
            !targetInventoryID ||
            targetInventoryID === boardPiece.inventoryID
          ) {
            continue
          }
          const targetPiece = piecesSoFar[targetInventoryID]
          if (!targetPiece) continue

          const sourcePiece = piecesSoFar[boardPiece.inventoryID]
          if (
            sourcePiece?.terrain === HexTerrain.startZone &&
            targetPiece.terrain === HexTerrain.startZone
          ) {
            boardPiece.inventoryID = targetInventoryID
            convertedCount += 1
            continue
          }

          const removeResult = removePiece({
            uid,
            boardHexes: workingHexes,
            boardPieces: workingPieces,
          })
          const addResult = addPiece({
            piece: targetPiece,
            boardHexes: removeResult.newBoardHexes,
            boardPieces: removeResult.newBoardPieces,
            pieceCoords: boardPiece.pieceCoords,
            placementAltitude: boardPiece.altitude,
            rotation: boardPiece.rotation,
            isVsTile: false,
            uid,
            permissive: true,
          })

          workingHexes = addResult.newBoardHexes
          workingPieces = addResult.newBoardPieces
          occupancyChanged = true
          convertedCount += 1
        }

        draft.boardPieces = workingPieces
        if (mapMetadata) {
          draft.hexMap.name = mapMetadata.name
          draft.hexMap.author = mapMetadata.author
          if (mapMetadata.mapNotes !== undefined) {
            draft.hexMap.mapNotes = mapMetadata.mapNotes
          }
        }
        if (occupancyChanged) {
          workingPieces.sort(
            (a, b) =>
              (originalOrder.get(a.uid) ?? Number.MAX_SAFE_INTEGER) -
              (originalOrder.get(b.uid) ?? Number.MAX_SAFE_INTEGER),
          )
          const rebuilt = rebuildBoardStateFromPieces(
            workingPieces,
            draft.boardHexes,
          )
          workingPieces = rebuilt.boardPieces
          draft.boardHexes = rebuilt.boardHexes
          draft.boardPieces = rebuilt.boardPieces
          draft.conflictedPieceUIDs = rebuilt.conflictedPieceUIDs
          draft.unsupportedPieceUIDs = getUnsupportedPieceUIDs({
            boardPieces: workingPieces,
            boardHexes: rebuilt.boardHexes,
          })
        }
      })
    })
    get().clearPendingUndoSelectionRestore()
    if (convertedCount || (adaptToCollection && metadataChanged)) {
      get().recordActionLog({
        type: adaptToCollection ? 'adapt' : 'convert',
        count: convertedCount,
        selection: { pieceUIDs: affectedUIDs },
      })
    }
    return convertedCount
  },
  movePiece: (args: MovePieceArgs) => get().movePieces({ moves: [args] }),
  movePieces: ({
    moves,
    preserveRotationPivot = false,
  }: {
    moves: MovePieceArgs[]
    preserveRotationPivot?: boolean
  }) => {
    const stateBeforeMove = get()
    const piecesBeforeMove = stateBeforeMove.boardPieces
    const movesWithSeats = includeSeatedMoves(
      moves,
      stateBeforeMove.boardHexes,
      piecesBeforeMove,
      stateBeforeMove.hexMap.setsUsed,
    )
    const selectionRecordUIDs: string[] = []
    const seenMoveUIDs = new Set<string>()
    for (const move of movesWithSeats) {
      if (seenMoveUIDs.has(move.uid)) continue
      seenMoveUIDs.add(move.uid)
      const boardPiece = piecesBeforeMove.find(
        (piece) => piece.uid === move.uid,
      )
      if (!boardPiece) continue
      const isMigratedEdgePiece =
        boardPiece.inventoryID === Pieces.battlement ||
        boardPiece.inventoryID === Pieces.roadWall ||
        boardPiece.inventoryID === Pieces.ropeLadder
      const edgeId = isMigratedEdgePiece ? getPieceEdgeId(boardPiece) : null
      const targetEdgeId =
        move.newEdgeId ??
        (isMigratedEdgePiece
          ? getPieceEdgeId({
              inventoryID: boardPiece.inventoryID,
              pieceCoords: move.newPieceCoords,
              rotation: move.newRotation ?? boardPiece.rotation,
            })
          : null)
      const changed = edgeId
        ? edgeId !== targetEdgeId ||
          boardPiece.pieceCoords.q !== move.newPieceCoords.q ||
          boardPiece.pieceCoords.r !== move.newPieceCoords.r ||
          boardPiece.pieceCoords.s !== move.newPieceCoords.s ||
          boardPiece.altitude !== (move.newAltitude ?? boardPiece.altitude) ||
          boardPiece.rotation !== (move.newRotation ?? boardPiece.rotation)
        : boardPiece.pieceCoords.q !== move.newPieceCoords.q ||
          boardPiece.pieceCoords.r !== move.newPieceCoords.r ||
          boardPiece.pieceCoords.s !== move.newPieceCoords.s ||
          boardPiece.altitude !== (move.newAltitude ?? boardPiece.altitude) ||
          boardPiece.rotation !== (move.newRotation ?? boardPiece.rotation)
      if (changed) selectionRecordUIDs.push(move.uid)
    }
    if (selectionRecordUIDs.length) {
      const selectedOrder = stateBeforeMove.selectedPieceIDs.filter((uid) =>
        selectionRecordUIDs.includes(uid),
      )
      const orderedUIDs = [
        ...selectedOrder,
        ...selectionRecordUIDs.filter((uid) => !selectedOrder.includes(uid)),
      ]
      get().pushPendingUndoSelectionRestore({
        pieceUIDs: orderedUIDs,
        objectiveMarkerUID: null,
      })
    }
    set((state) => {
      const effectiveMoves = movesWithSeats.filter((move, index) => {
        if (
          movesWithSeats.findIndex(
            (candidate) => candidate.uid === move.uid,
          ) !== index
        )
          return false
        const boardPiece = state.boardPieces.find(
          (piece) => piece.uid === move.uid,
        )
        if (!boardPiece) return false
        const isMigratedEdgePiece =
          boardPiece.inventoryID === Pieces.battlement ||
          boardPiece.inventoryID === Pieces.roadWall ||
          boardPiece.inventoryID === Pieces.ropeLadder
        const edgeId = isMigratedEdgePiece ? getPieceEdgeId(boardPiece) : null
        if (edgeId) {
          const targetEdgeId =
            move.newEdgeId ??
            getPieceEdgeId({
              inventoryID: boardPiece.inventoryID,
              pieceCoords: move.newPieceCoords,
              rotation: move.newRotation ?? boardPiece.rotation,
            })
          return (
            edgeId !== targetEdgeId ||
            boardPiece.pieceCoords.q !== move.newPieceCoords.q ||
            boardPiece.pieceCoords.r !== move.newPieceCoords.r ||
            boardPiece.pieceCoords.s !== move.newPieceCoords.s ||
            boardPiece.altitude !== (move.newAltitude ?? boardPiece.altitude) ||
            boardPiece.rotation !== (move.newRotation ?? boardPiece.rotation)
          )
        }
        return (
          boardPiece.pieceCoords.q !== move.newPieceCoords.q ||
          boardPiece.pieceCoords.r !== move.newPieceCoords.r ||
          boardPiece.pieceCoords.s !== move.newPieceCoords.s ||
          boardPiece.altitude !== (move.newAltitude ?? boardPiece.altitude) ||
          boardPiece.rotation !== (move.newRotation ?? boardPiece.rotation)
        )
      })
      if (!effectiveMoves.length) return state
      // One update makes the whole group one undo step. No-op moves should
      // not reorder board pieces or create history entries.
      return produce(state, (draft) => {
        const moved = applyPieceMoves(draft, effectiveMoves)
        if (!moved) return
        const pivotUID =
          state.selectedPieceIDs[state.selectedPieceIDs.length - 1]
        if (effectiveMoves.some((move) => move.uid === pivotUID)) {
          draft.rotationPivot = preserveRotationPivot
            ? reanchorRotationPivotAfterRotation(
                state.selectedPieceIDs,
                state.boardPieces,
                state.boardHexes,
                moved.boardPieces,
                moved.boardHexes,
                state.rotationPivot,
              )
            : null
        }
        draft.boardHexes = moved.boardHexes
        draft.boardPieces = moved.boardPieces
        draft.conflictedPieceUIDs = moved.conflictedPieceUIDs
        draft.unsupportedPieceUIDs = moved.unsupportedPieceUIDs
        // same as painting: keep a piece moved up into view
        draft.viewingLevel = getViewingLevelAfterPlacing(
          state.viewingLevel,
          moved.highestAltitude,
        )
      })
    })
    get().clearPendingUndoSelectionRestore()
    const piecesAfterMove = get().boardPieces
    const changedPieces: BoardPiece[] = []
    const seenUIDs = new Set<string>()
    for (const move of movesWithSeats) {
      if (seenUIDs.has(move.uid)) continue
      seenUIDs.add(move.uid)
      const before = piecesBeforeMove.find((piece) => piece.uid === move.uid)
      const after = piecesAfterMove.find((piece) => piece.uid === move.uid)
      if (
        before &&
        after &&
        (before.pieceCoords.q !== after.pieceCoords.q ||
          before.pieceCoords.r !== after.pieceCoords.r ||
          before.pieceCoords.s !== after.pieceCoords.s ||
          before.altitude !== after.altitude ||
          before.rotation !== after.rotation)
      ) {
        changedPieces.push(after)
      }
    }
    const leadPiece = changedPieces[0]
    if (leadPiece) {
      const pieceName =
        piecesSoFar[leadPiece.inventoryID]?.title ?? leadPiece.inventoryID
      const changedUIDs = new Set(changedPieces.map((piece) => piece.uid))
      const actionSelectionUIDs = [
        ...stateBeforeMove.selectedPieceIDs.filter((uid) =>
          changedUIDs.has(uid),
        ),
        ...changedPieces
          .map((piece) => piece.uid)
          .filter((uid) => !stateBeforeMove.selectedPieceIDs.includes(uid)),
      ]
      const isRotation = changedPieces.every((piece) => {
        const before = piecesBeforeMove.find(
          (oldPiece) => oldPiece.uid === piece.uid,
        )
        return (
          before &&
          before.rotation !== piece.rotation &&
          before.altitude === piece.altitude &&
          (preserveRotationPivot ||
            (before.pieceCoords.q === piece.pieceCoords.q &&
              before.pieceCoords.r === piece.pieceCoords.r &&
              before.pieceCoords.s === piece.pieceCoords.s))
        )
      })
      if (isRotation) {
        get().recordActionLog({
          type: 'rotate',
          pieceName,
          count: changedPieces.length,
          selection: { pieceUIDs: actionSelectionUIDs },
        })
      } else {
        get().recordActionLog({
          type: 'move',
          pieceName,
          count: changedPieces.length,
          selection: { pieceUIDs: actionSelectionUIDs },
        })
      }
    }
  },
  addObjectiveMarker: (marker) => {
    const existing = get().hexMap.objectiveMarkers ?? []
    let uid = marker.uid
    if (!uid || existing.some((item) => item.uid === uid)) {
      do {
        uid = generateObjectiveMarkerUID()
      } while (existing.some((item) => item.uid === uid))
    }
    const [normalized] = normalizeObjectiveMarkers([{ ...marker, uid }])
    if (
      !normalized ||
      existing.some((item) => objectiveMarkersOverlap(item, normalized))
    ) {
      return undefined
    }
    get().pushPendingUndoSelectionRestore({
      pieceUIDs: [],
      objectiveMarkerUID: uid,
      restoreObjectiveMarkerSelection: false,
    })
    set((state) =>
      produce(state, (draft) => {
        draft.hexMap.objectiveMarkers = [...existing, normalized]
      }),
    )
    get().clearPendingUndoSelectionRestore()
    get().recordActionLog({
      type: 'marker',
      operation: 'add',
      label: getObjectiveMarkerLabel(normalized),
      selection: { pieceUIDs: [], objectiveMarkerUID: uid },
    })
    return uid
  },
  updateObjectiveMarker: (uid, updates) => {
    const existing = get().hexMap.objectiveMarkers ?? []
    const current = existing.find((marker) => marker.uid === uid)
    if (!current) return
    const [normalized] = normalizeObjectiveMarkers([
      { ...current, ...updates, uid },
    ])
    if (
      !normalized ||
      existing.some(
        (marker) =>
          marker.uid !== uid && objectiveMarkersOverlap(marker, normalized),
      )
    ) {
      return
    }
    if (isEqual(current, normalized)) return
    get().pushPendingUndoSelectionRestore({
      pieceUIDs: [],
      objectiveMarkerUID: uid,
    })
    set((state) =>
      produce(state, (draft) => {
        draft.hexMap.objectiveMarkers = existing.map((marker) =>
          marker.uid === uid ? normalized : marker,
        )
      }),
    )
    get().clearPendingUndoSelectionRestore()
    get().recordActionLog({
      type: 'marker',
      operation: 'edit',
      label: getObjectiveMarkerLabel(normalized),
      selection: { pieceUIDs: [], objectiveMarkerUID: uid },
    })
  },
  moveObjectiveMarker: (uid, anchor) => {
    const existing = get().hexMap.objectiveMarkers ?? []
    const current = existing.find((marker) => marker.uid === uid)
    if (!current) return
    const [normalized] = normalizeObjectiveMarkers([
      { ...current, anchor, uid },
    ])
    if (
      !normalized ||
      existing.some(
        (marker) =>
          marker.uid !== uid && objectiveMarkersOverlap(marker, normalized),
      )
    ) {
      return
    }
    if (isEqual(current, normalized)) return
    get().pushPendingUndoSelectionRestore({
      pieceUIDs: [],
      objectiveMarkerUID: uid,
    })
    set((state) =>
      produce(state, (draft) => {
        draft.hexMap.objectiveMarkers = existing.map((marker) =>
          marker.uid === uid ? normalized : marker,
        )
      }),
    )
    get().clearPendingUndoSelectionRestore()
    get().recordActionLog({
      type: 'marker',
      operation: 'move',
      label: getObjectiveMarkerLabel(normalized),
      selection: { pieceUIDs: [], objectiveMarkerUID: uid },
    })
  },
  removeObjectiveMarker: (uid) => {
    const existing = get().hexMap.objectiveMarkers ?? []
    if (!existing.some((marker) => marker.uid === uid)) return
    get().pushPendingUndoSelectionRestore({
      pieceUIDs: [],
      objectiveMarkerUID: uid,
    })
    set((state) =>
      produce(state, (draft) => {
        draft.hexMap.objectiveMarkers = existing.filter(
          (marker) => marker.uid !== uid,
        )
        if (draft.selectedObjectiveMarkerUID === uid) {
          draft.selectedObjectiveMarkerUID = null
        }
      }),
    )
    get().clearPendingUndoSelectionRestore()
    const removedMarker = existing.find((marker) => marker.uid === uid)
    if (removedMarker) {
      set((state) =>
        produce(state, (draft) => {
          draft.savedSelections = draft.savedSelections.flatMap((selection) => {
            if (selection.objectiveMarkerUID !== uid) return [selection]
            const { objectiveMarkerUID: _removed, ...withoutMarker } = selection
            return withoutMarker.pieceUIDs.length ? [withoutMarker] : []
          })
        }),
      )
      get().recordActionLog({
        type: 'marker',
        operation: 'remove',
        label: getObjectiveMarkerLabel(removedMarker),
        selection: { pieceUIDs: [], objectiveMarkerUID: uid },
      })
    }
  },
  mapPortraitBase64: '',
  addMapPortraitBase64: (pic: string) =>
    set(
      produce((state) => {
        state.hexMap.mapPortraitBase64 = pic
      }),
    ),
  changeMapName: (val: string) =>
    set((state) => {
      return produce(state, (draft) => {
        draft.hexMap.name = val
      })
    }),
  changeSetsUsed: (val: string[]) =>
    set((state) => {
      return produce(state, (draft) => {
        draft.hexMap.setsUsed = val
        const constrainedInventory = getEffectiveTerrainConstraintInventory({
          setsUsed: val,
          terrainConstraintSource: draft.terrainConstraintSource,
          customConstraintInventory: draft.customConstraintInventory,
          userPieceInventory: draft.userPieceInventory,
        })
        const constrainedPenMode =
          draft.terrainConstraintSource === 'setsUsed'
            ? getPreferredConstrainedPenMode(val)
            : getPreferredConstrainedPenModeFromInventory(constrainedInventory)
        if (!constrainedPenMode) {
          return
        }
        const isCurrentLastPenModeAvailable =
          draft.terrainConstraintSource === 'setsUsed'
            ? getAvailableLandPrefixesForSets(val).has(draft.lastPenMode)
            : getAvailableLandPrefixesForInventory(constrainedInventory).has(
                draft.lastPenMode,
              )
        if (!isCurrentLastPenModeAvailable) {
          draft.lastPenMode = constrainedPenMode
          draft.lastPenSize = getDefaultSizeForLandPrefix(constrainedPenMode)
        }
      })
    }),
  syncTerrainConstraintPenMode: () =>
    set((state) => {
      return produce(state, (draft) => {
        const constrainedInventory = getEffectiveTerrainConstraintInventory({
          setsUsed: draft.hexMap.setsUsed,
          terrainConstraintSource: draft.terrainConstraintSource,
          customConstraintInventory: draft.customConstraintInventory,
          userPieceInventory: draft.userPieceInventory,
        })
        const constrainedPenMode =
          getPreferredConstrainedPenModeFromInventory(constrainedInventory)
        if (!constrainedPenMode) {
          return
        }
        if (
          !getAvailableLandPrefixesForInventory(constrainedInventory).has(
            draft.lastPenMode,
          )
        ) {
          draft.lastPenMode = constrainedPenMode
          draft.lastPenSize = getDefaultSizeForLandPrefix(constrainedPenMode)
        }
      })
    }),
  changeAuthorName: (val: string) =>
    set((state) => {
      return produce(state, (draft) => {
        draft.hexMap.author = val
      })
    }),
  mapNotes: '',
  changeMapNotes: (val: string) =>
    set((state) => {
      return produce(state, (draft) => {
        draft.hexMap.mapNotes = val
      })
    }),
  loadMap: (mapState, options = {}) => {
    clearGlobalMaterialCache()
    clearPalmCanopyCache()
    get().pushPendingUndoSelectionRestore([])
    const current = get()
    const boardPieces = isEqual(current.boardPieces, mapState.boardPieces)
      ? current.boardPieces
      : mapState.boardPieces
    const boardHexes = isEqual(current.boardHexes, mapState.boardHexes)
      ? current.boardHexes
      : mapState.boardHexes
    const hexMap = isEqual(current.hexMap, mapState.hexMap)
      ? current.hexMap
      : mapState.hexMap
    // A map with community custom (VC) pieces turns Include VC unit/terrain
    // data on. It is a setting, not map state: no undo step, no autosave.
    const turnsOnVC =
      !current.includeVCContent && boardPiecesUseVC(mapState.boardPieces)
    const result = set((state) => {
      return produce(state, (draft) => {
        const piecesBeforeLoad = draft.boardPieces
        if (!draft.isShowStartZones || !draft.isShowGlyphs) {
          draft.selectedPieceIDs = filterVisiblePieceIDs(
            draft.selectedPieceIDs,
            [...piecesBeforeLoad, ...mapState.boardPieces],
            draft.isShowStartZones,
            draft.isShowGlyphs,
          )
          const hoveredPiece = piecesBeforeLoad.find(
            (piece) => piece.uid === draft.hoveredPieceID,
          )
          if (
            (!draft.isShowStartZones && isStartZoneBoardPiece(hoveredPiece)) ||
            (!draft.isShowGlyphs && isGlyphBoardPiece(hoveredPiece))
          ) {
            draft.hoveredPieceID = ''
          }
        }
        draft.boardHexes = boardHexes
        draft.hexMap = hexMap
        draft.boardPieces = boardPieces
        draft.savedSelections = pruneSavedSelections(
          normalizeSavedSelections(mapState.savedSelections),
          new Set(mapState.boardPieces.map((piece) => piece.uid)),
          new Set(
            (mapState.hexMap.objectiveMarkers ?? []).map(
              (marker) => marker.uid,
            ),
          ),
        )
        draft.selectedObjectiveMarkerUID = null
        draft.rotationPivot = null
        draft.conflictedPieceUIDs = computeConflictedPieceUIDs(
          mapState.boardPieces,
        )
        draft.unsupportedPieceUIDs = getUnsupportedPieceUIDs({
          boardPieces: mapState.boardPieces,
          boardHexes,
        })
        draft.isAutosaveHeld = options.holdAutosave ?? false
        draft.mapLoadRevision += 1
        if (turnsOnVC) draft.includeVCContent = true
        const constrainedInventory = getEffectiveTerrainConstraintInventory({
          setsUsed: mapState.hexMap?.setsUsed,
          terrainConstraintSource: draft.terrainConstraintSource,
          customConstraintInventory: draft.customConstraintInventory,
          userPieceInventory: draft.userPieceInventory,
        })
        if (
          !getAvailableLandPrefixesForInventory(constrainedInventory).has(
            draft.lastPenMode,
          )
        ) {
          const constrainedPenMode =
            getPreferredConstrainedPenModeFromInventory(constrainedInventory)
          if (constrainedPenMode) {
            draft.lastPenMode = constrainedPenMode
            draft.lastPenSize = getDefaultSizeForLandPrefix(constrainedPenMode)
          }
        }
      })
    })
    get().clearPendingUndoSelectionRestore()
    get().clearActionLog()
    if (turnsOnVC) {
      enqueueSnackbar({
        message: VC_MAP_LOADED_MESSAGE,
        variant: 'info',
        key: 'vc-map-loaded',
        preventDuplicate: true,
      })
    }
    if (mapState.dimensionsAdjusted) {
      enqueueSnackbar({
        message: 'Hexoscape has adjusted your map dimensions to fit all pieces',
        variant: 'info',
        key: 'map-dimensions-adjusted',
        preventDuplicate: true,
      })
    }
    return result
  },
  saveSelectedSelection: (name) => {
    const state = get()
    const pieceUIDs = state.selectedPieceIDs.filter((uid) =>
      state.boardPieces.some((piece) => piece.uid === uid),
    )
    const objectiveMarkerUID =
      state.selectedObjectiveMarkerUID &&
      state.hexMap.objectiveMarkers?.some(
        (marker) => marker.uid === state.selectedObjectiveMarkerUID,
      )
        ? state.selectedObjectiveMarkerUID
        : undefined
    const result = saveNamedSelection(
      state.savedSelections,
      { pieceUIDs, ...(objectiveMarkerUID ? { objectiveMarkerUID } : {}) },
      name,
      nanoid(10),
    )
    if (result.result === 'saved') set({ savedSelections: result.selections })
    return result.result
  },
  renameSavedSelection: (id, name) =>
    set((state) => ({
      savedSelections: renameSavedSelection(state.savedSelections, id, name),
    })),
  deleteSavedSelection: (id) =>
    set((state) => ({
      savedSelections: state.savedSelections.filter(
        (selection) => selection.id !== id,
      ),
    })),
  selectSelectionUnit: (selection, additive = false) => {
    const state = get()
    const pieceUIDs = new Set(state.boardPieces.map((piece) => piece.uid))
    const visiblePieceUIDs = new Set(
      filterVisiblePieceIDs(
        [...pieceUIDs],
        state.boardPieces,
        state.isShowStartZones,
        state.isShowGlyphs,
      ),
    )
    const objectiveMarkers = state.hexMap.objectiveMarkers ?? []
    const markerUIDs = new Set(
      filterVisibleObjectiveMarkerUIDs(
        objectiveMarkers.map((marker) => marker.uid),
        objectiveMarkers,
        state.isShowObjectiveMarkers,
      ),
    )
    const resolved = resolveSelectionUnit(
      selection,
      pieceUIDs,
      visiblePieceUIDs,
      markerUIDs,
    )
    if (!resolved) return
    const expandedPieceUIDs = new Set<string>()
    for (const uid of resolved.pieceUIDs) {
      for (const groupUID of getSeatedGroupUIDs(
        uid,
        state.boardHexes,
        state.boardPieces,
        state.hexMap.setsUsed,
      )) {
        if (visiblePieceUIDs.has(groupUID)) expandedPieceUIDs.add(groupUID)
      }
    }
    set({
      selectedPieceIDs: additive
        ? [...new Set([...state.selectedPieceIDs, ...expandedPieceUIDs])]
        : [...expandedPieceUIDs],
      selectedObjectiveMarkerUID: additive
        ? (resolved.objectiveMarkerUID ?? state.selectedObjectiveMarkerUID)
        : (resolved.objectiveMarkerUID ?? null),
      rotationPivot: null,
    })
  },
})

export default createMapSlice
