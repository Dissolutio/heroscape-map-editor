import type { ThreeEvent } from '@react-three/fiber'
import type { MeshStandardMaterial } from 'three'
import usePieceHoverState from '../../hooks/usePieceHoverState'
import useBoundStore from '../../store/store'
import { PIECE_PREVIEW_OPACITY } from '../../utils/constants'
import { hexTerrainColor } from '../maphex/hexColors'
import { basicDoubleSideModelMaterial } from './materials'
import {
  getMarvelRuinMeshNames,
  getMarvelRuinParts,
  type MarvelRuinMeshName,
} from './marvelRuinParts'
import { useTexturedModelMaterial } from './texturedModelMaterial'
import { useDisposableGLTF } from './useDisposableGLTF'

function MarvelRuinMesh({
  nodes,
  meshName,
  color,
  pid,
  isHighlighted,
}: {
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  nodes: any
  meshName: MarvelRuinMeshName
  color: string
  pid?: string
  isHighlighted: boolean
}) {
  const isLightsAndShadowsRender = useBoundStore(
    (s) => s.isLightsAndShadowsRender,
  )
  const effectiveGraphicsTier = useBoundStore((s) => s.effectiveGraphicsTier)
  const textureLoadStatus = useBoundStore((s) => s.textureLoadStatus)
  const sourceMaterial = nodes[meshName].material as MeshStandardMaterial
  const texturedMaterial = useTexturedModelMaterial({
    sourceMaterial,
    tier: effectiveGraphicsTier,
    textureLoadStatus,
    isHighlighted,
    pid,
    highRoughness: 0.5,
    doubleSided: true,
  })

  return (
    <mesh
      userData={{ marvelRuinUID: pid ?? null, marvelRuinPart: meshName }}
      receiveShadow={isLightsAndShadowsRender}
      castShadow={isLightsAndShadowsRender}
      geometry={nodes[meshName].geometry}
      material={
        texturedMaterial ??
        basicDoubleSideModelMaterial(
          color,
          isLightsAndShadowsRender,
          pid === undefined ? PIECE_PREVIEW_OPACITY : undefined,
        )
      }
    />
  )
}

export function MarvelRuin({
  pid,
  inventoryID,
}: {
  pid: string
  inventoryID: string
}) {
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const { nodes } = useDisposableGLTF('/marvel-ruin-6-textured.glb') as any
  const selectedPieceIDs = useBoundStore((s) => s.selectedPieceIDs)
  const toggleSelectedPieceID = useBoundStore((s) => s.toggleSelectedPieceID)
  const isSelected = selectedPieceIDs.includes(pid)
  const hoveredPieceID = useBoundStore((s) => s.hoveredPieceID)
  const { onPointerEnterPID, onPointerOut } = usePieceHoverState()
  const onPointerUp = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation()
    if (event.button !== 0) return
    toggleSelectedPieceID(
      pid,
      event.shiftKey || event.ctrlKey || event.metaKey,
      { x: event.point.x, z: event.point.z },
    )
  }
  const isHighlighted = hoveredPieceID === pid || isSelected
  const { isUpperFloor, isWallIntact } = getMarvelRuinParts(inventoryID)
  const meshNames = getMarvelRuinMeshNames(isUpperFloor, isWallIntact)
  const color = isHighlighted ? 'yellow' : hexTerrainColor.marvelRuin
  const colorUpperFloor = isHighlighted ? 'yellow' : hexTerrainColor.ladder

  return (
    <group
      onPointerEnter={(e) => onPointerEnterPID(e, pid)}
      onPointerOut={(e) => onPointerOut(e)}
      onPointerUp={(e) => onPointerUp(e)}
    >
      {meshNames.map((meshName) => (
        <MarvelRuinMesh
          key={meshName}
          nodes={nodes}
          meshName={meshName}
          color={meshName === 'MarvelRuinUpperFloor' ? colorUpperFloor : color}
          pid={pid}
          isHighlighted={isHighlighted}
        />
      ))}
    </group>
  )
}

export function MarvelRuinPreview({
  isUpperFloor,
  isWallIntact,
}: {
  isUpperFloor: boolean
  isWallIntact: boolean
}) {
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const { nodes } = useDisposableGLTF('/marvel-ruin-6-textured.glb') as any
  const meshNames = getMarvelRuinMeshNames(isUpperFloor, isWallIntact)
  return (
    <>
      {meshNames.map((meshName) => (
        <MarvelRuinMesh
          key={meshName}
          nodes={nodes}
          meshName={meshName}
          color={
            meshName === 'MarvelRuinUpperFloor'
              ? hexTerrainColor.ladder
              : hexTerrainColor.marvelRuin
          }
          isHighlighted={false}
        />
      ))}
    </>
  )
}
