import type { SelectionUnit } from '../data/selectionUnits'

export type ActionLogKind =
  | 'place'
  | 'move'
  | 'rotate'
  | 'delete'
  | 'convert'
  | 'adapt'
  | 'marker'
  | 'undo'
  | 'redo'
  | 'warning'

export type ActionLogEntry = {
  id: string
  time: number
  kind: ActionLogKind
  severity: 'info' | 'warning'
  text: string
  pieceName?: string
  selection?: SelectionUnit
  selectionLabel?: string
  undoable: boolean
}

type ActionLogSelection = {
  selection?: SelectionUnit
  selectionLabel?: string
}

export type ActionLogAction = (
  | { type: 'place'; pieceName: string }
  | {
      type: 'move'
      pieceName: string
      count: number
    }
  | { type: 'rotate'; pieceName: string; count: number }
  | { type: 'delete'; pieceName: string }
  | { type: 'convert'; count: number }
  | { type: 'adapt'; count: number }
  | {
      type: 'marker'
      operation: 'add' | 'move' | 'edit' | 'remove'
      label?: string
    }
  | { type: 'undo' | 'redo'; description: string }
  | { type: 'warning'; text: string }
) &
  ActionLogSelection

export const ACTION_LOG_LIMIT = 200
export const ACTION_LOG_COLLAPSED_TIMEOUT_MS = 8_000

export function formatActionLogAction(action: ActionLogAction) {
  switch (action.type) {
    case 'place':
      return {
        kind: 'place' as const,
        severity: 'info' as const,
        text: `Placed ${action.pieceName}`,
        pieceName: action.pieceName,
        undoable: true,
      }
    case 'move':
      return {
        kind: 'move' as const,
        severity: 'info' as const,
        text:
          action.count > 1
            ? `Moved ${action.count} pieces`
            : `Moved ${action.pieceName}`,
        pieceName: action.pieceName,
        undoable: true,
      }
    case 'rotate':
      return {
        kind: 'rotate' as const,
        severity: 'info' as const,
        text:
          action.count > 1
            ? `Rotated ${action.count} pieces (lead: ${action.pieceName})`
            : `Rotated ${action.pieceName}`,
        pieceName: action.pieceName,
        undoable: true,
      }
    case 'delete':
      return {
        kind: 'delete' as const,
        severity: 'info' as const,
        text: `Deleted ${action.pieceName}`,
        pieceName: action.pieceName,
        undoable: true,
      }
    case 'convert':
      return {
        kind: 'convert' as const,
        severity: 'info' as const,
        text: `Converted ${action.count} ${action.count === 1 ? 'piece' : 'pieces'}`,
        undoable: true,
      }
    case 'adapt':
      return {
        kind: 'adapt' as const,
        severity: 'info' as const,
        text: `Adapted map to collection (${action.count} ${
          action.count === 1 ? 'piece' : 'pieces'
        })`,
        undoable: true,
      }
    case 'marker': {
      const label = action.label ? ` ${action.label}` : ''
      const verbs = {
        add: 'Added',
        move: 'Moved',
        edit: 'Edited',
        remove: 'Removed',
      }
      return {
        kind: 'marker' as const,
        severity: 'info' as const,
        text: `${verbs[action.operation]} objective marker${label}`,
        undoable: true,
      }
    }
    case 'undo':
    case 'redo':
      return {
        kind: action.type,
        severity: 'info' as const,
        text: `${action.type === 'undo' ? 'Undid' : 'Redid'}: ${action.description}`,
        undoable: false,
      }
    case 'warning':
      return {
        kind: 'warning' as const,
        severity: 'warning' as const,
        text: action.text,
        undoable: false,
      }
  }
}

export function appendActionLogEntry(
  entries: ActionLogEntry[],
  entry: ActionLogEntry,
  limit = ACTION_LOG_LIMIT,
) {
  const capacity = Math.max(0, limit)
  if (capacity === 0) return []
  return [...entries, entry].slice(-capacity)
}
