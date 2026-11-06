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

export function RoadWall({ pid }: { pid: string }) {
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const { nodes } = useDisposableGLTF('/road-wall-textured.glb') as any
  const wall = nodes.RoadWall
  const road = nodes.RoadWallRoad
  const { onPointerEnterPID, onPointerOut } = usePieceHoverState()
  const toggleSelectedPieceID = useBoundStore((s) => s.toggleSelectedPieceID)
  const selectedPieceIDs = useBoundStore((s) => s.selectedPieceIDs)
  const hoveredPieceID = useBoundStore((s) => s.hoveredPieceID)
  const isLightsAndShadowsRender = useBoundStore(
    (s) => s.isLightsAndShadowsRender,
  )
  const effectiveGraphicsTier = useBoundStore((s) => s.effectiveGraphicsTier)
  const textureLoadStatus = useBoundStore((s) => s.textureLoadStatus)
  const isSelected = selectedPieceIDs.includes(pid)
  const isHighlighted = hoveredPieceID === pid || isSelected
  const color = isHighlighted ? 'yellow' : hexTerrainColor[HexTerrain.roadWall]
  const wallMaterial = useTexturedModelMaterial({
    sourceMaterial: wall.material as MeshStandardMaterial,
    tier: effectiveGraphicsTier,
    textureLoadStatus,
    isHighlighted,
    pid,
    highRoughness: 0.5,
    repeatTexture: true,
    doubleSided: true,
  })
  const roadMaterial = useTexturedModelMaterial({
    sourceMaterial: road.material as MeshStandardMaterial,
    tier: effectiveGraphicsTier,
    textureLoadStatus,
    isHighlighted,
    pid,
    highRoughness: 0.5,
    repeatTexture: true,
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
    <group>
      <mesh
        userData={{ roadWallUID: pid, roadWallPart: 'wall' }}
        receiveShadow
        castShadow
        geometry={wall.geometry}
        onPointerUp={onPointerUp}
        onPointerEnter={(event) => onPointerEnterPID(event, pid)}
        onPointerOut={onPointerOut}
        material={
          wallMaterial ?? basicModelMaterial(color, isLightsAndShadowsRender)
        }
      />
      <mesh
        userData={{ roadWallUID: pid, roadWallPart: 'road' }}
        receiveShadow
        castShadow
        geometry={road.geometry}
        onPointerUp={onPointerUp}
        onPointerEnter={(event) => onPointerEnterPID(event, pid)}
        onPointerOut={onPointerOut}
        material={
          roadMaterial ?? basicModelMaterial(color, isLightsAndShadowsRender)
        }
      />
    </group>
  )
}

export function RoadWallPreview({ opacity }: { opacity?: number }) {
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const { nodes } = useDisposableGLTF('/road-wall-textured.glb') as any
  const wall = nodes.RoadWall
  const road = nodes.RoadWallRoad
  const isLightsAndShadowsRender = useBoundStore(
    (s) => s.isLightsAndShadowsRender,
  )
  const effectiveGraphicsTier = useBoundStore((s) => s.effectiveGraphicsTier)
  const textureLoadStatus = useBoundStore((s) => s.textureLoadStatus)
  const color = hexTerrainColor[HexTerrain.roadWall]
  const opacityLevel = opacity ?? PIECE_PREVIEW_OPACITY
  const wallMaterial = useTexturedModelMaterial({
    sourceMaterial: wall.material as MeshStandardMaterial,
    tier: effectiveGraphicsTier,
    textureLoadStatus,
    isHighlighted: false,
    opacity: opacityLevel,
    highRoughness: 0.5,
    repeatTexture: true,
    doubleSided: true,
  })
  const roadMaterial = useTexturedModelMaterial({
    sourceMaterial: road.material as MeshStandardMaterial,
    tier: effectiveGraphicsTier,
    textureLoadStatus,
    isHighlighted: false,
    opacity: opacityLevel,
    highRoughness: 0.5,
    repeatTexture: true,
    doubleSided: true,
  })
  return (
    <group>
      <mesh
        receiveShadow
        castShadow
        geometry={wall.geometry}
        material={
          wallMaterial ??
          basicModelMaterial(color, isLightsAndShadowsRender, opacityLevel)
        }
      />
      <mesh
        receiveShadow
        castShadow
        geometry={road.geometry}
        material={
          roadMaterial ??
          basicModelMaterial(color, isLightsAndShadowsRender, opacityLevel)
        }
      />
    </group>
  )
}
