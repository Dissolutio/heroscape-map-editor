import { useGLTF } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import usePieceHoverState from '../../hooks/usePieceHoverState'
import useBoundStore from '../../store/store'
import { HexTerrain, PiecePrefixes } from '../../types'
import { hexTerrainColor } from '../maphex/hexColors'
import { basicModelMaterial } from './materials'
import { decodePieceID } from '../../utils/map-utils'
import { PIECE_PREVIEW_OPACITY } from '../../utils/constants'
import type { ModelComponentProps } from './ModelComponentProps'

export function TicallaPalm({
  color,
  secondaryColor,
  colorTrunk,
  colorNeedleFern,
  colorPineappleFern,
  colorTriLeaf,
  highlightColor,
  boardPiece,
  opacity,
  isHighlighted,
  isLightsAndShadowsRender,
}: ModelComponentProps) {
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const { nodes } = useGLTF('/laur-jungle.glb') as any
  const currentColor =
    isHighlighted?.(boardPiece?.uid ?? '') && highlightColor
      ? highlightColor
      : color
  const currentColorTrunk =
    isHighlighted?.(boardPiece?.uid ?? '') && highlightColor
      ? highlightColor
      : colorTrunk
  const currentColorNeedleFern =
    isHighlighted?.(boardPiece?.uid ?? '') && highlightColor
      ? highlightColor
      : colorNeedleFern
  const currentColorPineappleFern =
    isHighlighted?.(boardPiece?.uid ?? '') && highlightColor
      ? highlightColor
      : colorPineappleFern
  const currentColorTrileaf =
    isHighlighted?.(boardPiece?.uid ?? '') && highlightColor
      ? highlightColor
      : colorTriLeaf
  const currentColorBase =
    isHighlighted?.(boardPiece?.uid ?? '') && highlightColor
      ? highlightColor
      : secondaryColor || color
  return (
    <>
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.Palm_Trunk.geometry}
      >
        {basicModelMaterial(currentColorTrunk, !!isLightsAndShadowsRender, opacity)}
      </mesh>
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.Palm_Canopy.geometry}
      >
        {basicModelMaterial(currentColor, !!isLightsAndShadowsRender, opacity)}
      </mesh>
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.JungleNeedleFern.geometry}
      >
        {basicModelMaterial(currentColorNeedleFern, !!isLightsAndShadowsRender, opacity)}
      </mesh>
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.TicallaPineappleFern.geometry}
      >
        {basicModelMaterial(
          currentColorPineappleFern,
          !!isLightsAndShadowsRender,
          opacity,
        )}
      </mesh>
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.TicallaTriLeaf.geometry}
      >
        {basicModelMaterial(currentColorTrileaf, !!isLightsAndShadowsRender, opacity)}
      </mesh>
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.JungleBase.geometry}
      >
        {basicModelMaterial(currentColorBase, !!isLightsAndShadowsRender, opacity)}
      </mesh>
    </>
  )
}

export function LaurPalm({
  color,
  secondaryColor,
  colorTrunk,
  colorRoundCactus,
  colorTriCactus,
  colorTriLeaf,
  highlightColor,
  boardPiece,
  opacity,
  isHighlighted,
  isLightsAndShadowsRender,
}: ModelComponentProps) {
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const { nodes } = useGLTF('/laur-jungle.glb') as any
  const currentColor =
    isHighlighted?.(boardPiece?.uid ?? '') && highlightColor
      ? highlightColor
      : color
  const currentColorTrunk =
    isHighlighted?.(boardPiece?.uid ?? '') && highlightColor
      ? highlightColor
      : colorTrunk
  const currentColorRoundCactus =
    isHighlighted?.(boardPiece?.uid ?? '') && highlightColor
      ? highlightColor
      : colorRoundCactus
  const currentColorTriCactus =
    isHighlighted?.(boardPiece?.uid ?? '') && highlightColor
      ? highlightColor
      : colorTriCactus
  const currentColorTrileaf =
    isHighlighted?.(boardPiece?.uid ?? '') && highlightColor
      ? highlightColor
      : colorTriLeaf
  const currentColorBase =
    isHighlighted?.(boardPiece?.uid ?? '') && highlightColor
      ? highlightColor
      : secondaryColor || color
  return (
    <>
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.Palm_Trunk.geometry}
      >
        {basicModelMaterial(currentColorTrunk, !!isLightsAndShadowsRender, opacity)}
      </mesh>
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.Palm_Canopy.geometry}
      >
        {basicModelMaterial(currentColor, !!isLightsAndShadowsRender, opacity)}
      </mesh>
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.LaurTriCactus.geometry}
      >
        {basicModelMaterial(currentColorTriCactus, !!isLightsAndShadowsRender, opacity)}
      </mesh>
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.LaurRoundCactus.geometry}
      >
        {basicModelMaterial(
          currentColorRoundCactus,
          !!isLightsAndShadowsRender,
          opacity,
        )}
      </mesh>
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.LaurTriLeaf.geometry}
      >
        {basicModelMaterial(currentColorTrileaf, !!isLightsAndShadowsRender, opacity)}
      </mesh>

      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.JungleBase.geometry}
      >
        {basicModelMaterial(currentColorBase, !!isLightsAndShadowsRender, opacity)}
      </mesh>
    </>
  )
}

useGLTF.preload('/laur-jungle.glb')
