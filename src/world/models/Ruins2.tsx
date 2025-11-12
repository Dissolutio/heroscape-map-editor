import { useGLTF } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import type { BoardPiece } from '../../types'
import { basicModelMaterial } from './materials'

export function Ruins2({
  color,
  highlightColor,
  boardPiece,
  onPointerUp,
  onPointerEnter,
  onPointerOut,
  opacity,
  isHighlighted,
  isLightsAndShadowsRender,
}: {
  color: string
  highlightColor?: string
  boardPiece?: BoardPiece
  onPointerUp?: (e: ThreeEvent<PointerEvent>, uid: string) => void
  onPointerEnter?: (e: ThreeEvent<PointerEvent>, uid: string) => void
  onPointerOut?: (e: ThreeEvent<PointerEvent>) => void
  opacity?: number
  isHighlighted?: (uid: string) => boolean
  isLightsAndShadowsRender?: boolean
}) {
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const { nodes } = useGLTF('/ruins2.glb') as any
  const currentColor = isHighlighted?.(boardPiece?.uid ?? '') && highlightColor ? highlightColor : color
  return (
    <mesh
      receiveShadow={isLightsAndShadowsRender}
      castShadow={isLightsAndShadowsRender}
      geometry={nodes.Ruin_Small_Scanned.geometry}
      scale={isHighlighted?.(boardPiece?.uid ?? '') ? [1.01, 1.01, 1.01] : [1, 1, 1]}
      onPointerUp={(e) => onPointerUp && boardPiece ? onPointerUp(e, boardPiece.uid) : null}
      onPointerEnter={(e) => onPointerEnter && boardPiece ? onPointerEnter(e, boardPiece.uid) : null}
      onPointerOut={(e) => onPointerOut && boardPiece ? onPointerOut(e) : null}
    >
      {basicModelMaterial(currentColor, !!isLightsAndShadowsRender, opacity ?? 1)}
    </mesh>
  )
}
useGLTF.preload('/ruins2.glb')
