import { Vector3 } from 'three'
import useBoundStore from '../store/store'
import { type BoardPiece, HexTerrain, Pieces } from '../types'
import { isRenderedFromPieceIDPiece } from '../utils/board-utils'
import {
  HEXGRID_HEXCAP_HEIGHT,
} from '../utils/constants'
import { getBoardHex3DCoords } from '../utils/map-utils'
import { Battlement } from './models/Battlement'
import { LaurWallAddon } from './models/LaurAddon'
import { RoadWall } from './models/RoadWall'
import {
  getLadderBattlementOptions,
  getRoadWallOptions,
} from './models/piece-adjustments'
import type { ThreeEvent } from '@react-three/fiber'
import { hexTerrainColor } from './maphex/hexColors'

export const MapBoardPiece3D = ({
  boardPiece,
}: {
  boardPiece: BoardPiece
}) => {
  const { inventoryID, altitude, rotation, pieceCoords } = boardPiece
  const selectedPieceID = useBoundStore((s) => s.selectedPieceID)
  const hoveredPieceID = useBoundStore((s) => s.hoveredPieceID)
  const isLightsAndShadowsRender = useBoundStore(
    (s) => s.isLightsAndShadowsRender,
  )
  const toggleSelectedPieceID = useBoundStore((s) => s.toggleSelectedPieceID)
  const viewingLevel = useBoundStore((s) => s.viewingLevel)
  const onPointerUp = (event: ThreeEvent<PointerEvent>, boardPiece: BoardPiece) => {
    event.stopPropagation() // prevent pass through
    // Early out right clicks(event.button=2), middle mouse clicks(1)
    if (event.button !== 0) {
      return
    }
    toggleSelectedPieceID(boardPiece.uid === selectedPieceID ? '' : boardPiece.uid)
  }
  const { x, z, y } = getBoardHex3DCoords({ ...pieceCoords, altitude })
  const {
    x: xLaurWall,
    z: zLaurWall,
    yWithBase: yLaurWall,
  } = getBoardHex3DCoords({ ...pieceCoords, altitude: altitude + 1 })
  const isVisible = altitude + 1 <= viewingLevel

  // TODO: PIECE ID TO RENDER MUST BE ADDED TO THIS FN: isRenderedFromPieceIDPiece
  // [Make it not so]
  // EARLY RETURN, no render
  if (!isRenderedFromPieceIDPiece(inventoryID) || !isVisible) {
    return null
  }

  // LAURWALL ADDON
  if (
    inventoryID === Pieces.laurWallShort ||
    inventoryID === Pieces.laurWallRuin1 ||
    inventoryID === Pieces.laurWallArch ||
    inventoryID === Pieces.laurWallLong
  ) {
    return (
      <group
        position={new Vector3(xLaurWall, yLaurWall, zLaurWall)}
        rotation={[0, (rotation * -Math.PI) / 3, 0]}
      >
        <LaurWallAddon
          boardPiece={boardPiece}
          color={hexTerrainColor[HexTerrain.laurWall]}
          secondaryColor={hexTerrainColor.laurModelColor2}
        />
      </group>
    )
  }

  // BATTLEMENT
  if (inventoryID === Pieces.battlement) {
    return (
      <group
        position={[
          x + getLadderBattlementOptions(rotation).xAdd,
          y + HEXGRID_HEXCAP_HEIGHT / 2,
          z + getLadderBattlementOptions(rotation).zAdd,
        ]}
        rotation={[0, (rotation * -Math.PI) / 3, 0]}
      >
        <Battlement
          boardPiece={boardPiece}
          color={hexTerrainColor[HexTerrain.battlement]}
          onPointerUp={onPointerUp}
          opacity={1}
          selectedPieceID={selectedPieceID}
          hoveredPieceID={hoveredPieceID}
          isLightsAndShadowsRender={isLightsAndShadowsRender}
        />
      </group>
    )
  }

  // ROADWALL
  if (inventoryID === Pieces.roadWall) {
    return (
      <group
        position={[
          x + getRoadWallOptions(rotation).xAdd,
          y,
          z + getRoadWallOptions(rotation).zAdd,
        ]}
        rotation={[0, (rotation * -Math.PI) / 3, 0]}
      >
        <RoadWall
          boardPiece={boardPiece}
          color={hexTerrainColor[HexTerrain.roadWall]}
          opacity={1}
          onPointerUp={onPointerUp}
          selectedPieceID={selectedPieceID}
          hoveredPieceID={hoveredPieceID}
          isLightsAndShadowsRender={isLightsAndShadowsRender}
        />
      </group>
    )
  }
  return <></>
}
