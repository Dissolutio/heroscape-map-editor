import { useGLTF } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import usePieceHoverState from '../../hooks/usePieceHoverState'
import useBoundStore from '../../store/store'
import { type BoardHex, HexTerrain } from '../../types'
import { hexTerrainColor } from '../maphex/hexColors'
import { basicModelMaterial } from './materials'
import { PIECE_PREVIEW_OPACITY } from '../../utils/constants'

type Outcrop3Props = {
  boardHex?: BoardHex
  isGlacier?: boolean
  isLavaRock?: boolean
  opacity?: number
}

export function Outcrop3({
  boardHex,
  isGlacier,
  isLavaRock,
  opacity,
}: Outcrop3Props) {
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const { nodes } = useGLTF('/uncolored-decimated-glacier-outcrop-3.glb') as any
  const isLightsAndShadowsRender = useBoundStore(
    (s) => s.isLightsAndShadowsRender,
  )
  const hoveredPieceID = useBoundStore((s) => s.hoveredPieceID)
  const selectedPieceID = useBoundStore((s) => s.selectedPieceID)
  const { onPointerEnterHex, onPointerOut } = usePieceHoverState()
  const toggleSelectedPieceID = useBoundStore((s) => s.toggleSelectedPieceID)

  const yellowColor = 'yellow'
  const isSelected = boardHex && selectedPieceID === boardHex.pieceID
  const isHighlighted =
    boardHex && (hoveredPieceID === boardHex.pieceID || isSelected)
  const iceColor = isHighlighted ? yellowColor : hexTerrainColor[HexTerrain.ice]
  const lavaColor = isHighlighted
    ? yellowColor
    : hexTerrainColor[HexTerrain.lavaField]
  const outcropColor = isHighlighted
    ? yellowColor
    : hexTerrainColor[HexTerrain.outcrop]
  const previewIceColor = hexTerrainColor[HexTerrain.ice]
  const previewLavaColor = hexTerrainColor[HexTerrain.lavaField]
  const previewOutcropColor = hexTerrainColor[HexTerrain.outcrop]
  const color = boardHex
    ? isGlacier
      ? iceColor
      : isLavaRock
        ? lavaColor
        : outcropColor
    : isGlacier
      ? previewIceColor
      : isLavaRock
        ? previewLavaColor
        : previewOutcropColor
  const opacityLevel = opacity ?? (boardHex ? 1 : PIECE_PREVIEW_OPACITY)

  const pointerHandlers = boardHex
    ? {
      onPointerUp: (e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation()
        if (e.button !== 0) return
        toggleSelectedPieceID(isSelected ? '' : boardHex.pieceID)
      },
      onPointerEnter: (e: ThreeEvent<PointerEvent>) =>
        onPointerEnterHex(e, boardHex),
      onPointerOut: (e: ThreeEvent<PointerEvent>) => onPointerOut(e),
    }
    : {}

  return (
    <mesh
      receiveShadow={isLightsAndShadowsRender}
      castShadow={isLightsAndShadowsRender}
      geometry={nodes.glacier_3_with_holes.geometry}
      {...pointerHandlers}
    >
      {basicModelMaterial(color, isLightsAndShadowsRender, opacityLevel)}
    </mesh>
  )
}

useGLTF.preload('/uncolored-decimated-glacier-outcrop-3.glb')
