import { useGLTF } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import usePieceHoverState from '../../hooks/usePieceHoverState'
import useBoundStore from '../../store/store'
import { HexTerrain, Pieces } from '../../types'
import { hexTerrainColor } from '../maphex/hexColors'
import { basicModelMaterial } from './materials'
import { PIECE_PREVIEW_OPACITY } from '../../utils/constants'

export default function JungleBrush({
  pid,
  inventoryID,
}: { pid: string; inventoryID: string }) {
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
  const isSelected = selectedPieceIDs.includes(pid)
  const isHighlighted = hoveredPieceID === pid || isSelected
  if (inventoryID === Pieces.laurBrush10) {
    return (
      <group
        onPointerUp={(e) => onPointerUp(e)}
        onPointerEnter={(e) => onPointerEnterPID(e, pid)}
        onPointerOut={(e) => onPointerOut(e)}
      >
        <LaurBrushPreview isHighlighted={isHighlighted} opacity={1} />
      </group>
    )
  }
  if (inventoryID === Pieces.swampBrush10) {
    return (
      <group
        onPointerUp={(e) => onPointerUp(e)}
        onPointerEnter={(e) => onPointerEnterPID(e, pid)}
        onPointerOut={(e) => onPointerOut(e)}
      >
        <SwampBrushPreview isHighlighted={isHighlighted} opacity={1} />
      </group>
    )
  }
  return (
    <group
      onPointerUp={(e) => onPointerUp(e)}
      onPointerEnter={(e) => onPointerEnterPID(e, pid)}
      onPointerOut={(e) => onPointerOut(e)}
    >
      <TicallaBrushPreview isHighlighted={isHighlighted} opacity={1} />
    </group>
  )
}
export function LaurBrushPreview({
  opacity = 1,
  isHighlighted,
}: {
  opacity?: number
  isHighlighted?: boolean
}) {
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const { nodes } = useGLTF('/laur-jungle.glb') as any
  const isLightsAndShadowsRender = useBoundStore(
    (s) => s.isLightsAndShadowsRender,
  )
  const colorTriLeaf = isHighlighted ? 'yellow' : hexTerrainColor.laurTriLeaf
  const colorFatLeaf = isHighlighted ? 'yellow' : hexTerrainColor.laurFatLeaf
  const colorTriCactus = isHighlighted
    ? 'yellow'
    : hexTerrainColor.laurTriCactus
  const colorRoundCactus = isHighlighted
    ? 'yellow'
    : hexTerrainColor.laurRoundCactus
  const colorBase = isHighlighted ? 'yellow' : hexTerrainColor[HexTerrain.swamp]
  return (
    <>
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.LaurTriLeaf.geometry}
        // Trileaf is a little counter-clockwise on brush, unlike on palms
        rotation={[0, Math.PI / 6.5, 0]}
      >
        {basicModelMaterial(colorTriLeaf, isLightsAndShadowsRender, opacity)}
      </mesh>
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.LaurFatLeaf.geometry}
      >
        {basicModelMaterial(colorFatLeaf, isLightsAndShadowsRender, opacity)}
      </mesh>
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.LaurTriCactus.geometry}
        // Cacti are closer together on brush than on palm
        rotation={[0, Math.PI / 1.5, 0]}
      >
        {basicModelMaterial(colorTriCactus, isLightsAndShadowsRender, opacity)}
      </mesh>
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.LaurRoundCactus.geometry}
        // Cacti are closer together on brush than on palm
        rotation={[0, -Math.PI / 1.6, 0]}
      >
        {basicModelMaterial(
          colorRoundCactus,
          isLightsAndShadowsRender,
          opacity,
        )}
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
  isHighlighted,
}: {
  opacity?: number
  isHighlighted?: boolean
}) {
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const { nodes } = useGLTF('/laur-jungle.glb') as any
  const isLightsAndShadowsRender = useBoundStore(
    (s) => s.isLightsAndShadowsRender,
  )
  const colorTriLeaf = isHighlighted ? 'yellow' : hexTerrainColor.swampTriLeaf
  const colorFatLeaf = isHighlighted ? 'yellow' : hexTerrainColor.swampFatLeaf
  const colorRoundCactus = isHighlighted
    ? 'yellow'
    : hexTerrainColor.swampRoundCactus
  const colorTriCactus = isHighlighted
    ? 'yellow'
    : hexTerrainColor.swampTriCactus
  const colorBase = isHighlighted ? 'yellow' : hexTerrainColor[HexTerrain.swamp]
  return (
    <>
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.LaurTriLeaf.geometry}
        // Trileaf is a little counter-clockwise on brush, unlike on palms
        rotation={[0, Math.PI / 6.5, 0]}
      >
        {basicModelMaterial(colorTriLeaf, isLightsAndShadowsRender, opacity)}
      </mesh>
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.LaurFatLeaf.geometry}
        // Trileaf is a little counter-clockwise on brush, unlike on palms
        rotation={[0, Math.PI / 6.5, 0]}
      >
        {basicModelMaterial(colorFatLeaf, isLightsAndShadowsRender, opacity)}
      </mesh>

      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.LaurTriCactus.geometry}
        // Cacti are closer together on brush than on palm
        rotation={[0, Math.PI / 1.5, 0]}
      >
        {basicModelMaterial(colorTriCactus, isLightsAndShadowsRender, opacity)}
      </mesh>

      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.LaurRoundCactus.geometry}
        // Cacti are closer together on brush than on palm
        rotation={[0, -Math.PI / 1.6, 0]}
      >
        {basicModelMaterial(
          colorRoundCactus,
          isLightsAndShadowsRender,
          opacity,
        )}
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
  isHighlighted,
}: {
  isHighlighted?: boolean
  opacity?: number
}) {
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const { nodes } = useGLTF('/laur-jungle.glb') as any
  const isLightsAndShadowsRender = useBoundStore(
    (s) => s.isLightsAndShadowsRender,
  )
  const colorTriLeaf = isHighlighted ? 'yellow' : hexTerrainColor.ticallaTriLeaf
  const colorNeedleFern = isHighlighted
    ? 'yellow'
    : hexTerrainColor.ticallaNeedleFern
  const colorPineappleFern = isHighlighted
    ? 'yellow'
    : hexTerrainColor.ticallaPineappleFern
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
        geometry={nodes.LaurFatLeaf.geometry}
        rotation={[0, Math.PI / 1.6, 0]}
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
        {basicModelMaterial(
          colorPineappleFern,
          isLightsAndShadowsRender,
          opacity,
        )}
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
// useGltf.preload('/laur-jungle.glb')
