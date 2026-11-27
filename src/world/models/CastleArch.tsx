import type { ThreeEvent } from '@react-three/fiber'
import usePieceHoverState from '../../hooks/usePieceHoverState'
import useBoundStore from '../../store/store'
import { isDragPassThrough } from '../drag/dragController'
import {
  type BoardHex,
  type CubeCoordinate,
  HexTerrain,
  Pieces,
} from '../../types'
import { PIECE_PREVIEW_OPACITY } from '../../utils/constants'
import {
  hexUtilsAdd,
  hexUtilsGetNeighborForRotation,
} from '../../utils/hex-utils'
import { genBoardHexID } from '../../utils/map-utils'
import { hexTerrainColor } from '../maphex/hexColors'
import { getFortressModelUrl, vsFitTarget } from './fortressModels'
import { useDisposableGLTF } from './useDisposableGLTF'
import {
  deferToOwnCap,
  fortressCapUserData,
  invisibleHitMaterial,
  measureVsSource,
  useVsNodes,
  VsModel,
  vsNodeParts,
} from './VsFortressMeshes'

type Props = {
  boardHex: BoardHex
  onPointerUp: (e: ThreeEvent<PointerEvent>, hex: BoardHex) => void
}

type PointerHandler = (e: ThreeEvent<PointerEvent>) => void

/** The Virtualscape arch, and its door, fitted to the arch's target height. */
function VsArch({
  isDoor,
  isHighlighted,
  pid,
  opacity,
  onPointerUpBody,
  onPointerUpDoor,
}: {
  isDoor: boolean
  isHighlighted: boolean
  pid?: string
  opacity?: number
  onPointerUpBody?: PointerHandler
  onPointerUpDoor?: PointerHandler
}) {
  const archUrl = getFortressModelUrl('fortressArch')
  const archNodes = useVsNodes(archUrl)
  // The door is fitted with the arch's own bottom and top, so it stays put
  // inside the arch.
  const target = {
    ...vsFitTarget('fortressArch'),
    source: measureVsSource(
      vsNodeParts(archNodes, 'VsFortressArch').map(({ node }) => node),
      'top',
    ),
  }
  return (
    <group>
      <VsModel
        url={archUrl}
        name="VsFortressArch"
        target={target}
        color={hexTerrainColor[HexTerrain.castleWall]}
        isHighlighted={isHighlighted}
        pid={pid}
        opacity={opacity}
        onPointerUp={onPointerUpBody}
      />
      {isDoor && (
        <VsModel
          url={getFortressModelUrl('fortressDoor')}
          name="VsFortressDoor"
          target={target}
          color={hexTerrainColor.castleDoor}
          isHighlighted={isHighlighted}
          pid={pid}
          opacity={opacity}
          onPointerUp={onPointerUpDoor}
        />
      )}
    </group>
  )
}

