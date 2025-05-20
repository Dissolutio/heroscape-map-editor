import { Billboard, Text } from '@react-three/drei'
import { Color, type Vector3 } from 'three'
import type {
  BoardHex,
  // HexTerrain,
} from '../../types'
import { HEXGRID_HEX_HEIGHT } from '../../utils/constants'

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
  return null
  /* 
  DEV VISUAL: toggling the below filters off, such that EVERY boardHex shows a billboardID, really helps to see how the 
  grid works (you can see vertical-clearance hexes, empty hexes)
  */
  // if (!boardHex.isCap) return null
  // if (
  //   !boardHex.isCap &&
  //   !(boardHex.isObstacleOrigin || boardHex.isObstacleAuxiliary)
  // )
  //   return null // filters out vertical clearance
  // if (boardHex.terrain === HexTerrain.empty) return null
  return (
    <Billboard
      position={[
        position.x,
        // position.y + (boardHex?.obstacleHeight ?? 0) * HEXGRID_HEX_HEIGHT,
        position.y,
        position.z,
      ]}
    >
      <Text fontSize={0.2} color={new Color('black')}>
        {/* {`${boardHex.terrain}:${boardHex.id}`} */}
        {`${boardHex.id}`}
        {/* {`${boardHex.q}:${boardHex.r}:${boardHex.s}`} */}
        {/* {`LeftMinX: ${boardHex.s - boardHex.q}`} */}
        {/* {`RightMaxX: ${boardHex.q - boardHex.s}`} */}
        {/* {`BottomMaxY: ${boardHex.r - boardHex.s - boardHex.q}`} */}
        {/* {`TopMinY: ${boardHex.q + boardHex.s - boardHex.r}`} */}
      </Text>
    </Billboard>
  )
}
