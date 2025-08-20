import useBoundStore from '../../store/store'
import {
  HEXGRID_HEXCAP_FLUID_HEIGHT,
  HEXGRID_OBSTACLE_BASE_HEIGHT,
} from '../../utils/constants'
import type { CylinderGeometryArgs } from '../maphex/instance-hex'

type ObstacleBaseProps = {
  x: number
  y: number
  z: number
  color: string
  isFluidBase?: boolean
}
export const laurBaseCylinderArgs: CylinderGeometryArgs = [
  0.95,
  0.997,
  HEXGRID_OBSTACLE_BASE_HEIGHT,
  6,
  undefined,
  false,
  undefined,
  undefined,
]
const treeBaseCylinderArgs: CylinderGeometryArgs = [
  0.95,
  0.997,
  HEXGRID_OBSTACLE_BASE_HEIGHT,
  6,
  undefined,
  false,
  undefined,
  undefined,
]
const baseFluidCapCylinderArgs: CylinderGeometryArgs = [
  0.95,
  0.997,
  HEXGRID_OBSTACLE_BASE_HEIGHT,
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
  const isLightsAndShadowsRender = useBoundStore(
    (s) => s.isLightsAndShadowsRender,
  )
  if (isFluidBase) {
    return (
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        position={[x, y, z]}
      >
        <cylinderGeometry args={baseFluidCapCylinderArgs} />
        {isLightsAndShadowsRender ? (
          <meshStandardMaterial color={color} transparent opacity={0.85} />
        ) : (
          <meshLambertMaterial color={color} transparent opacity={0.85} />
        )}
      </mesh>
    )
  }
  return (
    <mesh
      receiveShadow={isLightsAndShadowsRender}
      castShadow={isLightsAndShadowsRender}
      position={[x, y, z]}
    >
      <cylinderGeometry args={treeBaseCylinderArgs} />
      {isLightsAndShadowsRender ? (
        <meshStandardMaterial color={color} />
      ) : (
        <meshMatcapMaterial color={color} />
      )}
    </mesh>
  )
}
