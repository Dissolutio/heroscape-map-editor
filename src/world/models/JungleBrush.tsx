import { useGLTF } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import usePieceHoverState from '../../hooks/usePieceHoverState'
import useBoundStore from '../../store/store'
import { HexTerrain, Pieces } from '../../types'
import { hexTerrainColor } from '../maphex/hexColors'
import { basicModelMaterial } from './materials'
import { PIECE_PREVIEW_OPACITY } from '../../utils/constants'
import { decodePieceID } from '../../utils/map-utils'
import type { ModelComponentProps } from './ModelComponentProps'

export function LaurBrush({
  color,
  secondaryColor,
  colorRoundCactus,
  colorTriCactus,
  colorTriLeaf,
  highlightColor,
  boardPiece,
  opacity,
  isHighlighted,
  isLightsAndShadowsRender,
}: ModelComponentProps & {
  colorRoundCactus: string
  colorTriCactus: string
  colorTriLeaf: string
}) {
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const { nodes } = useGLTF('/laur-jungle.glb') as any
  const currentColor =
    isHighlighted?.(boardPiece?.uid ?? '') && highlightColor
      ? highlightColor
      : color
  const currentColorRoundCactus =
    isHighlighted?.(boardPiece?.uid ?? '') && highlightColor
      ? highlightColor
      : colorRoundCactus
  const currentColorTriCactus =
    isHighlighted?.(boardPiece?.uid ?? '') && highlightColor
      ? highlightColor
      : colorTriCactus
  const currentColorTriLeaf =
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
        geometry={nodes.LaurTriLeaf.geometry}
        // Trileaf is a little counter-clockwise on brush, unlike on palms
        rotation={[0, Math.PI / 6.5, 0]}
      >
        {basicModelMaterial(currentColorTriLeaf, !!isLightsAndShadowsRender, opacity)}
      </mesh>
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.LaurFatLeaf.geometry}
      >
        {basicModelMaterial(currentColor, !!isLightsAndShadowsRender, opacity)}
      </mesh>
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.LaurTriCactus.geometry}
        // Cacti are closer together on brush than on palm
        rotation={[0, Math.PI / 1.5, 0]}
      >
        {basicModelMaterial(currentColorTriCactus, !!isLightsAndShadowsRender, opacity)}
      </mesh>
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.LaurRoundCactus.geometry}
        // Cacti are closer together on brush than on palm
        rotation={[0, -Math.PI / 1.6, 0]}
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
        geometry={nodes.JungleBase.geometry}
      >
        {basicModelMaterial(currentColorBase, !!isLightsAndShadowsRender, opacity)}
      </mesh>
    </>
  )
}
export function TicallaBrush({
  color,
  secondaryColor,
  colorNeedleFern,
  colorPineappleFern,
  colorTriLeaf,
  highlightColor,
  boardPiece,
  opacity,
  isHighlighted,
  isLightsAndShadowsRender,
}: ModelComponentProps & {
  colorNeedleFern: string
  colorPineappleFern: string
  colorTriLeaf: string
}) {
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const { nodes } = useGLTF('/laur-jungle.glb') as any
  const currentColor =
    isHighlighted?.(boardPiece?.uid ?? '') && highlightColor
      ? highlightColor
      : color
  const currentColorNeedleFern =
    isHighlighted?.(boardPiece?.uid ?? '') && highlightColor
      ? highlightColor
      : colorNeedleFern
  const currentColorPineappleFern =
    isHighlighted?.(boardPiece?.uid ?? '') && highlightColor
      ? highlightColor
      : colorPineappleFern
  const currentColorTriLeaf =
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
        geometry={nodes.TicallaTriLeaf.geometry}
      >
        {basicModelMaterial(currentColorTriLeaf, !!isLightsAndShadowsRender, opacity)}
      </mesh>
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.LaurFatLeaf.geometry}
        rotation={[0, Math.PI / 1.6, 0]}
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
        geometry={nodes.JungleBase.geometry}
      >
        {basicModelMaterial(currentColorBase, !!isLightsAndShadowsRender, opacity)}
      </mesh>
    </>
  )
}


useGLTF.preload('/laur-jungle.glb')
