import { useGLTF } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import usePieceHoverState from '../../hooks/usePieceHoverState'
import type { BoardPiece } from '../../types'
import { basicModelMaterial } from './materials'

export function RoadWall({
  color,
  boardPiece,
  onPointerUp,
  opacity,
  selectedPieceID,
  hoveredPieceID,
  isLightsAndShadowsRender,
}: {
  color: string
  boardPiece?: BoardPiece
  onPointerUp?: (e: ThreeEvent<PointerEvent>, boardPiece: BoardPiece) => void
  opacity?: number
  selectedPieceID?: string
  hoveredPieceID?: string
  isLightsAndShadowsRender?: boolean
}) {
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const { nodes } = useGLTF('/handmade-roadwall.glb') as any
  const { onPointerEnterPiece, onPointerOut } = usePieceHoverState()
  const isSelected = selectedPieceID === boardPiece?.uid
  const isHighlighted = hoveredPieceID === boardPiece?.uid || isSelected
  const currentColor = isHighlighted
    ? 'yellow'
    : color
  const opacityLevel = opacity ?? 1
  const interactivityProps = onPointerUp && boardPiece ? {
    onPointerUp: (e: ThreeEvent<PointerEvent>) => onPointerUp(e, boardPiece),
    onPointerEnter: (e: ThreeEvent<PointerEvent>) => onPointerEnterPiece(e, boardPiece.uid),
    onPointerOut: (e: ThreeEvent<PointerEvent>) => onPointerOut(e),
  } : {}
  return (
    <>
      <mesh
        receiveShadow
        castShadow
        geometry={nodes.RoadWall.geometry}
        {...interactivityProps}
      >
        {basicModelMaterial(currentColor, !!isLightsAndShadowsRender, opacityLevel)}
      </mesh>
    </>
  )
}
useGLTF.preload('/handmade-roadwall.glb')
