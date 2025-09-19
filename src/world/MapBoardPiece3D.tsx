import { Vector3 } from 'three'
import useBoundStore from '../store/store'
import { Pieces } from '../types'
import { isRenderedFromPieceIDPiece } from '../utils/board-utils'
import {
  HEXGRID_HEXCAP_FLUID_HEIGHT,
  HEXGRID_HEXCAP_HEIGHT,
  HEXGRID_OBSTACLE_BASE_HEIGHT,
} from '../utils/constants'
import { decodePieceID, getBoardHex3DCoords } from '../utils/map-utils'
import { Battlement } from './models/Battlement'
import { LaurWallAddon } from './models/LaurAddon'
import { RoadWall } from './models/RoadWall'
import {
  getLadderBattlementOptions,
  getRoadWallOptions,
} from './models/piece-adjustments'

export const MapBoardPiece3D = ({
  pid,
}: {
  pid: string
}) => {
  const { inventoryID, altitude, rotation, pieceCoords } = decodePieceID(pid)
  const { x, z, y } = getBoardHex3DCoords({ ...pieceCoords, altitude })
  const {
    x: xLaurWall,
    z: zLaurWall,
    yWithBase: yLaurWall,
  } = getBoardHex3DCoords({ ...pieceCoords, altitude: altitude + 1 })
  const viewingLevel = useBoundStore((s) => s.viewingLevel)
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
        <LaurWallAddon pid={pid} />
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
        <Battlement pid={pid} />
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
        <RoadWall pid={pid} />
      </group>
    )
  }
  return <></>
}
