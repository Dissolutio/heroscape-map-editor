import { produce } from 'immer'
import { StateCreator } from 'zustand'
import { addPiece } from '../data/addPiece'
import { BoardHex, MapState, Piece } from '../types'
import { AppState } from './store'

export interface MapSlice extends MapState {
  paintTile: (args: PaintTileArgs) => void
  removePieceByPieceID: (pieceID: string) => void
  loadMap: (map: MapState) => void
  changeMapName: (mapName: string) => void
}

type PaintTileArgs = {
  piece: Piece
  clickedHex: BoardHex
  rotation: number
  laurSide?: string
}

const createMapSlice: StateCreator<AppState, [], [], MapSlice> = (set) => ({
  boardHexes: {},
  hexMap: { id: '', name: '', shape: 'rectangle', width: 20, length: 20 },
  boardPieces: {},
  paintTile: ({ piece, clickedHex, rotation }: PaintTileArgs) =>
    set((state) => {
      return produce(state, (draft) => {
        const { newBoardHexes, newBoardPieces } = addPiece({
          piece,
          boardHexes: draft.boardHexes,
          boardPieces: draft.boardPieces,
          pieceCoords: clickedHex,
          placementAltitude: clickedHex.altitude,
          rotation,
          isVsTile: false,
        })
        draft.boardHexes = newBoardHexes
        draft.boardPieces = newBoardPieces
      })
    }),
  removePieceByPieceID: (pieceID: string) =>
    set((state) => {
      return produce(state, (draft) => {
        delete draft.boardPieces[pieceID]
      })
    }),
  // deleteLandPiece: ({ piece, clickedHex }: {
  //   piece: Piece
  //   clickedHex: BoardHex
  // }) =>
  //   set((state) => {
  //     return produce(state, (draft) => {
  //       const { newBoardHexes, newBoardPieces } = addPiece({
  //         piece,
  //         boardHexes: draft.boardHexes,
  //         boardPieces: draft.boardPieces,
  //         pieceCoords: clickedHex,
  //         placementAltitude: clickedHex.altitude,
  //         rotation,
  //         isVsTile: false,
  //       })
  //       draft.boardHexes = newBoardHexes
  //       draft.boardPieces = newBoardPieces
  //     })
  //   }),
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
