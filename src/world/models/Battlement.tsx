import { useGLTF } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import usePieceHoverState from '../../hooks/usePieceHoverState'
import type { BoardPiece } from '../../types'
import { basicModelMaterial } from './materials'
import { encodeBoardPieces } from '../../utils/map-utils'

export function Battlement({
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
  const { nodes } = useGLTF('/handmade-battlement.glb') as any
  const { onPointerEnterBoardPiece, onPointerOut } = usePieceHoverState()
  const isSelected = selectedPieceID === boardPiece?.uid || (boardPiece && selectedPieceID === encodeBoardPieces([boardPiece])[0])
  const isHighlighted = hoveredPieceID === boardPiece?.uid || isSelected
  const currentColor = isHighlighted
    ? 'yellow'
    : color
  const opacityLevel = opacity ?? 1
  const interactivityProps = onPointerUp && boardPiece ? {
    onPointerUp: (e: ThreeEvent<PointerEvent>) => onPointerUp(e, boardPiece),
    onPointerEnter: (e: ThreeEvent<PointerEvent>) => onPointerEnterBoardPiece(e, boardPiece.uid),
    onPointerOut: (e: ThreeEvent<PointerEvent>) => onPointerOut(e),
  } : {}
  return (
    <mesh
      receiveShadow={isLightsAndShadowsRender}
      castShadow={isLightsAndShadowsRender}
      geometry={nodes.Battlement.geometry}
      scale={isHighlighted ? [1.01, 1.01, 1.01] : [1, 1, 1]}
      {...interactivityProps}
    >
      {basicModelMaterial(currentColor, !!isLightsAndShadowsRender, opacityLevel)}
    </mesh>
  )
}
