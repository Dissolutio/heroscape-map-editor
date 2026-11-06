import { useThree } from '@react-three/fiber'
import { useEffect, useMemo } from 'react'
import {
  DoubleSide,
  FrontSide,
  MeshStandardMaterial,
  RepeatWrapping,
  SRGBColorSpace,
} from 'three'
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
  doubleSided?: boolean
  repeatWrap?: boolean
}

export function useTexturedModelMaterial({
  sourceMaterial,
  tier,
  textureLoadStatus,
  isHighlighted,
  pid,
  highRoughness,
  doubleSided = false,
  repeatWrap = false,
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
      side: doubleSided ? DoubleSide : FrontSide,
      color: 'white',
      emissive: isHighlighted ? 'yellow' : 'black',
      emissiveIntensity: isHighlighted ? 0.3 : 0,
      metalness: isHigh ? sourceMaterial.metalness : 0,
      roughness: isHigh ? (highRoughness ?? sourceMaterial.roughness) : 1,
      transparent: pid === undefined,
      opacity: pid === undefined ? PIECE_PREVIEW_OPACITY : 1,
    })
  }, [
    doubleSided,
    highRoughness,
    isHighlighted,
    map,
    pid,
    sourceMaterial,
    tier,
    useTexture,
  ])

  useEffect(() => {
    if (!map || !useTexture) return
    map.colorSpace = SRGBColorSpace
    map.anisotropy = renderer.capabilities.getMaxAnisotropy()
    if (repeatWrap) {
      map.wrapS = RepeatWrapping
      map.wrapT = RepeatWrapping
    }
    map.needsUpdate = true
  }, [map, renderer, repeatWrap, useTexture])

  useEffect(
    () => () => {
      material?.dispose()
    },
    [material],
  )

  return material
}
