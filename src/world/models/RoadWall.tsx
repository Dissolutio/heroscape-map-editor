import type { ThreeEvent } from '@react-three/fiber'
import usePieceHoverState from '../../hooks/usePieceHoverState'
import useBoundStore from '../../store/store'
import { HexTerrain } from '../../types'
import { PIECE_PREVIEW_OPACITY } from '../../utils/constants'
import { hexTerrainColor } from '../maphex/hexColors'
import { basicModelMaterial } from './materials'
import { useDisposableGLTF } from './useDisposableGLTF'

export function RoadWall({ pid }: { pid: string }) {
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const { nodes } = useDisposableGLTF('/handmade-roadwall.glb') as any
  const { onPointerEnterPID, onPointerOut } = usePieceHoverState()
  const toggleSelectedPieceID = useBoundStore((s) => s.toggleSelectedPieceID)
  const selectedPieceIDs = useBoundStore((s) => s.selectedPieceIDs)
  const hoveredPieceID = useBoundStore((s) => s.hoveredPieceID)
  const isLightsAndShadowsRender = useBoundStore(
    (s) => s.isLightsAndShadowsRender,
  )
  const yellowColor = 'yellow'
  const isSelected = selectedPieceIDs.includes(pid)
  const isHighlighted = hoveredPieceID === pid || isSelected
  const color = isHighlighted
    ? yellowColor
    : hexTerrainColor[HexTerrain.roadWall]
  const onPointerUp = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation() // prevent pass through
    // Early out right clicks(event.button=2), middle mouse clicks(1)
    if (event.button !== 0) {
      return
    }
    toggleSelectedPieceID(
      pid,
      event.shiftKey || event.ctrlKey || event.metaKey,
      { x: event.point.x, z: event.point.z },
    )
  }
  return (
    <>
      <mesh
        receiveShadow
        castShadow
        geometry={nodes.RoadWall.geometry}
        onPointerUp={(e) => onPointerUp(e)}
        onPointerEnter={(e) => onPointerEnterPID(e, pid)}
        onPointerOut={(e) => onPointerOut(e)}
        material={basicModelMaterial(color, isLightsAndShadowsRender)}
      />
    </>
  )
}
export function RoadWallPreview({ opacity }: { opacity?: number }) {
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const { nodes } = useDisposableGLTF('/handmade-roadwall.glb') as any
  const isLightsAndShadowsRender = useBoundStore(
    (s) => s.isLightsAndShadowsRender,
  )
  const color = hexTerrainColor[HexTerrain.roadWall]
  const opacityLevel = opacity ?? PIECE_PREVIEW_OPACITY
  return (
    <>
      <mesh
        receiveShadow
        castShadow
        geometry={nodes.RoadWall.geometry}
        material={basicModelMaterial(
          color,
          isLightsAndShadowsRender,
          opacityLevel,
        )}
      />
    </>
  )
}
// useGltf.preload('/handmade-roadwall.glb')
