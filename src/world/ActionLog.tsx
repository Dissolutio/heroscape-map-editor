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
import {
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'
import useBoundStore from '../store/store'
import {
  ACTION_LOG_COLLAPSED_TIMEOUT_MS,
  formatActionLogAge,
  type ActionLogEntry,
  type ActionLogKind,
} from '../store/action-log'
import './ActionLog.css'

const ROW_HEIGHT = 22
const WINDOW_SIZE = 12

let actionLogClockNow = Date.now()
let actionLogClockInterval: number | null = null
const actionLogClockSubscribers = new Set<() => void>()

function notifyActionLogClock() {
  actionLogClockNow = Date.now()
  for (const subscriber of actionLogClockSubscribers) subscriber()
}

function stopActionLogClock() {
  if (actionLogClockInterval === null) return
  window.clearInterval(actionLogClockInterval)
  actionLogClockInterval = null
}

function startActionLogClock() {
  if (
    actionLogClockInterval !== null ||
    !actionLogClockSubscribers.size ||
    document.visibilityState !== 'visible'
  ) {
    return
  }
  actionLogClockInterval = window.setInterval(notifyActionLogClock, 1_000)
}

function handleActionLogVisibilityChange() {
  if (document.visibilityState === 'visible') {
    notifyActionLogClock()
    startActionLogClock()
  } else {
    stopActionLogClock()
  }
}

function subscribeToActionLogClock(subscriber: () => void) {
  actionLogClockSubscribers.add(subscriber)
  if (actionLogClockSubscribers.size === 1) {
    document.addEventListener(
      'visibilitychange',
      handleActionLogVisibilityChange,
    )
    actionLogClockNow = Date.now()
    startActionLogClock()
  }
  return () => {
    actionLogClockSubscribers.delete(subscriber)
    if (!actionLogClockSubscribers.size) {
      stopActionLogClock()
      document.removeEventListener(
        'visibilitychange',
        handleActionLogVisibilityChange,
      )
    }
  }
}

function getActionLogClock() {
  if (actionLogClockInterval === null && !actionLogClockSubscribers.size) {
    actionLogClockNow = Date.now()
  }
  return actionLogClockNow
}

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
  isNewest,
  isExpanded,
  onExpire,
}: {
  entry: ActionLogEntry
  isNewest: boolean
  isExpanded: boolean
  onExpire: (id: string) => void
}) {
  const now = useSyncExternalStore(
    subscribeToActionLogClock,
    getActionLogClock,
    getActionLogClock,
  )
  const ageMs = Math.max(0, now - entry.time)
  const isIdle = !isExpanded && ageMs >= ACTION_LOG_COLLAPSED_TIMEOUT_MS
  const Icon = icons[entry.kind]

  useEffect(() => {
    if (!isIdle) return
    const motionPreference = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    )
    const expireWithoutMotion = () => {
      if (motionPreference.matches) onExpire(entry.id)
    }
    expireWithoutMotion()
    motionPreference.addEventListener('change', expireWithoutMotion)
    return () =>
      motionPreference.removeEventListener('change', expireWithoutMotion)
  }, [entry.id, isIdle, onExpire])

  return (
    <div
      className={[
        'action-log__row',
        `action-log__row--${entry.kind}`,
        isNewest && 'action-log__row--latest',
        isIdle && 'action-log__row--idle',
      ]
        .filter(Boolean)
        .join(' ')}
      onAnimationEnd={(event) => {
        if (event.animationName === 'action-log-idle-fade' && !isExpanded) {
          onExpire(entry.id)
        }
      }}
      key={entry.id}
      title={entry.text}
    >
      <Icon aria-hidden="true" className="action-log__icon" />
      <span>{entry.text}</span>
      <span aria-hidden="true" className="action-log__age">
        {formatActionLogAge(ageMs)}
      </span>
    </div>
  )
}

const MemoizedActionRow = memo(ActionRow)

export default function ActionLog() {
  const entries = useBoundStore((state) => state.actionLog)
  const isDraggingPiece = useBoundStore((state) => state.isDraggingPiece)
  const [isExpanded, setIsExpanded] = useState(false)
  const [scrollTop, setScrollTop] = useState(0)
  const [expiredEntryIDs, setExpiredEntryIDs] = useState<Set<string>>(
    () => new Set(),
  )
  const listRef = useRef<HTMLDivElement>(null)
  const previousLength = useRef(entries.length)
  const previousShiftLength = useRef(entries.length)
  const [isListSettling, setIsListSettling] = useState(false)
  const expireEntry = useCallback((id: string) => {
    setExpiredEntryIDs((expired) => {
      if (expired.has(id)) return expired
      return new Set(expired).add(id)
    })
  }, [])

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
  const visibleEntries = entries
    .slice(firstVisible, endVisible)
    .filter((entry) => isExpanded || !expiredEntryIDs.has(entry.id))
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
        {visibleEntries.map((entry) => (
          <MemoizedActionRow
            entry={entry}
            isNewest={entry.id === entries[entries.length - 1]?.id}
            isExpanded={isExpanded}
            onExpire={expireEntry}
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
