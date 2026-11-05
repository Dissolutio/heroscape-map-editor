import { useThree } from '@react-three/fiber'
import { useEffect, useMemo } from 'react'
import { MeshStandardMaterial, SRGBColorSpace } from 'three'
import type { GraphicsTier } from '../../local-storage/settings'
import { PIECE_PREVIEW_OPACITY } from '../../utils/constants'
import type { TextureLoadStatus } from '../textures/terrainTextureArrays'

export function shouldUseTieredModelTexture(
  tier: GraphicsTier,
  textureLoadStatus: TextureLoadStatus,
  hasBaseColorMap: boolean,
) {
  return tier !== 'low' && textureLoadStatus === 'ready' && hasBaseColorMap
}

type TexturedModelMaterialOptions = {
  sourceMaterial: MeshStandardMaterial
  tier: GraphicsTier
  textureLoadStatus: TextureLoadStatus
  isHighlighted: boolean
  pid?: string
  highRoughness?: number
}

export function useTexturedModelMaterial({
  sourceMaterial,
  tier,
  textureLoadStatus,
  isHighlighted,
  pid,
  highRoughness,
}: TexturedModelMaterialOptions) {
  const renderer = useThree((state) => state.gl)
  const map = sourceMaterial.map
  const useTexture = shouldUseTieredModelTexture(
    tier,
    textureLoadStatus,
    Boolean(map),
  )

  const material = useMemo(() => {
    if (!useTexture || !map) return null
    const isHigh = tier === 'high'
    return new MeshStandardMaterial({
      map,
      aoMap: isHigh ? sourceMaterial.aoMap : null,
      metalnessMap: isHigh ? sourceMaterial.metalnessMap : null,
      normalMap: isHigh ? sourceMaterial.normalMap : null,
      roughnessMap: isHigh ? sourceMaterial.roughnessMap : null,
      color: 'white',
      emissive: isHighlighted ? 'yellow' : 'black',
      emissiveIntensity: isHighlighted ? 0.3 : 0,
      metalness: isHigh ? sourceMaterial.metalness : 0,
      roughness: isHigh ? (highRoughness ?? sourceMaterial.roughness) : 1,
      transparent: pid === undefined,
      opacity: pid === undefined ? PIECE_PREVIEW_OPACITY : 1,
    })
  }, [highRoughness, isHighlighted, map, pid, sourceMaterial, tier, useTexture])

  useEffect(() => {
    if (!map || !useTexture) return
    map.colorSpace = SRGBColorSpace
    map.anisotropy = renderer.capabilities.getMaxAnisotropy()
    map.needsUpdate = true
  }, [map, renderer, useTexture])

  useEffect(
    () => () => {
      material?.dispose()
    },
    [material],
  )

  return material
}
