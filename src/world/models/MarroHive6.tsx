import type { ThreeEvent } from '@react-three/fiber'
import { useThree } from '@react-three/fiber'
import { useEffect, useMemo } from 'react'
import { MeshStandardMaterial, SRGBColorSpace } from 'three'
import usePieceHoverState from '../../hooks/usePieceHoverState'
import useBoundStore from '../../store/store'
import { PIECE_PREVIEW_OPACITY } from '../../utils/constants'
import { hexTerrainColor } from '../maphex/hexColors'
import { shouldUseMarroHiveTexture } from './marroHiveMaterial'
import { basicModelMaterial } from './materials'
import { useDisposableGLTF } from './useDisposableGLTF'

export default function MarroHive6({ pid }: { pid?: string }) {
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const { nodes } = useDisposableGLTF('/marro-hive-6-textured.glb') as any
  const mesh = nodes.Marro_Hive_VS
  const gltfMaterial = mesh.material as MeshStandardMaterial
  const map = gltfMaterial.map
  const renderer = useThree((state) => state.gl)
  const hoveredPieceID = useBoundStore((s) => s.hoveredPieceID)
  const isLightsAndShadowsRender = useBoundStore(
    (s) => s.isLightsAndShadowsRender,
  )
  const effectiveGraphicsTier = useBoundStore((s) => s.effectiveGraphicsTier)
  const textureLoadStatus = useBoundStore((s) => s.textureLoadStatus)
  const { onPointerEnterPID, onPointerOut } = usePieceHoverState()
  const toggleSelectedPieceID = useBoundStore((s) => s.toggleSelectedPieceID)
  const selectedPieceIDs = useBoundStore((s) => s.selectedPieceIDs)
  const isSelected = selectedPieceIDs.includes(pid ?? '')
  const isHighlighted = hoveredPieceID === pid || isSelected
  const color = isHighlighted ? 'yellow' : hexTerrainColor.hiveModel1
  const useTexture = shouldUseMarroHiveTexture(
    effectiveGraphicsTier,
    textureLoadStatus,
    Boolean(map),
  )

  const texturedMaterial = useMemo(() => {
    if (!useTexture || !map) return null
    const isHigh = effectiveGraphicsTier === 'high'
    return new MeshStandardMaterial({
      map,
      aoMap: isHigh ? gltfMaterial.aoMap : null,
      metalnessMap: isHigh ? gltfMaterial.metalnessMap : null,
      normalMap: isHigh ? gltfMaterial.normalMap : null,
      roughnessMap: isHigh ? gltfMaterial.roughnessMap : null,
      color: 'white',
      emissive: isHighlighted ? 'yellow' : 'black',
      emissiveIntensity: isHighlighted ? 0.3 : 0,
      metalness: isHigh ? gltfMaterial.metalness : 0,
      roughness: isHigh ? gltfMaterial.roughness : 1,
      transparent: pid === undefined,
      opacity: pid === undefined ? PIECE_PREVIEW_OPACITY : 1,
    })
  }, [effectiveGraphicsTier, gltfMaterial, isHighlighted, map, pid, useTexture])

  useEffect(() => {
    if (!map || !useTexture) return
    map.colorSpace = SRGBColorSpace
    map.anisotropy = renderer.capabilities.getMaxAnisotropy()
    map.needsUpdate = true
  }, [map, renderer, useTexture])

  useEffect(
    () => () => {
      texturedMaterial?.dispose()
    },
    [texturedMaterial],
  )

  const onPointerUp = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation()
    if (event.button !== 0 || !pid) return
    toggleSelectedPieceID(
      pid,
      event.shiftKey || event.ctrlKey || event.metaKey,
      { x: event.point.x, z: event.point.z },
    )
  }

  return (
    <mesh
      userData={{ marroHiveUID: pid ?? null }}
      receiveShadow={isLightsAndShadowsRender}
      castShadow={isLightsAndShadowsRender}
      geometry={mesh.geometry}
      onPointerUp={(event) => {
        if (pid) onPointerUp(event)
      }}
      onPointerEnter={(event) => {
        if (pid) onPointerEnterPID(event, pid)
      }}
      onPointerOut={(event) => {
        if (pid) onPointerOut(event)
      }}
      material={
        texturedMaterial ??
        basicModelMaterial(
          color,
          isLightsAndShadowsRender,
          pid === undefined ? PIECE_PREVIEW_OPACITY : undefined,
        )
      }
    />
  )
}
