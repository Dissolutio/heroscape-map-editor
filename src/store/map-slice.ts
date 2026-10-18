import { produce } from 'immer'
import type { StateCreator } from 'zustand'
import { addPiece } from '../data/addPiece'
import { getNewPieceSizeForPenMode } from '../data/flatPieceSizes'
import { piecesSoFar } from '../data/pieces'
import { computeConflictedPieceUIDs } from '../data/rebuildBoardState'
import { removePiece } from '../data/removePiece'
import { HexTerrain } from '../types'
import type {
  AddRemovePieceError,
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
  conflictedPieceUIDs: string[]
  isAutosaveHeld: boolean
  mapLoadRevision: number
  recomputeConflicts: () => void
  paintTile: (args: PaintTileArgs) => AddRemovePieceError
  unpaintTile: (uid: string) => void
  convertTerrainForPieces: (args: ConvertTerrainArgs) => number
  movePiece: (args: MovePieceArgs) => void
  loadMap: (map: MapState, options?: LoadMapOptions) => void
  addMapPortraitBase64: (pic: string) => void
  changeMapName: (val: string) => void
  changeSetsUsed: (val: string[]) => void
  syncTerrainConstraintPenMode: () => void
  changeAuthorName: (val: string) => void
  changeMapNotes: (val: string) => void
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

type MovePieceArgs = {
  uid: string
  newPieceCoords: CubeCoordinate
  newAltitude?: number
  newRotation?: number
}

type ConvertTerrainArgs = {
  selectedUIDs: string[]
  targetInventoryBySourceInventory: Record<string, string>
}

const createMapSlice: StateCreator<AppState, [], [], MapSlice> = (set) => ({
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
  conflictedPieceUIDs: [],
  isAutosaveHeld: false,
  mapLoadRevision: 0,
  recomputeConflicts: () =>
    set((state) =>
      produce(state, (draft) => {
        draft.conflictedPieceUIDs = computeConflictedPieceUIDs(
          draft.boardPieces,
        )
      }),
    ),
  paintTile: ({
    piece,
    clickedHexCoords,
    altitude,
    rotation,
  }: PaintTileArgs): AddRemovePieceError => {
    let error: AddRemovePieceError
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
          permissive: true,
        })
        error = addPieceError
        // we added a piece. ___X go up piece height
        const placedAtLevel = altitude + 1
        draft.viewingLevel =
          placedAtLevel > state.viewingLevel
            ? state.viewingLevel + (placedAtLevel - state.viewingLevel)
            : state.viewingLevel
        draft.boardHexes = newBoardHexes
        draft.boardPieces = newBoardPieces
        // Recompute from boardPieces so conflict state stays correct even after load/rehydrate drift.
        draft.conflictedPieceUIDs = computeConflictedPieceUIDs(newBoardPieces)
      })
    })
    return error
  },
  unpaintTile: (uid: string) =>
    set((state) => {
      return produce(state, (draft) => {
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
        draft.conflictedPieceUIDs = [...newConflicts]
      })
    }),
  convertTerrainForPieces: ({
    selectedUIDs,
    targetInventoryBySourceInventory,
  }: ConvertTerrainArgs): number => {
    let convertedCount = 0
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
        }
      })
    })
    return convertedCount
  },
  movePiece: ({
    uid,
    newPieceCoords,
    newAltitude,
    newRotation,
  }: MovePieceArgs) =>
    set((state) => {
      return produce(state, (draft) => {
        const boardPiece = draft.boardPieces.find((bp) => bp.uid === uid)
        if (!boardPiece) return
        const piece = piecesSoFar[boardPiece.inventoryID]
        if (!piece) return

        // 1. Remove the moving piece, clearing its hex ownership
        let { newBoardHexes: workingHexes, newBoardPieces: workingPieces } =
          removePiece({
            uid,
            boardHexes: draft.boardHexes,
            boardPieces: draft.boardPieces,
          })

        const newConflicts = new Set<string>()

        // 2. Restore hexes for every previously-conflicted piece.
        //    When this piece overwrote another's hexes, those hexes now carry this
        //    piece's UID (or are gone after step 1). We remove each conflicted piece
        //    from boardPieces then re-add it so its hex entries are fresh and correct.
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

        // 3. Place the moving piece at its new position
        const { newBoardHexes, newBoardPieces } = addPiece({
          piece,
          boardHexes: workingHexes,
          boardPieces: workingPieces,
          pieceCoords: newPieceCoords,
          placementAltitude: newAltitude ?? boardPiece.altitude,
          rotation: newRotation ?? boardPiece.rotation,
          isVsTile: false,
          uid,
          permissive: true,
        })
        draft.boardHexes = newBoardHexes
        draft.boardPieces = newBoardPieces

        // Recompute globally so move and paint use the same conflict source of truth.
        draft.conflictedPieceUIDs = computeConflictedPieceUIDs(newBoardPieces)
      })
    }),
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
  loadMap: (mapState: MapState, options = {}) => {
    clearGlobalMaterialCache()
    return set((state) => {
      return produce(state, (draft) => {
        draft.boardHexes = mapState.boardHexes
        draft.hexMap = mapState.hexMap
        draft.boardPieces = mapState.boardPieces
        draft.conflictedPieceUIDs = computeConflictedPieceUIDs(
          mapState.boardPieces,
        )
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
  },
})

export default createMapSlice
