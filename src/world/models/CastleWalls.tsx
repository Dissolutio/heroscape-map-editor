import type { ThreeEvent } from '@react-three/fiber'
import usePieceHoverState from '../../hooks/usePieceHoverState'
import useBoundStore from '../../store/store'
import { isDragPassThrough } from '../drag/dragController'
import { type BoardHex, HexTerrain, Pieces } from '../../types'
import {
  HEXGRID_HEX_HEIGHT,
  PIECE_PREVIEW_OPACITY,
} from '../../utils/constants'
import { hexTerrainColor } from '../maphex/hexColors'
import {
  type CastleShape,
  getFortressModelUrl,
  vsCastleNodeName,
  vsFitTarget,
} from './fortressModels'
import { isFortressTopCovered } from './fortressCover'
import { useDisposableGLTF } from './useDisposableGLTF'
import {
  deferToOwnCap,
  fortressCapUserData,
  invisibleHitMaterial,
  VsModel,
} from './VsFortressMeshes'

const wallShape = (pieceID: string): CastleShape =>
  pieceID.includes(Pieces.castleWallEnd)
    ? 'End'
    : pieceID.includes(Pieces.castleWallStraight)
      ? 'Straight'
      : 'Corner'

type Props = {
  boardHex: BoardHex
  onPointerUp: (e: ThreeEvent<PointerEvent>, hex: BoardHex) => void
}

export function CastleWall({ boardHex, onPointerUp }: Props) {
  // Loaded only for the invisible cap click targets used to paint on wall tops.
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const { nodes } = useDisposableGLTF('/adjustable-castle-walls.glb') as any
  // A piece on top hides the receiver (one shared board lookup)
  const isTopCovered = useBoundStore((s) =>
    isFortressTopCovered(
      s.boardHexes,
      s.viewingLevel,
      boardHex.boardPieceUID ?? '',
    ),
  )
  const capUserData = fortressCapUserData(boardHex.boardPieceUID ?? '')
  const selectedPieceIDs = useBoundStore((s) => s.selectedPieceIDs)
  const toggleSelectedPieceID = useBoundStore((s) => s.toggleSelectedPieceID)
  const hoveredPieceID = useBoundStore((s) => s.hoveredPieceID)
  const isLightsAndShadowsRender = useBoundStore(
    (s) => s.isLightsAndShadowsRender,
  )
  const { onPointerEnter, onPointerOut } = usePieceHoverState()
  const isHighlighted =
    hoveredPieceID === boardHex?.boardPieceUID ||
    selectedPieceIDs.includes(boardHex?.boardPieceUID ?? '')
  const scaleYAdjust = 0.01 // just a little to get it out of the subterrain
  // castle walls are 10 levels tall, UNLESS stacked on another wall, then they are 9 (they have a 1-level bottom base when on land)
  const scaleY = (boardHex?.obstacleHeight ?? 9) + (1 - scaleYAdjust)
  const pieceID = boardHex.pieceID
  const onPointerEnterCap = (e: ThreeEvent<PointerEvent>) => {
    // the pointer sees through a wall being dragged
    if (isDragPassThrough(boardHex.boardPieceUID)) return
    onPointerEnter(e, boardHex)
    e.stopPropagation()
  }
  const onPointerOutCap = (e: ThreeEvent<PointerEvent>) => {
    onPointerOut(e)
    e.stopPropagation()
  }
  const capGeometry = pieceID.includes(Pieces.castleWallEnd)
    ? nodes.CastleWallEndCap.geometry
    : pieceID.includes(Pieces.castleWallStraight)
      ? nodes.CastleWallStraightCap.geometry
      : nodes.CastleWallCornerCap.geometry
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
      <VsModel
        url={getFortressModelUrl('castleWall')}
        name={vsCastleNodeName('Wall', wallShape(pieceID))}
        target={vsFitTarget('castleWall', { scaleY, isTopCovered })}
        color={hexTerrainColor[HexTerrain.castleWall]}
        isHighlighted={isHighlighted}
        pid={boardHex.boardPieceUID ?? ''}
        onPointerUp={deferToOwnCap(
          boardHex.boardPieceUID ?? '',
          onPointerUpBody,
        )}
        onPointerEnter={(e) => onPointerEnter(e, boardHex)}
        onPointerOut={(e) => onPointerOut(e)}
      />
      {/* Invisible cap targets for painting on top */}
      <group
        onPointerUp={(e) => onPointerUp(e, boardHex)}
        onPointerEnter={onPointerEnterCap}
        onPointerOut={onPointerOutCap}
      >
        <mesh
          userData={capUserData}
          receiveShadow={isLightsAndShadowsRender}
          geometry={nodes.WallCap.geometry}
          position={[0, (scaleY - 1) * HEXGRID_HEX_HEIGHT, 0]}
          material={invisibleHitMaterial}
        />
        <mesh
          userData={capUserData}
          receiveShadow={isLightsAndShadowsRender}
          geometry={capGeometry}
          position={[0, (scaleY - 1) * HEXGRID_HEX_HEIGHT, 0]}
          onPointerUp={(e) => onPointerUp(e, boardHex)}
          material={invisibleHitMaterial}
        />
      </group>
    </>
  )
}
export function CastleWallPreview({
  opacity,
  isCastleEnd,
  isCastleStraight,
  isCastleUnder,
}: {
  opacity?: number
  isCastleEnd?: boolean
  isCastleStraight?: boolean
  isCastleUnder?: boolean
}) {
  const scaleYAdjust = 0.01 // just a little to get it out of the subterrain
  // castle walls are 10 levels tall, UNLESS stacked on another wall, then they are 9 (they have a 1-level bottom base when on land)
  const scaleY = (isCastleUnder ? 8 : 9) + (1 - scaleYAdjust)
  const color = hexTerrainColor[HexTerrain.castleWall]
  const opacityLevel = opacity ?? PIECE_PREVIEW_OPACITY
  const shape: CastleShape = isCastleEnd
    ? 'End'
    : isCastleStraight
      ? 'Straight'
      : 'Corner'
  return (
    <VsModel
      url={getFortressModelUrl('castleWall')}
      name={vsCastleNodeName('Wall', shape)}
      target={vsFitTarget('castleWall', { scaleY })}
      color={color}
      isHighlighted={false}
      opacity={opacityLevel}
    />
  )
}
