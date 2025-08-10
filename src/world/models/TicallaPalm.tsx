import { useGLTF } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import usePieceHoverState from '../../hooks/usePieceHoverState'
import useBoundStore from '../../store/store'
import { type BoardHex, HexTerrain, PiecePrefixes, Pieces } from '../../types'
import { hexTerrainColor } from '../maphex/hexColors'
import { basicModelMaterial } from './materials'

export default function TicallaPalm({ boardHex }: { boardHex: BoardHex }) {
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
  const isSelected = selectedPieceID === boardHex.pieceID
  const isHighlighted = hoveredPieceID === boardHex.pieceID || isSelected
  if (boardHex.inventoryID.startsWith(PiecePrefixes.laurPalm)) {
    return (
      <>
        <group
          onPointerUp={(e) => onPointerUp(e)}
          onPointerEnter={(e) => onPointerEnter(e, boardHex)}
          onPointerOut={(e) => onPointerOut(e)}
        >
          <LaurPalmPreview isHighlighted={isHighlighted} />
        </group>
      </>
    )
  }
  return (
    <group
      onPointerUp={(e) => onPointerUp(e)}
      onPointerEnter={(e) => onPointerEnter(e, boardHex)}
      onPointerOut={(e) => onPointerOut(e)}
    >
      <TicallaPalmPreview isHighlighted={isHighlighted} />
    </group>
  )
}
export function TicallaPalmPreview({
  opacity = 1,
  isHighlighted
}: {
  opacity?: number
  isHighlighted?: boolean
}) {
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const { nodes } = useGLTF('/laur-jungle.glb') as any
  const isLightsAndShadowsRender = useBoundStore((s) => s.isLightsAndShadowsRender)
  const colorPalmTrunk = isHighlighted ? 'yellow' : hexTerrainColor.ticallaPalmTrunk
  const colorPalmCanopy = isHighlighted ? 'yellow' : hexTerrainColor.ticallaPalmCanopy
  const colorTriLeaf = isHighlighted ? 'yellow' : hexTerrainColor.ticallaTriLeaf
  const colorNeedleFern = isHighlighted ? 'yellow' : hexTerrainColor.ticallaNeedleFern
  const colorPineappleFern = isHighlighted ? 'yellow' : hexTerrainColor.ticallaPineappleFern
  const colorBase = isHighlighted ? 'yellow' : hexTerrainColor[HexTerrain.swamp]
  return (
    <>
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.Palm_Trunk.geometry}
      >
        {basicModelMaterial(colorPalmTrunk, isLightsAndShadowsRender, opacity)}
      </mesh>
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.Palm_Canopy.geometry}
      >
        {basicModelMaterial(colorPalmCanopy, isLightsAndShadowsRender, opacity)}
      </mesh>
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.JungleNeedleFern.geometry}
      >
        {basicModelMaterial(colorNeedleFern, isLightsAndShadowsRender, opacity)}
      </mesh>
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.TicallaPineappleFern.geometry}
      >
        {basicModelMaterial(colorPineappleFern, isLightsAndShadowsRender, opacity)}
      </mesh>
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.TicallaTriLeaf.geometry}
      >
        {basicModelMaterial(colorTriLeaf, isLightsAndShadowsRender, opacity)}
      </mesh>

      {/* <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.PalmBrush.geometry}
      >
        {basicModelMaterial(colorBrush, isLightsAndShadowsRender, opacity)}
      </mesh> */}
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
export function LaurPalmPreview({
  opacity = 1,
  isHighlighted
}: {
  opacity?: number
  isHighlighted?: boolean
}) {
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const { nodes } = useGLTF('/laur-jungle.glb') as any
  const isLightsAndShadowsRender = useBoundStore((s) => s.isLightsAndShadowsRender)
  const colorPalmTrunk = isHighlighted ? 'yellow' : hexTerrainColor.ticallaPalmTrunk
  const colorPalmCanopy = isHighlighted ? 'yellow' : hexTerrainColor.ticallaPalmCanopy
  const colorTriLeaf = isHighlighted ? 'yellow' : hexTerrainColor.laurTriLeaf
  const colorTriCactus = isHighlighted ? 'yellow' : hexTerrainColor.laurTriCactus
  const colorRoundCactus = isHighlighted ? 'yellow' : hexTerrainColor.laurRoundCactus
  const colorBase = isHighlighted ? 'yellow' : hexTerrainColor[HexTerrain.swamp]
  return (
    <>
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.Palm_Trunk.geometry}
      >
        {basicModelMaterial(colorPalmTrunk, isLightsAndShadowsRender, opacity)}
      </mesh>
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.Palm_Canopy.geometry}
      >
        {basicModelMaterial(colorPalmCanopy, isLightsAndShadowsRender, opacity)}
      </mesh>
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.LaurTriCactus.geometry}
      >
        {basicModelMaterial(colorTriCactus, isLightsAndShadowsRender, opacity)}
      </mesh>
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.LaurRoundCactus.geometry}
      >
        {basicModelMaterial(colorRoundCactus, isLightsAndShadowsRender, opacity)}
      </mesh>
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.LaurTriLeaf.geometry}
      >
        {basicModelMaterial(colorTriLeaf, isLightsAndShadowsRender, opacity)}
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
