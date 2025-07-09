import { Billboard, Text } from '@react-three/drei'
import { Color, type Vector3 } from 'three'
import {
  HexTerrain,
  type BoardHex,
  // HexTerrain,
} from '../../types'
import { HEXGRID_HEX_HEIGHT } from '../../utils/constants'
import { isFluidTerrainHex } from '../../utils/board-utils'
import useBoundStore from '../../store/store'

/* 
  MapHexIDDisplay
  This component is expensive to render if there are a lot of hexes
 */
export const MapHexIDDisplay = ({
  position,
  boardHex,
}: {
  position: Vector3
  boardHex: BoardHex
}) => {
  // return null
  /* 
  DEV VISUAL: toggling the below filters off, such that EVERY boardHex shows a billboardID, really helps to see how the 
  grid works (you can see vertical-clearance hexes, empty hexes)
  */
  const isDisplayCapHeights = useBoundStore((s) => s.isDisplayCapHeights)

  // TODO: make own component for cap heights
  if (!isDisplayCapHeights) return null

  // filters out non-caps
  if (!boardHex.isCap) return null
  // filters out vertical clearance
  if (
    !boardHex.isCap &&
    !(boardHex.isObstacleOrigin || boardHex.isObstacleAuxiliary)
  ) {
    return null // filters out vertical clearance
  }
  // filters out empty hexes
  if (boardHex.terrain === HexTerrain.empty) return null
  const hexAltitudeForStandingOn =
    boardHex.altitude - (isFluidTerrainHex(boardHex.terrain) ? 1 : 0)
  return (
    <Billboard
      position={[
        position.x,
        // position.y + (boardHex?.obstacleHeight ?? 0) * HEXGRID_HEX_HEIGHT,
        position.y,
        position.z,
      ]}
    >
      <Text fontSize={0.8} color={new Color('white')}>
        {/* {`${boardHex.terrain}:${boardHex.id}`} */}
        {/* {`${boardHex.id}`} */}
        {`${hexAltitudeForStandingOn === 1 ? '' : hexAltitudeForStandingOn}`}
        {/* {`${boardHex.q}:${boardHex.r}:${boardHex.s}`} */}
        {/* {`LeftMinX: ${boardHex.s - boardHex.q}`} */}
        {/* {`RightMaxX: ${boardHex.q - boardHex.s}`} */}
        {/* {`BottomMaxY: ${boardHex.r - boardHex.s - boardHex.q}`} */}
        {/* {`TopMinY: ${boardHex.q + boardHex.s - boardHex.r}`} */}
      </Text>
    </Billboard>
  )
}
