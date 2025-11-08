import { produce } from 'immer'
import type { StateCreator } from 'zustand'
import { addPiece } from '../data/addPiece'
import { removePiece } from '../data/removePiece'
import type {
  AddRemovePieceError,
  BoardPiece,
  CubeCoordinate,
  MapFileState,
  MapState,
  Piece,
} from '../types'
import type { AppState } from './store'
import { LS_KEYS } from '../local-storage/keys'
import { normalizeBoardPieces } from '../utils/map-utils'

export interface MapSlice extends MapState {
  paintTile: (piece: BoardPiece) => void
  unpaintTile: (boardPieceUid: string) => void
  loadMap: (map: MapState) => void
  addMapPortraitBase64: (pic: string) => void
  changeMapName: (val: string) => void
  changeSetsUsed: (val: string[]) => void
  changeAuthorName: (val: string) => void
  changeMapNotes: (val: string) => void
}

// Here, we duplicate lastMap in case the user is loading a URL, which will immediately overwrite lastMap,
// we can offer them the chance to load their last map instead of the URL (in useAutoLoadMapFile.tsx)
let localLastMap: { state: MapFileState } | undefined
if (localStorage.getItem(LS_KEYS.lastMap)) {
  localLastMap = JSON.parse(localStorage?.getItem(LS_KEYS.lastMap) ?? '{}')
  if (localLastMap?.state) {
    localStorage.setItem(
      LS_KEYS.lastMapCache,
      JSON.stringify({
        ...localLastMap.state,
        boardPieces: normalizeBoardPieces(localLastMap.state.boardPieces),
      }),
    )
  }
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
        draft.boardPieces = state.boardPieces.filter((bp) => bp.uid !== boardPieceUid)
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
        // draft.boardHexes = mapState.boardHexes
        draft.hexMap = mapState.hexMap
        draft.boardPieces = mapState.boardPieces
      })
    }),
})

export default createMapSlice
