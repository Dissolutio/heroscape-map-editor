import { TREE_BASE_HEIGHT } from "../../utils/constants"
import { hexTerrainColor } from "../maphex/hexColors"
import { CylinderGeometryArgs } from "../maphex/instance-hex"

type ObstacleBaseProps = {
  x: number
  y: number
  z: number
  color?: string
  isTransparent?: boolean
}

const treeBaseCylinderArgs: CylinderGeometryArgs = [0.999, 0.997, TREE_BASE_HEIGHT, 6, undefined, false, undefined, undefined]

export default function ObstacleBase({ x, y, z, color, isTransparent }: ObstacleBaseProps) {
  return (
    <mesh position={[x, y, z]}>
      <cylinderGeometry args={treeBaseCylinderArgs} />
      <meshMatcapMaterial
        color={color || hexTerrainColor['treeBase']}
        transparent={isTransparent}
        opacity={0.85}
      />
    </mesh>
  )
}