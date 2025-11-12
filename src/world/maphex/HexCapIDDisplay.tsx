import { Billboard, Text } from '@react-three/drei'
import type { Vector3 } from 'three'
import { HexTerrain, type BoardHex } from '../../types'

export const HexCapIDDisplay = ({
  position,
  boardHex,
}: {
  position: Vector3
  boardHex: BoardHex
}) => {
  // filters out everything but empty hex caps
  if (!boardHex.isCap || boardHex.terrain !== HexTerrain.empty) {
    return null
  }
  return (
    <Billboard position={[position.x, position.y, position.z]}>
      <Text fontSize={0.3} color={'black'}>
        {`${boardHex.q}~${boardHex.r}~${boardHex.s}`}
      </Text>
    </Billboard>
  )
}
