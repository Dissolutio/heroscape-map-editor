import type { ThreeEvent } from '@react-three/fiber'
import usePieceHoverState from '../../hooks/usePieceHoverState'
import useBoundStore from '../../store/store'
import { HexTerrain } from '../../types'
import { PIECE_PREVIEW_OPACITY } from '../../utils/constants'
import { hexTerrainColor } from '../maphex/hexColors'
import { basicModelMaterial } from './materials'
import { useDisposableGLTF } from './useDisposableGLTF'

export function Outcrop1({
  pid,
  isGlacier,
  isLavaRock,
  isToxic,
}: {
  pid: string
  isGlacier?: boolean
  isLavaRock?: boolean
  isToxic?: boolean
}) {
  const { nodes } = useDisposableGLTF(
    '/uncolored-decimated-glacier-outcrop-1.glb',
    // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  ) as any
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
    toggleSelectedPieceID(
      pid,
      event.shiftKey || event.ctrlKey || event.metaKey,
      { x: event.point.x, z: event.point.z },
    )
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
  const toxicColor = isHighlighted
    ? yellowColor
    : hexTerrainColor[HexTerrain.toxic]
  const outcropColor = isHighlighted
    ? yellowColor
    : hexTerrainColor[HexTerrain.outcrop]
  const color = isGlacier
    ? iceColor
    : isLavaRock
      ? lavaColor
      : isToxic
        ? toxicColor
        : outcropColor
  return (
    <mesh
      receiveShadow={isLightsAndShadowsRender}
      castShadow={isLightsAndShadowsRender}
      geometry={nodes.glacier_1_with_holes.geometry}
      onPointerUp={(e) => onPointerUp(e)}
      onPointerEnter={(e) => onPointerEnterPID(e, pid)}
      onPointerOut={onPointerOut}
      material={basicModelMaterial(color, isLightsAndShadowsRender)}
    />
  )
}
export function Outcrop1Preview({
  opacity,
  isGlacier,
  isLavaRock,
  isToxic,
}: {
  opacity?: number
  isGlacier?: boolean
  isLavaRock?: boolean
  isToxic?: boolean
}) {
  const { nodes } = useDisposableGLTF(
    '/uncolored-decimated-glacier-outcrop-1.glb',
    // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  ) as any
  const isLightsAndShadowsRender = useBoundStore(
    (s) => s.isLightsAndShadowsRender,
  )
  const iceColor = hexTerrainColor[HexTerrain.glacier]
  const lavaColor = hexTerrainColor[HexTerrain.lavaField]
  const toxicColor = hexTerrainColor[HexTerrain.toxic]
  const outcropColor = hexTerrainColor[HexTerrain.outcrop]
  const color = isGlacier
    ? iceColor
    : isLavaRock
      ? lavaColor
      : isToxic
        ? toxicColor
        : outcropColor
  const opacityLevel = opacity ?? PIECE_PREVIEW_OPACITY
  return (
    <mesh
      receiveShadow={isLightsAndShadowsRender}
      castShadow={isLightsAndShadowsRender}
      geometry={nodes.glacier_1_with_holes.geometry}
      material={basicModelMaterial(
        color,
        isLightsAndShadowsRender,
        opacityLevel,
      )}
    />
  )
}

// useGltf.preload('/uncolored-decimated-glacier-outcrop-1.glb')
