/*
Auto-generated by: https://github.com/pmndrs/gltfjsx
*/

import { useGLTF } from '@react-three/drei'
import { BoardHex, HexTerrain } from '../../types'
import { getBoardHex3DCoords } from '../../utils/map-utils'
import { hexTerrainColor } from '../maphex/hexColors'

export function Ladder({ boardHex }: { boardHex: BoardHex }) {
  const { nodes } = useGLTF('/handmade-ladder.glb') as any
  const { x, z, y, yWithBase, yBase } = getBoardHex3DCoords(boardHex)
  return (
    <group
      position={[x, y, z]}
      rotation={[0, (boardHex.pieceRotation * -Math.PI) / 3, 0]}
    >
      <mesh
        geometry={nodes.Ladder.geometry}
      >
        <meshMatcapMaterial color={hexTerrainColor[HexTerrain.ladder]} />
      </mesh>
    </group>
  )
}

useGLTF.preload('/handmade-battlement.glb')