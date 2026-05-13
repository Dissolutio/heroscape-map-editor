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
          displacedUIDs,
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
        // update conflict tracking
        const conflicts = new Set(draft.conflictedPieceUIDs)
        for (const duid of (displacedUIDs ?? [])) {
          conflicts.add(duid)
        }
        draft.conflictedPieceUIDs = [...conflicts]
      })
    })
    return error
  },
  unpaintTile: (uid: string) =>
    set((state) => {
      return produce(state, (draft) => {
        const { newBoardHexes, newBoardPieces } = removePiece({
          uid,
          boardHexes: draft.boardHexes,
          boardPieces: draft.boardPieces,
        })
        draft.boardHexes = newBoardHexes
        draft.boardPieces = newBoardPieces
        // remove from conflict tracking
        draft.conflictedPieceUIDs = draft.conflictedPieceUIDs.filter(
          (id) => id !== uid,
        )
      })
    }),
  movePiece: ({ uid, newPieceCoords, newAltitude, newRotation }: MovePieceArgs) =>
    set((state) => {
      return produce(state, (draft) => {
        const boardPiece = draft.boardPieces.find((bp) => bp.uid === uid)
        if (!boardPiece) return
        const piece = piecesSoFar[boardPiece.inventoryID]
        if (!piece) return
        // 1. Remove the piece (clears its hexes from boardHexes, removes from boardPieces)
        const { newBoardHexes: clearedHexes, newBoardPieces: clearedPieces } =
          removePiece({
            uid,
            boardHexes: draft.boardHexes,
            boardPieces: draft.boardPieces,
          })
        // 2. Re-add at new position, permissive (always succeeds)
        const {
          newBoardHexes,
          newBoardPieces,
          displacedUIDs,
        } = addPiece({
          piece,
          boardHexes: clearedHexes,
          boardPieces: clearedPieces,
          pieceCoords: newPieceCoords,
          placementAltitude: newAltitude ?? boardPiece.altitude,
          rotation: newRotation ?? boardPiece.rotation,
          isVsTile: false,
          uid,
          permissive: true,
        })
        draft.boardHexes = newBoardHexes
        draft.boardPieces = newBoardPieces
        // 3. Update conflict tracking
        const conflicts = new Set(
          draft.conflictedPieceUIDs.filter((id) => id !== uid),
        )
        for (const duid of (displacedUIDs ?? [])) {
          conflicts.add(duid)
        }
        if (displacedUIDs?.length) conflicts.add(uid)
        draft.conflictedPieceUIDs = [...conflicts]
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
        draft.conflictedPieceUIDs = []
      })
    }),
})

export default createMapSlice
