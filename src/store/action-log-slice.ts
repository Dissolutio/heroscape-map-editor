import { produce } from 'immer'
import type { StateCreator } from 'zustand'
import {
  ACTION_LOG_LIMIT,
  appendActionLogEntry,
  formatActionLogAction,
  type ActionLogAction,
  type ActionLogEntry,
} from './action-log'
import type { AppState } from './store'

export interface ActionLogSlice {
  actionLog: ActionLogEntry[]
  actionLogUndoStack: ActionLogEntry[]
  actionLogRedoStack: ActionLogEntry[]
  recordActionLog: (action: ActionLogAction) => void
  recordUndoActionLog: () => void
  recordRedoActionLog: () => void
  clearActionLog: () => void
}

let nextEntryId = 0

function createEntry(action: ActionLogAction): ActionLogEntry {
  const time = Date.now()
  const formatted = formatActionLogAction(action)
  const selectionLabel =
    action.selectionLabel ??
    (action.selection?.objectiveMarkerUID && !action.selection.pieceUIDs.length
      ? action.type === 'marker'
        ? (action.label ?? 'objective marker')
        : 'Objective marker'
      : action.selection?.pieceUIDs.length
        ? action.type === 'marker'
          ? (action.label ?? 'objective marker')
          : action.type === 'move' || action.type === 'rotate'
            ? action.count > 1
              ? `${action.count} pieces`
              : action.pieceName
            : action.type === 'convert'
              ? `${action.count} ${action.count === 1 ? 'piece' : 'pieces'}`
              : action.type === 'place' || action.type === 'delete'
                ? action.pieceName
                : 'pieces'
        : undefined)
  return {
    id: `${time}-${nextEntryId++}`,
    time,
    ...formatted,
    ...(action.selection
      ? {
          selection: {
            pieceUIDs: [...action.selection.pieceUIDs],
            ...(action.selection.objectiveMarkerUID
              ? { objectiveMarkerUID: action.selection.objectiveMarkerUID }
              : {}),
          },
        }
      : {}),
    ...(selectionLabel ? { selectionLabel } : {}),
  }
}

const createActionLogSlice: StateCreator<AppState, [], [], ActionLogSlice> = (
  set,
  get,
) => ({
  actionLog: [],
  actionLogUndoStack: [],
  actionLogRedoStack: [],
  recordActionLog: (action) => {
    const entry = createEntry(action)
    set((state) =>
      produce(state, (draft) => {
        draft.actionLog = appendActionLogEntry(
          draft.actionLog,
          entry,
          ACTION_LOG_LIMIT,
        )
        if (entry.undoable) {
          draft.actionLogUndoStack = appendActionLogEntry(
            draft.actionLogUndoStack,
            entry,
            ACTION_LOG_LIMIT,
          )
          draft.actionLogRedoStack = []
        }
      }),
    )
  },
  recordUndoActionLog: () => {
    const undoStack = get().actionLogUndoStack
    const entry = undoStack[undoStack.length - 1]
    const undoEntry = createEntry({
      type: 'undo',
      description: entry?.text ?? 'previous action',
      selection: entry?.selection,
      selectionLabel: entry?.selectionLabel,
    })
    set((state) =>
      produce(state, (draft) => {
        const undone = draft.actionLogUndoStack.pop()
        if (undone) {
          draft.actionLogRedoStack = appendActionLogEntry(
            draft.actionLogRedoStack,
            undone,
            ACTION_LOG_LIMIT,
          )
        }
        draft.actionLog = appendActionLogEntry(
          draft.actionLog,
          undoEntry,
          ACTION_LOG_LIMIT,
        )
      }),
    )
  },
  recordRedoActionLog: () => {
    const redoStack = get().actionLogRedoStack
    const entry = redoStack[redoStack.length - 1]
    const redoEntry = createEntry({
      type: 'redo',
      description: entry?.text ?? 'previous action',
      selection: entry?.selection,
      selectionLabel: entry?.selectionLabel,
    })
    set((state) =>
      produce(state, (draft) => {
        const redone = draft.actionLogRedoStack.pop()
        if (redone) {
          draft.actionLogUndoStack = appendActionLogEntry(
            draft.actionLogUndoStack,
            redone,
            ACTION_LOG_LIMIT,
          )
        }
        draft.actionLog = appendActionLogEntry(
          draft.actionLog,
          redoEntry,
          ACTION_LOG_LIMIT,
        )
      }),
    )
  },
  clearActionLog: () =>
    set((state) =>
      produce(state, (draft) => {
        draft.actionLog = []
        draft.actionLogUndoStack = []
        draft.actionLogRedoStack = []
      }),
    ),
})

export default createActionLogSlice
