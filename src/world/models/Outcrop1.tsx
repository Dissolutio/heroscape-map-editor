import { useGLTF } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import type { BoardPiece } from '../../types'
import { basicModelMaterial } from './materials'

export function Outcrop1({
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
  const { nodes } = useGLTF('/uncolored-decimated-glacier-outcrop-1.glb') as any
  const currentColor =
    isHighlighted?.(boardPiece?.uid ?? '') && highlightColor
      ? highlightColor
      : color
  const opacityLevel = opacity ?? 1
  return (
    <mesh
      receiveShadow={isLightsAndShadowsRender}
      castShadow={isLightsAndShadowsRender}
      geometry={nodes.glacier_1_with_holes.geometry}
      onPointerUp={(e) =>
        onPointerUp && boardPiece ? onPointerUp(e, boardPiece.uid) : null
      }
      onPointerEnter={(e) =>
        onPointerEnter && boardPiece ? onPointerEnter(e, boardPiece.uid) : null
      }
      onPointerOut={(e) =>
        onPointerOut && boardPiece ? onPointerOut(e) : null
      }
    >
      {basicModelMaterial(currentColor, !!isLightsAndShadowsRender, opacityLevel)}
    </mesh>
  )
}

useGLTF.preload('/uncolored-decimated-glacier-outcrop-1.glb')
