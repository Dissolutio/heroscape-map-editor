import type { ThreeEvent } from '@react-three/fiber'
import usePieceHoverState from '../../hooks/usePieceHoverState'
import useBoundStore from '../../store/store'
import { isDragPassThrough } from '../drag/dragController'
import { type BoardHex, HexTerrain, Pieces } from '../../types'
import { PIECE_PREVIEW_OPACITY } from '../../utils/constants'
import { hexTerrainColor } from '../maphex/hexColors'
import { basicModelMaterial } from './materials'
import { useDisposableGLTF } from './useDisposableGLTF'

type Props = {
  boardHex: BoardHex
  onPointerUp: (e: ThreeEvent<PointerEvent>, hex: BoardHex) => void
}

// These were made after the castle walls and are VERY SIMILAR. TODO: DRY
export default function CastleBase({ boardHex, onPointerUp }: Props) {
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const { nodes } = useDisposableGLTF('/adjustable-castle-walls.glb') as any
  const pieceID = boardHex.pieceID
  const selectedPieceIDs = useBoundStore((s) => s.selectedPieceIDs)
  const hoveredPieceID = useBoundStore((s) => s.hoveredPieceID)
  const toggleSelectedPieceID = useBoundStore((s) => s.toggleSelectedPieceID)
  const isSelected = selectedPieceIDs.includes(boardHex?.boardPieceUID ?? '')
  const isLightsAndShadowsRender = useBoundStore(
    (s) => s.isLightsAndShadowsRender,
  )
  const { onPointerEnter, onPointerOut } = usePieceHoverState()
  const isHighlighted = hoveredPieceID === boardHex?.boardPieceUID || isSelected
  const yellowColor = 'yellow'
  const bodyGeometry = pieceID.includes(Pieces.castleBaseEnd)
    ? nodes.CastleWallEndBody.geometry
    : pieceID.includes(Pieces.castleBaseStraight)
      ? nodes.CastleWallStraightBody.geometry
      : nodes.CastleWallCornerBody.geometry
  const capGeometry = pieceID.includes(Pieces.castleBaseEnd)
    ? nodes.CastleWallEndCap.geometry
    : pieceID.includes(Pieces.castleBaseStraight)
      ? nodes.CastleWallStraightCap.geometry
      : nodes.CastleWallCornerCap.geometry
  const color = isHighlighted
    ? yellowColor
    : hexTerrainColor[HexTerrain.castleBase]
  const onPointerEnterCap = (e: ThreeEvent<PointerEvent>) => {
    // the pointer sees through a base being dragged
    if (isDragPassThrough(boardHex.boardPieceUID)) return
    e.stopPropagation()
    onPointerEnter(e, boardHex)
  }
  const onPointerOutCap = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    onPointerOut(e)
  }
  const onPointerUpBody = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation() // prevent pass through
    // Early out right clicks(event.button=2), middle mouse clicks(1)
    if (event.button !== 0) {
      return
    }
    toggleSelectedPieceID(
      boardHex.boardPieceUID ?? '',
      event.shiftKey || event.ctrlKey || event.metaKey,
      { x: event.point.x, z: event.point.z },
    )
  }
  return (
    <>
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={bodyGeometry}
        onPointerUp={onPointerUpBody}
        onPointerEnter={(e) => onPointerEnter(e, boardHex)}
        onPointerOut={onPointerOut}
        material={basicModelMaterial(color, isLightsAndShadowsRender)}
      />

      {/* Each wall has a WallCap mesh, then each wall-type adds on its little directional indicator mesh */}
      <group
        onPointerUp={(e) => onPointerUp(e, boardHex)}
        onPointerEnter={onPointerEnterCap}
        onPointerOut={onPointerOutCap}
      >
        <mesh
          receiveShadow={isLightsAndShadowsRender}
          castShadow={isLightsAndShadowsRender}
          geometry={nodes.WallCap.geometry}
          onPointerEnter={onPointerEnterCap}
          onPointerOut={onPointerOutCap}
          material={basicModelMaterial(color, isLightsAndShadowsRender)}
        />
        <mesh
          receiveShadow={isLightsAndShadowsRender}
          castShadow={isLightsAndShadowsRender}
          geometry={capGeometry}
          material={basicModelMaterial(color, isLightsAndShadowsRender)}
        />
      </group>
    </>
  )
}
export function CastleBasePreview({
  opacity,
  isCastleEnd,
  isCastleStraight,
}: {
  opacity?: number
  isCastleEnd?: boolean
  isCastleStraight?: boolean
}) {
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const { nodes } = useDisposableGLTF('/adjustable-castle-walls.glb') as any
  const isLightsAndShadowsRender = useBoundStore(
    (s) => s.isLightsAndShadowsRender,
  )
  const bodyGeometry = isCastleEnd
    ? nodes.CastleWallEndBody.geometry
    : isCastleStraight
      ? nodes.CastleWallStraightBody.geometry
      : nodes.CastleWallCornerBody.geometry
  const capGeometry = isCastleEnd
    ? nodes.CastleWallEndCap.geometry
    : isCastleStraight
      ? nodes.CastleWallStraightCap.geometry
      : nodes.CastleWallCornerCap.geometry
  const color = hexTerrainColor[HexTerrain.castleBase]
  const opacityLevel = opacity ?? PIECE_PREVIEW_OPACITY
  return (
    <>
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={bodyGeometry}
        material={basicModelMaterial(color, isLightsAndShadowsRender)}
      />

      {/* Each wall has a WallCap mesh, then each wall-type adds on its little directional indicator mesh */}
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.WallCap.geometry}
        material={basicModelMaterial(
          color,
          isLightsAndShadowsRender,
          opacityLevel,
        )}
      />
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={capGeometry}
        material={basicModelMaterial(
          color,
          isLightsAndShadowsRender,
          opacityLevel,
        )}
      />
    </>
  )
}
