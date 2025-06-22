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
export const basicModelMaterial = (color: string, isHQ: boolean, isPreview?: boolean) =>
  isHQ ? (
    <meshStandardMaterial color={color} transparent={isPreview} opacity={isPreview ? 0.5 : 1} />
  ) : (
    <meshMatcapMaterial color={color} transparent={isPreview} opacity={isPreview ? 0.5 : 1} />
  )
export const basicDoubleSideModelMaterial = (color: string, isHQ: boolean) =>
  isHQ ? (
    <meshStandardMaterial side={DoubleSide} color={color} />
  ) : (
    <meshMatcapMaterial side={DoubleSide} color={color} />
  )
