import { produce } from 'immer'
import { isEqual } from 'lodash'
import { nanoid } from 'nanoid'
import { enqueueSnackbar } from 'notistack'
import type { StateCreator } from 'zustand'
import { addPiece } from '../data/addPiece'
import { getNewPieceSizeForPenMode } from '../data/flatPieceSizes'
import { evaluateLaurAddonConflicts } from '../data/laurAddonConflicts'
import { getUnsupportedLaurAddonUIDs } from '../data/laurAddonSupport'
import { getPieceEdgeId } from '../data/hexGrid/pieceFeatures'
import { type MovePieceArgs, applyPieceMoves } from '../data/movePieces'
import {
  type NewObjectiveMarker,
  type ObjectiveMarker,
  type ObjectiveMarkerAnchor,
  generateObjectiveMarkerUID,
  normalizeObjectiveMarkers,
  objectiveMarkersOverlap,
} from '../data/objectiveMarkers'
import { piecesSoFar } from '../data/pieces'
import { computeConflictedPieceUIDs } from '../data/rebuildBoardState'
import { removePiece } from '../data/removePiece'
import { reanchorRotationPivotAfterRotation } from '../data/rotationPivot'
import {
  normalizeSavedSelections,
  pruneDeletedPiece,
  pruneSavedSelections,
  renameSavedSelection,
  resolveSelectionUnit,
  saveNamedSelection,
  type SavedSelection,
  type SelectionUnit,
} from '../data/selectionUnits'
import {
  filterVisiblePieceIDs,
  isStartZoneBoardPiece,
} from '../data/startZoneVisibility'
import { filterVisibleObjectiveMarkerUIDs } from '../data/objectiveMarkerVisibility'
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
}

