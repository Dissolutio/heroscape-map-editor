import type { ThreeEvent } from '@react-three/fiber'
import React from 'react'
import useBoundStore from '../store/store'
import type { BoardHex } from '../types'

export default function usePieceHoverState(isVisible?: boolean) {
  const toggleHoveredPieceID = useBoundStore((s) => s.toggleHoveredPieceID)
  const toggleHoveredHex = useBoundStore((s) => s.toggleHoveredHex)
  // biome-ignore lint/style/noNonNullAssertion: <is immediately defined>
  const hoverTimeout = React.useRef<number>(null!)
  const [isHovered, setIsHovered] = React.useState(false)

  const onPointerEnter = (e: ThreeEvent<PointerEvent>, boardHex: BoardHex) => {
    e.stopPropagation()
    setIsHovered(true)
    hoverTimeout.current = window.setTimeout(() => {
      toggleHoveredPieceID(boardHex.pieceID)
      toggleHoveredHex(boardHex)
    }, 50) // Adjust the delay (in milliseconds) as needed
  }
  const onPointerEnterPID = (e: ThreeEvent<PointerEvent>, pid: string) => {
    e.stopPropagation()
    setIsHovered(true)
    hoverTimeout.current = window.setTimeout(() => {
      toggleHoveredPieceID(pid)
    }, 50) // Adjust the delay (in milliseconds) as needed
  }
  const onPointerOut = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    setIsHovered(false)
    clearTimeout(hoverTimeout.current)
  }
  return {
    isHovered,
    onPointerEnter,
    onPointerEnterPID,
    onPointerOut,
  }
}
