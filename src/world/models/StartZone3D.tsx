import { basicModelMaterial } from './materials'
import { HEXGRID_HEX_RADIUS } from '../../utils/constants'
import type { ModelComponentProps } from './ModelComponentProps'

export function StartZone3D({
  color,
  highlightColor,
  boardPiece,
  opacity,
  isHighlighted,
  isLightsAndShadowsRender,
}: ModelComponentProps) {
  const currentColor =
    isHighlighted?.(boardPiece?.uid ?? '') && highlightColor
      ? highlightColor
      : color
  const opacityLevel = opacity ?? 1
  return (
    <mesh
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
      {/* <meshStandardMaterial color={color} transparent opacity={opacityLevel} /> */}
    </mesh>
  )
}
