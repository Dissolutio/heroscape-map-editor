/*
Auto-generated by: https://github.com/pmndrs/gltfjsx
*/

import { useGLTF } from '@react-three/drei'
import { HexTerrain } from '../../types'
import { decodePieceID, getBoardHex3DCoords } from '../../utils/map-utils'
import { hexTerrainColor } from '../maphex/hexColors'
import { getLadderBattlementOptions } from './getLadderBattlementOptions'
import { HEXGRID_HEX_HEIGHT, HEXGRID_HEXCAP_HEIGHT } from '../../utils/constants'

export function Battlement({ pid }: { pid: string }) {
  const {
    // pieceID,
    altitude,
    rotation,
    // boardHexID,
    pieceCoords
  } = decodePieceID(pid)
  const { nodes } = useGLTF('/handmade-battlement.glb') as any
  const { x, z, y } = getBoardHex3DCoords({ ...pieceCoords, altitude })
  const options = getLadderBattlementOptions(rotation)
  return (
    <group
      position={[x + options.xAdd, y - HEXGRID_HEX_HEIGHT + (HEXGRID_HEXCAP_HEIGHT / 2), z + options.zAdd]}
      rotation={[0, (rotation * -Math.PI) / 3, 0]}
    >
      <mesh
        geometry={nodes.Battlement.geometry}
      >
        <meshMatcapMaterial color={hexTerrainColor[HexTerrain.battlement]} />
      </mesh>
    </group>
  )
}

useGLTF.preload('/handmade-battlement.glb')
