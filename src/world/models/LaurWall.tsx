import React from 'react'
import { useGLTF } from '@react-three/drei'
import { BoardHex, HexTerrain } from '../../types'
import { hexTerrainColor } from '../maphex/hexColors'

export function LaurWallShort({ boardHex }: { boardHex: BoardHex }) {
  const { nodes } = useGLTF('/laurwall-short.glb') as any
  return (
    <group>
      <mesh
        geometry={nodes.LaurShortWall.geometry}
      >
        <meshMatcapMaterial color={hexTerrainColor[HexTerrain.laurWallPillar]} />
      </mesh>
    </group>
  )
}

useGLTF.preload('/laurwall-short.glb')

export function LaurWallRuin({ boardHex }: { boardHex: BoardHex }) {
  const { nodes } = useGLTF('/laurwall-ruin.glb') as any
  return (
    <group>
      <mesh
        geometry={nodes.LaurWallRuin.geometry}
      >
        <meshMatcapMaterial color={hexTerrainColor[HexTerrain.laurWallPillar]} />
      </mesh>
    </group>
  )
}

useGLTF.preload('/laurwall-ruin.glb')

export function LaurWallLong({ boardHex }: { boardHex: BoardHex }) {
  const { nodes } = useGLTF('/laurwall-long.glb') as any
  return (
    <group>
      <mesh
        geometry={nodes.LaurWallLong.geometry}
      >
        <meshMatcapMaterial color={hexTerrainColor[HexTerrain.laurWallPillar]} />
      </mesh>
    </group>
  )
}

useGLTF.preload('/laurwall-long.glb')