import { useGLTF } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import usePieceHoverState from '../../hooks/usePieceHoverState'
import useBoundStore from '../../store/store'
import { type BoardHex, HexTerrain, Pieces } from '../../types'
import { hexTerrainColor } from '../maphex/hexColors'
import { basicModelMaterial } from './materials'

export default function TicallaBrush({ boardHex }: { boardHex: BoardHex }) {
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
  const isSwampBrush = boardHex.pieceID.includes(Pieces.swampBrush10)
  const color1 = isHighlighted
    ? yellowColor
    : isSwampBrush
      ? hexTerrainColor.swampUnderbrush1
      : hexTerrainColor.ticallaBrush1
  const color2 = isHighlighted
    ? yellowColor
    : isSwampBrush
      ? hexTerrainColor.swampUnderbrush2
      : hexTerrainColor.ticallaBrush2
  const color3 = isHighlighted
    ? yellowColor
    : isSwampBrush
      ? hexTerrainColor.swampUnderbrush3
      : hexTerrainColor.ticallaBrush3
  const colorBase = isHighlighted
    ? yellowColor
    : hexTerrainColor[HexTerrain.swamp]
  return (
    <>
      <group
        onPointerUp={(e) => onPointerUp(e)}
        onPointerEnter={(e) => onPointerEnter(e, boardHex)}
        onPointerOut={(e) => onPointerOut(e)}
      >
        <TicallaBrushPreview
          opacity={1}
          color1={color1}
          color2={color2}
          color3={color3}
          colorBase={colorBase}
        />
      </group>
    </>
  )
}
export function TicallaBrushPreview({
  opacity = 1,
  color1 = hexTerrainColor.ticallaBrush1,
  color2 = hexTerrainColor.ticallaBrush2,
  color3 = hexTerrainColor.ticallaBrush3,
  colorBase = hexTerrainColor[HexTerrain.swamp],
}: {
  opacity?: number
  color1?: string
  color2?: string
  color3?: string
  colorBase?: string
}) {
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const { nodes } = useGLTF('/ticalla-brush.glb') as any
  const isLightsAndShadowsRender = useBoundStore((s) => s.isLightsAndShadowsRender)
  return (
    <>
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.FatFern.geometry}
      >
        {basicModelMaterial(color1, isLightsAndShadowsRender, opacity)}
      </mesh>
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.PineappleFern.geometry}
      >
        {basicModelMaterial(color2, isLightsAndShadowsRender, opacity)}
      </mesh>
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.Needler.geometry}
      >
        {basicModelMaterial(color3, isLightsAndShadowsRender, opacity)}
      </mesh>
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.Interlock6.geometry}
      >
        {basicModelMaterial(colorBase, isLightsAndShadowsRender, opacity)}
      </mesh>
    </>
  )
}

useGLTF.preload('/ticalla-brush.glb')