export function CastleArchPreview({ isDoor }: { isDoor: boolean }) {
  return (
    <VsArch
      isDoor={isDoor}
      isHighlighted={false}
      opacity={PIECE_PREVIEW_OPACITY}
    />
  )
}
export function CastleArch({ boardHex, onPointerUp }: Props) {
  // Loaded only for the invisible cap click targets used to paint on arch tops.
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const { nodes } = useDisposableGLTF('/castle-arch-handmade.glb') as any
  const capUserData = fortressCapUserData(boardHex.boardPieceUID ?? '')
  const boardHexes = useBoundStore((s) => s.boardHexes)
  const selectedPieceIDs = useBoundStore((s) => s.selectedPieceIDs)
  const toggleSelectedPieceID = useBoundStore((s) => s.toggleSelectedPieceID)
  const isSelected = selectedPieceIDs.includes(boardHex?.boardPieceUID ?? '')
  const hoveredPieceID = useBoundStore((s) => s.hoveredPieceID)
  const isLightsAndShadowsRender = useBoundStore(
    (s) => s.isLightsAndShadowsRender,
  )
  const { onPointerEnter, onPointerOut } = usePieceHoverState()
  const isHighlighted = hoveredPieceID === boardHex?.boardPieceUID || isSelected
  const isDoor = !(boardHex.inventoryID === Pieces.castleArchNoDoor)
  const middleBaseHex = () => {
    const middleCube = hexUtilsAdd(
      boardHex,
      hexUtilsGetNeighborForRotation(boardHex.pieceRotation),
    )
    return boardHexes[
      genBoardHexID({ ...middleCube, altitude: boardHex.altitude })
    ]
  }
  const farBaseHex = () => {
    const direction = hexUtilsGetNeighborForRotation(boardHex.pieceRotation)
    const farCube: CubeCoordinate = hexUtilsAdd(
      hexUtilsAdd({ q: boardHex.q, r: boardHex.r, s: boardHex.s }, direction),
      direction,
    )
    return boardHexes[
      genBoardHexID({ ...farCube, altitude: boardHex.altitude })
    ]
  }
  const onPointerEnterNear = (e: ThreeEvent<PointerEvent>) => {
    onPointerEnter(e, boardHex)
  }
  const onPointerOutNear = (e: ThreeEvent<PointerEvent>) => {
    onPointerOut(e)
  }
  const onPointerEnterMiddle = (e: ThreeEvent<PointerEvent>) => {
    const hex = middleBaseHex()
    if (hex) onPointerEnter(e, hex)
    else if (!isDragPassThrough(boardHex.boardPieceUID)) e.stopPropagation()
  }
  const onPointerOutMiddle = (e: ThreeEvent<PointerEvent>) => {
    onPointerOut(e)
  }
  const onPointerEnterFar = (e: ThreeEvent<PointerEvent>) => {
    const hex = farBaseHex()
    if (hex) onPointerEnter(e, hex)
    else if (!isDragPassThrough(boardHex.boardPieceUID)) e.stopPropagation()
  }
  const onPointerOutFar = (e: ThreeEvent<PointerEvent>) => {
    onPointerOut(e)
  }
  const isVerticalClearanceHex = !(
    boardHex.isObstacleAuxiliary || boardHex.isObstacleOrigin
  )
  const onPointerUpMiddle = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    const hex = middleBaseHex()
    if (hex) onPointerUp(e, hex)
  }
  const onPointerUpFar = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    const hex = farBaseHex()
    if (hex) onPointerUp(e, hex)
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

  // Early return non-origin hexes
  if (isVerticalClearanceHex) {
    return null
  }
  if (boardHex.isObstacleAuxiliary) {
    return null
  }

  return (
    <group
      onPointerEnter={(e) => onPointerEnter(e, boardHex)}
      onPointerOut={(e) => onPointerOut(e)}
    >
      <VsArch
        isDoor={isDoor}
        isHighlighted={isHighlighted}
        pid={boardHex.boardPieceUID ?? ''}
        onPointerUpBody={deferToOwnCap(
          boardHex.boardPieceUID ?? '',
          onPointerUpBody,
        )}
        onPointerUpDoor={(e) => onPointerUp(e, boardHex)}
      />
      {/* Invisible cap targets for painting on top */}
      <mesh
        userData={capUserData}
        receiveShadow={isLightsAndShadowsRender}
        geometry={nodes.CastleArchCapNear.geometry}
        onPointerUp={(e) => onPointerUp(e, boardHex)}
        onPointerEnter={onPointerEnterNear}
        onPointerOut={onPointerOutNear}
        material={invisibleHitMaterial}
      />
      <mesh
        userData={capUserData}
        receiveShadow={isLightsAndShadowsRender}
        geometry={nodes.CastleArchCapMiddle.geometry}
        onPointerEnter={onPointerEnterMiddle}
        onPointerOut={onPointerOutMiddle}
        onPointerUp={onPointerUpMiddle}
        material={invisibleHitMaterial}
      />
      <mesh
        userData={capUserData}
        receiveShadow={isLightsAndShadowsRender}
        geometry={nodes.CastleArchCapFar.geometry}
        onPointerEnter={onPointerEnterFar}
        onPointerOut={onPointerOutFar}
        onPointerUp={onPointerUpFar}
        material={invisibleHitMaterial}
      />
    </group>
  )
}
