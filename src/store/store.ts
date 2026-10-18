import { isEqual } from 'lodash'
import { temporal } from 'zundo'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { LS_KEYS } from '../local-storage/keys'
import {
  mapStorage,
  partializeMap,
  saveMapPortrait,
} from '../local-storage/mapStorage'
import createMapSlice, { type MapSlice } from './map-slice'
import createUISlice, { type UISlice } from './ui-slice'

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
        storage: mapStorage,
        partialize: partializeMap,
        skipHydration: true,
      },
    ),
    // undo/redo config object
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

useBoundStore.subscribe((state, previous) => {
  if (
    state.hexMap.id !== previous.hexMap.id ||
    state.hexMap.mapPortraitBase64 !== previous.hexMap.mapPortraitBase64
  ) {
    saveMapPortrait(state.hexMap)
  }
})

export default useBoundStore
