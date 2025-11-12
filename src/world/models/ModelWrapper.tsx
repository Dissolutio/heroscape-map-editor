import React from 'react'
import type { ThreeEvent } from '@react-three/fiber'
import type { BoardPiece } from '../../types'

type InteractivityHandlers = {
  onPointerUp?: (e: ThreeEvent<PointerEvent>, uid: string) => void
  onPointerEnter?: (e: ThreeEvent<PointerEvent>, uid: string) => void
  onPointerOut?: (e: ThreeEvent<PointerEvent>) => void
}

type ModelWrapperProps = {
  boardPiece?: BoardPiece
  opacity?: number
  isLightsAndShadowsRender?: boolean
  isHighlighted?: (uid: string) => boolean
  highlightColor?: string
} & InteractivityHandlers & {
    children: React.ReactElement
  }

export default function ModelWrapper({
  boardPiece,
  onPointerUp,
  onPointerEnter,
  onPointerOut,
  opacity = 1,
  isLightsAndShadowsRender,
  isHighlighted,
  highlightColor,
  children,
}: ModelWrapperProps) {
  const uid = boardPiece?.uid ?? ''
  const scale: [number, number, number] = isHighlighted?.(uid)
    ? [1.01, 1.01, 1.01]
    : [1, 1, 1]

  const handleUp = (e: ThreeEvent<PointerEvent>) => {
    if (onPointerUp && boardPiece) onPointerUp(e, uid)
  }
  const handleEnter = (e: ThreeEvent<PointerEvent>) => {
    if (onPointerEnter && boardPiece) onPointerEnter(e, uid)
  }
  const handleOut = (e: ThreeEvent<PointerEvent>) => {
    if (onPointerOut && boardPiece) onPointerOut(e)
  }

  // Clone child to inject common props (opacity, lights/shadows, boardPiece, isHighlighted, highlightColor)
  const childWithProps = React.cloneElement(children, {
    boardPiece,
    opacity,
    isLightsAndShadowsRender,
    isHighlighted,
    highlightColor,
  })

  return (
    <group
      onPointerUp={handleUp}
      onPointerEnter={handleEnter}
      onPointerOut={handleOut}
      scale={scale}
    >
      {childWithProps}
    </group>
  )
}
