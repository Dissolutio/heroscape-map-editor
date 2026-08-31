import { DoubleSide } from 'three'
import type * as THREE from 'three'

export const basicModelMaterial = (
  color: string,
  isHQ: boolean,
  opacity?: number,
  handleBeforeCompile?: (
    parameters: THREE.WebGLProgramParametersWithUniforms,
    renderer: THREE.WebGLRenderer,
  ) => void,
) =>
  isHQ ? (
    <meshStandardMaterial
      color={color}
      transparent={(opacity ?? 1) !== 1}
      opacity={opacity ?? 1}
      onBeforeCompile={handleBeforeCompile}
    />
  ) : (
    <meshMatcapMaterial
      color={color}
      transparent={(opacity ?? 1) !== 1}
      opacity={opacity ?? 1}
      onBeforeCompile={handleBeforeCompile}
    />
  )
export const basicDoubleSideModelMaterial = (
  color: string,
  isHQ: boolean,
  opacity?: number,
  handleBeforeCompile?: (
    parameters: THREE.WebGLProgramParametersWithUniforms,
    renderer: THREE.WebGLRenderer,
  ) => void,
) =>
  isHQ ? (
    <meshStandardMaterial
      side={DoubleSide}
      color={color}
      transparent={(opacity ?? 1) !== 1}
      opacity={opacity ?? 1}
      onBeforeCompile={handleBeforeCompile}
    />
  ) : (
    <meshMatcapMaterial
      side={DoubleSide}
      color={color}
      transparent={(opacity ?? 1) !== 1}
      opacity={opacity ?? 1}
      onBeforeCompile={handleBeforeCompile}
    />
  )
