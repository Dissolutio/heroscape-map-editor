
import { useGLTF } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import usePieceHoverState from '../../hooks/usePieceHoverState'
import { type BoardPiece, Pieces } from '../../types'
import { basicModelMaterial } from './materials'
import { encodeBoardPieces } from '../../utils/map-utils'

export function LaurWallAddon({
  color,
  secondaryColor,
  highlightColor,
  boardPiece,
  onPointerUp,
  onPointerEnter,
  onPointerOut,
  opacity,
  isHighlighted,
  isLightsAndShadowsRender,
}: {
  color: string
  secondaryColor: string
  highlightColor?: string
  boardPiece?: BoardPiece
  onPointerUp?: (e: ThreeEvent<PointerEvent>, uid: string) => void
  onPointerEnter?: (e: ThreeEvent<PointerEvent>, uid: string) => void
  onPointerOut?: (e: ThreeEvent<PointerEvent>) => void
  opacity?: number
  isHighlighted?: (uid: string) => boolean
  isLightsAndShadowsRender?: boolean
}) {
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
  const currentColor = isHighlighted?.(boardPiece?.uid ?? '') && highlightColor ? highlightColor : color
  const interiorColor = isHighlighted?.(boardPiece?.uid ?? '') && highlightColor ? highlightColor : secondaryColor
  const opacityLevel = opacity ?? 1
  return (
    <group
      onPointerUp={(e) => onPointerUp && boardPiece ? onPointerUp(e, boardPiece.uid) : null}
      onPointerEnter={(e) => onPointerEnter && boardPiece ? onPointerEnter(e, boardPiece.uid) : null}
      onPointerOut={(e) => onPointerOut && boardPiece ? onPointerOut(e) : null}
      scale={isHighlighted?.(boardPiece?.uid ?? '') ? [1.01, 1.01, 1.01] : [1, 1, 1]}
    >
      {/* LAUR WALL RUIN */}
      {/* {boardPiece?.inventoryID === Pieces.laurWallRuin2 && ()} */}
      {/* {boardPiece?.inventoryID === Pieces.laurWallRuin3 && ()} */}
      {boardPiece?.inventoryID === Pieces.laurWallRuin1 && (
        <group
        >
          <mesh
            receiveShadow={isLightsAndShadowsRender}
            castShadow={isLightsAndShadowsRender}
            geometry={LaurWallRuin.geometry}
          >
            {basicModelMaterial(currentColor, !!isLightsAndShadowsRender, opacityLevel)}
          </mesh>
          <mesh
            receiveShadow={isLightsAndShadowsRender}
            castShadow={isLightsAndShadowsRender}
            geometry={LaurWallRuinBustedConcrete.geometry}
          >
            {basicModelMaterial(interiorColor, !!isLightsAndShadowsRender, opacityLevel)}
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
            {basicModelMaterial(currentColor, !!isLightsAndShadowsRender, opacityLevel)}
          </mesh>
          <mesh
            receiveShadow={isLightsAndShadowsRender}
            castShadow={isLightsAndShadowsRender}
            geometry={LaurWallShortDecorDeep.geometry}
          >
            {basicModelMaterial(interiorColor, !!isLightsAndShadowsRender, opacityLevel)}
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
            {basicModelMaterial(currentColor, !!isLightsAndShadowsRender, opacityLevel)}
          </mesh>
          <mesh
            receiveShadow={isLightsAndShadowsRender}
            castShadow={isLightsAndShadowsRender}
            geometry={LaurWallLongDecorDeep.geometry}
          >
            {basicModelMaterial(interiorColor, !!isLightsAndShadowsRender, opacityLevel)}
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
          {basicModelMaterial(currentColor, !!isLightsAndShadowsRender, opacityLevel)}
        </mesh>
      )
      }
    </group >
  )
}

useGLTF.preload('/laurwall-ruin-from-hs-models-blendfile.glb')
useGLTF.preload('/laurwall-short-from-hs-models-blendfile.glb')
useGLTF.preload('/laurwall-long-from-hs-models-blendfile.glb')
useGLTF.preload('/laurwall-long-arch.glb')
