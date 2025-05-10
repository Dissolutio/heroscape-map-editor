import { isEqual } from 'lodash'
import { temporal } from 'zundo'
import { create } from 'zustand'
import createMapSlice, { MapSlice } from './map-slice'
import createUISlice, { UISlice } from './ui-slice'

export type AppState = MapSlice & UISlice

const useBoundStore = create<AppState>()(
  temporal(
    (...a) => ({
      ...createMapSlice(...a),
      ...createUISlice(...a),
    }),
    {
      limit: 30,
      // onSave: (state) => console.log('saved', state),
      partialize: (state) => {
        return {
          boardHexes: state.boardHexes,
          boardPieces: state.boardPieces,
          hexMap: state.hexMap,
        }
      },
      equality: (pastState, currentState) =>
        isEqual(pastState.boardHexes, currentState.boardHexes) &&
        isEqual(pastState.boardPieces, currentState.boardPieces) &&
        isEqual(pastState.hexMap, currentState.hexMap),
    },
  ),
)

export default useBoundStore
