/*
Auto-generated by: https://github.com/pmndrs/gltfjsx
*/
import { useGLTF } from '@react-three/drei'
import { BoardHex, HexTerrain } from '../../types'
import { getBoardHex3DCoords } from '../../utils/map-utils'
import { TREE_BASE_HEIGHT } from '../../utils/constants'
import ObstacleBase from './ObstacleBase'
import { hexTerrainColor } from '../maphex/hexColors'

export default function TicallaBrush({ boardHex }: { boardHex: BoardHex }) {
  const { x, y, z } = getBoardHex3DCoords(boardHex)
  const yTree = y + TREE_BASE_HEIGHT / 2
  const yBase = y + TREE_BASE_HEIGHT / 2
  const { nodes, materials } = useGLTF('/ticalla-brush-colored-lowpoly.glb') as any
  return (
    <group>
      <group position={[x, yTree, z]} dispose={null}>
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.PlankFern1_1.geometry}
          material={materials.BushFern}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.PlankFern1_2.geometry}
          material={materials.PalmBush}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.PlankFern1_3.geometry}
          material={materials.BushArbol}
        />
      </group>
      <ObstacleBase x={x} y={yBase} z={z} color={hexTerrainColor[HexTerrain.brush]} />
    </group>
  )
}

useGLTF.preload('/ticalla-brush-colored-lowpoly.glb')