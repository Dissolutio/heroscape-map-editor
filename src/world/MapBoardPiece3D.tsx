import { Vector3 } from 'three'
import useBoundStore from '../store/store'
import { Pieces } from '../types'
import { isRenderedFromPieceIDPiece } from '../utils/board-utils'
import { HEXGRID_HEX_HEIGHT, HEXGRID_HEXCAP_HEIGHT } from '../utils/constants'
import { decodePieceID, getBoardHex3DCoords } from '../utils/map-utils'
import { Battlement } from './models/Battlement'
import { LaurWallArchAddon } from './models/LaurWallArchModel'
import { LaurWallLongAddon } from './models/LaurWallLongModel'
import { LaurWallRuinAddon } from './models/LaurWallRuinModel'
import { LaurWallShortAddon } from './models/LaurWallShortModel'
import { RoadWall } from './models/RoadWall'
import {
  getLadderBattlementOptions,
  getRoadWallOptions,
} from './models/piece-adjustments'
import { Suspense } from 'react'
import ModelLoader from './models/ModelLoader'
import { RopeLadder } from './models/RopeLadder'

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

  if (
    inventoryID === Pieces.laurWallRuin1 ||
    inventoryID === Pieces.laurWallRuin2 ||
    inventoryID === Pieces.laurWallRuin3
  ) {
    return (
      <group
        position={new Vector3(xLaurWall, yLaurWall, zLaurWall)}
        rotation={[0, (rotation * -Math.PI) / 3, 0]}
      >
        <Suspense fallback={<ModelLoader />}>
          <LaurWallRuinAddon pid={pid} />
        </Suspense>
      </group>
    )
  }

  if (
    inventoryID === Pieces.laurWallShort ||
    inventoryID === Pieces.laurWallShortStackable
  ) {
    return (
      <group
        position={new Vector3(xLaurWall, yLaurWall, zLaurWall)}
        rotation={[0, (rotation * -Math.PI) / 3, 0]}
      >
        <Suspense fallback={<ModelLoader />}>
          <LaurWallShortAddon pid={pid} />
        </Suspense>
      </group>
    )
  }

  if (
    inventoryID === Pieces.laurWallLong ||
    inventoryID === Pieces.laurWallLongStackable
  ) {
    return (
      <group
        position={new Vector3(xLaurWall, yLaurWall, zLaurWall)}
        rotation={[0, (rotation * -Math.PI) / 3, 0]}
      >
        <Suspense fallback={<ModelLoader />}>
          <LaurWallLongAddon pid={pid} />
        </Suspense>
      </group>
    )
  }

  if (inventoryID === Pieces.laurWallArch) {
    return (
      <group
        position={new Vector3(xLaurWall, yLaurWall, zLaurWall)}
        rotation={[0, (rotation * -Math.PI) / 3, 0]}
      >
        <Suspense fallback={<ModelLoader />}>
          <LaurWallArchAddon pid={pid} />
        </Suspense>
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
        <Suspense fallback={<ModelLoader />}>
          <Battlement pid={pid} />
        </Suspense>
      </group>
    )
  }

  // ROPE LADDER
  if (inventoryID === Pieces.ropeLadder) {
    return (
      <group
        position={[x, y, z]}
        rotation={[0, (rotation * -Math.PI) / 3, 0]}
      >
        <Suspense fallback={<ModelLoader />}>
          <RopeLadder pid={pid} />
        </Suspense>
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
        <Suspense fallback={<ModelLoader />}>
          <RoadWall pid={pid} />
        </Suspense>
      </group>
    )
  }
  return <></>
}
