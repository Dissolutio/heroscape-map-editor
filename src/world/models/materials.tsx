export const getMaterialForOutcrop = (isHQ: boolean, color: string, isGlacier?: boolean) => {
  return isHQ ? <meshStandardMaterial
    color={color}
    transparent={isGlacier}
    opacity={isGlacier ? 0.99 : 1}
  />
    :
    <meshMatcapMaterial
      color={color}
      transparent={isGlacier}
      opacity={isGlacier ? 0.99 : 1}
    />
}