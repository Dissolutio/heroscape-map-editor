import * as THREE from 'three'

type BeforeCompileHandler = (
  parameters: THREE.WebGLProgramParametersWithUniforms,
  renderer: THREE.WebGLRenderer,
) => void

interface MaterialConfig {
  color: string
  isHQ: boolean
  side?: THREE.Side
  opacity?: number
  handleBeforeCompile?: BeforeCompileHandler
}

const materialCache = new Map<string, THREE.Material>()
const callbackIds = new WeakMap<BeforeCompileHandler, number>()
let nextCallbackId = 1

export function clearGlobalMaterialCache(): void {
  for (const material of materialCache.values()) {
    material.dispose()
  }
  materialCache.clear()
}

function getCallbackId(callback?: BeforeCompileHandler): number {
  if (!callback) {
    return 0
  }

  let id = callbackIds.get(callback)
  if (id === undefined) {
    id = nextCallbackId++
    callbackIds.set(callback, id)
  }
  return id
}

export function getSharedMaterial(config: MaterialConfig): THREE.Material {
  const side = config.side ?? THREE.FrontSide
  const opacity = config.opacity ?? 1
  const transparent = opacity !== 1
  const key = JSON.stringify([
    config.color,
    config.isHQ,
    side,
    opacity,
    getCallbackId(config.handleBeforeCompile),
  ])
  const cachedMaterial = materialCache.get(key)
  if (cachedMaterial) {
    return cachedMaterial
  }

  const material = config.isHQ
    ? new THREE.MeshStandardMaterial({
        color: new THREE.Color(config.color),
        side,
        transparent,
        opacity,
      })
    : new THREE.MeshMatcapMaterial({
        color: new THREE.Color(config.color),
        side,
        transparent,
        opacity,
      })

  if (config.handleBeforeCompile) {
    material.onBeforeCompile = config.handleBeforeCompile
  }
  materialCache.set(key, material)
  return material
}

export const basicModelMaterial = (
  color: string,
  isHQ: boolean,
  opacity?: number,
  handleBeforeCompile?: BeforeCompileHandler,
): THREE.Material =>
  getSharedMaterial({
    color,
    isHQ,
    opacity,
    side: THREE.FrontSide,
    handleBeforeCompile,
  })

export const basicDoubleSideModelMaterial = (
  color: string,
  isHQ: boolean,
  opacity?: number,
  handleBeforeCompile?: BeforeCompileHandler,
): THREE.Material =>
  getSharedMaterial({
    color,
    isHQ,
    opacity,
    side: THREE.DoubleSide,
    handleBeforeCompile,
  })
