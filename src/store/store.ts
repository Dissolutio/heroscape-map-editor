import { enqueueSnackbar } from 'notistack'
import { temporal } from 'zundo'
import { create } from 'zustand'
import { LS_KEYS } from '../local-storage/keys'
import { createMapAutosave } from '../local-storage/mapAutosave'
import { safeRemove, safeSetItem } from '../local-storage/safeStorage'
import {
  createSettingsWriter,
  pickSettings,
  settingsChanged,
} from '../local-storage/settings'
import { trackStoreSubscriptions } from '../performance/performanceFlags'
import createActionLogSlice, { type ActionLogSlice } from './action-log-slice'
import createMapSlice, { type MapSlice } from './map-slice'
import createUISlice, {
  EMPTY_UNDO_SELECTION_RESTORE,
  type UISlice,
} from './ui-slice'

export type AppState = MapSlice & UISlice & ActionLogSlice

let temporalHistoryWasSaved = false

const useBoundStore = create<AppState>()(
  trackStoreSubscriptions(
    temporal(
      (...a) => ({
        ...createMapSlice(...a),
        ...createUISlice(...a),
        ...createActionLogSlice(...a),
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
            objectiveMarkers: state.hexMap.objectiveMarkers,
            viewingLevel: state.viewingLevel,
          }
        },
        equality: (pastState, currentState) =>
          pastState.boardHexes === currentState.boardHexes &&
          pastState.boardPieces === currentState.boardPieces &&
          pastState.hexMap === currentState.hexMap &&
          pastState.objectiveMarkers === currentState.objectiveMarkers,
        onSave: () => {
          const actions = useBoundStore.getState()
          const record =
            actions.consumePendingUndoSelectionRestore() ??
            EMPTY_UNDO_SELECTION_RESTORE
          actions.pushUndoSelectionRestore(record)
          temporalHistoryWasSaved = true
        },
      },
    ),
  ),
)

let knownPastCount = useBoundStore.temporal.getState().pastStates.length
let knownFutureCount = useBoundStore.temporal.getState().futureStates.length
useBoundStore.temporal.subscribe((state) => {
  const pastCount = state.pastStates.length
  const futureCount = state.futureStates.length
  const actions = useBoundStore.getState()
  if (pastCount === 0 && futureCount === 0) {
    actions.clearUndoSelectionRestoreHistory()
  } else if (temporalHistoryWasSaved) {
    temporalHistoryWasSaved = false
  } else if (pastCount < knownPastCount) {
    const record =
      actions.popPendingUndoSelectionRestore() ?? EMPTY_UNDO_SELECTION_RESTORE
    actions.pushPendingRedoSelectionRestore(record)
  } else if (futureCount < knownFutureCount && pastCount > knownPastCount) {
    const record =
      actions.popPendingRedoSelectionRestore() ?? EMPTY_UNDO_SELECTION_RESTORE
    actions.pushPendingUndoSelectionRestoreFromRedo(record)
  }
  knownPastCount = pastCount
  knownFutureCount = futureCount
})

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

export function saveMapPortraitWithoutUndo(portrait: string) {
  const temporal = useBoundStore.temporal.getState()
  temporal.pause()
  try {
    useBoundStore.getState().addMapPortraitBase64(portrait)
  } finally {
    temporal.resume()
  }
}
