import type { ThreeEvent } from '@react-three/fiber'
import React from 'react'
import useBoundStore from '../store/store'
import {
  finishPerformanceTiming,
  startPerformanceTiming,
} from '../performance/performanceTiming'
import type { BoardHex } from '../types'
import { isDragPassThrough, isDragging } from '../world/drag/dragController'
import {
  rememberPointerWorldPoint,
  shouldTrackHoveredWorldPoint,
} from '../world/hoverWorldPoint'

export default function usePieceHoverState({
  trackIsHovered = true,
}: {
  trackIsHovered?: boolean
} = {}) {
  const toggleHoveredPieceID = useBoundStore((s) => s.toggleHoveredPieceID)
  const toggleHoveredHex = useBoundStore((s) => s.toggleHoveredHex)
  const toggleHoveredWorldPoint = useBoundStore(
    (s) => s.toggleHoveredWorldPoint,
  )
  const hoverTimeout = React.useRef<number | null>(null)
  const pointerMoveFrame = React.useRef<number | null>(null)
  const pendingWorldPoint = React.useRef<{ x: number; z: number } | null>(null)
  const [isHovered, setIsHovered] = React.useState(false)

  const cancelHoverWork = () => {
    if (hoverTimeout.current !== null) {
      window.clearTimeout(hoverTimeout.current)
      hoverTimeout.current = null
    }
    if (pointerMoveFrame.current !== null) {
      window.cancelAnimationFrame(pointerMoveFrame.current)
      pointerMoveFrame.current = null
    }
    pendingWorldPoint.current = null
  }
  const scheduleWorldPoint = (point: { x: number; z: number }) => {
    rememberPointerWorldPoint(point)
    if (!shouldTrackHoveredWorldPoint(useBoundStore.getState().penMode)) {
      pendingWorldPoint.current = null
      return
    }
    if (pointerMoveFrame.current !== null) {
      pendingWorldPoint.current = point
      return
    }
    pendingWorldPoint.current = point
    pointerMoveFrame.current = window.requestAnimationFrame(() => {
      pointerMoveFrame.current = null
      const currentPoint = pendingWorldPoint.current
      pendingWorldPoint.current = null
      if (
        currentPoint &&
        shouldTrackHoveredWorldPoint(useBoundStore.getState().penMode)
      ) {
        toggleHoveredWorldPoint(currentPoint)
      }
    })
  }

  React.useEffect(
    () => () => {
      if (hoverTimeout.current !== null) {
        window.clearTimeout(hoverTimeout.current)
      }
      if (pointerMoveFrame.current !== null) {
        window.cancelAnimationFrame(pointerMoveFrame.current)
      }
    },
    [],
  )

  const onPointerEnter = (e: ThreeEvent<PointerEvent>, boardHex: BoardHex) => {
    const startedAt = startPerformanceTiming()
    try {
      // the pointer sees through a piece being dragged (no stopPropagation)
      if (isDragPassThrough(boardHex.boardPieceUID)) return
      if (!isDragging()) e.stopPropagation()
      const point = { x: e.point.x, z: e.point.z }
      if (trackIsHovered) setIsHovered(true)
      if (hoverTimeout.current !== null) {
        window.clearTimeout(hoverTimeout.current)
      }
      hoverTimeout.current = window.setTimeout(() => {
        hoverTimeout.current = null
        toggleHoveredPieceID(boardHex.boardPieceUID ?? '')
        toggleHoveredHex(boardHex)
        if (shouldTrackHoveredWorldPoint(useBoundStore.getState().penMode)) {
          scheduleWorldPoint(point)
        }
      }, 50) // Adjust the delay (in milliseconds) as needed
    } finally {
      finishPerformanceTiming('app.pointerHandler', startedAt)
    }
  }
  const onPointerMove = (e: ThreeEvent<PointerEvent>) => {
    const startedAt = startPerformanceTiming()
    try {
      scheduleWorldPoint({ x: e.point.x, z: e.point.z })
    } finally {
      finishPerformanceTiming('app.pointerHandler', startedAt)
    }
  }
  const onPointerEnterPID = (e: ThreeEvent<PointerEvent>, pid: string) => {
    const startedAt = startPerformanceTiming()
    try {
      if (isDragPassThrough(pid)) return
      if (!isDragging()) e.stopPropagation()
      if (trackIsHovered) setIsHovered(true)
      if (hoverTimeout.current !== null) {
        window.clearTimeout(hoverTimeout.current)
      }
      hoverTimeout.current = window.setTimeout(() => {
        hoverTimeout.current = null
        toggleHoveredPieceID(pid)
      }, 50) // Adjust the delay (in milliseconds) as needed
    } finally {
      finishPerformanceTiming('app.pointerHandler', startedAt)
    }
  }
  const onPointerOut = (e: ThreeEvent<PointerEvent>) => {
    const startedAt = startPerformanceTiming()
    try {
      e.stopPropagation()
      if (trackIsHovered) setIsHovered(false)
      toggleHoveredHex(undefined)
      cancelHoverWork()
    } finally {
      finishPerformanceTiming('app.pointerHandler', startedAt)
    }
  }
  return {
    isHovered,
    onPointerEnter,
    onPointerEnterPID,
    onPointerOut,
    onPointerMove,
  }
}
