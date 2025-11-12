import { useGLTF } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import usePieceHoverState from '../../hooks/usePieceHoverState'
import useBoundStore from '../../store/store'
import { HexTerrain, Pieces } from '../../types'
import { hexTerrainColor } from '../maphex/hexColors'
import { basicModelMaterial } from './materials'
import { PIECE_PREVIEW_OPACITY } from '../../utils/constants'
import { decodePieceID } from '../../utils/map-utils'

export function JungleBrush({
  pid,
  opacity,
}: { pid?: string; opacity?: number }) {
  const hoveredPieceID = useBoundStore((s) => s.hoveredPieceID)
  const { onPointerEnterBoardPiece, onPointerOut } = usePieceHoverState()
  const toggleSelectedPieceID = useBoundStore((s) => s.toggleSelectedPieceID)
  const selectedPieceID = useBoundStore((s) => s.selectedPieceID)
  const isSelected = selectedPieceID === pid
  const isHighlighted = hoveredPieceID === pid || isSelected
  const { inventoryID } = decodePieceID(pid || '')
  const opacityLevel = (opacity ?? pid) ? 1 : PIECE_PREVIEW_OPACITY
  const pointerHandlers = pid
    ? {
      onPointerUp: (e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation()
        if (e.button !== 0) return
        toggleSelectedPieceID(isSelected ? '' : pid)
      },
      onPointerEnter: (e: ThreeEvent<PointerEvent>) =>
        onPointerEnterBoardPiece(e, pid),
      onPointerOut: (e: ThreeEvent<PointerEvent>) => onPointerOut(e),
    }
    : {}
  const model =
    inventoryID === Pieces.laurBrush10 ? (
      <LaurBrushPreview isHighlighted={isHighlighted} opacity={opacityLevel} />
    ) : inventoryID === Pieces.swampBrush10 ? (
      <SwampBrushPreview isHighlighted={isHighlighted} opacity={opacityLevel} />
    ) : (
      <TicallaBrushPreview
        isHighlighted={isHighlighted}
        opacity={opacityLevel}
      />
    )
  return <group {...pointerHandlers}>{model}</group>
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
useGLTF.preload('/laur-jungle.glb')
