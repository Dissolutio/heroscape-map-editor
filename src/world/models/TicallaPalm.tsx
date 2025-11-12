import { useGLTF } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import usePieceHoverState from '../../hooks/usePieceHoverState'
import useBoundStore from '../../store/store'
import { type BoardHex, HexTerrain, PiecePrefixes, Pieces } from '../../types'
import { hexTerrainColor } from '../maphex/hexColors'
import { basicModelMaterial } from './materials'
import { decodePieceID } from '../../utils/map-utils'
import { PIECE_PREVIEW_OPACITY } from '../../utils/constants'

export default function TicallaPalm({
  pid,
  opacity,
}: { pid?: string; opacity?: number }) {
  const hoveredPieceID = useBoundStore((s) => s.hoveredPieceID)
  const { onPointerEnterPiece, onPointerOut } = usePieceHoverState()
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
        onPointerEnterPiece(e, pid),
      onPointerOut: (e: ThreeEvent<PointerEvent>) => onPointerOut(e),
    }
    : {}
  const model = inventoryID.startsWith(PiecePrefixes.laurPalm) ? (
    <LaurPalmPreview isHighlighted={isHighlighted} opacity={opacityLevel} />
  ) : (
    <TicallaPalmPreview isHighlighted={isHighlighted} opacity={opacityLevel} />
  )
  return <group {...pointerHandlers}>{model}</group>
}
export function TicallaPalmPreview({
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
  const colorPalmTrunk = isHighlighted
    ? 'yellow'
    : hexTerrainColor.ticallaPalmTrunk
  const colorPalmCanopy = isHighlighted
    ? 'yellow'
    : hexTerrainColor.ticallaPalmCanopy
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
        {basicModelMaterial(
          colorPineappleFern,
          isLightsAndShadowsRender,
          opacity,
        )}
      </mesh>
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
        geometry={nodes.JungleBase.geometry}
      >
        {basicModelMaterial(colorBase, isLightsAndShadowsRender, opacity)}
      </mesh>
    </>
  )
}
export function LaurPalmPreview({
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
  const colorPalmTrunk = isHighlighted
    ? 'yellow'
    : hexTerrainColor.ticallaPalmTrunk
  const colorPalmCanopy = isHighlighted
    ? 'yellow'
    : hexTerrainColor.ticallaPalmCanopy
  const colorTriLeaf = isHighlighted ? 'yellow' : hexTerrainColor.laurTriLeaf
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
        {basicModelMaterial(
          colorRoundCactus,
          isLightsAndShadowsRender,
          opacity,
        )}
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
