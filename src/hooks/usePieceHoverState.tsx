import type { ThreeEvent } from '@react-three/fiber'
import React from 'react'
import useBoundStore from '../store/store'
import type { BoardHex } from '../types'
import { isDragPassThrough, isDragging } from '../world/drag/dragController'

export default function usePieceHoverState() {
  const toggleHoveredPieceID = useBoundStore((s) => s.toggleHoveredPieceID)
  const toggleHoveredHex = useBoundStore((s) => s.toggleHoveredHex)
  const toggleHoveredWorldPoint = useBoundStore(
    (s) => s.toggleHoveredWorldPoint,
  )
  // biome-ignore lint/style/noNonNullAssertion: <is immediately defined>
  const hoverTimeout = React.useRef<number>(null!)
  const [isHovered, setIsHovered] = React.useState(false)

  const onPointerEnter = (e: ThreeEvent<PointerEvent>, boardHex: BoardHex) => {
    // the pointer sees through a piece being dragged (no stopPropagation)
    if (isDragPassThrough(boardHex.boardPieceUID)) return
    if (!isDragging()) e.stopPropagation()
    const point = { x: e.point.x, z: e.point.z }
    setIsHovered(true)
    hoverTimeout.current = window.setTimeout(() => {
      toggleHoveredPieceID(boardHex.boardPieceUID ?? '')
      toggleHoveredHex(boardHex)
      toggleHoveredWorldPoint(point)
    }, 50) // Adjust the delay (in milliseconds) as needed
  }
  const onPointerMove = (e: ThreeEvent<PointerEvent>) => {
    toggleHoveredWorldPoint({ x: e.point.x, z: e.point.z })
  }
  const onPointerEnterPID = (e: ThreeEvent<PointerEvent>, pid: string) => {
    if (isDragPassThrough(pid)) return
    if (!isDragging()) e.stopPropagation()
    setIsHovered(true)
    hoverTimeout.current = window.setTimeout(() => {
      toggleHoveredPieceID(pid)
    }, 50) // Adjust the delay (in milliseconds) as needed
  }
  const onPointerOut = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    setIsHovered(false)
    toggleHoveredHex(undefined)
    clearTimeout(hoverTimeout.current)
  }
  return {
    isHovered,
    onPointerEnter,
    onPointerEnterPID,
    onPointerOut,
    onPointerMove,
  }
}
