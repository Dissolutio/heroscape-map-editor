import {
  BufferGeometry,
  DoubleSide,
  Float32BufferAttribute,
  MeshBasicMaterial,
  SRGBColorSpace,
  type Texture,
} from 'three'
import {
  buildVoidMarkerGeometryArrays,
  buildVoidMatGeometryArrays,
} from './voidMatGeometry'

let voidMatGeometry: BufferGeometry | undefined
let voidMarkerGeometry: BufferGeometry | undefined

const configuredTextures = new WeakSet<Texture>()
const texturedMaterials = new WeakMap<Texture, Map<string, MeshBasicMaterial>>()
const fallbackMaterials = new Map<string, MeshBasicMaterial>()

function createGeometry(isMarker: boolean) {
  const { positions, uvs, indices } = isMarker
    ? buildVoidMarkerGeometryArrays()
    : buildVoidMatGeometryArrays()
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  return geometry
}

export function getVoidMatGeometry(isMarker = false): BufferGeometry {
  if (isMarker) {
    voidMarkerGeometry ??= createGeometry(true)
    return voidMarkerGeometry
  }
  voidMatGeometry ??= createGeometry(false)
  return voidMatGeometry
}

export function configureVoidMatTexture(texture: Texture): void {
  if (configuredTextures.has(texture)) {
    return
  }
  texture.colorSpace = SRGBColorSpace
  texture.anisotropy = 8
  texture.needsUpdate = true
  configuredTextures.add(texture)
}

export function getVoidMatMaterial(
  texture: Texture,
  isHighlighted: boolean,
  opacity?: number,
): MeshBasicMaterial {
  let materials = texturedMaterials.get(texture)
  if (!materials) {
    materials = new Map()
    texturedMaterials.set(texture, materials)
  }
  const transparent = opacity !== undefined
  const opacityLevel = opacity ?? 1
  const key = JSON.stringify([isHighlighted, opacityLevel, transparent])
  let material = materials.get(key)
  if (!material) {
    material = new MeshBasicMaterial({
      map: texture,
      color: isHighlighted ? '#fff59d' : 'white',
      side: DoubleSide,
      transparent,
      opacity: opacityLevel,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    })
    materials.set(key, material)
  }
  return material
}

export function getVoidMatFallbackMaterial(
  color: string,
  opacity?: number,
): MeshBasicMaterial {
  const transparent = opacity !== undefined
  const opacityLevel = opacity ?? 1
  const key = JSON.stringify([color, opacityLevel, transparent])
  let material = fallbackMaterials.get(key)
  if (!material) {
    material = new MeshBasicMaterial({
      color,
      side: DoubleSide,
      transparent,
      opacity: opacityLevel,
    })
    fallbackMaterials.set(key, material)
  }
  return material
}
