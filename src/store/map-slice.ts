import { produce } from 'immer'
import type { StateCreator } from 'zustand'
import { addPiece } from '../data/addPiece'
import { removePiece } from '../data/removePiece'
import type {
  AddRemovePieceError,
  BoardHex,
  CubeCoordinate,
  MapState,
  Piece,
} from '../types'
import type { AppState } from './store'
import { getBoardPiecesMaxLevel } from '../utils/map-utils'

export interface MapSlice extends MapState {
  paintTile: (args: PaintTileArgs) => AddRemovePieceError
  unpaintTile: (pieceID: string) => void
  loadMap: (map: MapState) => void
  changeMapName: (mapName: string) => void
}

type PaintTileArgs = {
  piece: Piece
  clickedHexCoords: CubeCoordinate
  altitude: number
  rotation: number
}

const createMapSlice: StateCreator<AppState, [], [], MapSlice> = (set) => ({
  boardHexes: {},
  hexMap: { id: '', name: '', shape: 'rectangle', width: 20, length: 20 },
  boardPieces: {},
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
        draft.viewingLevel = getBoardPiecesMaxLevel(newBoardPieces) > state.viewingLevel ? getBoardPiecesMaxLevel(newBoardPieces) : state.viewingLevel
        draft.boardHexes = newBoardHexes
        draft.boardPieces = newBoardPieces
      })
    })
    return error
  },
  unpaintTile: (pieceID: string) =>
    set((state) => {
      return produce(state, (draft) => {
        const { newBoardHexes, newBoardPieces, error } = removePiece({
          pieceID,
          boardHexes: draft.boardHexes,
          boardPieces: draft.boardPieces,
        })
        draft.viewingLevel = getBoardPiecesMaxLevel(newBoardPieces) < state.viewingLevel ? getBoardPiecesMaxLevel(newBoardPieces) : state.viewingLevel
        draft.boardHexes = newBoardHexes
        draft.boardPieces = newBoardPieces
      })
    }),
  changeMapName: (mapName: string) =>
    set((state) => {
      return produce(state, (draft) => {
        draft.hexMap.name = mapName
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
