import { useGLTF } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import usePieceHoverState from '../../hooks/usePieceHoverState'
import useBoundStore from '../../store/store'
import { type BoardHex, HexTerrain, Pieces } from '../../types'
import { hexTerrainColor } from '../maphex/hexColors'
import { basicModelMaterial } from './materials'
import { PIECE_PREVIEW_OPACITY } from '../../utils/constants'
import { noop } from 'lodash'

export default function JungleBrush({ boardHex }: { boardHex?: BoardHex }) {
  const hoveredPieceID = useBoundStore((s) => s.hoveredPieceID)
  const { onPointerEnter, onPointerOut } = usePieceHoverState()
  const toggleSelectedPieceID = useBoundStore((s) => s.toggleSelectedPieceID)
  const isLightsAndShadowsRender = useBoundStore((s) => s.isLightsAndShadowsRender)
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
      : hexTerrainColor.ticallaPineappleFern
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
  if (boardHex?.inventoryID === Pieces.laurBrush10) {
    return (
      <>
        <group
          onPointerUp={(e) => boardHex ? onPointerUp(e) : noop()}
          onPointerEnter={(e) => boardHex ? onPointerEnter(e, boardHex) : noop()}
          onPointerOut={(e) => boardHex ? onPointerOut(e) : noop()}
        >
          <LaurBrushPreview
            opacity={boardHex ? 1 : PIECE_PREVIEW_OPACITY}
            color1={color1}
            color2={color2}
            color3={color3}
            colorBase={colorBase}
          />
        </group>
      </>
    )
  }
  if (boardHex?.inventoryID === Pieces.swampBrush10) {
    return (
      <>
        <group
          onPointerUp={(e) => boardHex ? onPointerUp(e) : noop()}
          onPointerEnter={(e) => boardHex ? onPointerEnter(e, boardHex) : noop()}
          onPointerOut={(e) => boardHex ? onPointerOut(e) : noop()}
        >
          <SwampBrushPreview
            opacity={boardHex ? 1 : PIECE_PREVIEW_OPACITY}
          />
        </group>
      </>
    )
  }
  return (
    <>
      <group
        onPointerUp={(e) => boardHex ? onPointerUp(e) : noop()}
        onPointerEnter={(e) => boardHex ? onPointerEnter(e, boardHex) : noop()}
        onPointerOut={(e) => boardHex ? onPointerOut(e) : noop()}
      >
        <TicallaBrushPreview
          opacity={boardHex ? 1 : PIECE_PREVIEW_OPACITY}
        />
      </group>
    </>
  )
}
export function LaurBrushPreview({
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
  const { nodes } = useGLTF('/laur-jungle.glb') as any
  // const { nodes } = useGLTF('/ticalla-brush.glb') as any
  const colorCactus = color3 || hexTerrainColor.ticallaPalmModel3
  const isLightsAndShadowsRender = useBoundStore(
    (s) => s.isLightsAndShadowsRender,
  )
  return (
    <>
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.LaurTriLeaf.geometry}
      >
        {basicModelMaterial(color1, isLightsAndShadowsRender, opacity)}
      </mesh>
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.LaurTriCactus.geometry}
        // Cacti are closer together on brush than on palm
        rotation={[0, Math.PI / 6.5, 0]}
      >
        {basicModelMaterial(colorCactus, isLightsAndShadowsRender, opacity)}
      </mesh>
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.LaurRoundCactus.geometry}
        // Cacti are closer together on brush than on palm
        rotation={[0, -Math.PI / 6.5, 0]}
      >
        {basicModelMaterial(colorCactus, isLightsAndShadowsRender, opacity)}
      </mesh>
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.JungleBase.geometry}
      >
        {basicModelMaterial(colorBase, isLightsAndShadowsRender, opacity)}
      </mesh>
    </>
  )
}
export function TicallaBrushPreview({
  opacity = 1,
  // color1 = hexTerrainColor.ticallaBrush1,
  // color2 = hexTerrainColor.ticallaBrush2,
  // color3 = hexTerrainColor.ticallaBrush3,
  // colorBase = hexTerrainColor[HexTerrain.swamp],
}: {
  opacity?: number
  // color1?: string
  // color2?: string
  // color3?: string
  // colorBase?: string
}) {
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const { nodes } = useGLTF('/laur-jungle.glb') as any
  // const { nodes } = useGLTF('/ticalla-brush.glb') as any
  const isLightsAndShadowsRender = useBoundStore((s) => s.isLightsAndShadowsRender)
  const color1 = hexTerrainColor.ticallaPineappleFern
  const color2 = hexTerrainColor.ticallaBrush2
  const color3 = hexTerrainColor.ticallaBrush3
  const colorBase = hexTerrainColor[HexTerrain.swamp]
  return (
    <>

      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.TicallaTriLeaf.geometry}
      >
        {basicModelMaterial(color1, isLightsAndShadowsRender, opacity)}
      </mesh>

      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.JungleNeedleFern.geometry}
      >
        {basicModelMaterial(color2, isLightsAndShadowsRender, opacity)}
      </mesh>

      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.TicallaPineappleFern.geometry}
      >
        {basicModelMaterial(color3, isLightsAndShadowsRender, opacity)}
      </mesh>

      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.JungleBase.geometry}
      >
        {basicModelMaterial(colorBase, isLightsAndShadowsRender, opacity)}
      </mesh>
    </>
  )
}
export function SwampBrushPreview({
  opacity = 1,
  // color1 = hexTerrainColor.ticallaBrush1,
  // color2 = hexTerrainColor.ticallaBrush2,
  // color3 = hexTerrainColor.ticallaBrush3,
  // colorBase = hexTerrainColor[HexTerrain.swamp],
}: {
  opacity?: number
  // color1?: string
  // color2?: string
  // color3?: string
  // colorBase?: string
}) {
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const { nodes } = useGLTF('/laur-jungle.glb') as any
  // const { nodes } = useGLTF('/ticalla-brush.glb') as any
  const isLightsAndShadowsRender = useBoundStore((s) => s.isLightsAndShadowsRender)
  const color1 = hexTerrainColor.swampUnderbrush1
  const color2 = hexTerrainColor.swampUnderbrush2
  const color3 = hexTerrainColor.swampUnderbrush3
  const colorBase = hexTerrainColor[HexTerrain.swamp]
  return (
    <>
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.TicallaTriLeaf.geometry}
      >
        {basicModelMaterial(color1, isLightsAndShadowsRender, opacity)}
      </mesh>

      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.JungleNeedleFern.geometry}
      >
        {basicModelMaterial(color2, isLightsAndShadowsRender, opacity)}
      </mesh>

      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.TicallaPineappleFern.geometry}
      >
        {basicModelMaterial(color3, isLightsAndShadowsRender, opacity)}
      </mesh>

      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.JungleBase.geometry}
      >
        {basicModelMaterial(colorBase, isLightsAndShadowsRender, opacity)}
      </mesh>
    </>
  )
}

useGLTF.preload('/laur-jungle.glb')
// useGLTF.preload('/ticalla-brush.glb')
