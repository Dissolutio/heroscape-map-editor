import { useGLTF } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import usePieceHoverState from '../../hooks/usePieceHoverState'
import useBoundStore from '../../store/store'
import { type BoardHex, HexTerrain } from '../../types'
import { hexTerrainColor } from '../maphex/hexColors'
import { basicModelMaterial } from './materials'
import { PIECE_PREVIEW_OPACITY } from '../../utils/constants'

export default function Outcrop3({
  boardHex,
  isGlacier,
  isLavaRock,
}: {
  boardHex: BoardHex
  isGlacier?: boolean
  isLavaRock?: boolean
}) {
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const { nodes } = useGLTF('/uncolored-decimated-glacier-outcrop-3.glb') as any
  const isLightsAndShadowsRender = useBoundStore((s) => s.isLightsAndShadowsRender)
  const hoveredPieceID = useBoundStore((s) => s.hoveredPieceID)
  const { onPointerEnter, onPointerOut } = usePieceHoverState()
  const toggleSelectedPieceID = useBoundStore((s) => s.toggleSelectedPieceID)
  const onPointerUp = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation() // prevent pass through
    // Early out right clicks(event.button=2), middle mouse clicks(1)
    if (event.button !== 0) {
      return
    }
    toggleSelectedPieceID(isSelected ? '' : boardHex.pieceID)
  }
  const selectedPieceID = useBoundStore((s) => s.selectedPieceID)
  const yellowColor = 'yellow'
  const isSelected = selectedPieceID === boardHex.pieceID
  const isHighlighted = hoveredPieceID === boardHex.pieceID || isSelected
  const iceColor = hexTerrainColor[HexTerrain.ice]
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
      geometry={nodes.glacier_3_with_holes.geometry}
      onPointerUp={(e) => onPointerUp(e)}
      onPointerEnter={(e) => onPointerEnter(e, boardHex)}
      onPointerOut={onPointerOut}
    >
      {basicModelMaterial(color, isLightsAndShadowsRender)}
    </mesh>
  )
}
export function Outcrop3Preview({
  isGlacier,
  isLavaRock,
}: {
  isGlacier?: boolean
  isLavaRock?: boolean
}) {
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const { nodes } = useGLTF('/uncolored-decimated-glacier-outcrop-3.glb') as any
  const isLightsAndShadowsRender = useBoundStore((s) => s.isLightsAndShadowsRender)
  const iceColor = hexTerrainColor[HexTerrain.ice]
  const lavaColor = hexTerrainColor[HexTerrain.lavaField]
  const outcropColor = hexTerrainColor[HexTerrain.outcrop]
  const color = isGlacier ? iceColor : isLavaRock ? lavaColor : outcropColor

  return (
    <mesh
      receiveShadow={isLightsAndShadowsRender}
      castShadow={isLightsAndShadowsRender}
      geometry={nodes.glacier_3_with_holes.geometry}
    >
      {basicModelMaterial(color, isLightsAndShadowsRender, PIECE_PREVIEW_OPACITY)}
    </mesh>
  )
}

useGLTF.preload('/uncolored-decimated-glacier-outcrop-3.glb')
