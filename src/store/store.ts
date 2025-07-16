import { isEqual } from 'lodash'
import { temporal } from 'zundo'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import createMapSlice, { type MapSlice } from './map-slice'
import createUISlice, { type UISlice } from './ui-slice'
import { LS_KEYS } from '../local-storage/keys'

export type AppState = MapSlice & UISlice

const useBoundStore = create<AppState>()(
  temporal(
    persist(
      (...a) => ({
        ...createMapSlice(...a),
        ...createUISlice(...a),
      }),
      {
        name: LS_KEYS.lastMap, // name of the item in the storage (must be unique)
        // storage: createJSONStorage(() => sessionStorage), // (optional) by default, 'localStorage' is used
        partialize: (state) => {
          return {
            boardHexes: state.boardHexes,
            boardPieces: state.boardPieces,
            hexMap: state.hexMap,
            mapNotes: state.mapNotes,
            mapPortraitBase64: state.mapPortraitBase64,
          }
        },
        // skipHydration: true,
      },
    ),
    {
      limit: 30,
      // onSave: (state) => console.log('saved', state),
      partialize: (state) => {
        return {
          boardHexes: state.boardHexes,
          boardPieces: state.boardPieces,
          hexMap: state.hexMap,
          viewingLevel: state.viewingLevel,
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
