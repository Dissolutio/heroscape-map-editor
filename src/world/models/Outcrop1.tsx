import { useGLTF } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import usePieceHoverState from '../../hooks/usePieceHoverState'
import useBoundStore from '../../store/store'
import { HexTerrain } from '../../types'
import { hexTerrainColor } from '../maphex/hexColors'
import { basicModelMaterial } from './materials'
import { PIECE_PREVIEW_OPACITY } from '../../utils/constants'

export function Outcrop1({
  pid,
  isGlacier,
  isLavaRock,
}: {
  pid: string
  isGlacier?: boolean
  isLavaRock?: boolean
}) {
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const { nodes } = useGLTF('/uncolored-decimated-glacier-outcrop-1.glb') as any
  const isLightsAndShadowsRender = useBoundStore(
    (s) => s.isLightsAndShadowsRender,
  )
  const hoveredPieceID = useBoundStore((s) => s.hoveredPieceID)
  const { onPointerEnterPID, onPointerOut } = usePieceHoverState()
  const toggleSelectedPieceID = useBoundStore((s) => s.toggleSelectedPieceID)
  const onPointerUp = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation() // prevent pass through
    // Early out right clicks(event.button=2), middle mouse clicks(1)
    if (event.button !== 0) {
      return
    }
    toggleSelectedPieceID(pid, event.shiftKey || event.ctrlKey || event.metaKey)
  }
  const selectedPieceIDs = useBoundStore((s) => s.selectedPieceIDs)
  const yellowColor = 'yellow'
  const isSelected = selectedPieceIDs.includes(pid)
  const isHighlighted = hoveredPieceID === pid || isSelected
  const iceColor = isHighlighted
    ? yellowColor
    : hexTerrainColor[HexTerrain.glacier]
  const lavaColor = isHighlighted
    ? yellowColor
    : hexTerrainColor[HexTerrain.lavaField]
  const outcropColor = isHighlighted
    ? yellowColor
    : hexTerrainColor[HexTerrain.outcrop]
  const color = isGlacier ? iceColor : isLavaRock ? lavaColor : outcropColor
  return (
    <mesh
      receiveShadow={isLightsAndShadowsRender}
      castShadow={isLightsAndShadowsRender}
      geometry={nodes.glacier_1_with_holes.geometry}
      onPointerUp={(e) => onPointerUp(e)}
      onPointerEnter={(e) => onPointerEnterPID(e, pid)}
      onPointerOut={onPointerOut}
    >
      {basicModelMaterial(color, isLightsAndShadowsRender)}
    </mesh>
  )
}
export function Outcrop1Preview({
  opacity,
  isGlacier,
  isLavaRock,
}: {
  opacity?: number
  isGlacier?: boolean
  isLavaRock?: boolean
}) {
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const { nodes } = useGLTF('/uncolored-decimated-glacier-outcrop-1.glb') as any
  const isLightsAndShadowsRender = useBoundStore(
    (s) => s.isLightsAndShadowsRender,
  )
  const iceColor = hexTerrainColor[HexTerrain.glacier]
  const lavaColor = hexTerrainColor[HexTerrain.lavaField]
  const outcropColor = hexTerrainColor[HexTerrain.outcrop]
  const color = isGlacier ? iceColor : isLavaRock ? lavaColor : outcropColor
  const opacityLevel = opacity ?? PIECE_PREVIEW_OPACITY
  return (
    <mesh
      receiveShadow={isLightsAndShadowsRender}
      castShadow={isLightsAndShadowsRender}
      geometry={nodes.glacier_1_with_holes.geometry}
    >
      {basicModelMaterial(color, isLightsAndShadowsRender, opacityLevel)}
    </mesh>
  )
}

// useGltf.preload('/uncolored-decimated-glacier-outcrop-1.glb')
