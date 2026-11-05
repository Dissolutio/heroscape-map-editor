import type { ThreeEvent } from '@react-three/fiber'
import type { MeshStandardMaterial } from 'three'
import usePieceHoverState from '../../hooks/usePieceHoverState'
import useBoundStore from '../../store/store'
import { PIECE_PREVIEW_OPACITY } from '../../utils/constants'
import { hexTerrainColor } from '../maphex/hexColors'
import { basicModelMaterial } from './materials'
import { useTexturedModelMaterial } from './texturedModelMaterial'
import { useDisposableGLTF } from './useDisposableGLTF'

export default function MarroHive6({ pid }: { pid?: string }) {
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const { nodes } = useDisposableGLTF('/marro-hive-6-textured.glb') as any
  const mesh = nodes.Marro_Hive_VS
  const gltfMaterial = mesh.material as MeshStandardMaterial
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
  const texturedMaterial = useTexturedModelMaterial({
    sourceMaterial: gltfMaterial,
    tier: effectiveGraphicsTier,
    textureLoadStatus,
    isHighlighted,
    pid,
  })

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
