import { temporal } from 'zundo'
import { create } from 'zustand'
import { enqueueSnackbar } from 'notistack'
import { LS_KEYS } from '../local-storage/keys'
import { createMapAutosave } from '../local-storage/mapAutosave'
import {
  createSettingsWriter,
  pickSettings,
  settingsChanged,
} from '../local-storage/settings'
import { safeRemove, safeSetItem } from '../local-storage/safeStorage'
import { trackStoreSubscriptions } from '../performance/performanceFlags'
import createMapSlice, { type MapSlice } from './map-slice'
import createUISlice, { type UISlice } from './ui-slice'

export type AppState = MapSlice & UISlice

const useBoundStore = create<AppState>()(
  trackStoreSubscriptions(
    temporal(
      (...a) => ({
        ...createMapSlice(...a),
        ...createUISlice(...a),
      }),
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
          pastState.boardHexes === currentState.boardHexes &&
          pastState.boardPieces === currentState.boardPieces &&
          pastState.hexMap === currentState.hexMap,
      },
    ),
  ),
)

createMapAutosave(useBoundStore)

const settingsWriter = createSettingsWriter(
  {
    setItem: (key, value) => {
      const result = safeSetItem(key, value)
      if (!result.ok && typeof enqueueSnackbar === 'function') {
        enqueueSnackbar({
          message: result.quota
            ? 'Storage is full. Your settings could not be saved.'
            : 'Your settings could not be saved locally.',
          variant: 'warning',
          preventDuplicate: true,
          key: 'settings-storage-error',
        })
      }
      return result.ok
    },
    removeItem: (key) => {
      const ok = safeRemove(key)
      if (!ok && typeof enqueueSnackbar === 'function') {
        enqueueSnackbar({
          message: 'Your settings could not be reset locally.',
          variant: 'warning',
          preventDuplicate: true,
          key: 'settings-storage-error',
        })
      }
      return ok
    },
  },
  300,
)

useBoundStore.subscribe((state, previous) => {
  const currentSettings = pickSettings(state)
  const previousSettings = pickSettings(previous)
  if (settingsChanged(previousSettings, currentSettings)) {
    settingsWriter.schedule(currentSettings)
  }
})

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') settingsWriter.flush()
  })
}

if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', settingsWriter.flush)
}

export default useBoundStore
