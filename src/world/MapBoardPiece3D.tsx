import { Vector3 } from 'three'
import useBoundStore from '../store/store'
import { Pieces } from '../types'
import { isPieceIDPiece } from '../utils/board-utils'
import { HEXGRID_HEXCAP_HEIGHT } from '../utils/constants'
import { decodePieceID, getBoardHex3DCoords } from '../utils/map-utils'
import { Battlement } from './models/Battlement'
import { LaurWallAddon } from './models/LaurAddon'
import { RoadWall } from './models/RoadWall'
import {
  getLadderBattlementOptions,
  getLaurWallAddonPositionByRotation,
  getRoadWallOptions,
} from './models/piece-adjustments'

export const MapBoardPiece3D = ({
  pid,
}: {
  pid: string
}) => {
  const {
    pieceID,
    altitude,
    rotation,
    // boardHexID,
    pieceCoords,
  } = decodePieceID(pid)
  const { x, z, y } = getBoardHex3DCoords({ ...pieceCoords, altitude })
  const {
    x: xLaurWall,
    z: zLaurWall,
    yWithBase: yLaurWall,
  } = getBoardHex3DCoords({ ...pieceCoords, altitude: altitude + 1 })
  const viewingLevel = useBoundStore((s) => s.viewingLevel)
  const isVisible = altitude + 1 <= viewingLevel
  if (!isPieceIDPiece(pieceID)) {
    return null
  }
  // LAURWALL ADDON
  if (
    pieceID === Pieces.laurWallRuin ||
    pieceID === Pieces.laurWallShort ||
    pieceID === Pieces.laurWallLong
  ) {
    return (
      <group
        position={new Vector3(xLaurWall, yLaurWall, zLaurWall).add(
          getLaurWallAddonPositionByRotation(rotation),
        )}
        rotation={[0, (rotation * -Math.PI) / 3, 0]}
        visible={isVisible}
      >
        <LaurWallAddon pid={pid} isVisible={isVisible} />
      </group>
    )
  }

  // BATTLEMENT
  if (pieceID === Pieces.battlement) {
    return (
      <group
        position={[
          x + getLadderBattlementOptions(rotation).xAdd,
          y + HEXGRID_HEXCAP_HEIGHT / 2,
          z + getLadderBattlementOptions(rotation).zAdd,
        ]}
        rotation={[0, (rotation * -Math.PI) / 3, 0]}
        visible={isVisible}
      >
        <Battlement pid={pid} isVisible={isVisible} />
      </group>
    )
  }

  // ROADWALL
  if (pieceID === Pieces.roadWall) {
    return (
      <group
        position={[
          x + getRoadWallOptions(rotation).xAdd,
          y,
          z + getRoadWallOptions(rotation).zAdd,
        ]}
        rotation={[0, (rotation * -Math.PI) / 3, 0]}
        visible={isVisible}
      >
        <RoadWall pid={pid} isVisible={isVisible} />
      </group>
    )
  }
  return <></>
}
