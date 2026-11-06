import type { ThreeEvent } from '@react-three/fiber'
import type { MeshStandardMaterial } from 'three'
import usePieceHoverState from '../../hooks/usePieceHoverState'
import useBoundStore from '../../store/store'
import { HexTerrain } from '../../types'
import { PIECE_PREVIEW_OPACITY } from '../../utils/constants'
import { hexTerrainColor } from '../maphex/hexColors'
import { basicModelMaterial } from './materials'
import { useTexturedModelMaterial } from './texturedModelMaterial'
import { useDisposableGLTF } from './useDisposableGLTF'

export default function Ruins2({ pid }: { pid: string }) {
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const { nodes } = useDisposableGLTF('/ruins2-textured.glb') as any
  const isLightsAndShadowsRender = useBoundStore(
    (s) => s.isLightsAndShadowsRender,
  )
  const effectiveGraphicsTier = useBoundStore((s) => s.effectiveGraphicsTier)
  const textureLoadStatus = useBoundStore((s) => s.textureLoadStatus)
  const hoveredPieceID = useBoundStore((s) => s.hoveredPieceID)
  const { onPointerEnterPID, onPointerOut } = usePieceHoverState()
  const toggleSelectedPieceID = useBoundStore((s) => s.toggleSelectedPieceID)
  const selectedPieceIDs = useBoundStore((s) => s.selectedPieceIDs)
  const isHighlighted = hoveredPieceID === pid || selectedPieceIDs.includes(pid)
  const color = isHighlighted ? 'yellow' : hexTerrainColor[HexTerrain.ruin]
  const face = nodes.Ruin_Small_Face
  const columns = nodes.Ruin_Small_Columns
  const faceMaterial = useTexturedModelMaterial({
    sourceMaterial: face.material as MeshStandardMaterial,
    tier: effectiveGraphicsTier,
    textureLoadStatus,
    isHighlighted,
    pid,
    highRoughness: 0.5,
    doubleSided: true,
    repeatWrap: true,
  })
  const columnsMaterial = useTexturedModelMaterial({
    sourceMaterial: columns.material as MeshStandardMaterial,
    tier: effectiveGraphicsTier,
    textureLoadStatus,
    isHighlighted,
    pid,
    highRoughness: 0.5,
    doubleSided: true,
  })
  const onPointerUp = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation()
    if (event.button !== 0) return
    toggleSelectedPieceID(
      pid,
      event.shiftKey || event.ctrlKey || event.metaKey,
      { x: event.point.x, z: event.point.z },
    )
  }

  return (
    <group
      onPointerEnter={(event) => onPointerEnterPID(event, pid)}
      onPointerOut={onPointerOut}
    >
      <mesh
        userData={{ ruinsUID: pid, ruinsPart: 'face' }}
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={face.geometry}
        onPointerUp={onPointerUp}
        material={
          faceMaterial ?? basicModelMaterial(color, isLightsAndShadowsRender)
        }
      />
      <mesh
        userData={{ ruinsUID: pid, ruinsPart: 'columns' }}
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={columns.geometry}
        onPointerUp={onPointerUp}
        material={
          columnsMaterial ?? basicModelMaterial(color, isLightsAndShadowsRender)
        }
      />
    </group>
  )
}

export function Ruins2Preview() {
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const { nodes } = useDisposableGLTF('/ruins2-textured.glb') as any
  const isLightsAndShadowsRender = useBoundStore(
    (s) => s.isLightsAndShadowsRender,
  )
  const effectiveGraphicsTier = useBoundStore((s) => s.effectiveGraphicsTier)
  const textureLoadStatus = useBoundStore((s) => s.textureLoadStatus)
  const color = hexTerrainColor[HexTerrain.ruin]
  const face = nodes.Ruin_Small_Face
  const columns = nodes.Ruin_Small_Columns
  const faceMaterial = useTexturedModelMaterial({
    sourceMaterial: face.material as MeshStandardMaterial,
    tier: effectiveGraphicsTier,
    textureLoadStatus,
    isHighlighted: false,
    highRoughness: 0.5,
    doubleSided: true,
    repeatWrap: true,
  })
  const columnsMaterial = useTexturedModelMaterial({
    sourceMaterial: columns.material as MeshStandardMaterial,
    tier: effectiveGraphicsTier,
    textureLoadStatus,
    isHighlighted: false,
    highRoughness: 0.5,
    doubleSided: true,
  })

  return (
    <group>
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={face.geometry}
        material={
          faceMaterial ??
          basicModelMaterial(
            color,
            isLightsAndShadowsRender,
            PIECE_PREVIEW_OPACITY,
          )
        }
      />
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={columns.geometry}
        material={
          columnsMaterial ??
          basicModelMaterial(
            color,
            isLightsAndShadowsRender,
            PIECE_PREVIEW_OPACITY,
          )
        }
      />
    </group>
  )
}
