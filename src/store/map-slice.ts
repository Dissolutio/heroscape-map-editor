import { produce } from 'immer'
import type { StateCreator } from 'zustand'
import { addPiece } from '../data/addPiece'
import { removePiece } from '../data/removePiece'
import { piecesSoFar } from '../data/pieces'
import type {
  AddRemovePieceError,
  CubeCoordinate,
  MapState,
  Piece,
} from '../types'
import type { AppState } from './store'
import { LS_KEYS } from '../local-storage/keys'
import { normalizeBoardPieces } from '../utils/map-utils'
import { loadMapFromLocalStorage } from '../local-storage/get-local-item'

function computeConflictedPieceUIDs(boardPieces: MapState['boardPieces']) {
  const conflicts = new Set<string>()
  let workingHexes: MapState['boardHexes'] = {}
  let workingPieces: MapState['boardPieces'] = []

  for (const boardPiece of normalizeBoardPieces(boardPieces)) {
    const piece = piecesSoFar[boardPiece.inventoryID]
    if (!piece) continue

    const result = addPiece({
      piece,
      boardHexes: workingHexes,
      boardPieces: workingPieces,
      pieceCoords: boardPiece.pieceCoords,
      placementAltitude: boardPiece.altitude,
      rotation: boardPiece.rotation,
      isVsTile: false,
      uid: boardPiece.uid,
      permissive: true,
    })

    workingHexes = result.newBoardHexes
    workingPieces = result.newBoardPieces
    for (const displacedUID of result.displacedUIDs ?? []) {
      conflicts.add(displacedUID)
      conflicts.add(boardPiece.uid)
    }
  }

  return [...conflicts]
}

export interface MapSlice extends MapState {
  conflictedPieceUIDs: string[]
  paintTile: (args: PaintTileArgs) => AddRemovePieceError
  unpaintTile: (uid: string) => void
  movePiece: (args: MovePieceArgs) => void
  loadMap: (map: MapState) => void
  addMapPortraitBase64: (pic: string) => void
  changeMapName: (val: string) => void
  changeSetsUsed: (val: string[]) => void
  changeAuthorName: (val: string) => void
  changeMapNotes: (val: string) => void
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

// Here, we duplicate lastMap in case the user is loading a URL, which will immediately overwrite lastMap,
// we can offer them the chance to load their last map instead of the URL (in useAutoLoadMapFile.tsx)
const localLastMap = loadMapFromLocalStorage(LS_KEYS.lastMap)
if (localLastMap) {
  localStorage.setItem(LS_KEYS.lastMapCache, JSON.stringify(localLastMap))
}

const createMapSlice: StateCreator<AppState, [], [], MapSlice> = (set) => ({
  boardHexes: {},
  hexMap: {
    id: '',
    name: '',
    author: '',
    // sets: '',
    shape: 'rectangle',
    width: 20,
    length: 20,
  },
  boardPieces: [],
  conflictedPieceUIDs: [],
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
  loadMap: (mapState: MapState) =>
    set((state) => {
      return produce(state, (draft) => {
        draft.boardHexes = mapState.boardHexes
        draft.hexMap = mapState.hexMap
        draft.boardPieces = mapState.boardPieces
        draft.conflictedPieceUIDs = computeConflictedPieceUIDs(
          mapState.boardPieces,
        )
      })
    }),
})

export default createMapSlice
