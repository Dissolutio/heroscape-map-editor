import { Billboard, Text } from '@react-three/drei'
import { Color, type Vector3 } from 'three'
import {
  HexTerrain,
  Pieces,
  type BoardHex,
  // HexTerrain,
} from '../../types'
import { HEXGRID_HEX_HEIGHT } from '../../utils/constants'
import { isFluidTerrainHex } from '../../utils/board-utils'
import useBoundStore from '../../store/store'
import { genBoardHexID, getBoardPiecesMaxLevel } from '../../utils/map-utils'

/* 
  MapHexIDDisplay
  This component is expensive to render if there are a lot of hexes
 */
export const HexCapIDDisplay = ({
  position,
  boardHex,
}: {
  position: Vector3
  boardHex: BoardHex
}) => {
  // filters out everything but empty hexes
  // if (
  //   !boardHex.isCap ||
  //   boardHex.terrain !== HexTerrain.empty
  // ) {
  //   return null
  // }
  return (
    <Billboard
      position={[
        position.x,
        position.y,
        position.z,
      ]}
    >
      <Text fontSize={0.3} color={'black'}>
        {`${boardHex.q}~${boardHex.r}~${boardHex.s}`}
      </Text>
    </Billboard>
  )
}