type ConvertTerrainArgs = {
  selectedUIDs: string[]
  targetInventoryBySourceInventory: Record<string, string>
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
        draft.unsupportedPieceUIDs = getUnsupportedLaurAddonUIDs({
          boardPieces: draft.boardPieces,
        })
      }),
    ),
  paintTile: ({
    piece,
    clickedHexCoords,
    altitude,
    rotation,
  }: PaintTileArgs): AddRemovePieceError => {
    let error: AddRemovePieceError
    const uid = nanoid(10)
    get().pushPendingUndoSelectionRestore({
      pieceUIDs: [uid],
      objectiveMarkerUID: null,
    })
    set((state) => {
      return produce(state, (draft) => {
        const {
          newBoardHexes,
          newBoardPieces,
          error: addPieceError,
        } = addPiece({
          piece,
          boardHexes: draft.boardHexes,
          boardPieces: draft.boardPieces,
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
        draft.unsupportedPieceUIDs = getUnsupportedLaurAddonUIDs({
          boardPieces: newBoardPieces,
        })
      })
    })
    get().clearPendingUndoSelectionRestore()
    if (!error) {
      get().recordActionLog({
        type: 'place',
        pieceName: piece.title,
        selection: { pieceUIDs: [uid] },
      })
    }
    return error
  },
  unpaintTile: (uid: string) => {
    const removedPiece = get().boardPieces.find((piece) => piece.uid === uid)
    if (removedPiece) {
      get().pushPendingUndoSelectionRestore({
        pieceUIDs: [uid],
        objectiveMarkerUID: null,
      })
    }
    set((state) => {
      return produce(state, (draft) => {
        draft.rotationPivot = null
        // 1. Remove the piece being deleted
        let { newBoardHexes: workingHexes, newBoardPieces: workingPieces } =
          removePiece({
            uid,
            boardHexes: draft.boardHexes,
            boardPieces: draft.boardPieces,
          })

        const newConflicts = new Set<string>()

        // 2. Restore hexes for previously-conflicted pieces (same as in movePiece)
        for (const conflictedUID of draft.conflictedPieceUIDs) {
          if (conflictedUID === uid) continue
          const conflictedBP = workingPieces.find(
            (bp) => bp.uid === conflictedUID,
          )
          if (!conflictedBP) continue
          const conflictedPiece = piecesSoFar[conflictedBP.inventoryID]
          if (!conflictedPiece) continue
          // Remove from the pieces array (hexes are already absent/overwritten)
          const removeResult = removePiece({
            uid: conflictedUID,
            boardHexes: workingHexes,
            boardPieces: workingPieces,
          })
          // Re-add with fresh hexes
          const addResult = addPiece({
            piece: conflictedPiece,
            boardHexes: removeResult.newBoardHexes,
            boardPieces: removeResult.newBoardPieces,
            pieceCoords: conflictedBP.pieceCoords,
            placementAltitude: conflictedBP.altitude,
            rotation: conflictedBP.rotation,
            isVsTile: false,
            uid: conflictedUID,
            permissive: true,
          })
          workingHexes = addResult.newBoardHexes
          workingPieces = addResult.newBoardPieces
          // Track any residual conflicts among the restored pieces themselves
          for (const duid of addResult.displacedUIDs ?? []) {
            newConflicts.add(duid)
          }
          if (addResult.displacedUIDs?.length) newConflicts.add(conflictedUID)
        }

        draft.boardHexes = workingHexes
        draft.boardPieces = workingPieces
        draft.savedSelections = pruneDeletedPiece(draft.savedSelections, uid)
        draft.conflictedPieceUIDs = [
          ...new Set([
            ...newConflicts,
            ...evaluateLaurAddonConflicts(workingPieces, workingHexes),
          ]),
        ]
        draft.unsupportedPieceUIDs = getUnsupportedLaurAddonUIDs({
          boardPieces: workingPieces,
        })
      })
    })
    get().clearPendingUndoSelectionRestore()
    if (removedPiece) {
      get().recordActionLog({
        type: 'delete',
        pieceName:
          piecesSoFar[removedPiece.inventoryID]?.title ??
          removedPiece.inventoryID,
        selection: { pieceUIDs: [uid] },
      })
    }
  },
  convertTerrainForPieces: ({
    selectedUIDs,
    targetInventoryBySourceInventory,
  }: ConvertTerrainArgs): number => {
    let convertedCount = 0
    const affectedUIDs = [
      ...new Set(
        selectedUIDs.filter((uid) => {
          const boardPiece = get().boardPieces.find(
            (piece) => piece.uid === uid,
          )
          if (!boardPiece) return false
          const targetInventoryID =
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

        for (const uid of selectedUIDs) {
          const boardPiece = workingPieces.find((bp) => bp.uid === uid)
          if (!boardPiece) continue

          const targetInventoryID =
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
        if (occupancyChanged) {
          draft.boardHexes = workingHexes
          draft.conflictedPieceUIDs = computeConflictedPieceUIDs(workingPieces)
          draft.unsupportedPieceUIDs = getUnsupportedLaurAddonUIDs({
            boardPieces: workingPieces,
          })
        }
      })
    })
    get().clearPendingUndoSelectionRestore()
    if (convertedCount) {
      get().recordActionLog({
        type: 'convert',
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
    const selectionRecordUIDs: string[] = []
    const seenMoveUIDs = new Set<string>()
    for (const move of moves) {
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
      const effectiveMoves = moves.filter((move, index) => {
        if (
          moves.findIndex((candidate) => candidate.uid === move.uid) !== index
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
    for (const move of moves) {
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
    const result = set((state) => {
      return produce(state, (draft) => {
        const piecesBeforeLoad = draft.boardPieces
        if (!draft.isShowStartZones) {
          draft.selectedPieceIDs = filterVisiblePieceIDs(
            draft.selectedPieceIDs,
            [...piecesBeforeLoad, ...mapState.boardPieces],
            false,
          )
          if (
            isStartZoneBoardPiece(
              piecesBeforeLoad.find(
                (piece) => piece.uid === draft.hoveredPieceID,
              ),
            )
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
        draft.unsupportedPieceUIDs = getUnsupportedLaurAddonUIDs({
          boardPieces: mapState.boardPieces,
        })
        draft.isAutosaveHeld = options.holdAutosave ?? false
        draft.mapLoadRevision += 1
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
    set({
      selectedPieceIDs: additive
        ? [...new Set([...state.selectedPieceIDs, ...resolved.pieceUIDs])]
        : resolved.pieceUIDs,
      selectedObjectiveMarkerUID: additive
        ? (resolved.objectiveMarkerUID ?? state.selectedObjectiveMarkerUID)
        : (resolved.objectiveMarkerUID ?? null),
      rotationPivot: null,
    })
  },
})

export default createMapSlice
