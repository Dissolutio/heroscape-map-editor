/* eslint-disable no-fallthrough */
import { useGLTF } from '@react-three/drei'
import { BoardHex, HexTerrain } from '../../types'
import { getBoardHex3DCoords } from '../../utils/map-utils'
import ObstacleBase from './ObstacleBase'
import { hexTerrainColor } from '../maphex/hexColors'


export default function Outcrop6({ boardHex, isGlacier }: { boardHex: BoardHex, isGlacier: boolean }) {
  const { x, z, yWithBase, yBase } = getBoardHex3DCoords(boardHex)
  const model = useGLTF('/uncolored-decimated-marro-hive-6.glb') as any
  const { nodes } = model
  const options = getOptions(boardHex.pieceRotation)
  function getOptions(rotation: number) {
    switch (rotation) {
      case 0:
        return { rotationY: 0, xAdd: 0, zAdd: 0 }
      case 1:
        return { rotationY: -Math.PI / 3, xAdd: 0, zAdd: 0 }
      case 2:
        return { rotationY: -2 * Math.PI / 3, xAdd: 0, zAdd: 0 }
      case 3:
        return { rotationY: -Math.PI, xAdd: 0, zAdd: 0 }
      case 4:
        return { rotationY: 2 * Math.PI / 3, xAdd: 0, zAdd: 0 }
      case 5:
        return { rotationY: Math.PI / 3, xAdd: 0, zAdd: 0 }
      default:
        return { rotationY: 0, xAdd: 0, zAdd: 0 }
    }
  }
  if (boardHex.isAuxiliary) {
    return (
      <ObstacleBase
        x={x}
        y={yBase}
        z={z}
        color={isGlacier ? hexTerrainColor[HexTerrain.ice] : hexTerrainColor[HexTerrain.shadow]}
        isTransparent={isGlacier}
      />
    )
  }
  return (
    <group>
      <group
        position={[x, yWithBase, z]}
        rotation={[0, options.rotationY, 0]}
      >
        <mesh
          geometry={nodes.Marro_Hive.geometry}
        >
          <meshMatcapMaterial
            color={isGlacier ? hexTerrainColor[HexTerrain.ice] : hexTerrainColor[HexTerrain.outcrop]}
            transparent={isGlacier}
            opacity={0.99}
          />
        </mesh>
      </group>
      <ObstacleBase
        x={x}
        y={yBase}
        z={z}
        color={isGlacier ? hexTerrainColor[HexTerrain.ice] : hexTerrainColor[HexTerrain.shadow]}
        isTransparent={isGlacier}
      />
    </group>
  )
}

useGLTF.preload('/uncolored-decimated-marro-hive-6.glb')