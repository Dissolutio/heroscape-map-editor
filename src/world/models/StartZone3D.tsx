import type { ThreeEvent } from '@react-three/fiber'
import type { BoardPiece } from '../../types'
import { basicModelMaterial } from './materials'
import { HEXGRID_HEX_RADIUS } from '../../utils/constants'

export function StartZone3D({
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
  const currentColor =
    isHighlighted?.(boardPiece?.uid ?? '') && highlightColor
      ? highlightColor
      : color
  const opacityLevel = opacity ?? 1
  return (
    <mesh
      onPointerUp={(e) =>
        onPointerUp && boardPiece ? onPointerUp(e, boardPiece.uid) : null
      }
      onPointerEnter={(e) =>
        onPointerEnter && boardPiece ? onPointerEnter(e, boardPiece.uid) : null
      }
      onPointerOut={(e) =>
        onPointerOut && boardPiece ? onPointerOut(e) : null
      }
      rotation={[0, Math.PI / 2, 0]}
      scale={isHighlighted ? [1.01, 1.01, 1.01] : [1, 1, 1]}
    >
      <circleGeometry args={[HEXGRID_HEX_RADIUS / 2.1, 32]} />
      {basicModelMaterial(
        currentColor,
        !!isLightsAndShadowsRender,
        opacityLevel,
      )}
      {/* <ringGeometry args={[HEXGRID_HEX_RADIUS / 3, HEXGRID_HEX_RADIUS / 2.1, 32]} /> */}
      {/* <meshStandardMaterial color={color} transparent opacity={0.2} /> */}
    </mesh>
  )
}
