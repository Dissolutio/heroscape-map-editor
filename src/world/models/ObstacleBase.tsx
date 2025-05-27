import { HEXGRID_HEXCAP_FLUID_HEIGHT } from '../../utils/constants'
import { hexTerrainColor } from '../maphex/hexColors'
import type { CylinderGeometryArgs } from '../maphex/instance-hex'

type ObstacleBaseProps = {
  x: number
  y: number
  z: number
  color?: string
  isTransparent?: boolean
  isFluidBase?: boolean
}

const treeBaseCylinderArgs: CylinderGeometryArgs = [
  0.9,
  0.997,
  HEXGRID_HEXCAP_FLUID_HEIGHT,
  6,
  undefined,
  false,
  undefined,
  undefined,
]
const baseFluidCapCylinderArgs: CylinderGeometryArgs = [
  0.95,
  0.997,
  HEXGRID_HEXCAP_FLUID_HEIGHT,
  6,
  undefined,
  false,
  undefined,
  undefined,
]

export default function ObstacleBase({
  x,
  y,
  z,
  color,
  isTransparent,
  isFluidBase,
}: ObstacleBaseProps) {
  if (isFluidBase) {
    return (
      <mesh position={[x, y, z]}>
        <cylinderGeometry args={baseFluidCapCylinderArgs} />
        <meshLambertMaterial color={color} transparent opacity={0.85} />
      </mesh>
    )
  }
  return (
    <mesh position={[x, y, z]}>
      <cylinderGeometry args={treeBaseCylinderArgs} />
      <meshMatcapMaterial
        color={color || hexTerrainColor.treeBase}
        transparent={isTransparent}
        opacity={0.85}
      />
    </mesh>
  )
}
