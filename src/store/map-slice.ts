import { produce } from 'immer'
import type { StateCreator } from 'zustand'
import type {
  BoardHexes,
  BoardPiece,
  MapState,
} from '../types'
import type { AppState } from './store'
import { LS_KEYS } from '../local-storage/keys'
import { loadMapFromLocalStorage } from '../local-storage/get-local-item'
import { encodeBoardPieces } from '../utils/map-utils'

export interface MapSlice extends MapState {
  boardHexes: BoardHexes
  paintTile: (piece: BoardPiece) => void
  unpaintTile: (boardPieceUid: string) => void
  updateBoardHexes: (bh: BoardHexes) => void
  loadMap: (map: MapState) => void
  addMapPortraitBase64: (pic: string) => void
  changeMapName: (val: string) => void
  changeSetsUsed: (val: string[]) => void
  changeAuthorName: (val: string) => void
  changeMapNotes: (val: string) => void
}

// Here, we duplicate lastMap in case the user is loading a URL, which will immediately overwrite lastMap,
// we can offer them the chance to load their last map instead of the URL (in useAutoLoadMapFile.tsx)
const localLastMap = loadMapFromLocalStorage(LS_KEYS.lastMap)
if (localLastMap) {
  localStorage.setItem(
    LS_KEYS.lastMapCache,
    JSON.stringify(localLastMap),
  )
}


const createMapSlice: StateCreator<AppState, [], [], MapSlice> = (set) => ({
  boardHexes: {},
  hexMap: {
    id: '',
    name: '',
    author: '',
    shape: 'rectangle',
    width: 20,
    length: 20,
  },
  boardPieces: [],
  paintTile: (piece: BoardPiece) => {
    set((state) => {
      return produce(state, (draft) => {
        // we added a piece. ___X go up piece height
        const placedAtLevel = piece.altitude + 1
        draft.viewingLevel =
          placedAtLevel > state.viewingLevel
            ? state.viewingLevel + (placedAtLevel - state.viewingLevel)
            : state.viewingLevel
        draft.boardPieces.push(piece)
      })
    })
  },
  unpaintTile: (boardPieceUid: string) =>
    set((state) => {
      return produce(state, (draft) => {
        // new mode which is not implemented yet, where selectedPieceID is a uid, not an encoded id
        const potentialPieceToBeDeleted = state.boardPieces.find(bp => bp.uid === boardPieceUid)
        if (potentialPieceToBeDeleted) {
          draft.boardPieces = state.boardPieces.filter((bp) => bp.uid !== boardPieceUid)
        }
        // legacy mode to be deprecated soon
        const encodedBoardPieces = encodeBoardPieces(state.boardPieces)
        const potentialIndexToBeDeleted = encodedBoardPieces.findIndex((pid) => pid === boardPieceUid)
        if (potentialIndexToBeDeleted >= 0) {
          draft.boardPieces = state.boardPieces.filter((_bp, i) => i !== potentialIndexToBeDeleted)
        }
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
  updateBoardHexes: (bh: BoardHexes) => {
    set((state) => {
      return produce(state, (draft) => {
        draft.boardHexes = bh
      })
    })
  },
  loadMap: (mapState: MapState) =>
    set((state) => {
      return produce(state, (draft) => {
        draft.hexMap = mapState.hexMap
        draft.boardPieces = mapState.boardPieces
      })
    }),
})

export default createMapSlice
