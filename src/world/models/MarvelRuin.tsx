import { useGLTF } from '@react-three/drei'
import { Pieces } from '../../types'
import { basicDoubleSideModelMaterial } from './materials'
import type { ModelComponentProps } from './ModelComponentProps'

export function MarvelRuin({
  color,
  secondaryColor,
  highlightColor,
  boardPiece,
  opacity,
  isHighlighted,
  isLightsAndShadowsRender,
  showUpperFloor,
  showWallIntact,
}: ModelComponentProps & {
  showUpperFloor?: boolean
  showWallIntact?: boolean
}) {
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const { nodes } = useGLTF('/marvel-ruins.glb') as any
  const currentColor =
    isHighlighted?.(boardPiece?.uid ?? '') && highlightColor
      ? highlightColor
      : color
  const currentSecondaryColor =
    isHighlighted?.(boardPiece?.uid ?? '') && highlightColor
      ? highlightColor
      : secondaryColor
        ? secondaryColor
        : color
  const isUpperFloor = showUpperFloor ?? (boardPiece?.inventoryID === Pieces.marvel || boardPiece?.inventoryID === Pieces.marvelBroken)
  const isWallIntact = showWallIntact ?? (boardPiece?.inventoryID === Pieces.marvel || boardPiece?.inventoryID === Pieces.marvelNoUpper)
  return (
    <>
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.MarvelRuinMain.geometry}
      >
        {basicDoubleSideModelMaterial(
          currentColor,
          !!isLightsAndShadowsRender,
          opacity ?? 1,
        )}
      </mesh>
      {isUpperFloor && (
        <mesh
          receiveShadow={isLightsAndShadowsRender}
          castShadow={isLightsAndShadowsRender}
          geometry={nodes.MarvelRuinUpperFloor.geometry}
        >
          {basicDoubleSideModelMaterial(
            currentSecondaryColor,
            !!isLightsAndShadowsRender,
            opacity ?? 1,
          )}
        </mesh>
      )}
      {isWallIntact && (
        <mesh
          receiveShadow={isLightsAndShadowsRender}
          castShadow={isLightsAndShadowsRender}
          geometry={nodes.MarvelRuinRemoveableWall.geometry}
        >
          {basicDoubleSideModelMaterial(
            currentColor,
            !!isLightsAndShadowsRender,
            opacity ?? 1,
          )}
        </mesh>
      )}
    </>
  )
}

useGLTF.preload('/marvel-ruins.glb')
