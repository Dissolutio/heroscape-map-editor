import { DoubleSide } from 'three'

export const getMaterialForOutcrop = (
  isHQ: boolean,
  color: string,
  isGlacier?: boolean,
) => {
  return isHQ ? (
    <meshStandardMaterial
      color={color}
      transparent={isGlacier}
      opacity={isGlacier ? 0.99 : 1}
    />
  ) : (
    <meshMatcapMaterial
      color={color}
      transparent={isGlacier}
      opacity={isGlacier ? 0.99 : 1}
    />
  )
}
export const basicModelMaterial = (
  color: string,
  isHQ: boolean,
  opacity?: number,
) =>
  isHQ ? (
    <meshStandardMaterial
      color={color}
      transparent={(opacity ?? 1) !== 1}
      opacity={opacity ?? 1}
    />
  ) : (
    <meshMatcapMaterial
      color={color}
      transparent={(opacity ?? 1) !== 1}
      opacity={opacity ?? 1}
    />
  )
export const basicDoubleSideModelMaterial = (
  color: string,
  isHQ: boolean,
  opacity?: number,
) =>
  isHQ ? (
    <meshStandardMaterial
      side={DoubleSide}
      color={color}
      transparent={(opacity ?? 1) !== 1}
      opacity={opacity ?? 1}
    />
  ) : (
    <meshMatcapMaterial
      side={DoubleSide}
      color={color}
      transparent={(opacity ?? 1) !== 1}
      opacity={opacity ?? 1}
    />
  )
