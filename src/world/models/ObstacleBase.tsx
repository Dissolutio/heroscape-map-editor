import useBoundStore from '../../store/store'
import { HEXGRID_HEXCAP_FLUID_HEIGHT } from '../../utils/constants'
import type { CylinderGeometryArgs } from '../maphex/instance-hex'

type ObstacleBaseProps = {
  x: number
  y: number
  z: number
  color: string
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
  isFluidBase,
}: ObstacleBaseProps) {
  const isHighQualityRender = useBoundStore((s) => s.isHighQualityRender)
  if (isFluidBase) {
    return (
      <mesh
        receiveShadow={isHighQualityRender}
        castShadow={isHighQualityRender}
        position={[x, y, z]}
      >
        <cylinderGeometry args={baseFluidCapCylinderArgs} />
        {isHighQualityRender ? (
          <meshStandardMaterial color={color} transparent opacity={0.85} />
        ) : (
          <meshLambertMaterial color={color} transparent opacity={0.85} />
        )}
      </mesh>
    )
  }
  return (
    <mesh
      receiveShadow={isHighQualityRender}
      castShadow={isHighQualityRender}
      position={[x, y, z]}
    >
      <cylinderGeometry args={treeBaseCylinderArgs} />
      {isHighQualityRender ? (
        <meshStandardMaterial color={color} />
      ) : (
        <meshMatcapMaterial color={color} />
      )}
    </mesh>
  )
}
