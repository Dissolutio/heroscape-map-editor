import {
  MdAdd,
  MdDeleteOutline,
  MdExpandLess,
  MdExpandMore,
  MdFlag,
  MdOpenWith,
  MdRedo,
  MdRotateRight,
  MdTransform,
  MdUndo,
  MdWarningAmber,
} from 'react-icons/md'
import type { CSSProperties } from 'react'
import { useEffect, useRef, useState } from 'react'
import useBoundStore from '../store/store'
import type { ActionLogEntry, ActionLogKind } from '../store/action-log'
import './ActionLog.css'

const ROW_HEIGHT = 22
const WINDOW_SIZE = 12

const icons = {
  place: MdAdd,
  move: MdOpenWith,
  rotate: MdRotateRight,
  delete: MdDeleteOutline,
  convert: MdTransform,
  marker: MdFlag,
  undo: MdUndo,
  redo: MdRedo,
  warning: MdWarningAmber,
} satisfies Record<ActionLogKind, typeof MdAdd>

function ActionRow({
  entry,
  age,
  isNewest,
}: {
  entry: ActionLogEntry
  age: number
  isNewest: boolean
}) {
  const Icon = icons[entry.kind]
  return (
    <div
      className={[
        'action-log__row',
        `action-log__row--${entry.kind}`,
        isNewest && 'action-log__row--latest',
      ]
        .filter(Boolean)
        .join(' ')}
      key={entry.id}
      style={
        {
          '--action-log-entry-opacity': Math.max(0.45, 1 - age * 0.12),
          '--action-log-entry-shift': `${-Math.min(age, 2)}px`,
        } as CSSProperties
      }
      title={entry.text}
    >
      <Icon aria-hidden="true" className="action-log__icon" />
      <span>{entry.text}</span>
    </div>
  )
}

export default function ActionLog() {
  const entries = useBoundStore((state) => state.actionLog)
  const isDraggingPiece = useBoundStore((state) => state.isDraggingPiece)
  const [isExpanded, setIsExpanded] = useState(false)
  const [scrollTop, setScrollTop] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)
  const previousLength = useRef(entries.length)
  const previousShiftLength = useRef(entries.length)
  const [isListSettling, setIsListSettling] = useState(false)

  useEffect(() => {
    if (isExpanded && entries.length > previousLength.current) {
      const list = listRef.current
      if (
        list &&
        list.scrollHeight - list.scrollTop - list.clientHeight < ROW_HEIGHT * 2
      ) {
        list.scrollTop = list.scrollHeight
      }
    }
    previousLength.current = entries.length
  }, [entries.length, isExpanded])

  useEffect(() => {
    if (entries.length <= previousShiftLength.current) return
    previousShiftLength.current = entries.length
    setIsListSettling(true)
    const frame = window.requestAnimationFrame(() => setIsListSettling(false))
    return () => window.cancelAnimationFrame(frame)
  }, [entries.length])

  useEffect(() => {
    if (!isExpanded) return
    const list = listRef.current
    if (list && list.scrollTop === 0) list.scrollTop = list.scrollHeight
  }, [isExpanded])

  if (!entries.length) return null

  const firstVisible = isExpanded
    ? Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - 2)
    : Math.max(0, entries.length - 5)
  const endVisible = isExpanded
    ? Math.min(entries.length, firstVisible + WINDOW_SIZE)
    : entries.length
  const visibleEntries = entries.slice(firstVisible, endVisible)
  const hasFocusWithin = (element: HTMLElement) =>
    element.contains(document.activeElement)

  return (
    <div
      className={[
        'action-log',
        isExpanded && 'action-log--expanded',
        isDraggingPiece && 'action-log--dragging',
      ]
        .filter(Boolean)
        .join(' ')}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={(event) => {
        if (!hasFocusWithin(event.currentTarget)) setIsExpanded(false)
      }}
      onBlur={(event) => {
        if (!hasFocusWithin(event.currentTarget)) setIsExpanded(false)
      }}
    >
      <div
        aria-live="polite"
        aria-relevant="additions text"
        className={[
          'action-log__list',
          isListSettling && 'action-log__list--settling',
        ]
          .filter(Boolean)
          .join(' ')}
        id="action-log-entries"
        onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
        onWheel={(event) => {
          event.stopPropagation()
        }}
        ref={listRef}
        role="log"
        tabIndex={isExpanded ? 0 : -1}
      >
        {isExpanded && firstVisible > 0 && (
          <div
            aria-hidden="true"
            style={{ height: firstVisible * ROW_HEIGHT }}
          />
        )}
        {visibleEntries.map((entry, index) => (
          <ActionRow
            age={entries.length - firstVisible - index - 1}
            entry={entry}
            isNewest={firstVisible + index === entries.length - 1}
            key={entry.id}
          />
        ))}
        {isExpanded && endVisible < entries.length && (
          <div
            aria-hidden="true"
            style={{ height: (entries.length - endVisible) * ROW_HEIGHT }}
          />
        )}
      </div>
      <button
        aria-controls="action-log-entries"
        aria-expanded={isExpanded}
        aria-label={isExpanded ? 'Collapse action log' : 'Expand action log'}
        className="action-log__toggle"
        onClick={() => setIsExpanded((expanded) => !expanded)}
        onFocus={() => setIsExpanded(true)}
        type="button"
      >
        <span>Recent actions</span>
        {isExpanded ? <MdExpandLess /> : <MdExpandMore />}
      </button>
    </div>
  )
}
