import { useGLTF } from '@react-three/drei'
import { Pieces } from '../../types'
import { basicModelMaterial } from './materials'
import type { ModelComponentProps } from './ModelComponentProps'

export function LaurWallAddon({
  color,
  secondaryColor,
  highlightColor,
  boardPiece,
  opacity,
  isHighlighted,
  isLightsAndShadowsRender,
}: ModelComponentProps) {
  const {
    nodes: { LaurWallRuin, LaurWallRuinBustedConcrete },
    // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  } = useGLTF('/laurwall-ruin-from-hs-models-blendfile.glb') as any
  const {
    nodes: { LaurWallShort, LaurWallShortDecorDeep },
    // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  } = useGLTF('/laurwall-short-from-hs-models-blendfile.glb') as any
  const {
    nodes: { LaurWallLong, LaurWallLongDecorDeep },
    // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  } = useGLTF('/laurwall-long-from-hs-models-blendfile.glb') as any
  const {
    nodes: { LaurWallLongArch },
    // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  } = useGLTF('/laurwall-long-arch.glb') as any
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
  const opacityLevel = opacity ?? 1
  return (
    <group>
      {/* LAUR WALL RUIN */}
      {/* {boardPiece?.inventoryID === Pieces.laurWallRuin2 && ()} */}
      {/* {boardPiece?.inventoryID === Pieces.laurWallRuin3 && ()} */}
      {boardPiece?.inventoryID === Pieces.laurWallRuin1 && (
        <group>
          <mesh
            receiveShadow={isLightsAndShadowsRender}
            castShadow={isLightsAndShadowsRender}
            geometry={LaurWallRuin.geometry}
          >
            {basicModelMaterial(
              currentColor,
              !!isLightsAndShadowsRender,
              opacityLevel,
            )}
          </mesh>
          <mesh
            receiveShadow={isLightsAndShadowsRender}
            castShadow={isLightsAndShadowsRender}
            geometry={LaurWallRuinBustedConcrete.geometry}
          >
            {basicModelMaterial(
              currentSecondaryColor,
              !!isLightsAndShadowsRender,
              opacityLevel,
            )}
          </mesh>
        </group>
      )}
      {/* LAUR WALL SHORT */}
      {/* {inventoryID === Pieces.laurWallShortStackable && ()} */}
      {boardPiece?.inventoryID === Pieces.laurWallShort && (
        <>
          <mesh
            receiveShadow={isLightsAndShadowsRender}
            castShadow={isLightsAndShadowsRender}
            geometry={LaurWallShort.geometry}
          >
            {basicModelMaterial(
              currentColor,
              !!isLightsAndShadowsRender,
              opacityLevel,
            )}
          </mesh>
          <mesh
            receiveShadow={isLightsAndShadowsRender}
            castShadow={isLightsAndShadowsRender}
            geometry={LaurWallShortDecorDeep.geometry}
          >
            {basicModelMaterial(
              currentSecondaryColor,
              !!isLightsAndShadowsRender,
              opacityLevel,
            )}
          </mesh>
        </>
      )}
      {/* LAUR WALL LONG */}
      {/* {inventoryID === Pieces.laurWallLongStackable && ()} */}
      {boardPiece?.inventoryID === Pieces.laurWallLong && (
        <>
          <mesh
            receiveShadow={isLightsAndShadowsRender}
            castShadow={isLightsAndShadowsRender}
            geometry={LaurWallLong.geometry}
          >
            {basicModelMaterial(
              currentColor,
              !!isLightsAndShadowsRender,
              opacityLevel,
            )}
          </mesh>
          <mesh
            receiveShadow={isLightsAndShadowsRender}
            castShadow={isLightsAndShadowsRender}
            geometry={LaurWallLongDecorDeep.geometry}
          >
            {basicModelMaterial(
              currentSecondaryColor,
              !!isLightsAndShadowsRender,
              opacityLevel,
            )}
          </mesh>
        </>
      )}
      {/* LAUR WALL ARCH */}
      {boardPiece?.inventoryID === Pieces.laurWallArch && (
        <mesh
          receiveShadow={isLightsAndShadowsRender}
          castShadow={isLightsAndShadowsRender}
          geometry={LaurWallLongArch.geometry}
        >
          {basicModelMaterial(
            currentColor,
            !!isLightsAndShadowsRender,
            opacityLevel,
          )}
        </mesh>
      )}
    </group>
  )
}

useGLTF.preload('/laurwall-ruin-from-hs-models-blendfile.glb')
useGLTF.preload('/laurwall-short-from-hs-models-blendfile.glb')
useGLTF.preload('/laurwall-long-from-hs-models-blendfile.glb')
useGLTF.preload('/laurwall-long-arch.glb')
