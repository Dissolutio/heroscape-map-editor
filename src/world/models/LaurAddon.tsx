import { useGLTF } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import usePieceHoverState from '../../hooks/usePieceHoverState'
import { type BoardPiece, Pieces } from '../../types'
import { basicModelMaterial } from './materials'

export function LaurWallAddon({
  color,
  secondaryColor,
  boardPiece,
  onPointerUp,
  opacity,
  selectedPieceID,
  hoveredPieceID,
  isLightsAndShadowsRender,
}: {
  color: string
  secondaryColor: string
  boardPiece?: BoardPiece
  onPointerUp?: (e: ThreeEvent<PointerEvent>, boardPiece: BoardPiece) => void
  opacity?: number
  selectedPieceID?: string
  hoveredPieceID?: string
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
  const { onPointerEnterPiece, onPointerOut } = usePieceHoverState()
  const isSelected = selectedPieceID === boardPiece?.uid
  const isHighlighted = hoveredPieceID === boardPiece?.uid || isSelected
  const currentColor = isHighlighted
    ? 'yellow'
    : color
  const opacityLevel = opacity ?? 1
  const interactivityProps = onPointerUp && boardPiece ? {
    onPointerUp: (e: ThreeEvent<PointerEvent>) => onPointerUp(e, boardPiece),
    onPointerEnter: (e: ThreeEvent<PointerEvent>) => onPointerEnterPiece(e, boardPiece.uid),
    onPointerOut: (e: ThreeEvent<PointerEvent>) => onPointerOut(e),
  } : {}
  return (
    <group
      {...interactivityProps}
    >
      {/* LAUR WALL RUIN */}
      {/* {boardPiece?.inventoryID === Pieces.laurWallRuin2 && ()} */}
      {/* {boardPiece?.inventoryID === Pieces.laurWallRuin3 && ()} */}
      {boardPiece?.inventoryID === Pieces.laurWallRuin1 && (
        <>
          <mesh
            receiveShadow={isLightsAndShadowsRender}
            castShadow={isLightsAndShadowsRender}
            geometry={LaurWallRuin.geometry}
          >
            {basicModelMaterial(color, !!isLightsAndShadowsRender, opacityLevel)}
          </mesh>
          <mesh
            receiveShadow={isLightsAndShadowsRender}
            castShadow={isLightsAndShadowsRender}
            geometry={LaurWallRuinBustedConcrete.geometry}
          >
            {basicModelMaterial(secondaryColor, !!isLightsAndShadowsRender, opacityLevel)}
          </mesh>
        </>
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
            {basicModelMaterial(color, !!isLightsAndShadowsRender, opacityLevel)}
          </mesh>
          <mesh
            receiveShadow={isLightsAndShadowsRender}
            castShadow={isLightsAndShadowsRender}
            geometry={LaurWallShortDecorDeep.geometry}
          >
            {basicModelMaterial(secondaryColor, !!isLightsAndShadowsRender, opacityLevel)}
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
            {basicModelMaterial(color, !!isLightsAndShadowsRender, opacityLevel)}
          </mesh>
          <mesh
            receiveShadow={isLightsAndShadowsRender}
            castShadow={isLightsAndShadowsRender}
            geometry={LaurWallLongDecorDeep.geometry}
          >
            {basicModelMaterial(secondaryColor, !!isLightsAndShadowsRender, opacityLevel)}
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
