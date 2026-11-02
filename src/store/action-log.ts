import type { CubeCoordinate } from '../types'

export type ActionLogKind =
  | 'place'
  | 'move'
  | 'rotate'
  | 'delete'
  | 'convert'
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
  undoable: boolean
}

export type ActionLogAction =
  | { type: 'place'; pieceName: string }
  | {
      type: 'move'
      pieceName: string
      count: number
      coords: CubeCoordinate
    }
  | { type: 'rotate'; pieceName: string; count: number }
  | { type: 'delete'; pieceName: string }
  | { type: 'convert'; count: number }
  | {
      type: 'marker'
      operation: 'add' | 'move' | 'edit' | 'remove'
      label?: string
      coords?: CubeCoordinate
    }
  | { type: 'undo' | 'redo'; description: string }
  | { type: 'warning'; text: string }

export const ACTION_LOG_LIMIT = 200

const coordinateText = (coords: CubeCoordinate) => `q${coords.q} r${coords.r}`

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
            ? `Moved ${action.count} pieces (lead: ${action.pieceName}) to ${coordinateText(action.coords)}`
            : `Moved ${action.pieceName} to ${coordinateText(action.coords)}`,
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
    case 'marker': {
      const label = action.label ? ` ${action.label}` : ''
      const suffix = action.coords ? ` to ${coordinateText(action.coords)}` : ''
      const verbs = {
        add: 'Added',
        move: 'Moved',
        edit: 'Edited',
        remove: 'Removed',
      }
      return {
        kind: 'marker' as const,
        severity: 'info' as const,
        text: `${verbs[action.operation]} objective marker${label}${suffix}`,
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
