import { produce } from 'immer'
import type { StateCreator } from 'zustand'
import { addPiece } from '../data/addPiece'
import { removePiece } from '../data/removePiece'
import type {
  AddRemovePieceError,
  CubeCoordinate,
  MapState,
  Piece,
} from '../types'
import type { AppState } from './store'
import { LS_KEYS } from '../local-storage/keys'
import { normalizeBoardPieces } from '../utils/map-utils'

export interface MapSlice extends MapState {
  paintTile: (args: PaintTileArgs) => AddRemovePieceError
  unpaintTile: (pieceID: string) => void
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

// Here, we cache the local map in case the user is loading a URL, we can offer them the chance to load their last map instead (in useAutoLoadMapFile)
let localLastMap: { state: MapState } | undefined
if (localStorage.getItem(LS_KEYS.lastMap)) {
  localLastMap = JSON.parse(localStorage?.getItem(LS_KEYS.lastMap) ?? '{}')
  if (localLastMap?.state) {
    localStorage.setItem(
      LS_KEYS.lastMapCache,
      JSON.stringify({
        ...localLastMap.state,
        boardPieces: normalizeBoardPieces(localLastMap.state.boardPieces)
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
    // sets: '',
    shape: 'rectangle',
    width: 20,
    length: 20,
  },
  boardPieces: [],
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
        })
        error = addPieceError
        // we added a piece. ___X go up piece height, __xX|
        const placedAtLevel = altitude + 1
        draft.viewingLevel =
          placedAtLevel > state.viewingLevel
            ? state.viewingLevel + (placedAtLevel - state.viewingLevel)
            : state.viewingLevel
        draft.boardHexes = newBoardHexes
        draft.boardPieces = newBoardPieces
      })
    })
    return error
  },
  unpaintTile: (pieceID: string) =>
    set((state) => {
      return produce(state, (draft) => {
        const { newBoardHexes, newBoardPieces } = removePiece({
          pieceID,
          boardHexes: draft.boardHexes,
          boardPieces: draft.boardPieces,
        })
        // draft.viewingLevel =
        //   getBoardPiecesMaxLevel(newBoardPieces) < state.viewingLevel
        //     ? getBoardPiecesMaxLevel(newBoardPieces)
        //     : state.viewingLevel
        draft.boardHexes = newBoardHexes
        draft.boardPieces = newBoardPieces
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
      })
    }),
})

export default createMapSlice
