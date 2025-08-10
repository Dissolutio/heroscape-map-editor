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
  const onPointerUp = (event: ThreeEvent<PointerEvent>) => {
    if (!boardHex) return
    event.stopPropagation() // prevent pass through
    // Early out right clicks(event.button=2), middle mouse clicks(1)
    if (event.button !== 0) {
      return
    }
    toggleSelectedPieceID(isSelected ? '' : boardHex.pieceID)
  }
  const selectedPieceID = useBoundStore((s) => s.selectedPieceID)
  const isSelected = selectedPieceID === boardHex?.pieceID
  const isHighlighted = hoveredPieceID === boardHex?.pieceID || isSelected
  if (boardHex?.inventoryID === Pieces.laurBrush10) {
    return (
      <group
        onPointerUp={(e) => boardHex ? onPointerUp(e) : noop()}
        onPointerEnter={(e) => boardHex ? onPointerEnter(e, boardHex) : noop()}
        onPointerOut={(e) => boardHex ? onPointerOut(e) : noop()}
      >
        <LaurBrushPreview
          isHighlighted={isHighlighted}
          opacity={boardHex ? 1 : PIECE_PREVIEW_OPACITY}
        />
      </group>
    )
  }
  if (boardHex?.inventoryID === Pieces.swampBrush10) {
    return (
      <group
        onPointerUp={(e) => boardHex ? onPointerUp(e) : noop()}
        onPointerEnter={(e) => boardHex ? onPointerEnter(e, boardHex) : noop()}
        onPointerOut={(e) => boardHex ? onPointerOut(e) : noop()}
      >
        <SwampBrushPreview
          isHighlighted={isHighlighted}
          opacity={boardHex ? 1 : PIECE_PREVIEW_OPACITY}
        />
      </group>
    )
  }
  return (
    <group
      onPointerUp={(e) => boardHex ? onPointerUp(e) : noop()}
      onPointerEnter={(e) => boardHex ? onPointerEnter(e, boardHex) : noop()}
      onPointerOut={(e) => boardHex ? onPointerOut(e) : noop()}
    >
      <TicallaBrushPreview
        isHighlighted={isHighlighted}
        opacity={boardHex ? 1 : PIECE_PREVIEW_OPACITY}
      />
    </group>
  )
}
export function LaurBrushPreview({
  opacity = 1,
  isHighlighted
}: {
  opacity?: number
  isHighlighted?: boolean
}) {
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const { nodes } = useGLTF('/laur-jungle.glb') as any
  // const { nodes } = useGLTF('/ticalla-brush.glb') as any
  const isLightsAndShadowsRender = useBoundStore((s) => s.isLightsAndShadowsRender)
  const colorTriLeaf = isHighlighted ? 'yellow' : hexTerrainColor.laurTriLeaf
  const colorTriCactus = isHighlighted ? 'yellow' : hexTerrainColor.laurTriCactus
  const colorRoundCactus = isHighlighted ? 'yellow' : hexTerrainColor.laurRoundCactus
  const colorBase = isHighlighted ? 'yellow' : hexTerrainColor[HexTerrain.swamp]
  return (
    <>
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
        geometry={nodes.LaurTriCactus.geometry}
        // Cacti are closer together on brush than on palm
        rotation={[0, Math.PI / 6.5, 0]}
      >
        {basicModelMaterial(colorTriCactus, isLightsAndShadowsRender, opacity)}
      </mesh>
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.LaurRoundCactus.geometry}
        // Cacti are closer together on brush than on palm
        rotation={[0, -Math.PI / 6.5, 0]}
      >
        {basicModelMaterial(colorRoundCactus, isLightsAndShadowsRender, opacity)}
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
  isHighlighted
}: {
  isHighlighted?: boolean
  opacity?: number
}) {
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const { nodes } = useGLTF('/laur-jungle.glb') as any
  const isLightsAndShadowsRender = useBoundStore((s) => s.isLightsAndShadowsRender)
  const colorTriLeaf = isHighlighted ? 'yellow' : hexTerrainColor.ticallaTriLeaf
  const colorNeedleFern = isHighlighted ? 'yellow' : hexTerrainColor.ticallaNeedleFern
  const colorPineappleFern = isHighlighted ? 'yellow' : hexTerrainColor.ticallaPineappleFern
  const colorBase = isHighlighted ? 'yellow' : hexTerrainColor[HexTerrain.swamp]
  return (
    <>

      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.TicallaTriLeaf.geometry}
      >
        {basicModelMaterial(colorTriLeaf, isLightsAndShadowsRender, opacity)}
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
        geometry={nodes.JungleBase.geometry}
      >
        {basicModelMaterial(colorBase, isLightsAndShadowsRender, opacity)}
      </mesh>
    </>
  )
}
export function SwampBrushPreview({
  opacity = 1,
  isHighlighted
}: {
  opacity?: number
  isHighlighted?: boolean
}) {
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const { nodes } = useGLTF('/laur-jungle.glb') as any
  const isLightsAndShadowsRender = useBoundStore((s) => s.isLightsAndShadowsRender)
  // const colorTriLeaf = isHighlighted ? 'yellow' : hexTerrainColor.swampTriLeaf
  const colorTriLeaf = isHighlighted ? 'yellow' : hexTerrainColor.swampFatLeaf
  const colorTriCactus = isHighlighted ? 'yellow' : hexTerrainColor.swampTriCactus
  const colorRoundCactus = isHighlighted ? 'yellow' : hexTerrainColor.swampRoundCactus
  const colorBase = isHighlighted ? 'yellow' : hexTerrainColor[HexTerrain.swamp]
  return (
    <>
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
        geometry={nodes.LaurTriCactus.geometry}
        // Cacti are closer together on brush than on palm
        rotation={[0, Math.PI / 6.5, 0]}
      >
        {basicModelMaterial(colorTriCactus, isLightsAndShadowsRender, opacity)}
      </mesh>

      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.LaurRoundCactus.geometry}
        // Cacti are closer together on brush than on palm
        rotation={[0, -Math.PI / 6.5, 0]}
      >
        {basicModelMaterial(colorRoundCactus, isLightsAndShadowsRender, opacity)}
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
