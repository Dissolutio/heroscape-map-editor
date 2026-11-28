import type { ThreeEvent } from '@react-three/fiber'
import usePieceHoverState from '../../hooks/usePieceHoverState'
import useBoundStore from '../../store/store'
import { isDragPassThrough } from '../drag/dragController'
import { type BoardHex, HexTerrain, Pieces } from '../../types'
import { PIECE_PREVIEW_OPACITY } from '../../utils/constants'
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

const baseShape = (pieceID: string): CastleShape =>
  pieceID.includes(Pieces.castleBaseEnd)
    ? 'End'
    : pieceID.includes(Pieces.castleBaseStraight)
      ? 'Straight'
      : 'Corner'

type Props = {
  boardHex: BoardHex
  onPointerUp: (e: ThreeEvent<PointerEvent>, hex: BoardHex) => void
}

// These were made after the castle walls and are VERY SIMILAR. TODO: DRY
export default function CastleBase({ boardHex, onPointerUp }: Props) {
  // Loaded only for the invisible cap click targets used to paint on base tops.
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
  const capGeometry = pieceID.includes(Pieces.castleBaseEnd)
    ? nodes.CastleWallEndCap.geometry
    : pieceID.includes(Pieces.castleBaseStraight)
      ? nodes.CastleWallStraightCap.geometry
      : nodes.CastleWallCornerCap.geometry
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
      <VsModel
        url={getFortressModelUrl('castleBase')}
        name={vsCastleNodeName('Base', baseShape(pieceID))}
        target={vsFitTarget('castleBase', { isTopCovered })}
        color={hexTerrainColor[HexTerrain.castleBase]}
        isHighlighted={isHighlighted}
        pid={boardHex.boardPieceUID ?? ''}
        onPointerUp={deferToOwnCap(
          boardHex.boardPieceUID ?? '',
          onPointerUpBody,
        )}
        onPointerEnter={(e) => onPointerEnter(e, boardHex)}
        onPointerOut={onPointerOut}
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
          onPointerEnter={onPointerEnterCap}
          onPointerOut={onPointerOutCap}
          material={invisibleHitMaterial}
        />
        <mesh
          userData={capUserData}
          receiveShadow={isLightsAndShadowsRender}
          geometry={capGeometry}
          material={invisibleHitMaterial}
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
  const color = hexTerrainColor[HexTerrain.castleBase]
  const opacityLevel = opacity ?? PIECE_PREVIEW_OPACITY
  return (
    <VsModel
      url={getFortressModelUrl('castleBase')}
      name={vsCastleNodeName(
        'Base',
        isCastleEnd ? 'End' : isCastleStraight ? 'Straight' : 'Corner',
      )}
      target={vsFitTarget('castleBase')}
      color={color}
      isHighlighted={false}
      opacity={opacityLevel}
    />
  )
}
