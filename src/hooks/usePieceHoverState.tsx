import type { ThreeEvent } from '@react-three/fiber'
import React from 'react'
import useBoundStore from '../store/store'
import type { BoardHex } from '../types'

export default function usePieceHoverState(isVisible?: boolean) {
  const toggleHoveredPieceID = useBoundStore((s) => s.toggleHoveredPieceID)
  const hoverTimeout = React.useRef<number>(null!)
  const [isHovered, setIsHovered] = React.useState(false)

  const onPointerEnter = (e: ThreeEvent<PointerEvent>, boardHex: BoardHex) => {
    if (!isVisible) {
      return
    }
    e.stopPropagation()
    setIsHovered(true)
    hoverTimeout.current = window.setTimeout(() => {
      toggleHoveredPieceID(boardHex.pieceID)
    }, 50) // Adjust the delay (in milliseconds) as needed
  }
  const onPointerEnterPID = (e: ThreeEvent<PointerEvent>, pid: string) => {
    if (!isVisible) {
      return
    }
    e.stopPropagation()
    setIsHovered(true)
    hoverTimeout.current = window.setTimeout(() => {
      toggleHoveredPieceID(pid)
    }, 50) // Adjust the delay (in milliseconds) as needed
  }
  const onPointerOut = (e: ThreeEvent<PointerEvent>) => {
    if (!isVisible) {
      return
    }
    e.stopPropagation()
    // toggleHoveredPieceID(''); // We clear the hoveredPieceID in many ways (other hexes, empty hexes, onLeave canvas), no need here
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
